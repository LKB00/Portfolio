// api/stats.js — lives at the ROOT of the Portfolio repo (not in a subfolder)
//
// Logs into the self-hosted Umami with admin credentials held in Vercel env
// vars, fetches the numbers and returns them as JSON. No auth: the dashboard
// is public, so every field here is an aggregate. Umami credentials never
// reach the browser.
//
// Required Vercel environment variables:
//   UMAMI_URL            https://umami-swart-five.vercel.app
//   UMAMI_USER           admin
//   UMAMI_PASS           your Umami admin password
//   UMAMI_WEBSITE_ID     5a59e8a0-e996-42f4-a248-fcf582413c76
//
// Every key that existed before is still returned unchanged: ok, updated,
// days, headline, sources, pages, events, totals. Seven were added:
// previous, timeBuckets, sections, ctas, countries (with cities) and
// devices. All arithmetic happens here; the front end renders what it gets.
//
// There is no `sessions` field. It existed, and it listed individual
// readers by city, device and dwell time. That is defensible behind a
// password and not defensible in public, and this endpoint is public, so
// it was removed rather than softened.
//
// Two constraints this file exists to absorb:
//
//   1. Umami's metrics endpoint returns event NAMES and totals only —
//      properties never surface there. Anything that needs a property
//      breakdown (time-on-page bucket, section-reached section, card-click
//      card) goes through /event-data/values instead.
//
//   2. The Neon free tier sleeps. The first request after idle takes 3-4
//      seconds, sometimes more. Every call is bounded by an AbortController
//      and the login is retried once, because a cold start should read as
//      slow, not as broken.
//
// Nothing is ever invented. A field Umami cannot answer comes back null,
// and _diag says which upstream call failed and why.

export const config = { maxDuration: 30 };

const REQ_TIMEOUT_MS = 8000;


// Every page with a labelled funnel. The home page earns its place: it
// takes the most traffic, and hero -> work -> experience -> notes is a
// drop-off curve like any other.
const TRACKED_PAGES = ["/", "/app-merge.html", "/rise-portal.html"];

// The section labels each case study carries, in the order a reader meets
// them. This is the authored order from the markup, not a guess.
//
// It exists because Umami ignores the &url= filter on /event-data/values —
// verified live: both case studies returned all 21 site-wide values. Since we
// wrote these names ourselves and they are unique per page, splitting them
// here needs no filter and no extra request.
//
// It also produces something the filter never could. Umami sorts values by
// count; a drop-off curve has to be in document order, or the shape is
// meaningless. Reading the map in order gives that for free.
const PAGE_SECTIONS = {
  "/": ["Notes board", "Selected work", "Experience"],
  "/app-merge.html": [
    "Two apps, one customer", "Who was in the room", "Revenue at risk",
    "Not a merge", "Fast version first", "Three constraints",
    "Ten slots to five", "What shipped",
  ],
  "/rise-portal.html": [
    "Revenue they couldn't see", "Who I was working with",
    "Refer more, earn less", "Two questions", "Show the calculation",
    "The eligibility rule", "The call sheet", "What changed",
  ],
};

// Umami builds disagree on what the page-path metric is called. Live returned
// 400 for type=url while every other metric returned 200, so the type is
// probed rather than assumed.
const PATH_METRIC_TYPES = ["path", "url"];

// Click events, in the order the dashboard should list them. Kept explicit
// rather than inferred, so a new event name cannot silently join the CTA
// list and change what "CTA clicks" means between two deploys.
const CTA_EVENTS = [
  "card-click",
  "resume-click",
  "resume-open",
  "email-click",
  "email-copied",
  "social-click",
  "outbound",
  "outbound-runable",
  "outbound-other",
  "nav-about",
  "palette-open",
  "palette-navigate",
];

const TIME_BUCKETS = ["0-10s", "10-30s", "30-60s", "1-3m", "3m+"];

