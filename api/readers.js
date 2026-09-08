/* GET /api/readers  ->  { ok, views, visitors, updated }
 *
 * One number, and nothing else. api/stats.js answers the same question, but
 * it makes fifteen upstream calls to build a whole dashboard and logs in
 * fresh every time, so asking it for the reader count costs five to eleven
 * seconds. The pill on every page was waiting on that, and giving up at six.
 *
 * This does the one call the count actually needs. Two things make it fast:
 *
 *   GET, not POST. Vercel edge-caches GET and does not cache POST at all --
 *   the `s-maxage` on stats.js has never once been honoured, which is why
 *   every visitor there pays full price. Here one request per 30s reaches
 *   Umami and everyone else is served from the edge.
 *
 *   A token held across warm invocations. The login is ~900ms of the cost
 *   and the token outlives the request that fetched it, so throwing it away
 *   each time was paying for the same thing repeatedly.
 *
 * Nothing here is private: it is one integer, the same one printed on the
 * page that asks for it.
 */

// Module scope: survives between invocations while the lambda stays warm,
// and is simply absent when it does not, which is the correct behaviour --
// a cold start logs in, a warm one does not.
let cachedToken = null;
let tokenExpires = 0;
const TOKEN_TTL_MS = 20 * 60 * 1000;

const ALL_TIME_DAYS = 3650;
const UPSTREAM_TIMEOUT_MS = 9000;

async function withTimeout(url, options, ms) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function login(base, username, password) {
  const now = Date.now();
  if (cachedToken && now < tokenExpires) return cachedToken;

  const r = await withTimeout(
    `${base}/api/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    },
    UPSTREAM_TIMEOUT_MS
  );
  if (!r.ok) throw new Error(`login ${r.status}`);

  const j = await r.json();
  if (!j || !j.token) throw new Error("login returned no token");

  cachedToken = j.token;
  tokenExpires = now + TOKEN_TTL_MS;
  return cachedToken;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Use GET." });
  }

  const { UMAMI_URL, UMAMI_USER, UMAMI_PASS, UMAMI_WEBSITE_ID } = process.env;
  const missing = [];
  if (!UMAMI_URL) missing.push("UMAMI_URL");
  if (!UMAMI_USER) missing.push("UMAMI_USER");
  if (!UMAMI_PASS) missing.push("UMAMI_PASS");
  if (!UMAMI_WEBSITE_ID) missing.push("UMAMI_WEBSITE_ID");
  if (missing.length) {
    return res.status(500).json({ error: "Server not configured", missing });
  }

  // 30s at the edge, and up to five minutes of serving the old number while
  // a new one is fetched behind it. The pill polls faster than 30s, so most
  // of its requests never leave the CDN; the ones that do are never what a
  // reader waits on, because stale-while-revalidate answers them instantly.
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=30, stale-while-revalidate=300"
  );

  const base = String(UMAMI_URL).replace(/\/+$/, "");
  const endAt = Date.now();
  const startAt = endAt - ALL_TIME_DAYS * 24 * 60 * 60 * 1000;

  try {
    let token = await login(base, UMAMI_USER, UMAMI_PASS);

    let r = await withTimeout(
      `${base}/api/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`,
      { headers: { Authorization: `Bearer ${token}` } },
      UPSTREAM_TIMEOUT_MS
    );

    // A held token can expire before its TTL says so -- Umami restarting is
    // enough. One retry with a fresh one, rather than reporting a failure
    // that is really just a stale credential.
    if (r.status === 401 || r.status === 403) {
      cachedToken = null;
      tokenExpires = 0;
      token = await login(base, UMAMI_USER, UMAMI_PASS);
      r = await withTimeout(
        `${base}/api/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`,
        { headers: { Authorization: `Bearer ${token}` } },
        UPSTREAM_TIMEOUT_MS
      );
    }

    if (!r.ok) throw new Error(`stats ${r.status}`);

    const j = await r.json();
    // Umami has returned both {pageviews:{value}} and {pageviews:N} across
    // versions. Read either rather than trusting one shape.
    const one = (v) =>
      v && typeof v === "object" ? Number(v.value) : Number(v);

    const views = one(j && j.pageviews);
    const visitors = one(j && j.visitors);

    if (!Number.isFinite(views)) throw new Error("no pageview count");

    // Both, because they answer different questions and the caller should
    // not have to pick one at the server. The pill wants views; anything
    // counting people wants the other.
    return res.status(200).json({
      ok: true,
      views,
      visitors: Number.isFinite(visitors) ? visitors : null,
      updated: new Date().toISOString(),
    });
  } catch (err) {
    // Never cache a failure: the pill would then be told the same lie for
    // thirty seconds by the edge.
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ ok: false, error: String(err.message || err) });
  }
}
