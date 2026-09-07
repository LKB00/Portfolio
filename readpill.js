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
  var TIMEOUT_MS = 6000;

  // Same rule as the dashboard: the apex loses POST bodies to its redirect, a
  // local page has no /api of its own, and a preview deployment does.
  var LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname) ||
              location.protocol === "file:";
  var LIVE_HOST = /(^|\.)lokeshbhatia\.com$/.test(location.hostname);
  var API = (LIVE_HOST || LOCAL) ? "https://www.lokeshbhatia.com/api/stats" : "/api/stats";

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
  function show(n) {
    if (!n || !line) return;
    line.textContent = "";
    var fig = document.createElement("span");
    fig.className = "rp-n";
    fig.textContent = num(n);
    line.appendChild(fig);
    line.appendChild(document.createTextNode(" so far."));
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

  function load() {
    var hit = cached();
    if (hit) { show(hit); return; }

    // Bounded, because a cold database must not leave a request hanging off
    // every page on the site.
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, TIMEOUT_MS);

    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: 3650 }),
      signal: ctl ? ctl.signal : undefined
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var n = j && j.headline && j.headline.visitors;
        if (n) { remember(n); show(n); }
      })
      .catch(function () { /* the resting copy is already true */ })
      .then(function () { clearTimeout(timer); });
  }

  // Fire on arrival, not on load: the +1 should land while the pill is being
  // looked at, which is the whole point of it.
  function arrive() {
    pill.classList.add("is-in");
    load();
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
