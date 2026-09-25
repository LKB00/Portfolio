// api/chat.js — the OG assistant's brain.
//
// A thin, streaming proxy in front of Groq's OpenAI-compatible chat
// endpoint. The browser never sees GROQ_API_KEY; it lives only in Vercel's
// environment variables and is attached here, server-side, on every call.
//
// Vercel environment variables (at least one key is required):
//   GEMINI_API_KEY    from aistudio.google.com (free tier, tried first)
//   GROQ_API_KEY      from console.groq.com (free tier, the fallback chain)
//   CEREBRAS_API_KEY  optional, from cloud.cerebras.ai (last resort)
// All three speak the same OpenAI-style chat API and stream the same SSE,
// so the browser never knows which one answered.
//
// Streaming: Groq's response is Server-Sent Events, one JSON chunk per
// line ("data: {...}"). Re-encoding that into some other shape would only
// add a translation step for no benefit, since the frontend can read raw
// OpenAI-style SSE directly — so this passes the upstream bytes straight
// through to the client as they arrive, unread and unbuffered, which is
// also why the response starts appearing in the UI before Groq has
// finished generating it.
//
// Cost control, since this runs on a free tier with no billing behind it:
// history is capped at a handful of turns and each message at a few
// hundred characters, both enforced before the request ever reaches Groq.
// Combined with a low max_tokens on the reply, a single conversation stays
// small regardless of how long a visitor keeps typing.

import { LOKESH_CONTEXT } from "./data/lokesh-context.js";
import { ANSWER_FORMAT } from "./data/answer-format.js";

// what I know, then how to lay it out
const SYSTEM_PROMPT = LOKESH_CONTEXT + "\n" + ANSWER_FORMAT;

export const config = { maxDuration: 30 };

// A fallback chain, not one model. Groq's free tier caps each model at
// 8,000 tokens a minute, and every question here carries ~2,500 tokens of
// context — so one model alone serves about three questions a minute
// across ALL visitors. The buckets are per model, though: when the first
// one answers 429, the next has its own full allowance. Three models,
// roughly three times the headroom, still at zero cost.
//
// Groq also retires model IDs without much notice (llama-3.3-70b-versatile
// went that way), so the chain is overridable from Vercel as a
// comma-separated GROQ_MODELS without touching code.
//
// The gpt-oss models reason before answering: that streams in
// delta.reasoning, separate from delta.content, and the client only reads
// content — so it never reaches the chat, but it does spend tokens, hence
// the budget and low effort.
const list = (v, d) => (v || d).split(",").map((m) => m.trim()).filter(Boolean);
const GROQ_MODELS = list(process.env.GROQ_MODELS, "openai/gpt-oss-120b,openai/gpt-oss-20b,qwen/qwen3.8-27b");
// Gemini first: its free tier allows far more tokens a minute than Groq's,
// which matters because every question carries the whole system prompt.
// (the 2.5 family is closed to new users; these are the current 3.x IDs)
const GEMINI_MODELS = list(process.env.GEMINI_MODELS, "gemini-3.8-flash,gemini-3.5-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite");
const CEREBRAS_MODELS = list(process.env.CEREBRAS_MODELS, "gpt-oss-120b");

function providerChain(env) {
  const chain = [];
  if (env.GEMINI_API_KEY) for (const model of GEMINI_MODELS) chain.push({
    name: "gemini", model, key: env.GEMINI_API_KEY,
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    extra: { max_tokens: MAX_TOKENS, reasoning_effort: "low" },
  });
  if (env.GROQ_API_KEY) for (const model of GROQ_MODELS) chain.push({
    name: "groq", model, key: env.GROQ_API_KEY,
    url: "https://api.groq.com/openai/v1/chat/completions",
    extra: { max_completion_tokens: MAX_TOKENS, ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}) },
  });
  if (env.CEREBRAS_API_KEY) for (const model of CEREBRAS_MODELS) chain.push({
    name: "cerebras", model, key: env.CEREBRAS_API_KEY,
    url: "https://api.cerebras.ai/v1/chat/completions",
    extra: { max_completion_tokens: MAX_TOKENS },
  });
  return chain;
}
const MAX_TURNS = 16; // user+assistant messages, not counting the system prompt
const MAX_MESSAGE_CHARS = 600;   // per visitor message
const MAX_ANSWER_CHARS = 6000;   // per assistant message echoed back in history
const MAX_TOKENS = 1024;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  const chain = providerChain(process.env);
  if (!chain.length) {
    return res.status(500).json({ error: "Server not configured" });
  }

  const body = req.body || {};
  const messages = Array.isArray(body.messages) ? body.messages : null;
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: "messages must be a non-empty array" });
  }
  if (messages.length > MAX_TURNS) {
    return res.status(400).json({ error: `Keep it under ${MAX_TURNS} messages — start a new chat.` });
  }
  for (const m of messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") {
      return res.status(400).json({ error: "Each message needs a role of user/assistant and string content" });
    }
    // the cap is for what visitors type; the assistant's own earlier
    // answers come back in history and are routinely longer than that
    if (m.role === "user" && m.content.length > MAX_MESSAGE_CHARS) {
      return res.status(400).json({ error: `Keep each message under ${MAX_MESSAGE_CHARS} characters` });
    }
    if (m.content.length > MAX_ANSWER_CHARS) {
      return res.status(400).json({ error: "That conversation got long — start a new chat." });
    }
  }

  let upstream = null, used = null;
  const skipped = []; // "provider/model:status", for diagnosing the chain
  let lastDetail = "";
  let allBusy = true;
  for (const p of chain) {
    let r;
    try {
      r = await fetch(p.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${p.key}`,
        },
        body: JSON.stringify({
          model: p.model,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          stream: true,
          temperature: 0.3, // low: answers are retold facts, not ideas
          ...p.extra,
        }),
      });
    } catch (e) {
      allBusy = false;
      lastDetail = "Could not reach " + p.name;
      continue;
    }
    if (r.ok && r.body) { upstream = r; used = p; break; }
    lastDetail = (await r.text().catch(() => "")).slice(0, 300);
    skipped.push(p.name + "/" + p.model + ":" + r.status);
    console.warn("chat: skipped", p.name, p.model, r.status, lastDetail.slice(0, 200));
    // 429 = this model's minute is spent; 503 = it's overloaded. Either way
    // the next model has its own separate allowance, so move on. Anything
    // else (a bad request, a retired model ID) is worth trying past too,
    // but it means the chain isn't just busy — say so if nothing answers.
    if (r.status !== 429 && r.status !== 503) allBusy = false;
  }

  if (!upstream) {
    if (allBusy) {
      res.setHeader("Retry-After", "30");
      return res.status(429).json({ error: "busy" });
    }
    return res.status(502).json({ error: "Upstream error", detail: lastDetail });
  }

  res.writeHead(200, {
    "X-AI-Model": used.name + "/" + used.model, // which link in the chain answered
    "X-AI-Skipped": skipped.join(", ") || "none",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  const reader = upstream.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  } catch (e) {
    // client disconnected mid-stream — nothing to clean up upstream
  } finally {
    res.end();
  }
}
