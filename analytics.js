// Portfolio analytics helpers - layered on top of Umami.
(function () {
  function track(name, data) {
    if (window.umami && typeof window.umami.track === "function") window.umami.track(name, data || {});
  }
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (/resume/i.test(href)) track("resume-click", { href: href });
    else if (/^mailto:/i.test(href)) track("email-click", { href: href });
    else if (/^https?:/i.test(href) && a.hostname !== location.hostname) track("outbound", { href: href });
  }, true);
  window.pfTrack = track;
})();
