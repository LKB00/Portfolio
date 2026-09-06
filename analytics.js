/* Portfolio analytics events — lokeshbhatia.com
 *
 * Restored from commit 5374a63 (2026-08-31), which was silently overwritten by
 * an "Add files via upload" commit (b784b81, 2026-09-04) with a 15-line stub.
 * api/stats.js reads the event names below; do not rename them. The workflow
 * asserts every required name is still present before it will publish.
 *
 * Pair it with this script tag, which every page already carries:
 *
 *   <script defer src="./analytics.js"></script>
 *   <script defer src="https://umami-swart-five.vercel.app/script.js"
 *           data-website-id="5a59e8a0-e996-42f4-a248-fcf582413c76"
 *           data-domains="lokeshbhatia.com,www.lokeshbhatia.com"
 *           data-exclude-hash="true"
 *           data-before-send="pfBeforeSend"></script>
 *
 * This file MUST load first: the tag points data-before-send at pfBeforeSend,
 * and until now nothing defined it, so no path normalisation was happening and
 * / and /index.html were counted as two pages.
 *
 * To silence one browser:  localStorage.setItem('lb-analytics-off', '1')
 */
(function () {
  "use strict";

  // ---- 0. who is allowed to record ---------------------------------------
  // Only the live domains. Everything else — file://, localhost, preview
  // deploys, lkb00.github.io — is cancelled at the source, including the
  // tracker's own pageview, not just the events below.
  var ALLOWED = ["lokeshbhatia.com", "www.lokeshbhatia.com"];

  function optedOut() {
    try { return localStorage.getItem("lb-analytics-off") === "1"; }
    catch (e) { return false; }        // Safari private mode throws on access
  }

  var recording = ALLOWED.indexOf(location.hostname) > -1 && !optedOut();

  if (!recording) {
    // Umami cancels the send when before-send returns a falsy value.
    window.pfBeforeSend = function () { return false; };
    window.pfTrack = function () {};
    return;
  }

  // ---- 1. path normalisation, before anything leaves the browser ---------
  // /, /index.html, /#top and /index.html#top are one page. Other pages keep
  // their .html: stripping it would split /about.html from /about and break
  // continuity with everything already collected.
  function tidy(u) {
    try {
      var url = new URL(u, location.href);
      url.hash = "";                                  // data-exclude-hash may be lost
      url.pathname = url.pathname
        .replace(/(.)\/+$/, "$1")                     // trailing slash, before anything else
        .replace(/\/index\.html?$/i, "/");
      if (!url.pathname) url.pathname = "/";
      return url.toString();
    } catch (e) { return u; }
  }

  window.pfBeforeSend = function (type, payload) {
    if (payload && payload.url) payload.url = tidy(payload.url);
    return payload;
  };

  // ---- safe wrapper -------------------------------------------------------
  function track(name, data) {
    try {
      if (window.umami && typeof window.umami.track === "function") {
        data ? window.umami.track(name, data) : window.umami.track(name);
      }
    } catch (e) { /* never break the page for analytics */ }
  }
  window.pfTrack = track;

  // which page are we on
  var path = location.pathname.split("/").pop() || "index.html";
  var page = path.replace(".html", "") || "home";

  // ---- 2. scroll depth ----------------------------------------------------
  // Fires once per threshold per page load. Used for case study completion.
  var marks = [25, 50, 75, 100];
  var fired = {};

  function scrollable() {
    return document.documentElement.scrollHeight - window.innerHeight;
  }

  function onScroll() {
    var range = scrollable();
    if (range < 200) return;                   // handled by shortPageCheck
    var pct = (window.scrollY / range) * 100;

    for (var i = 0; i < marks.length; i++) {
      var m = marks[i];
      if (!fired[m] && pct >= m - 1) {
        fired[m] = true;
        track("scroll-depth", { page: page, depth: m });
      }
    }
  }

  // A page with nothing to scroll has been seen in full by definition, so it
  // reports 100 rather than reporting nothing. Deliberately runs on window
  // load, not DOMContentLoaded: before images settle the document is short,
  // and a long page would otherwise claim 100 on the way up.
  function shortPageCheck() {
    if (fired[100]) return;
    if (scrollable() >= 200) return;
    fired[100] = true;
    track("scroll-depth", { page: page, depth: 100 });
  }

  // ---- 3. section reached (powers the page-map drop-off chart) -----------
  // Watches every <section> and every <h2>. Reports the first time each
  // one is seen, so you learn WHICH section loses readers, not just a %.
  function watchSections() {
    if (!("IntersectionObserver" in window)) return;
    var nodes = document.querySelectorAll("section[id], main h2, article h2");
    if (!nodes.length) return;

    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var name = el.id || (el.textContent || "").trim().slice(0, 48);
        if (!name || seen[name]) return;
        seen[name] = true;
        track("section-reached", { page: page, section: name });
        io.unobserve(el);
      });
    }, { threshold: 0.5 });

    nodes.forEach(function (n) { io.observe(n); });
  }

  // ---- 4. clicks ----------------------------------------------------------
  // Two sets fire from one listener.
  //
  // The three names the deployed stub emits — resume-click, email-click,
  // outbound — keep firing exactly as they do now, so the series already
  // collected continues unbroken. The specific names sit alongside them.
  // stats.js reads the specific names and ignores `outbound`, so nothing is
  // double-counted downstream.
  function specific(href) {
    // case study cards
    if (href.indexOf("app-merge") > -1)   return track("card-click", { card: "app-merge", from: page });
    if (href.indexOf("rise-portal") > -1) return track("card-click", { card: "rise-portal", from: page });
    if (href.indexOf("about") > -1)       return track("nav-about", { from: page });

    // card 03 sends people off-site — measured separately on purpose
    if (href.indexOf("runable.com") > -1) return track("outbound-runable", { from: page });

    // intent signals
    if (href.indexOf("resume.pdf") > -1)  return track("resume-open", { from: page });
    if (href.indexOf("mailto:") === 0)    return track("email-click", { from: page, href: href });
    if (href.indexOf("linkedin.com") > -1)  return track("social-click", { to: "linkedin" });
    if (href.indexOf("behance.net") > -1)   return track("social-click", { to: "behance" });
    if (href.indexOf("figma.com") > -1)     return track("social-click", { to: "figma" });

    // any other external link
    if (/^https?:\/\//.test(href) && href.indexOf(location.hostname) === -1) {
      track("outbound-other", { href: href.slice(0, 80) });
    }
  }

  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a");
    if (!a) return;
    var href = a.getAttribute("href") || "";

    // continuity: the stub's own names, on the stub's own conditions.
    // email-click is emitted by specific() below — same name, fired once.
    if (/resume/i.test(href)) {
      track("resume-click", { href: href });
    } else if (!/^mailto:/i.test(href) &&
               /^https?:/i.test(href) && a.hostname !== location.hostname) {
      track("outbound", { href: href });
    }

    specific(href);
  }, true);

  // ---- 5. email copied ----------------------------------------------------
  // The copy button is not an <a>, so catch it separately.
  document.addEventListener("click", function (ev) {
    var el = ev.target.closest && ev.target.closest("[data-copy], .copy, button");
    if (!el) return;
    var txt = (el.textContent || "") + " " + (el.getAttribute("aria-label") || "");
    if (/copy|email|@/i.test(txt)) track("email-copied", { from: page });
  }, true);

  // ---- 6. command palette -------------------------------------------------
  // You built keyboard nav. This finds out whether anyone actually uses it.
  document.addEventListener("keydown", function (ev) {
    var k = ev.key;
    if ((ev.metaKey || ev.ctrlKey) && (k === "k" || k === "K")) {
      track("palette-open", { via: "shortcut", page: page });
    } else if (k === "ArrowDown" || k === "ArrowUp") {
      var p = document.getElementById("palette");
      if (p && getComputedStyle(p).display !== "none") {
        track("palette-navigate", { page: page });
      }
    }
  });

  // ---- 7. hero exit -------------------------------------------------------
  // Did they scroll past the hero at all? Brutal, and the most useful number.
  var scrolled = false;
  function heroCheck() {
    if (scrolled) return;
    if (window.scrollY > window.innerHeight * 0.6) {
      scrolled = true;
      track("passed-hero", { page: page });
    }
  }

  // ---- 8. read time -------------------------------------------------------
  // Bucketed, not exact. Exact seconds would be false precision at this volume.
  // Once per page load, on the FIRST hidden event only: firing on every
  // visibilitychange logged a bucket per tab-switch, which made one restless
  // visitor look like four and put a floor under every reading-depth number.
  var start = Date.now(), left = false;
  function onLeave() {
    if (left) return;
    left = true;
    var s = Math.round((Date.now() - start) / 1000);
    var bucket = s < 10 ? "0-10s"
               : s < 30 ? "10-30s"
               : s < 60 ? "30-60s"
               : s < 180 ? "1-3m"
               : "3m+";
    track("time-on-page", { page: page, bucket: bucket });
  }

  // ---- wire up ------------------------------------------------------------
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      onScroll();
      heroCheck();
      ticking = false;
    });
  }, { passive: true });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") onLeave();
  });
  // Some browsers tear the page down without a visibilitychange. Same guard,
  // so this can only ever add the event that would otherwise be lost.
  window.addEventListener("pagehide", onLeave);

  window.addEventListener("load", shortPageCheck);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watchSections);
  } else {
    watchSections();
  }
})();
