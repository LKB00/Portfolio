// api/chat.js — the OG assistant's brain.
//
// A thin, streaming proxy in front of Groq's OpenAI-compatible chat
// endpoint. The browser never sees GROQ_API_KEY; it lives only in Vercel's
// environment variables and is attached here, server-side, on every call.
//
// Required Vercel environment variable:
//   GROQ_API_KEY    from console.groq.com (free tier, no card required)
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

export const config = { maxDuration: 30 };

const MODEL = "llama-3.3-70b-versatile";
const MAX_TURNS = 16; // user+assistant messages, not counting the system prompt
const MAX_MESSAGE_CHARS = 600;
const MAX_TOKENS = 500;

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

  const { GROQ_API_KEY } = process.env;
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "Server not configured", missing: ["GROQ_API_KEY"] });
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
    if (m.content.length > MAX_MESSAGE_CHARS) {
      return res.status(400).json({ error: `Keep each message under ${MAX_MESSAGE_CHARS} characters` });
    }
  }

  let upstream;
  try {
    upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: LOKESH_CONTEXT }, ...messages],
        stream: true,
        temperature: 0.5,
        max_tokens: MAX_TOKENS,
      }),
    });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach the model provider" });
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return res.status(502).json({ error: "Upstream error", detail: detail.slice(0, 300) });
  }

  res.writeHead(200, {
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