export default async function handler(req, res) {
  // Open to any origin. The endpoint is public and every field it returns is
  // an aggregate, so there is nothing here an origin check would protect —
  // and without this the dashboard can only ever show real numbers when it is
  // served from the live domain, which makes the page impossible to develop
  // against its own data.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin");

  // A POST carrying application/json is not a simple request, so the browser
  // asks first. Answering after the method guard would have returned 405 to
  // the preflight and failed every cross-origin call.
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  const {
    UMAMI_URL,
    UMAMI_USER,
    UMAMI_PASS,
    UMAMI_WEBSITE_ID,
  } = process.env;

  const missing = [];
  if (!UMAMI_URL) missing.push("UMAMI_URL");
  if (!UMAMI_USER) missing.push("UMAMI_USER");
  if (!UMAMI_PASS) missing.push("UMAMI_PASS");
  if (!UMAMI_WEBSITE_ID) missing.push("UMAMI_WEBSITE_ID");
  if (missing.length) {
    return res.status(500).json({ error: "Server not configured", missing });
  }

  // --- public ------------------------------------------------------------
  // No password. The dashboard is public, so this endpoint is too, and every
  // field below is an aggregate. The one field that described individual
  // people — recent sessions, with their city, device and dwell time — was
  // removed rather than published: counting readers is not the same as
  // listing them.
  //
  // Cached at the edge so that being public costs one upstream round trip
  // every five minutes instead of one per visitor.
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

  const days = Number(
    (typeof req.body === "object" && req.body && req.body.days) || 30
  );
  const endAt = Date.now();
  const startAt = endAt - days * 24 * 60 * 60 * 1000;
  const base = String(UMAMI_URL).replace(/\/+$/, "");
  const range = `startAt=${startAt}&endAt=${endAt}`;

  // The preceding window of equal length, so every headline number can carry
  // a comparison. Ends where the current window begins — no overlap.
  const prevEnd = startAt;
  const prevStart = startAt - (endAt - startAt);
  const prevRange = `startAt=${prevStart}&endAt=${prevEnd}`;

  const diag = [];

  // --- transport ----------------------------------------------------------
  async function timedFetch(url, init, label) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), REQ_TIMEOUT_MS);
    const t0 = Date.now();
    try {
      const r = await fetch(url, { ...init, signal: ctl.signal });
      return { r, ms: Date.now() - t0 };
    } catch (err) {
      const aborted = err && err.name === "AbortError";
      diag.push({
        call: label,
        ok: false,
        ms: Date.now() - t0,
        error: aborted ? `timeout after ${REQ_TIMEOUT_MS}ms` : String(err).slice(0, 120),
      });
      return { r: null, ms: Date.now() - t0 };
    } finally {
      clearTimeout(timer);
    }
  }

  try {
    // --- log in -----------------------------------------------------------
    // Retried once: a cold Neon instance routinely loses the first attempt,
    // and returning 502 for a database that is merely asleep is a lie.
    let token = null;
    let loginDetail = "";
    for (let attempt = 1; attempt <= 2 && !token; attempt++) {
      const { r, ms } = await timedFetch(
        `${base}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: UMAMI_USER, password: UMAMI_PASS }),
        },
        `auth/login (attempt ${attempt})`
      );
      if (!r) continue;
      if (!r.ok) {
        loginDetail = (await r.text()).slice(0, 200);
        diag.push({ call: `auth/login (attempt ${attempt})`, ok: false, ms, status: r.status });
        continue;
      }
      const j = await r.json();
      token = j && j.token;
      diag.push({ call: `auth/login (attempt ${attempt})`, ok: true, ms, status: r.status });
    }

    if (!token) {
      return res.status(502).json({
        error: "Umami login failed",
        detail: loginDetail || "no response after 2 attempts",
        _diag: diag,
      });
    }

    const auth = { Authorization: `Bearer ${token}` };
    const site = `/api/websites/${UMAMI_WEBSITE_ID}`;

    // Returns null on any failure and records why. Callers must treat null as
    // "unknown", never as zero.
    const get = async (path, label) => {
      const { r, ms } = await timedFetch(`${base}${path}`, { headers: auth }, label || path);
      if (!r) return null;
      if (!r.ok) {
        diag.push({ call: label || path, ok: false, ms, status: r.status });
        return null;
      }
      let j = null;
      try { j = await r.json(); } catch { j = null; }
      diag.push({
        call: label || path,
        ok: true,
        ms,
        status: r.status,
        items: Array.isArray(j) ? j.length : (j && Array.isArray(j.data) ? j.data.length : null),
      });
      return j;
    };

    // Property breakdown for one event. Umami's metrics endpoint cannot do
    // this — it returns the event name and a total, and the properties are
    // simply absent — so every per-property number on the dashboard comes
    // from here.
    const eventValues = (eventName, propertyName, extra = "") =>
      get(
        `${site}/event-data/values?${range}&eventName=${encodeURIComponent(eventName)}` +
          `&propertyName=${encodeURIComponent(propertyName)}${extra}`,
        `event-data/values ${eventName}.${propertyName}${extra}`
      );

    // --- fetch, in parallel ----------------------------------------------
    // Tries each candidate type and keeps the first that answers. One 400 for
    // the wrong name is cheap; an empty `pages` list on the dashboard is not.
    const getPaths = async () => {
      for (const t of PATH_METRIC_TYPES) {
        const j = await get(`${site}/metrics?type=${t}&${range}`, `metrics ${t}`);
        if (j) return j;
      }
      return null;
    };

    const [
      stats, referrers, urls, events,
      prevStats, prevEvents,
      countryRows, cityRows, deviceRows,
      bucketRows, sectionRows, cardRows, socialRows,
    ] = await Promise.all([
      get(`${site}/stats?${range}`, "stats"),
      get(`${site}/metrics?type=referrer&${range}`, "metrics referrer"),
      getPaths(),
      get(`${site}/metrics?type=event&${range}`, "metrics event"),

      get(`${site}/stats?${prevRange}`, "stats (previous period)"),
      get(`${site}/metrics?type=event&${prevRange}`, "metrics event (previous period)"),

      get(`${site}/metrics?type=country&${range}`, "metrics country"),
      get(`${site}/metrics?type=city&${range}`, "metrics city"),
      get(`${site}/metrics?type=device&${range}`, "metrics device"),

      eventValues("time-on-page", "bucket"),
      eventValues("section-reached", "section"),
      eventValues("card-click", "card"),
      eventValues("social-click", "to"),

    ]);

    // The daily series. Without it the traffic chart has no source at all —
    // and it fails silently, because the front end guards with
    // Array.isArray() and renders an empty chart rather than an error.
    const series = await get(
      `${site}/pageviews?${range}&unit=day&timezone=Asia%2FKolkata`,
      "pageviews (daily series)"
    );

    // --- shaping helpers ---------------------------------------------------
    const num = (v) => (v && typeof v === "object" ? v.value : v) || 0;
    const rows = (j) => (Array.isArray(j) ? j : (j && Array.isArray(j.data) ? j.data : null));
    const rate = (n, d) => (d ? +((n / d) * 100).toFixed(1) : 0);
    const delta = (now, was) =>
      was === null || was === undefined ? null : +(now - was).toFixed(1);

    // event-data/values rows are {value, total}; metrics rows are {x, y}
    const valueMap = (j) => {
      const r = rows(j);
      if (!r) return null;
      const m = {};
      r.forEach((row) => {
        const k = row.value !== undefined ? row.value : row.x;
        const v = row.total !== undefined ? row.total : row.y;
        if (k !== undefined && k !== null) m[String(k)] = Number(v) || 0;
      });
      return m;
    };

    const eventMap = (j) => {
      const r = rows(j);
      if (!r) return {};
      const m = {};
      r.forEach((e) => { m[e.x] = Number(e.y) || 0; });
      return m;
    };

    // --- existing shape, unchanged ----------------------------------------
    const evMap = eventMap(events);

    const started = evMap["passed-hero"] || 0;

    const cardClicks = evMap["card-click"] || 0;
    const contacts =
      (evMap["email-copied"] || 0) +
      (evMap["email-click"] || 0) +
      (evMap["social-click"] || 0);

    const visitors = num(stats?.visitors);
    const pageviews = num(stats?.pageviews);

    // contactRate and heroPassRate are kept in the response because things
    // already read them, but they are no longer computed. They divided event
    // TOTALS by UNIQUE VISITORS — two different units — which is how the live
    // endpoint reported heroPassRate 103.2% and a desktop completion rate of
    // 400%. One visitor passing the hero on three pages is three events.
    //
    // Umami's metrics endpoint cannot return unique visitors per event, so an
    // honest rate needs a per-session pass over every session in the window.
    // At this volume that is a lot of requests to earn a number that a raw
    // count already tells you, so the counts are exposed and the rates are
    // null until the traffic justifies the work.
    const headline = {
      visitors,
      pageviews,
      events: (rows(events) || []).reduce((a, e) => a + (Number(e.y) || 0), 0),
      contacts,
      passedHero: started,
      contactRate: null,
      heroPassRate: null,
    };

    // --- 1. previous -------------------------------------------------------
    // Same shape as headline, plus the deltas, so the front end subtracts
    // nothing. null where the previous window could not be read at all.
    const prevEvMap = eventMap(prevEvents);
    const prevVisitors = num(prevStats?.visitors);
    const prevContacts =
      (prevEvMap["email-copied"] || 0) +
      (prevEvMap["email-click"] || 0) +
      (prevEvMap["social-click"] || 0);
    const prevStarted = prevEvMap["passed-hero"] || 0;

    const previous = !prevStats
      ? null
      : {
          from: new Date(prevStart).toISOString(),
          to: new Date(prevEnd).toISOString(),
          visitors: prevVisitors,
          pageviews: num(prevStats?.pageviews),
          events: (rows(prevEvents) || []).reduce((a, e) => a + (Number(e.y) || 0), 0),
          contacts: prevContacts,
          passedHero: prevStarted,
          contactRate: null,
          heroPassRate: null,
          // A previous window with no data at all is a first period, not a
          // rise from zero. Saying "+63" against a baseline that never
          // existed reads as growth; the flag lets the front end say "no
          // comparison yet" instead of drawing an arrow.
          baseline: prevVisitors === 0 && num(prevStats?.pageviews) === 0 ? "empty" : "ok",
          delta: {
            visitors: delta(visitors, prevVisitors),
            pageviews: delta(pageviews, num(prevStats?.pageviews)),
            contacts: delta(contacts, prevContacts),
            passedHero: delta(started, prevStarted),
          },
        };

    // --- 2. timeBuckets ----------------------------------------------------
    // Fixed order, zero-filled, so the chart's x-axis never reorders itself
    // because one bucket happened to be empty.
    const bucketVals = valueMap(bucketRows);
    const timeBuckets =
      bucketVals === null
        ? null
        : TIME_BUCKETS.map((b) => ({ bucket: b, count: bucketVals[b] || 0 }));

    // --- 3. sections -------------------------------------------------------
    const sectionsAll = valueMap(sectionRows);

    const toList = (m) =>
      Object.entries(m)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    // byPage is split with the authored map, not with a server-side filter.
    // Every label is emitted in document order with a zero where nobody
    // reached it, so the array IS the drop-off curve and the front end can
    // plot it without sorting, joining or filling gaps.
    const sections =
      sectionsAll === null
        ? null
        : {
            all: toList(sectionsAll),
            byPage: TRACKED_PAGES.map((path) => {
              const labels = PAGE_SECTIONS[path] || [];
              const counts = labels.map((name) => sectionsAll[name] || 0);

              // Against the PEAK, not against section one. A drop-off curve
              // looks monotonic but is not guaranteed to be: anyone who
              // deep-links to #s3, or lands mid-page from a shared anchor,
              // reaches a later section without passing the first. The live
              // call proved it — "Revenue at risk" outscored the opening
              // section and produced ofFirst 133.3%, which is the same class
              // of error as dividing events by visitors.
              const peak = counts.length ? Math.max(...counts) : 0;
              // Only a real peak has a name. With every count at zero,
              // indexOf(0) returns the first label and would present it as
              // the most-reached section of a page nobody has opened.
              const peakAt = peak > 0 ? counts.indexOf(peak) : -1;
              const monotonic = counts.every((c, i) => i === 0 || c <= counts[i - 1]);

              return {
                path,
                source: "authored-map",
                ordered: true,
                // False means people are entering mid-page rather than the
                // curve being broken — worth surfacing, not hiding.
                monotonic,
                peakSection: labels[peakAt] || null,
                sections: labels.map((name, i) => ({
                  name,
                  count: counts[i],
                  // Both sides are section-reached events, so this percentage
                  // divides like with like and cannot exceed 100.
                  ofPeak: peak ? +((counts[i] / peak) * 100).toFixed(1) : null,
                })),
              };
            }),
            // Anything recorded that no longer belongs to a case study:
            // homepage sections, ids from before the labels landed, and the
            // stray <h2> text the old selector matched.
            unmapped: toList(sectionsAll).filter(
              (s) => !Object.values(PAGE_SECTIONS).some((l) => l.includes(s.name))
            ),
          };

    // --- 4. ctas -----------------------------------------------------------
    // Per name, in a fixed order, with the two that carry a useful property
    // broken down underneath.
    const ctas = {
      byName: CTA_EVENTS.map((name) => ({ name, count: evMap[name] || 0 })),
      cards: valueMap(cardRows)
        ? Object.entries(valueMap(cardRows))
            .map(([card, count]) => ({ card, count }))
            .sort((a, b) => b.count - a.count)
        : null,
      socials: valueMap(socialRows)
        ? Object.entries(valueMap(socialRows))
            .map(([to, count]) => ({ to, count }))
            .sort((a, b) => b.count - a.count)
        : null,
    };

    // --- 5. countries and cities ------------------------------------------
    const geoList = (j, key) => {
      const r = rows(j);
      if (!r) return null;
      return r
        .map((row) => ({ [key]: row.x || "unknown", visitors: Number(row.y) || 0 }))
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 20);
    };
    const countries = geoList(countryRows, "code");
    const cities = geoList(cityRows, "city");

    // --- 6. devices7. devices --------------------------------------------------------
    // Completion rate per device needs event counts filtered by device. If
    // this Umami build ignores the filter, completionRate comes back null
    // rather than repeating the site-wide number under a device label.
    const deviceList = rows(deviceRows) || [];
    let devices = null;

    if (deviceRows) {
      const scopedMaps = await Promise.all(
        deviceList.map(async (d) => {
          const name = d.x || "unknown";
          const scoped = await get(
            `${site}/metrics?type=event&${range}&device=${encodeURIComponent(name)}`,
            `metrics event device=${name}`
          );
          return scoped ? eventMap(scoped) : null;
        })
      );

      // Whether the filter works is a property of the build, not of one
      // device. Deciding it per device would withhold a correct number from
      // a site whose traffic genuinely is all desktop. It is only ignored if
      // EVERY device returns the site-wide figure while more than one exists.
      const siteWidePassed = evMap["passed-hero"] || 0;
      const answered = scopedMaps.filter((m) => m !== null);
      const filterIgnored =
        deviceList.length > 1 &&
        answered.length > 1 &&
        answered.every((m) => (m["passed-hero"] || 0) === siteWidePassed);

      devices = deviceList.map((d, i) => {
        const name = d.x || "unknown";
        const visitorsOn = Number(d.y) || 0;
        const m = scopedMaps[i];
        const usable = m !== null && !filterIgnored;
        return {
          device: name,
          visitors: visitorsOn,
          // Counts, for the same reason the headline rates are null: these
          // are event totals and `visitors` is unique people. Dividing them
          // is what produced a 400% desktop completion rate.
          passedHero: usable ? m["passed-hero"] || 0 : null,
          // No readToEnd here: nothing emits `read-complete`. That name came
          // from a different script that was never deployed, and reporting a
          // hard zero for an event no code fires would read as "nobody
          // finished" rather than "not measured".
          sectionsReached: usable ? m["section-reached"] || 0 : null,
          scrollDepthEvents: usable ? m["scroll-depth"] || 0 : null,
          completionRate: null,
          filtered: usable,
        };
      });
    }

    const notes = [];
    notes.push(
      "contactRate, heroPassRate and devices[].completionRate are null on purpose. " +
        "They divided event totals by unique visitors, which reported 103% and 400%. " +
        "Use the counts beside them."
    );
    if (sections && sections.unmapped.length) {
      notes.push(
        `${sections.unmapped.length} recorded section names belong to no case study ` +
          "(homepage sections, ids from before the labels landed). They are in " +
          "`sections.unmapped` and excluded from the drop-off curves."
      );
    }
    if (devices && devices.some((d) => d.filtered === false)) {
      notes.push("this Umami build ignored the device filter; per-device counts withheld rather than guessed.");
    }
    if (sections && sections.byPage.some((p) => p.monotonic === false)) {
      notes.push(
        "a drop-off curve rises somewhere: people are entering that page mid-way, " +
          "via an anchor or a shared link, rather than the curve being wrong. " +
          "ofPeak is measured against peakSection."
      );
    }

    // Umami returns pageviews and sessions as two separate series of
    // {x: date, y: n}. Zipped by date here so the front end plots one array
    // instead of joining two. Named `daily`, not `days`: `days` already means
    // the window length, and one key with two meanings is how a chart ends up
    // silently empty.
    const seriesMap = (arr) => {
      const m = {};
      (Array.isArray(arr) ? arr : []).forEach((p) => {
        const d = String(p.x || "").slice(0, 10);
        if (d) m[d] = Number(p.y) || 0;
      });
      return m;
    };
    const pv = seriesMap(series && series.pageviews);
    const sv = seriesMap(series && series.sessions);
    const allDates = Array.from(new Set([...Object.keys(pv), ...Object.keys(sv)])).sort();
    const daily = !series
      ? null
      : allDates.map((date) => ({
          date,
          visitors: sv[date] || 0,
          pageviews: pv[date] || 0,
        }));

    return res.status(200).json({
      ok: true,
      updated: new Date().toISOString(),
      days,
      // The window, spelled out, so the front end formats dates instead of
      // recomputing which dates it is looking at.
      range: {
        from: new Date(startAt).toISOString(),
        to: new Date(endAt).toISOString(),
        days,
        prevFrom: new Date(prevStart).toISOString(),
        prevTo: new Date(prevEnd).toISOString(),
      },
      daily,
      headline,
      sources: (rows(referrers) || [])
        .map((r) => ({ name: r.x || "direct", count: Number(r.y) || 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
      pages: (rows(urls) || [])
        .map((u) => ({ path: u.x, views: Number(u.y) || 0 }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 8),
      events: (rows(events) || [])
        .map((e) => ({ name: e.x, count: Number(e.y) || 0 }))
        .sort((a, b) => b.count - a.count),
      totals: { cardClicks, contacts, passedHero: started },

      previous,
      timeBuckets,
      sections,
      ctas,
      countries,
      cities,
      devices,

      notes,
      _diag: diag,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Fetch failed",
      detail: String(err).slice(0, 200),
      _diag: diag,
    });
  }
}
