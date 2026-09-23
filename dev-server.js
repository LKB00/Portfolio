// dev-server.js — local-only stand-in for `vercel dev`.
//
// Serves the static site exactly like `python3 -m http.server` did, but
// also runs the real api/chat.js handler for POST /api/chat, so the OG
// Assistant can be tested against the actual Groq call on this machine
// without linking the repo to a Vercel account or pushing anything to
// GitHub. Not deployed anywhere; not referenced by Vercel; safe to delete
// once real testing happens through `vercel dev` or a live deploy instead.
//
// Reads GROQ_API_KEY from .env.local (git-ignored, never committed).
//
// Usage: node dev-server.js [port]   (defaults to 4173, same as before)

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2]) || 4173;

// --- tiny .env.local loader, no dependency needed for KEY=value lines ---
function loadEnvLocal(){
  const file = path.join(__dirname, ".env.local");
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2",
};

function serveStatic(req, res, urlPath){
  let rel = decodeURIComponent(urlPath.split("?")[0]);
  if (rel === "/") rel = "/index.html";
  const filePath = path.normalize(path.join(__dirname, rel));
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403); res.end("Forbidden"); return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // no-extension paths (./resume etc. aren't used here) just 404
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found: " + rel);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

async function handleApiChat(req, res){
  let raw = "";
  req.on("data", (chunk) => { raw += chunk; });
  req.on("end", async () => {
    try {
      req.body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }
    const { default: handler } = await import("./api/chat.js?t=" + Date.now());
    try {
      await handler(req, res);
    } catch (e) {
      console.error("api/chat.js threw:", e);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Local dev server error", detail: String(e) }));
      }
    }
  });
}

const server = http.createServer((req, res) => {
  // minimal shims so api/chat.js's res.status(...).json(...) calls work
  // the same as they would on Vercel's Node runtime
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(obj));
    return res;
  };

  if (req.url.startsWith("/api/chat")) {
    handleApiChat(req, res);
    return;
  }
  serveStatic(req, res, req.url);
});

server.listen(PORT, () => {
  const hasKey = !!process.env.GROQ_API_KEY;
  console.log(`Local dev server running at http://localhost:${PORT}`);
  console.log(
    hasKey
      ? "GROQ_API_KEY loaded from .env.local — /api/chat is live."
      : "No GROQ_API_KEY found in .env.local — /api/chat will return a 500 'Server not configured'."
  );
});
