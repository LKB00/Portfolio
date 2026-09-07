/* readpill.js — the footer's readership pill.
 *
 * The pill is already complete in the markup: faces, a +1, and copy that is
 * true whether or not this file ever runs. Everything here is an upgrade —
 * the arrival animation, and the count. If the fetch is slow, blocked or
 * broken, the reader sees a finished pill and nothing shifts.
 *
 * The count is fetched once per session, not once per page. Six pages all
 * carrying this would otherwise be six calls into a function that makes
 * fifteen upstream requests on a cache miss.
 */
(function () {
  "use strict";

  var pill = document.querySelector("[data-readpill]");
  if (!pill) return;

  var line = pill.querySelector("[data-rp-line]");
  var sub = pill.querySelector("[data-rp-sub]");
  var KEY = "lb-readers";
  var TIMEOUT_MS = 6000;

  var API = /(^|\.)lokeshbhatia\.com$/.test(location.hostname)
    ? "https://www.lokeshbhatia.com/api/stats"
    : "/api/stats";

  function num(n) {
    try { return Number(n).toLocaleString("en-GB"); } catch (e) { return String(n); }
  }

  // "one of N" only once N is known. Until then the pill says the thing that
  // is true without any data: you have been counted.
  function show(n) {
    if (!n || !line) return;
    // The badge and the sentence do one job between them: the +1 is the
    // subject, the line names it. Saying "you have been counted" beside a
    // visible +1 was the same fact twice.
    line.textContent = "That +1 was you. " + num(n) + " so far.";
    if (sub) sub.textContent = "See how far the others got";
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
      body: JSON.stringify({ days: 28 }),
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
