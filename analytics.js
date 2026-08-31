/* Portfolio analytics events — lokeshbhatia.com
   Requires the Umami script tag to load BEFORE this file.
   Fails silently if Umami is blocked or not yet installed. */
(function () {
  "use strict";

  // ---- safe wrapper -------------------------------------------------------
  function track(name, data) {
    try {
      if (window.umami && typeof window.umami.track === "function") {
        data ? window.umami.track(name, data) : window.umami.track(name);
      }
    } catch (e) { /* never break the page for analytics */ }
  }

  // which page are we on
  var path = location.pathname.split("/").pop() || "index.html";
  var page = path.replace(".html", "") || "home";

  // ---- 1. scroll depth ----------------------------------------------------
  // Fires once per threshold per page load. Used for case study completion.
  var marks = [25, 50, 75, 100];
  var fired = {};

  function onScroll() {
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable < 400) return;              // page too short to measure
    var pct = (window.scrollY / scrollable) * 100;

    for (var i = 0; i < marks.length; i++) {
      var m = marks[i];
      if (!fired[m] && pct >= m - 1) {
        fired[m] = true;
        track("scroll-depth", { page: page, depth: m });
      }
    }
  }

  // ---- 2. section reached (powers the page-map drop-off chart) -----------
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

  // ---- 3. clicks ----------------------------------------------------------
  // One delegated listener. Covers cards, outbound, resume, email, socials.
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a");
    if (!a) return;
    var href = a.getAttribute("href") || "";

    // case study cards
    if (href.indexOf("app-merge") > -1)   return track("card-click", { card: "app-merge", from: page });
    if (href.indexOf("rise-portal") > -1) return track("card-click", { card: "rise-portal", from: page });
    if (href.indexOf("about") > -1)       return track("nav-about", { from: page });

    // card 03 sends people off-site — measured separately on purpose
    if (href.indexOf("runable.com") > -1) return track("outbound-runable", { from: page });

    // intent signals
    if (href.indexOf("resume.pdf") > -1)  return track("resume-open", { from: page });
    if (href.indexOf("mailto:") === 0)    return track("email-click", { from: page });
    if (href.indexOf("linkedin.com") > -1)  return track("social-click", { to: "linkedin" });
    if (href.indexOf("behance.net") > -1)   return track("social-click", { to: "behance" });
    if (href.indexOf("figma.com") > -1)     return track("social-click", { to: "figma" });

    // any other external link
    if (/^https?:\/\//.test(href) && href.indexOf(location.hostname) === -1) {
      track("outbound-other", { href: href.slice(0, 80) });
    }
  }, true);

  // ---- 4. email copied ----------------------------------------------------
  // The copy button is not an <a>, so catch it separately.
  document.addEventListener("click", function (ev) {
    var el = ev.target.closest && ev.target.closest("[data-copy], .copy, button");
    if (!el) return;
    var txt = (el.textContent || "") + " " + (el.getAttribute("aria-label") || "");
    if (/copy|email|@/i.test(txt)) track("email-copied", { from: page });
  }, true);

  // ---- 5. command palette -------------------------------------------------
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

  // ---- 6. hero exit -------------------------------------------------------
  // Did they scroll past the hero at all? Brutal, and the most useful number.
  var scrolled = false;
  function heroCheck() {
    if (scrolled) return;
    if (window.scrollY > window.innerHeight * 0.6) {
      scrolled = true;
      track("passed-hero", { page: page });
    }
  }

  // ---- 7. read time -------------------------------------------------------
  // Bucketed, not exact. Exact seconds would be false precision at this volume.
  var start = Date.now();
  function onLeave() {
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watchSections);
  } else {
    watchSections();
  }
})();
