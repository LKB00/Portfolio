// api/stats.js — lives at the ROOT of the Portfolio repo (not in a subfolder)
//
// Checks the dashboard password, logs into the self-hosted Umami with
// admin credentials held in Vercel env vars, fetches the numbers and
// returns them as JSON. Umami credentials never reach the browser.
//
// Required Vercel environment variables:
//   DASHBOARD_PASSWORD   password you type on the dashboard page
//   UMAMI_URL            https://umami-swart-five.vercel.app
//   UMAMI_USER           admin
//   UMAMI_PASS           your Umami admin password
//   UMAMI_WEBSITE_ID     5a59e8a0-e996-42f4-a248-fcf582413c76

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  const {
    DASHBOARD_PASSWORD,
    UMAMI_URL,
    UMAMI_USER,
    UMAMI_PASS,
    UMAMI_WEBSITE_ID,
  } = process.env;

  const missing = [];
  if (!DASHBOARD_PASSWORD) missing.push("DASHBOARD_PASSWORD");
  if (!UMAMI_URL) missing.push("UMAMI_URL");
  if (!UMAMI_USER) missing.push("UMAMI_USER");
  if (!UMAMI_PASS) missing.push("UMAMI_PASS");
  if (!UMAMI_WEBSITE_ID) missing.push("UMAMI_WEBSITE_ID");
  if (missing.length) {
    return res.status(500).json({ error: "Server not configured", missing });
  }

  // --- password check -----------------------------------------------------
  let given = "";
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    given = String(body.password || "");
  } catch {
    return res.status(400).json({ error: "Bad request." });
  }
  if (given !== DASHBOARD_PASSWORD) {
    return res.status(401).json({ error: "Wrong password." });
  }

  const days = Number(
    (typeof req.body === "object" && req.body && req.body.days) || 30
  );
  const endAt = Date.now();
  const startAt = endAt - days * 24 * 60 * 60 * 1000;
  const base = String(UMAMI_URL).replace(/\/+$/, "");
  const range = `startAt=${startAt}&endAt=${endAt}`;

  try {
    // --- log in ----------------------------------------------------------
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: UMAMI_USER, password: UMAMI_PASS }),
    });

    if (!loginRes.ok) {
      const text = await loginRes.text();
      return res.status(502).json({
        error: "Umami login failed",
        status: loginRes.status,
        detail: text.slice(0, 200),
      });
    }

    const { token } = await loginRes.json();
    const auth = { Authorization: `Bearer ${token}` };

    const get = async (path) => {
      const r = await fetch(`${base}${path}`, { headers: auth });
      if (!r.ok) return null;
      return r.json();
    };

    const site = `/api/websites/${UMAMI_WEBSITE_ID}`;

    const [stats, referrers, urls, events] = await Promise.all([
      get(`${site}/stats?${range}`),
      get(`${site}/metrics?type=referrer&${range}`),
      get(`${site}/metrics?type=url&${range}`),
      get(`${site}/metrics?type=event&${range}`),
    ]);

    // --- reshape ---------------------------------------------------------
    const num = (v) => (v && typeof v === "object" ? v.value : v) || 0;

    const evMap = {};
    (events || []).forEach((e) => { evMap[e.x] = e.y; });

    const started = evMap["passed-hero"] || 0;
    const finished = evMap["scroll-depth"] ? null : null; // depth split below

    const cardClicks = evMap["card-click"] || 0;
    const contacts =
      (evMap["email-copied"] || 0) +
      (evMap["email-click"] || 0) +
      (evMap["social-click"] || 0);

    const visitors = num(stats?.visitors);
    const pageviews = num(stats?.pageviews);

    return res.status(200).json({
      ok: true,
      updated: new Date().toISOString(),
      days,
      headline: {
        visitors,
        pageviews,
        events: (events || []).reduce((a, e) => a + e.y, 0),
        contactRate: visitors ? +((contacts / visitors) * 100).toFixed(1) : 0,
        heroPassRate: visitors ? +((started / visitors) * 100).toFixed(1) : 0,
      },
      sources: (referrers || [])
        .map((r) => ({ name: r.x || "direct", count: r.y }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
      pages: (urls || [])
        .map((u) => ({ path: u.x, views: u.y }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 8),
      events: (events || [])
        .map((e) => ({ name: e.x, count: e.y }))
        .sort((a, b) => b.count - a.count),
      totals: { cardClicks, contacts, passedHero: started },
    });
  } catch (err) {
    return res.status(500).json({ error: "Fetch failed", detail: String(err).slice(0, 200) });
  }
}
