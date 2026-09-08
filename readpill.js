/* readpill.js — the footer's readership pill.
 *
 * The pill is already complete in the markup: faces, a +1, and copy that is
 * true whether or not this file ever runs -- "You're in the count." holds
 * on its own, and only gives way to the total if one arrives. Everything here is an upgrade —
 * the arrival animation, and the count. If the fetch is slow, blocked or
 * broken, the reader sees a finished pill and nothing shifts.
 *
 * The count is fetched once per session, not once per page. Six pages all
 * carrying this would otherwise be six calls into a function that makes
 * fifteen upstream requests on a cache miss.
 *
 * The window is every day there is, not the dashboard's rolling four weeks.
 * "so far" has to mean since the counting started: on a 28-day window the
 * total would quietly shrink whenever a quiet month followed a busy one,
 * which is the one thing a running count must never do.
 */
(function () {
  "use strict";

  var pill = document.querySelector("[data-readpill]");
  if (!pill) return;

  var line = pill.querySelector("[data-rp-line]");
  var KEY = "lb-readers-all";
  var SEEN = "lb-readers-rolled";
  /* Polled while the tab is watched, so the number is live rather than a
     snapshot from page load. 20s is cheaper than it sounds: /api/readers is
     edge-cached for 30s, so most of these never leave the CDN, and the ones
     that do are answered from stale-while-revalidate while the new figure
     is fetched behind them. Nobody waits. */
  var POLL_MS = 20000;
  /* 6s, and the endpoint answers in 5 to 11: the pill was aborting its own
     request just before the reply arrived, which is why it sat on its
     resting copy on the live site while the API was working perfectly.
     Fifteen, because nothing waits on this -- the pill is already complete
     when the request starts and nothing moves when it lands. */
  var TIMEOUT_MS = 15000;
  var ROLL_MS = 900;

  var still = false;
  try {
    still = window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  // Same rule as the dashboard: the apex loses POST bodies to its redirect, a
  // local page has no /api of its own, and a preview deployment does.
  var LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname) ||
              location.protocol === "file:";
  var LIVE_HOST = /(^|\.)lokeshbhatia\.com$/.test(location.hostname);
  /* /api/readers, not /api/stats. stats makes fifteen upstream calls to
     build a dashboard and cannot be cached, because it is a POST; readers
     makes one and is a GET, which is the whole difference between eight
     seconds and fifty milliseconds. */
  var API = (LIVE_HOST || LOCAL)
    ? "https://www.lokeshbhatia.com/api/readers"
    : "/api/readers";

  function num(n) {
    try { return Number(n).toLocaleString("en-GB"); } catch (e) { return String(n); }
  }

  // "one of N" only once N is known. Until then the pill says the thing that
  // is true without any data: you have been counted.
  // Only the top line is ever rewritten. It rests on a sentence that is
  // true with no data at all and becomes the total once there is one; the
  // line under it does not move, and the second line under THAT is the
  // hover, which is CSS and none of this file's business.
  //
  // Built as nodes rather than a string so the figure can carry its own
  // numeral treatment: tabular, so the pill holds its width when the
  // count gains a digit.
  var shownValue = null;

  function show(n) {
    if (!n || !line) return;
    // A poll that returns the same number must not rebuild the line: it
    // would restart the animation every twenty seconds for no news.
    if (n === shownValue) return;
    var moved = shownValue !== null && n !== shownValue;
    shownValue = n;
    line.textContent = "";
    var fig = document.createElement("span");
    fig.className = "rp-n";
    fig.textContent = num(n);
    line.appendChild(fig);
    // The noun has to be the one being counted. "people have stopped by"
    // was wrong for a pageview total: nine people had opened sixty-five
    // pages, and the pill was reporting the pages as people.
    line.appendChild(document.createTextNode(
      n === 1 ? " view so far." : " views so far."));

    // Someone arrived while this page was open. That is the one moment the
    // pill exists for, so it gets the +1 again rather than silently
    // swapping a digit.
    if (moved) {
      pill.classList.remove("is-in");
      void pill.offsetWidth;
      pill.classList.add("is-in");
      return;
    }
    roll(fig, n);
  }

  // The number climbs to the total instead of appearing at it, so the
  // count reads as something being taken rather than something already
  // written down. It lands on the real figure -- nothing here invents a
  // value or claims the visit has been added; only the arrival is staged.
  //
  // Once a session. Rolling on all six pages would turn a moment into a
  // tic, and the second time you see it you already know what it says.
  function roll(el, target) {
    var again = false;
    try { again = sessionStorage.getItem(SEEN) === "1"; } catch (e) {}
    // Below 25 the climb is over before it reads as a climb, so there is
    // nothing to lose by showing the number outright.
    if (again || still || target < 25 || !window.requestAnimationFrame) return;
    try { sessionStorage.setItem(SEEN, "1"); } catch (e) {}

    pill.classList.add("is-rolling");
    var t0 = 0;
    // rAF does not run in a background tab, and the pill would sit on a
    // part-counted number for as long as the tab stayed there. This puts
    // the true figure up regardless; the animation is the thing that is
    // allowed to fail, never the number.
    var settle = setTimeout(function () { finish(); }, ROLL_MS + 400);

    function finish() {
      clearTimeout(settle);
      el.textContent = num(target);
      pill.classList.remove("is-rolling");
      pill.classList.add("is-counted");
    }

    // Starts at a third of the way up, not at zero. A count-up that begins
    // at 0 spends its first frames printing "0 views so far", which is a
    // sentence, and a false one. From a third the climb still reads as a
    // climb and never says nothing is there.
    var from = Math.max(1, Math.round(target * 0.34));

    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / ROLL_MS);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = num(Math.round(from + (target - from) * eased));
      if (p < 1) requestAnimationFrame(frame);
      else finish();
    }
    el.textContent = num(from);
    requestAnimationFrame(frame);
  }

  function cached() {
    try {
      var raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      var v = JSON.parse(raw);
      return v && typeof v.n === "number" ? v.n : null;
    } catch (e) { return null; }
  }

  function remember(n) {
    try { sessionStorage.setItem(KEY, JSON.stringify({ n: n })); } catch (e) {}
  }

  /* The stored number is a head start, not the answer: it goes up
     immediately so the pill is never blank, and the network overwrites it a
     moment later. Before, a session cache meant the first figure you saw
     was the only one you ever saw. */
  function load() {
    var hit = cached();
    if (hit) show(hit);

    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, TIMEOUT_MS);

    return fetch(API, { signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        // views, not visitors. They are different numbers -- 9 people had
        // opened 65 pages between them -- and the pill counts the opening.
        var n = j && j.ok && j.views;
        if (n) { remember(n); show(n); }
      })
      .catch(function () { /* the resting copy is already true */ })
      .then(function () { clearTimeout(timer); });
  }

  /* Only while the tab is being looked at. A backgrounded tab polling every
     twenty seconds forever is somebody's battery, and there is nobody there
     to see the number change. Coming back to the tab asks straight away,
     which is also the moment the count is most likely to have moved. */
  var pollTimer = null;
  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(load, POLL_MS);
  }
  function stopPolling() {
    if (!pollTimer) return;
    clearInterval(pollTimer);
    pollTimer = null;
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { stopPolling(); return; }
    load();
    startPolling();
  });

  // Fire on arrival, not on load: the +1 should land while the pill is being
  // looked at, which is the whole point of it.
  function arrive() {
    pill.classList.add("is-in");
    load();
    if (!document.hidden) startPolling();
  }

  var fired = false;
  function once() { if (fired) return; fired = true; arrive(); }

  if (!("IntersectionObserver" in window)) { once(); return; }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.disconnect();
      once();
    });
  }, { threshold: 0.6 });

  io.observe(pill);

  // A backstop, because IntersectionObserver does not deliver in a background
  // tab and the count should not wait on someone coming back to the window.
  setTimeout(function () { io.disconnect(); once(); }, 5000);
}());
