/* aitwin.js: "Ask my AI twin", on every page.
   The homepage carries the dock and the chat markup and styles inline; any
   other page gets them injected here, with aitwin.css, before the chat client
   (below, unchanged from the homepage) starts. */
/* Phones: no wide dock. The AI twin is the animated hand, one more button
   at the front of the nav pill, a hairline before the page icons. Added before the chat
   client runs, so its hand animates like the dock's. */
(function(){
  var nav = document.querySelector("#siteHeader .navlinks");
  if (!nav || document.getElementById("navAsk")) return;
  var b = document.createElement("button");
  b.type = "button"; b.id = "navAsk"; b.className = "navask";
  b.setAttribute("aria-label", "Ask my AI twin");
  b.innerHTML = '<canvas class="askhand" width="22" height="22" aria-hidden="true"></canvas>';
  var line = document.createElement("span");
  line.className = "navsep"; line.setAttribute("aria-hidden", "true");
  nav.insertBefore(line, nav.firstChild);
  nav.insertBefore(b, line);
  b.addEventListener("click", function(){ var d = document.getElementById("askDock"); if (d) d.click(); });
  var pill = nav.closest(".navpill");
  if (pill && window.ResizeObserver) new ResizeObserver(function(){
    document.documentElement.style.setProperty("--navpill-w", pill.offsetWidth + "px");
  }).observe(pill);
})();

(function(){
  if (document.getElementById("aiChat")) return;
  var head = document.head;
  if (!document.querySelector('link[href*="STIX+Two+Text"]')) {
    var f = document.createElement("link"); f.rel = "stylesheet";
    f.href = "https://fonts.googleapis.com/css2?family=Geist:wght@400;500&family=Geist+Mono:wght@400;500&family=STIX+Two+Text:ital,wght@0,400;0,500;0,600;1,400&display=swap";
    head.appendChild(f);
  }
  var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "./aitwin.css?v=2"; head.appendChild(l);
  var wrap = document.createElement("div");
  wrap.innerHTML = "  <button type=\"button\" class=\"askdock\" id=\"askDock\" aria-label=\"Ask my AI twin\" tabindex=\"-1\" aria-hidden=\"true\">\n    <canvas class=\"askhand\" width=\"20\" height=\"20\" aria-hidden=\"true\"></canvas><span class=\"askdock-t\"><span class=\"heroask-q\">Ask my</span> AI twin</span><span class=\"askdock-go\" aria-hidden=\"true\"><svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M5 12h14\"/><path d=\"m12 5 7 7-7 7\"/></svg></span>\n  </button>\n\n  <div class=\"aichat\" id=\"aiChat\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"aiChatTitle\" aria-hidden=\"true\">\n    <div class=\"aichat-scrim\" data-aichat-close></div>\n    <div class=\"aichat-panel\" tabindex=\"-1\">\n      <span class=\"aichat-handle\" aria-hidden=\"true\"></span>\n\n\n      <section class=\"aimain\">\n        <div class=\"aichat-head\">\n          <div class=\"aiwm aiid\">\n            <span class=\"aiav\" aria-hidden=\"true\"><img src=\"assets/avatar-96.webp\" alt=\"\" width=\"36\" height=\"36\"></span>\n            <span class=\"aiid-t\">\n              <span class=\"aiid-n\" id=\"aiChatTitle\"><span class=\"aiwm-n\">Lokesh Bhatia</span><span class=\"aiwm-b\">AI</span></span>\n              <span class=\"aiid-s\" id=\"aiHeadStatus\">Trained on my work and r\u00e9sum\u00e9</span>\n            </span>\n          </div>\n          <span id=\"aiChatSpark\" hidden></span>\n          <button type=\"button\" class=\"aichat-iconbtn\" id=\"aiChatReset\" aria-label=\"New chat\" title=\"New chat\">\n            <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"/><path d=\"M12 7v6\"/><path d=\"M9 10h6\"/></svg>\n          </button>\n          <button type=\"button\" class=\"aichat-iconbtn\" id=\"aiChatClose\" aria-label=\"Close\" title=\"Close\">\n            <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M18 6 6 18\"/><path d=\"m6 6 12 12\"/></svg>\n          </button>\n        </div>\n        <div class=\"aichat-body\" id=\"aiChatBody\">\n          <div class=\"aichat-intro\" id=\"aiChatIntro\">\n            <canvas class=\"aihand\" id=\"aiHand\" aria-hidden=\"true\"></canvas>\n            <div class=\"aihero\"><p class=\"aihero-t\" id=\"aiHero\">What would you like to know?</p></div>\n          </div>\n        </div>\n        <p class=\"fsr\" id=\"aiChatLive\" aria-live=\"polite\"></p>\n        <div class=\"aichat-foot\" id=\"aiChatFoot\">\n          <div class=\"aitray\">\n            <div class=\"aitray-top\">\n              <p class=\"ailabel\" id=\"aiTrayLabel\">Ask me about</p>\n              <div class=\"airows\" id=\"aiChatSuggest\"></div>\n            </div>\n            <form class=\"aicomposer\" id=\"aiChatForm\">\n              <textarea class=\"aichat-input\" id=\"aiChatInput\" rows=\"1\" maxlength=\"600\" placeholder=\"Ask about my work, my career, or AI&#8230;\" aria-label=\"Ask me a question\"></textarea>\n              <div class=\"aicomposer-row\">\n                <button type=\"submit\" class=\"aichat-send\" id=\"aiChatSend\" aria-label=\"Send\" disabled>\n                  <svg class=\"ico-send\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m5 12 7-7 7 7\"/><path d=\"M12 19V5\"/></svg>\n                  <svg class=\"ico-stop\" width=\"10\" height=\"10\" viewBox=\"0 0 12 12\" aria-hidden=\"true\"><rect x=\"1\" y=\"1\" width=\"10\" height=\"10\" rx=\"2.2\" fill=\"currentColor\"></rect></svg>\n                </button>\n              </div>\n            </form>\n          </div>\n          <div class=\"aihint\"><span>AI version of me &#183; can be wrong</span></div>\n        </div>\n      </section>\n    </div>\n  </div>";
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

  // Case studies shift their reading column right of centre to make room
  // for the contents rail. There the dock centres on the column, like the
  // footer under it, not on the screen.
  var dock = document.getElementById("askDock");
  function alignDock(){
    var toc = document.querySelector(".toc"), col = document.querySelector(".shell .col");
    var railOn = toc && col && toc.getBoundingClientRect().width > 0 && getComputedStyle(toc).display !== "none" && window.innerWidth > 576;
    if (!railOn) { dock.style.left = ""; return; }
    var r = col.getBoundingClientRect();
    dock.style.left = Math.round(r.left + r.width / 2) + "px";
  }
  alignDock();
  window.addEventListener("resize", alignDock);
  window.addEventListener("load", alignDock);
})();

/* ══ THE OG ASSISTANT — chat client ═══════════════════════════════════
   Talks to /api/chat, which proxies Groq with Lokesh's facts as a system
   prompt (see api/data/lokesh-context.js) and streams the reply back as
   plain OpenAI-style SSE. Everything here is presentation: the panel, a
   transcript of question-and-answer exchanges, tokens as they land. */
(function(){
  var panel = document.getElementById("aiChat");
  if (!panel) return;
  var askBtn = document.getElementById("askAiBtn");
  var askBtnMobile = document.getElementById("askAiBtnMobile");
  var sheet = panel.querySelector(".aichat-panel");
  var head = panel.querySelector(".aichat-head");
  var scrim = panel.querySelector(".aichat-scrim");
  var headSpark = document.getElementById("aiChatSpark");
  var closeBtn = document.getElementById("aiChatClose");
  var resetBtn = document.getElementById("aiChatReset");
  var body = document.getElementById("aiChatBody");
  var intro = document.getElementById("aiChatIntro");
  var suggest = document.getElementById("aiChatSuggest");
  var form = document.getElementById("aiChatForm");
  var input = document.getElementById("aiChatInput");
  var sendBtn = document.getElementById("aiChatSend");
  var live = document.getElementById("aiChatLive");

  var MAIL = "hi.lokeshux@gmail.com";
  var FALLBACK = "Sorry, I lost my train of thought there. The real me won\u2019t.";
  var BUSY = "Everyone\u2019s asking me things at once, so I can\u2019t answer live right now. I\u2019ll keep trying, or you can read the answer or send it to the real me.";
  var OFFLINE = "You seem to be offline. I\u2019ll ask again as soon as you\u2019re back.";
  var BROKEN = "Something went wrong on my end.";
  var LONG = "This chat has got long. Start a fresh one and I\u2019ll pick up your question.";
  var ICON_RETRY = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.6 8a5.4 5.4 0 1 0 1.6-3.85M2.6 2.6v3.2h3.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  // a retry waiting to happen (countdown or back-online); anything the
  // visitor does next cancels it
  var cancelRetry = null;
  function dropRetry(){ if (cancelRetry){ var c = cancelRetry; cancelRetry = null; c(); } }
  var ARROW = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';


  // Lucide icons, as the Instead prototype uses them: 24-unit paths drawn
  // at 14px by default (12px inline, 16px for header actions), 1.5 stroke,
  // round caps and joins.
  var LP = {
    thumbsUp: '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
    thumbsDown: '<path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    arrowUp: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    cornerDownRight: '<path d="m15 10 5 5-5 5"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    cornerDownLeft: '<path d="M20 4v7a4 4 0 0 1-4 4H4"/><path d="m9 10-5 5 5 5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    messagePlus: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 7v6"/><path d="M9 10h6"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    sparkles: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0l1.58 6.14a2 2 0 0 0 1.44 1.44l6.14 1.58a.5.5 0 0 1 0 .96l-6.14 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    fileText: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    arrowUpRight: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>'
  };
  function LI(name, size, stroke){
    size = size || 14;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (stroke || 1.5) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + LP[name] + "</svg>";
  }

  // The opening four are fixed and in this order: the questions a
  // recruiter screening a designer actually has, strongest story first.
  var STARTERS = [
    { q: "What's the project you're proudest of?", tag: "Work", hint: "The Rupeezy app merge" },
    { q: "What have you actually designed for AI?", tag: "AI", hint: "Two products, Runable and ZZAZZ" },
    { q: "How did you get into design?", tag: "Career", hint: "Self-taught, from chemical science" },
    { q: "How do you work with PMs and engineers?", tag: "Craft", hint: "One PM, seven engineers" }
  ];
  // When the live AI can't answer (every free model busy, or an outage),
  // a suggested question still gets a real answer: one written by the
  // same AI from the same facts, saved here. Typed questions that aren't
  // in this list get the honest card instead. Regenerate with the live
  // API when the facts change.
  var SAVED_ANSWERS = {
  "Do you have fintech experience?": "<<used: about, resume>>\nYes, fintech is **my strongest domain**.\n\nI spent 18 months at Rupeezy, a stockbroker, owning the trading app end to end. More than **200,000 registered users** used it, and **97% of company revenue** ran through that product.\n\nRegulation is not an edge case for me. It is a normal design constraint I worked inside every day, covering KYC flows, SEBI compliance rules, and payment systems.\n\n[case:app-merge]",
  "How big was the revenue hit?": "<<used: app-merge>>\nTrading revenue fell **about 75%** after new rules for derivatives.\n\nI checked that number myself in Firebase. When SEBI announced those rules in October 2024, it led to that drop by March 2025, meaning we had to combine the trading app and Investeezy into one app, fast.\n\n[case:app-merge]",
  "How did you build this site?": "<<used: about>>\nI built this entire site using **Claude Code and Claude Design**.\n\nI am not a developer, so I direct the AI and push back when the output looks generated rather than considered. That includes the navigation, analytics dashboard, and interactive demos. I use AI a lot in my own work day to day, but the costly design calls are still mine.",
  "How did you get into design?": "<<used: about>>\nI didn't study design at all, so **I taught myself** from scratch. \n\nI graduated from IIT Guwahati in Chemical Science. While there, I became the campus photographer, which led me to pick up Photoshop and Adobe XD on my own. \n\nTo prove I could actually do the work, I did unpaid, unsolicited design tasks. That landed me my first paid design job just **four months** after graduation, without going to a bootcamp.",
  "How do I reach you directly?": "<<used: about>>\nThe best way is to **email me directly** at hi.lokeshux@gmail.com.\n\nYou can also find me on LinkedIn at linkedin.com/in/lkb01.",
  "How do you approach a design problem?": "<<used: about>>\nI start with what the user needs, then look at **real constraints to make a call**.\n\nI figure out the user problem, then check the hard boundaries: budget, timeline, regulation, or whatever is real. That is where the design happens.\n\nAfter shipping, I go check what actually happened . I don't just ship something and walk away.",
  "How do you use AI day to day?": "<<used: about>>\nI use AI as a **first-draft tool and building partner**, not a decision-maker.\n\nI use Claude Code and Claude Design to build things day to day. I directed Claude to build this entire portfolio site, including the navigation and the analytics dashboard. I am not a developer, so my job is to direct the AI and push back when the output looks generated rather than considered.\n\nFor actual decisions, I do not use AI. It is fast at the average answer, but the costly calls are still mine to make.",
  "How do you work with PMs and engineers?": "<<used: about, resume>>\nI keep design and build close, mostly by **defining the shared system**.\n\nAt Rupeezy, I worked with one PM and seven engineers. I defined the design tokens and variables that engineers used in production code, so design and code stayed in sync. I also worked directly with compliance on SEBI and KYC rules.\n\nAt Runable there was no PM, so I took on that part of the job myself from concept to launch.",
  "What are you looking for next?": "<<used: resume>>\nWhat I want next is **one product I can go deep on for years**.\nI am looking for a place where I can settle in and build over a long stretch.\n- **Availability:** Immediately. I have no notice period.\n- **Location:** I can work remotely, move anywhere in India, or do on-site and hybrid work.",
  "What did Rise Portal actually change?": "<<used: rise-portal>>\nIt changed **how partners worked with us**, and the results showed up clearly.\n\nRise Portal served about **100 partners** who drove **35%** of company revenue. After launch, lead-to-client conversion rose **2.4x** and partner support tickets fell **48%**. The source for both numbers is the support team.\n\n[case:rise-portal]",
  "What have you actually designed for AI?": "<<used: about, resume>>\nTwo AI products, and both put **trust before speed**.\n\nAt Runable, people didn't trust the agent because all they saw was a loading spinner. I designed a view that shows each step the agent takes as it happens. It puts more on screen, but people could finally see what the AI was doing.\n\nAt ZZAZZ, I designed tools that suggest better headlines for publishers. The AI only suggests and the editor decides, because for someone whose name is on the article, control matters more than speed.",
  "What was it like being the only designer?": "<<used: about, resume>>\nIt has been **most of my career**, and it means learning the parts nobody assigns you.\n\nAt Runable I was the founding designer with no PM. I built the whole first version from scratch, onboarding included, and it shipped and did well.\n\nAt Sustainability Economics I was the sole designer on a net-zero carbon accounting platform. Being alone meant pressure-testing my own thinking because there was no one else to catch it.",
  "What won't you use AI for?": "<<used: about>>\nI don't use AI for **making the final decision**. \n\nIt is fast at giving the average answer, but the costly call is still mine. I treat AI as a first-draft tool, not a decision-maker.",
  "What's the project you're proudest of?": "<<used: app-merge>>\nThe Rupeezy app merge, where I shipped the agreed switch and then **designed the better model**.\n\nWhen new SEBI rules for derivatives cut our trading revenue by **about 75%**, the company needed both products in one app, fast. I built the simple switch and it shipped in **six weeks**. \n\nA switch only works for two things, so I designed a model that could hold any number of products. It was built after I left, and it is live in the app today.\n\n[case:app-merge]",
  "When can you start?": "<<used: resume>>\n\n**Immediately.** I have no notice period to serve. \n\nI am happy to work remotely or move anywhere in India, and I am open to both on-site and hybrid setups.",
  "Where do the Rise Portal numbers come from?": "<<used: rise-portal>>\nBoth numbers come from our **support team**.\n\nAfter launch, lead-to-client conversion rose **2.4x** and partner support tickets fell **48%**. The support team is the source for both.\n\n[case:rise-portal]",
  "Why not just keep the switch?": "<<used: app-merge>>\nA switch **only works for two things**.\n\nWe built the simple switch first and shipped it in **six weeks** because we had to move fast after SEBI rules hit our revenue. \n\nWhile building it, I saw its limit because more products were coming. A switch model breaks down once you add a third product, so I designed a model that could hold any number of them instead.\n\n[case:app-merge]",
  "Why was your new model paused?": "<<used: app-merge>>\nIt was paused because every team was **busy with SEBI compliance work**.\n\nWhen SEBI announced new rules for derivatives, our trading revenue fell **about 75%**, so the company needed both products in one app fast. All our energy had to go toward meeting the regulatory requirements first. \n\n[case:app-merge]",
  "Would you relocate?": "<<used: resume>>\nYes, I am **happy to move anywhere in India**. \n\nI am also open to working remotely, on-site, or in a hybrid setup. I can start immediately since I have no notice period to serve."
};
  var SAVED = {};
  Object.keys(SAVED_ANSWERS).forEach(function(q){ SAVED[q.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim()] = SAVED_ANSWERS[q]; });
  function savedAnswerFor(q){ return SAVED[(q || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim()] || null; }
  // the page most likely to answer a question the AI couldn't
  function pageFor(q){
    var t = (q || "").toLowerCase();
    if (/merge|switch|investeezy|proudest|revenue|sebi|paused|model/.test(t)) return { href: "./app-merge.html", label: "Read the App Merge case study" };
    if (/rise|partner|referral/.test(t)) return { href: "./rise-portal.html", label: "Read the Rise Portal case study" };
    if (/terminal|watchlist|chart|order|web app|desktop/.test(t)) return { href: "./web-terminal.html", label: "Read the Web Terminal case study" };
    if (/r[eé]sum[eé]|\bcv\b|experience|career|start|notice|relocat|remote|company|companies|role/.test(t)) return { href: "./resume.html", label: "See my r\u00e9sum\u00e9" };
    if (/design|ai|work|process|photograph|learn|yourself|about/.test(t)) return { href: "./about.html", label: "Read my About page" };
    return null;
  }

  // "Ask next" draws from these plus any starter not yet asked
  var QUESTION_POOL = STARTERS.concat([
    { q: "What did Rise Portal actually change?", tag: "Work" },
    { q: "Do you have fintech experience?", tag: "Work" },
    { q: "How did you build this site?", tag: "Craft" },
    { q: "What was it like being the only designer?", tag: "Career" },
    { q: "What are you looking for next?", tag: "Career" },
    { q: "When can you start?", tag: "Hiring" },
    { q: "How do I reach you directly?", tag: "Hiring" }
  ]);

  var history = [], asked = [], busy = false, lastFocus = null, stopCurrent = null;
  var canHover = window.matchMedia && window.matchMedia("(hover:hover)").matches;
  setTimeout(function(){ renderRail(); }, 0);

  function shuffle(a){
    for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function pick(n, oneEachTag){
    var fresh = shuffle(QUESTION_POOL.filter(function(x){ return asked.indexOf(x.q) === -1; }));
    if (fresh.length < n) fresh = shuffle(QUESTION_POOL.slice());
    if (!oneEachTag) return fresh.slice(0, n);
    var out = [], tags = [];
    fresh.forEach(function(x){ if (out.length < n && tags.indexOf(x.tag) === -1){ out.push(x); tags.push(x.tag); } });
    fresh.forEach(function(x){ if (out.length < n && out.indexOf(x) === -1) out.push(x); });
    return out;
  }
  function chip(item){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "aichip";
    b.innerHTML = "<span></span>" + ARROW;
    b.firstChild.textContent = item.q;
    b.addEventListener("click", function(){ sendMessage(item.q); });
    return b;
  }
  var TOPIC = { Work: "My work", AI: "AI", Craft: "Working together", Career: "Career", Hiring: "Hiring" };
  // Familiar icons, one per topic (NN/g: recognisable icon + plain label),
  // so a row says what kind of question it is before it's read.
  var SVG = function(d){ return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' + d + "</svg>"; };
  var TOPIC_ICON = {
    Work:   SVG('<rect x="2" y="4.5" width="12" height="9" rx="1.8" stroke="currentColor" stroke-width="1.4"/><path d="M5.8 4.5V3.2c0-.5.4-.9.9-.9h2.6c.5 0 .9.4.9.9v1.3M2 8.5h12" stroke="currentColor" stroke-width="1.4"/>'),
    AI:     SVG('<path d="M8 1.8c.4 2.9 1.3 3.8 4.2 4.2-2.9.4-3.8 1.3-4.2 4.2-.4-2.9-1.3-3.8-4.2-4.2 2.9-.4 3.8-1.3 4.2-4.2Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M12.4 10.6c.2 1.2.6 1.6 1.8 1.8-1.2.2-1.6.6-1.8 1.8-.2-1.2-.6-1.6-1.8-1.8 1.2-.2 1.6-.6 1.8-1.8Z" fill="currentColor"/>'),
    Craft:  SVG('<circle cx="5.6" cy="5.6" r="2.2" stroke="currentColor" stroke-width="1.4"/><circle cx="11" cy="6.4" r="1.8" stroke="currentColor" stroke-width="1.4"/><path d="M1.8 13.4c.4-2.2 1.9-3.4 3.8-3.4s3.4 1.2 3.8 3.4M9.6 10.3c1.6-.2 3.8.5 4.6 3.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'),
    Career: SVG('<path d="M2.5 13.5h3v-3h3v-3h3v-3h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>'),
    Hiring: SVG('<rect x="2.2" y="3" width="11.6" height="10.5" rx="1.8" stroke="currentColor" stroke-width="1.4"/><path d="M2.2 6.5h11.6M5.5 1.8v2.4M10.5 1.8v2.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>')
  };
  var ICON_FOLLOW = SVG('<path d="M3.5 2.5v5.2c0 1.1.9 2 2 2h7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M10 7l2.6 2.7L10 12.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>');
  function sugRow(item, icon){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "aisug";
    b.innerHTML = '<span class="aisug-i">' + icon + '</span><span class="aisug-t"></span><span class="aisug-a">' + ARROW + "</span>";
    b.querySelector(".aisug-t").textContent = item.q;
    if (item.tag) b.title = TOPIC[item.tag] || item.tag;
    b.addEventListener("click", function(){ sendMessage(item.q); });
    return b;
  }
  function dotRow(item){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "aitr";
    // just the question: it already says what the answer is about. The
    // arrow only appears on hover or focus, to say "this sends it".
    b.innerHTML = '<span class="aitr-t"></span><span class="aitr-a" aria-hidden="true">' + ARROW + "</span>";
    b.querySelector(".aitr-t").textContent = item.q;
    b.addEventListener("click", function(){ sendMessage(item.q); });
    return b;
  }
  // Suggestions live in the tray the composer docks into, as pill rows;
  // hovering a row reveals its action, as in the prototype's "Open".
  function trayRow(q){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "airow";
    b.innerHTML = '<span class="airow-i" aria-hidden="true">' + LI("cornerDownRight", 12) + '</span><span class="airow-t"></span>' +
      '<span class="airow-go">Ask' + LI("cornerDownLeft", 12) + '</span><span class="airow-arr" aria-hidden="true">' + LI("arrowRight", 12) + "</span>";
    b.querySelector(".airow-t").textContent = q;
    b.addEventListener("click", function(){ sendMessage(q); });
    return b;
  }
  var trayLabel = document.getElementById("aiTrayLabel");
  function fillTray(label, qs){
    suggest.innerHTML = "";
    if (trayLabel) trayLabel.textContent = label;
    qs.forEach(function(q){ suggest.appendChild(trayRow(q)); });
    suggest.parentNode.hidden = !qs.length;
  }
  function renderTry(){
    fillTray("Ask me about", SCOPES[scope].rows);
  }
  // The context pill: what the conversation is about, as the prototype's
  // "All clients ⌄". Choosing one changes the heading, the suggestions,
  // and tells the model which part of my work to answer from.
  var SCOPES = {
    all:    { label: "Everything", icon: "layers", hero: "What would you like to know?",
              rows: ["What's the project you're proudest of?", "What have you actually designed for AI?", "How did you get into design?", "How do you work with PMs and engineers?"] },
    work:   { label: "My work", icon: "briefcase", hero: "Which project should we start with?",
              rows: ["What's the project you're proudest of?", "What did Rise Portal actually change?", "Do you have fintech experience?", "How do you approach a design problem?"] },
    ai:     { label: "AI", icon: "sparkles", hero: "Ask me how I design for AI.",
              rows: ["What have you actually designed for AI?", "How do you use AI day to day?", "What won't you use AI for?"] },
    career: { label: "Career", icon: "route", hero: "Ask me about my career.",
              rows: ["How did you get into design?", "What was it like being the only designer?", "What are you looking for next?"] },
    hiring: { label: "Hiring", icon: "users", hero: "Let\u2019s talk about working together.",
              rows: ["When can you start?", "Would you relocate?", "How do you work with PMs and engineers?", "How do I reach you directly?"] }
  };
  var scope = "all";
  var ctxBtn = document.getElementById("aiCtxBtn"), ctxMenu = document.getElementById("aiCtxMenu");
  var heroEl = document.getElementById("aiHero");
  function paintCtx(){
    if (!ctxBtn) return;
    document.getElementById("aiCtxIcon").innerHTML = LI(SCOPES[scope].icon, 12);
    document.getElementById("aiCtxName").textContent = SCOPES[scope].label;
    ctxBtn.querySelector(".aictx-chev").innerHTML = LI("chevronDown", 12);
    ctxBtn.classList.toggle("is-scoped", scope !== "all");
    ctxMenu.innerHTML = '<p class="ailabel">What\u2019s this about?</p>' + Object.keys(SCOPES).map(function(k){
      return '<button type="button" class="aictx-item" role="menuitemradio" aria-checked="' + (k === scope) + '" data-k="' + k + '">' +
        '<span class="aictx-ic">' + LI(SCOPES[k].icon, 14) + '</span><span class="aictx-l">' + SCOPES[k].label + "</span>" +
        (k === scope ? '<span class="aictx-ck">' + LI("check", 12) + "</span>" : "") + "</button>";
    }).join("");
  }
  function setScope(k){
    scope = k;
    paintCtx();
    closeCtx();
    if (!panel.classList.contains("has-chat")){ renderTry(); typeHero(SCOPES[k].hero, false); }
    input.focus({ preventScroll: true });
  }
  function openCtx(){ ctxMenu.hidden = false; ctxBtn.setAttribute("aria-expanded", "true"); var on = ctxMenu.querySelector('[aria-checked="true"]'); if (on) on.focus(); }
  function closeCtx(){ ctxMenu.hidden = true; ctxBtn.setAttribute("aria-expanded", "false"); }
  if (ctxBtn){
  ctxBtn.addEventListener("click", function(e){ e.stopPropagation(); ctxMenu.hidden ? openCtx() : closeCtx(); });
  ctxMenu.addEventListener("click", function(e){ var it = e.target.closest(".aictx-item"); if (it) setScope(it.getAttribute("data-k")); });
  document.addEventListener("click", function(e){ if (!ctxMenu.hidden && !e.target.closest(".aictx")) closeCtx(); });
  ctxMenu.addEventListener("keydown", function(e){
    var items = Array.prototype.slice.call(ctxMenu.querySelectorAll(".aictx-item")), i = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown"){ e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === "ArrowUp"){ e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === "Escape"){ e.stopPropagation(); closeCtx(); ctxBtn.focus(); }
  });
  }
  // The prototype's hero: the wordmark flips (rotateX) into the heading,
  // which then types in at 15ms a character.
  // ---- the welcome wave --------------------------------------------
  var handCv = document.getElementById("aiHand"), handRaf = 0, handPts = null;
  var HAND_D = ["M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2", "M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2",
    "M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8",
    "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"];
  // two small arcs off the fingertips: the "motion" of the wave
  var MOTION_D = ["M20.2 1.2a3.2 3.2 0 0 1 2.6 2.6", "M20.6 -1a5.6 5.6 0 0 1 4.4 4.4"];
  var AI_HUES = [[108,155,255], [177,124,255], [255,134,183], [255,176,112]];
  function samplePaths(list, gap){
    var ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg"), out = [];
    svg.setAttribute("style", "position:absolute;width:0;height:0;visibility:hidden");
    document.body.appendChild(svg);
    list.forEach(function(d, pi){
      var el = document.createElementNS(ns, "path"); el.setAttribute("d", d); svg.appendChild(el);
      var len = el.getTotalLength(), n = Math.max(2, Math.round(len / gap));
      for (var i = 0; i <= n; i++){ var pt = el.getPointAtLength(len * i / n); out.push({ x: pt.x, y: pt.y, path: pi }); }
    });
    svg.remove();
    // drop points that land on top of each other where paths meet
    return out.filter(function(p, i){
      for (var j = 0; j < i; j++){ var q = out[j]; if ((p.x-q.x)*(p.x-q.x) + (p.y-q.y)*(p.y-q.y) < gap*gap*0.35) return false; }
      return true;
    });
  }
  function mix(a, b, t){ return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }
  function hueAt(t){ t = Math.max(0, Math.min(.999, t)) * (AI_HUES.length - 1); var i = Math.floor(t); return mix(AI_HUES[i], AI_HUES[i+1], t - i); }
  function inkRgb(){
    var m = getComputedStyle(heroEl || document.body).color.match(/\d+/g);
    return m ? [+m[0], +m[1], +m[2]] : [36, 32, 32];
  }
  function playHand(quick){
    if (!handCv) return;
    cancelAnimationFrame(handRaf);
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var css = handCv.clientWidth || 88, dpr = Math.min(window.devicePixelRatio || 1, 3);
    handCv.width = Math.round(css * dpr); handCv.height = Math.round(css * dpr);
    var g = handCv.getContext("2d"), S = css / 30, OX = css / 2 - 12 * S, OY = css / 2 - 11.5 * S;
    if (!handPts) handPts = { hand: samplePaths(HAND_D, 1.2), motion: samplePaths(MOTION_D, 1.1) };
    var ink = inkRgb(), N = handPts.hand.length, R = Math.max(1, css / 72);
    // each point starts somewhere in a loose cloud and swirls in on a curve
    var P = handPts.hand.map(function(p, i){
      var a = Math.random() * 6.2832, r = (0.55 + Math.random() * 0.6) * css * 0.5;
      var sx = css/2 + Math.cos(a) * r, sy = css/2 + Math.sin(a) * r * 0.85;
      var tx = OX + p.x * S, ty = OY + p.y * S;
      var bend = (Math.random() - 0.5) * css * 0.5;
      return { sx: sx, sy: sy, tx: tx, ty: ty,
        cx: (sx + tx) / 2 - (ty - sy) * 0.001 * bend * 4, cy: (sy + ty) / 2 + (tx - sx) * 0.001 * bend * 4,
        delay: (quick ? 0 : 1) * ((i / N) * 420 + Math.random() * 180), hue: hueAt(i / N) };
    });
    var FLY = quick ? 0 : 900, WAVE_AT = quick ? 0 : 1250, WAVE = 1500;
    var PX = OX + 12 * S, PY = OY + 22 * S; // the wrist
    function ease(t){ return t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 4); }
    var t0 = performance.now();
    function frame(now){
      var t = reduce ? 1e5 : now - t0;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, css, css);
      var w = (t - WAVE_AT) / WAVE, ang = 0;
      if (w > 0 && w < 1) ang = Math.sin(w * Math.PI * 4) * Math.pow(1 - w, 1.4) * 0.34;
      // motion arcs, only while it waves
      if (w > 0 && w < 1){
        var ma = Math.sin(Math.min(1, w * 1.6) * Math.PI) * 0.55;
        g.fillStyle = "rgba(" + ink.join(",") + "," + ma + ")";
        handPts.motion.forEach(function(p){ g.beginPath(); g.arc(OX + p.x * S, OY + p.y * S, R * 0.8, 0, 6.2832); g.fill(); });
      }
      g.save(); g.translate(PX, PY); g.rotate(ang); g.translate(-PX, -PY);
      var busy = w < 1;
      for (var i = 0; i < P.length; i++){
        var p = P[i], k = FLY ? (t - p.delay) / FLY : 1, e = ease(k);
        if (k <= 0){ busy = true; continue; }
        var u = 1 - e, x = u*u*p.sx + 2*u*e*p.cx + e*e*p.tx, y = u*u*p.sy + 2*u*e*p.cy + e*e*p.ty;
        // colour holds its AI hue in flight, then settles into ink on landing
        var land = FLY ? Math.max(0, Math.min(1, (t - p.delay - FLY * 0.7) / 380)) : 1;
        var c = mix(p.hue, ink, land), alpha = Math.min(1, 0.15 + e);
        var pulse = land > 0 && land < 1 ? 1 + Math.sin(land * Math.PI) * 0.45 : 1;
        if (land < 1) busy = true;
        g.fillStyle = "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + alpha + ")";
        g.beginPath(); g.arc(x, y, R * pulse * (0.7 + 0.3 * e), 0, 6.2832); g.fill();
      }
      g.restore();
      if (busy && !reduce) handRaf = requestAnimationFrame(frame);
    }
    handRaf = requestAnimationFrame(frame);
  }

  var heroPlayed = false;
  function typeHero(text, withMark){
    if (!heroEl) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function type(){
      heroEl.classList.remove("is-mark", "is-leaving");
      if (reduce){ heroEl.textContent = text; return; }
      heroEl.innerHTML = text.split(" ").map(function(w, wi, arr){
        var before = arr.slice(0, wi).join(" ").length + (wi ? 1 : 0);
        return '<span class="tw-word">' + w.split("").map(function(ch, ci){
          return '<span class="tw-char" style="animation-delay:' + ((before + ci) * 15) + 'ms">' + escapeHtml(ch) + "</span>";
        }).join("") + "</span>";
      }).join(" ");
      heroEl.classList.add("is-entering");
      setTimeout(function(){ heroEl.classList.remove("is-entering"); heroEl.textContent = text; }, text.length * 15 + 320);
    }
    if (withMark && !reduce){
      heroEl.textContent = "Lokesh Bhatia";
      heroEl.classList.add("is-mark");
      setTimeout(function(){ heroEl.classList.add("is-leaving"); }, 900);
      setTimeout(type, 1200);
    } else type();
  }
  paintCtx();

  // the header caption: the role at rest, the real state while working
  var stateEl = document.getElementById("aiState");
  var ROLE = stateEl ? stateEl.textContent : "";
  function setState(t){ if (stateEl) stateEl.textContent = t || ROLE; }
  // the rail: everything you can ask, grouped, ticking off as you go
  var railTopics = document.getElementById("aiRailTopics");
  function renderRail(){
    if (!railTopics) return;
    railTopics.innerHTML = "";
    ["Work", "AI", "Craft", "Career", "Hiring"].forEach(function(tag){
      var items = QUESTION_POOL.filter(function(x){ return x.tag === tag; });
      if (!items.length) return;
      var k = document.createElement("p");
      k.className = "airail-k";
      k.textContent = TOPIC[tag];
      railTopics.appendChild(k);
      items.forEach(function(item){
        var b = document.createElement("button");
        b.type = "button";
        b.className = "airail-q" + (asked.indexOf(item.q) > -1 ? " is-asked" : "");
        b.textContent = item.q;
        b.addEventListener("click", function(){ sendMessage(item.q); });
        railTopics.appendChild(b);
      });
    });
  }
  renderTry();

  // ── open / close ──────────────────────────────────────────────────────
  function releaseMobileNav(){
    var mobileNav = document.getElementById("mobileNav");
    if (!mobileNav || !mobileNav.classList.contains("open")) return;
    var lockedAt = -(parseInt(document.body.style.top || "0", 10)) || 0;
    mobileNav.classList.remove("open");
    document.body.classList.remove("menu-open");
    document.body.style.top = "";
    window.scrollTo(0, lockedAt);
    var burger = document.getElementById("burgerBtn");
    if (burger) burger.setAttribute("aria-expanded", "false");
  }
  // While the chat is open the page underneath must not move: pin the
  // body where it is (the same technique the mobile menu uses, which is
  // the one iOS Safari respects), and put it back exactly on close.
  var lockedY = 0;
  function isDocked(){ return window.matchMedia("(min-width:641px)").matches; }
  function lockPage(){
    if (isDocked()){ document.documentElement.classList.add("chat-docked"); return; }
    lockedY = window.scrollY || window.pageYOffset || 0;
    var gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.top = -lockedY + "px";
    if (gap > 0) document.body.style.paddingRight = gap + "px";
    document.body.classList.add("chat-open");
  }
  function unlockPage(){
    document.documentElement.classList.remove("chat-docked");
    if (!document.body.classList.contains("chat-open")) return;
    document.body.classList.remove("chat-open");
    document.body.style.top = "";
    document.body.style.paddingRight = "";
    window.scrollTo(0, lockedY);
  }
  // On a phone the keyboard covers the bottom of the layout viewport, and
  // a sheet pinned to that bottom would sit behind it, composer and all.
  // Track the visible viewport instead: the sheet rests on top of the
  // keyboard and never grows taller than what's actually visible.
  function fitViewport(){
    var vv = window.visualViewport;
    if (!vv) return;
    var kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    sheet.style.setProperty("--vvh", vv.height + "px");
    sheet.style.setProperty("--kb", kb + "px");
    panel.classList.toggle("kb-open", kb > 80);
    if (kb > 80) scrollDown(true);
  }
  if (window.visualViewport){
    window.visualViewport.addEventListener("resize", function(){ if (panel.classList.contains("open")) fitViewport(); });
    window.visualViewport.addEventListener("scroll", function(){ if (panel.classList.contains("open")) fitViewport(); });
  }
  // the dimmed page behind the sheet isn't scrollable either
  panel.querySelector(".aichat-scrim").addEventListener("touchmove", function(e){ e.preventDefault(); }, { passive: false });

  function openChat(){
    lastFocus = document.activeElement;
    releaseMobileNav();
    lockPage();
    fitViewport();
    if (!heroPlayed && !panel.classList.contains("has-chat")){ heroPlayed = true; heroEl.style.opacity = "0"; requestAnimationFrame(function(){ playHand(false); }); setTimeout(function(){ heroEl.style.opacity = ""; typeHero(SCOPES[scope].hero, false); }, 1000); }
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    panel.setAttribute("aria-modal", isDocked() ? "false" : "true");
    // a phone keyboard would cover the introduction the moment it opened,
    // so only reach for the input where there's a real keyboard already
    setTimeout(function(){ (canHover ? input : sheet).focus({ preventScroll: true }); }, 380);
  }
  function closeChat(){
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    unlockPage();
    if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  [askBtn, askBtnMobile].forEach(function(b){ if (b) b.addEventListener("click", openChat); });

  // ---- entry points: the hero ask box and the dock --------------------
  function askFrom(q){
    q = (q || "").trim();
    if (q){ heroPlayed = true; }
    openChat();
    if (q) setTimeout(function(){ sendMessage(q); }, 60);
  }
  var heroAsk = document.getElementById("heroAsk");
  // the entry icons: the chat's welcome, small and on a loop. Dots
  // gather into the hand in the AI colours, settle into ink, wave,
  // rest, then drift apart and gather again. Runs only while visible.
  // When the live AI can't be reached, the hand comes apart: its dots
  // drift in a slow cloud. As the retry timer runs they gather back, so
  // the countdown IS the animation; when the hand is whole again it
  // tries again. With no timer (an outage) the dots just drift, and
  // gather when the visitor asks it to.
  function lostHand(cv, seconds, onWhole){
    var css = cv.clientWidth || 56, dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = Math.round(css * dpr); cv.height = Math.round(css * dpr);
    var g = cv.getContext("2d"), S = css / 26, OX = css / 2 - 12 * S, OY = css / 2 - 11.5 * S;
    var pts = samplePaths(HAND_D, 1.4), N = pts.length, R = Math.max(.9, css / 46);
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var P = pts.map(function(p, i){
      var a = Math.random() * 6.2832, r = (0.28 + Math.random() * 0.2) * css;
      return { tx: OX + p.x * S, ty: OY + p.y * S, cx: css/2 + Math.cos(a) * r, cy: css/2 + Math.sin(a) * r,
        ph: Math.random() * 6.2832, sp: 0.4 + Math.random() * 0.6, hue: hueAt(i / N) };
    });
    var t0 = 0, raf = 0, gatherAt = seconds ? seconds * 1000 : Infinity, whole = false, stopped = false;
    var SCATTER = 900;
    function ease(t){ return t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3); }
    function frame(now){
      raf = 0;
      if (stopped) return;
      if (!t0) t0 = now;
      var t = now - t0, ink = inkRgb();
      var out = ease(t / SCATTER);                                  // 0 hand → 1 cloud
      var back = gatherAt === Infinity ? 0 : ease((t - Math.max(SCATTER, gatherAt - 1400)) / 1400); // gather in the last 1.4s
      var k = out * (1 - back);                                     // how far from the hand
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, css, css);
      for (var i = 0; i < N; i++){
        var p = P[i];
        var dx = Math.cos(t / 1000 * p.sp + p.ph) * css * 0.05, dy = Math.sin(t / 1300 * p.sp + p.ph) * css * 0.05; // slow drift
        var x = p.tx + (p.cx + dx - p.tx) * k, y = p.ty + (p.cy + dy - p.ty) * k;
        var c = mix(ink, p.hue, Math.min(1, k * 1.2)), al = 1 - k * 0.55;
        g.fillStyle = "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + al.toFixed(3) + ")";
        g.beginPath(); g.arc(x, y, R, 0, 6.2832); g.fill();
      }
      if (back >= 1 && !whole){ whole = true; if (onWhole) onWhole(); return; }
      raf = requestAnimationFrame(frame);
    }
    if (reduce){ g.setTransform(dpr, 0, 0, dpr, 0, 0); P.forEach(function(p){ g.fillStyle = "rgb(" + inkRgb().join(",") + ")"; g.beginPath(); g.arc(p.tx, p.ty, R, 0, 6.2832); g.fill(); }); }
    else raf = requestAnimationFrame(frame);
    return {
      gather: function(){ if (gatherAt === Infinity){ gatherAt = (performance.now() - t0) + 1400; } },
      stop: function(){ stopped = true; if (raf) cancelAnimationFrame(raf); }
    };
  }
  function loopHand(cv, onCycle){
    var css, dpr, S, OX, OY, R, PX, PY, g = cv.getContext("2d");
    var pts = samplePaths(HAND_D, 2.2), N = pts.length, P = [], t0 = 0, raf = 0, visible = true;
    // Measured again whenever the canvas changes size. On pages that load
    // aitwin.css after this runs, the first measurement came before the
    // styles, and a hand drawn for that size shrunk into 22px vanished.
    function layout(){
      css = cv.clientWidth || 20; dpr = Math.min(window.devicePixelRatio || 1, 3);
      cv.width = Math.round(css * dpr); cv.height = Math.round(css * dpr);
      S = css / 26; OX = css / 2 - 12 * S; OY = css / 2 - 11.5 * S; R = Math.max(.7, css / 26);
      PX = OX + 12 * S; PY = OY + 22 * S;
    }
    layout();
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var GATHER = 1300, WAVE_AT = 2500, WAVE = 1200, SCATTER_AT = 4800, SCATTER = 650, CYCLE = 5500;
    function seed(){
      P = pts.map(function(p, i){
        var a = Math.random() * 6.2832, r = (0.3 + Math.random() * 0.25) * css;
        var sx = css/2 + Math.cos(a) * r, sy = css/2 + Math.sin(a) * r, tx = OX + p.x * S, ty = OY + p.y * S;
        var b = (Math.random() - 0.5) * 0.6;
        return { sx: sx, sy: sy, tx: tx, ty: ty, cx: (sx+tx)/2 - (ty-sy) * b, cy: (sy+ty)/2 + (tx-sx) * b,
          ox: tx + (tx - css/2) * (0.35 + Math.random() * 0.35), oy: ty + (ty - css/2) * (0.35 + Math.random() * 0.35) - css * 0.05,
          d: (i / N) * 260 + Math.random() * 120, hue: hueAt(i / N) };
      });
    }
    function ease(t){ return t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3); }
    function draw(t){
      var ink = inkRgb();
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, css, css);
      var w = (t - WAVE_AT) / WAVE, ang = (w > 0 && w < 1) ? Math.sin(w * Math.PI * 4) * Math.pow(1 - w, 1.3) * 0.32 : 0;
      g.save(); g.translate(PX, PY); g.rotate(ang); g.translate(-PX, -PY);
      for (var i = 0; i < P.length; i++){
        var p = P[i], x, y, c, al;
        if (t < SCATTER_AT){
          var e = ease((t - p.d) / GATHER), u = 1 - e;
          x = u*u*p.sx + 2*u*e*p.cx + e*e*p.tx; y = u*u*p.sy + 2*u*e*p.cy + e*e*p.ty;
          var land = Math.max(0, Math.min(1, (t - p.d - GATHER * .65) / 320));
          c = mix(p.hue, ink, land); al = Math.min(1, .35 + e);
        } else {
          var k = ease((t - SCATTER_AT - p.d * .5) / SCATTER);
          x = p.tx + (p.ox - p.tx) * k; y = p.ty + (p.oy - p.ty) * k;
          c = mix(ink, p.hue, Math.min(1, k * 1.6)); al = 1 - k;
        }
        if (al <= 0.01) continue;
        g.fillStyle = "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + al + ")";
        g.beginPath(); g.arc(x, y, R, 0, 6.2832); g.fill();
      }
      g.restore();
    }
    function frame(now){
      raf = 0;
      if (!visible || document.hidden) return;
      if (!t0) { t0 = now; seed(); if (onCycle) onCycle(); }
      var t = now - t0;
      if (t >= CYCLE){ t0 = now; seed(); t = 0; if (onCycle) onCycle(); }
      draw(t);
      raf = requestAnimationFrame(frame);
    }
    // A width equal to the drawing buffer's is the canvas's own intrinsic
    // size (no stylesheet yet), not a new layout: skip it, or it would grow.
    if ("ResizeObserver" in window){
      new ResizeObserver(function(){
        var w = cv.clientWidth;
        if (!w || w === css || w === cv.width) return;
        layout(); seed();
        if (reduce) draw(SCATTER_AT - 1);
      }).observe(cv);
    }
    if (reduce){ seed(); draw(SCATTER_AT - 1); return; }
    function kick(){ if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }
    if ("IntersectionObserver" in window){
      new IntersectionObserver(function(es){ visible = es[es.length - 1].isIntersecting; if (visible) kick(); }).observe(cv);
    }
    document.addEventListener("visibilitychange", kick);
    kick();
  }
  Array.prototype.forEach.call(document.querySelectorAll("canvas.askhand"), function(cv){
    var ring = cv.parentNode.querySelector(".heroask-ring");
    loopHand(cv, ring ? function(){ ring.classList.remove("run"); void ring.getBoundingClientRect(); ring.classList.add("run"); } : null);
  });
  if (heroAsk) heroAsk.addEventListener("click", function(){ askFrom(""); });
  // the ring is a real rounded rect, sized to the button so its corners match the pill
  var ringSvg = heroAsk && heroAsk.querySelector(".heroask-ring"), ringRect = ringSvg && ringSvg.querySelectorAll("rect[pathLength]");
  function sizeRing(){
    if (!ringRect) return;
    var w = heroAsk.offsetWidth + 2, h = heroAsk.offsetHeight + 2, sw = 1.25;
    Array.prototype.forEach.call(ringRect, function(r){
      r.setAttribute("x", sw / 2); r.setAttribute("y", sw / 2);
      r.setAttribute("width", Math.max(0, w - sw)); r.setAttribute("height", Math.max(0, h - sw));
      r.setAttribute("rx", (h - sw) / 2); r.setAttribute("ry", (h - sw) / 2);
    });
  }
  if (ringRect){
    sizeRing();
    window.addEventListener("resize", sizeRing);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeRing);
  }
  var dock = document.getElementById("askDock");
  if (dock){
    dock.addEventListener("click", function(){ askFrom(""); });
    var heroGone = false, footVisible = false;
    var syncDock = function(){
      var on = heroGone && !footVisible;
      dock.classList.toggle("is-on", on);
      dock.setAttribute("aria-hidden", on ? "false" : "true");
      dock.tabIndex = on ? 0 : -1;
    };
    var foot = document.querySelector("footer"), dockRaf = 0;
    var measureDock = function(){
      dockRaf = 0;
      heroGone = heroAsk ? heroAsk.getBoundingClientRect().bottom < 0 : true;
      footVisible = foot ? foot.getBoundingClientRect().top < window.innerHeight - 40 : false;
      syncDock();
    };
    var queueDock = function(){ if (!dockRaf) dockRaf = requestAnimationFrame(measureDock); };
    window.addEventListener("scroll", queueDock, { passive: true });
    window.addEventListener("resize", queueDock);
    measureDock();
  }
  closeBtn.addEventListener("click", closeChat);
  scrim.addEventListener("click", closeChat);
  document.addEventListener("keydown", function(e){
    if (!panel.classList.contains("open")) return;
    if (e.key === "Escape"){ closeChat(); return; }
    if (e.key !== "Tab" || isDocked()) return;
    var f = Array.prototype.filter.call(
      sheet.querySelectorAll("button:not([disabled]), textarea, a[href]"),
      function(el){ return el.offsetParent !== null; }
    );
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });

  // Acting on the page, not just talking: when an answer is about one of
  // the case studies and the page is visible beside the panel, scroll the
  // page to that project's card and ring it for a moment.
  var CASE_PAGES = { "app-merge": "app-merge.html", "rise-portal": "rise-portal.html", "web-terminal": "web-terminal.html" };
  function pointAtCase(full){
    if (!isDocked()) return;
    var m = /\[case:([a-z-]+)\]/.exec(full || ""), href = m && CASE_PAGES[m[1]];
    if (!href) return;
    var card = document.querySelector('a.workrow[href$="' + href + '"]');
    if (!card) return;
    setTimeout(function(){
      setHead("Showing it on the page\u2026");
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.classList.add("ai-pointed");
      setTimeout(function(){ card.classList.remove("ai-pointed"); setHead(HEAD_REST); }, 2600);
    }, Math.min(lastRevealMs, 1800));
  }

  // the header takes a hairline once the conversation runs under it
  body.addEventListener("scroll", function(){ sheet.classList.toggle("is-scrolled", body.scrollTop > 4); }, { passive: true });

  // on phones the chat is a full screen that closes only from its ✕:
  // no pull-to-dismiss, and dragging on the header or the composer's
  // surround moves nothing (the conversation itself still scrolls)
  (function(){
    function hold(e){ if (window.matchMedia("(max-width:640px)").matches && e.cancelable) e.preventDefault(); }
    head.addEventListener("touchmove", hold, { passive: false });
    var foot = document.getElementById("aiChatFoot");
    if (foot) foot.addEventListener("touchmove", function(e){
      if (e.target.closest && e.target.closest("textarea, .airows")) return;
      hold(e);
    }, { passive: false });
  })();

  // ── rendering ─────────────────────────────────────────────────────────
  function escapeHtml(s){
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function linkify(html){
    return html
      .replace(/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, '<a href="mailto:$1">$1</a>')
      .replace(/(^|[\s(])((?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?)/g, function(m, pre, url){
        var href = /^https?:/.test(url) ? url : "https://" + url;
        return pre + '<a href="' + href + '" target="_blank" rel="noreferrer">' + url + "</a>";
      });
  }
  function inline(s){
    return linkify(escapeHtml(s)
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/`([^`]+)`/g, "<code>$1</code>"));
  }
  // The blocks the model is told to use (api/data/answer-format.js):
  // a lead line, figures {{n|label}}, a "Label: value" facts list,
  // labelled steps, a quote, and [case:id] cards. Re-run on every token.
  var CASES = {
    "app-merge":    { n: "01", t: "Unifying the investing journey in one app", m: "Rupeezy \u00b7 Consumer app", href: "./app-merge.html" },
    "rise-portal":  { n: "02", t: "The first product Rupeezy\u2019s partners ever had", m: "Rupeezy \u00b7 B2B platform", href: "./rise-portal.html" },
    "web-terminal": { n: "03", t: "Designing the desktop trading experience", m: "Rupeezy \u00b7 Web trading terminal", href: "./web-terminal.html" },
    "resume":       { t: "My r\u00e9sum\u00e9", k: "R\u00e9sum\u00e9", m: "Roles, dates and tools", href: "./resume.html" }
  };
  var FIG_RE = /\{\{\s*([^|}]+?)\s*\|\s*([^}]+?)\s*\}\}/g;
  var FACT_RE = /^\s*(?:\*\*)?([^:*]{1,44}?)(?:\*\*)?\s*:\s+(.+)$/;
  var CARD_ARROW = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function caseCard(id){
    var c = CASES[id];
    if (!c) return "";
    var kind = c.k || "Case study";
    return '<a class="aicase" href="' + c.href + '">' + (c.k === "R\u00e9sum\u00e9" ? LI("fileText", 14) : '<span class="aicase-k">' + kind + '</span>') +
      '<span class="aicase-t">' + escapeHtml(c.t) + '</span>' + CARD_ARROW + '</a>';
  }
  // a half-arrived token would flash as raw syntax, so while streaming
  // the tail is held back until it closes
  function holdPartial(text){
    text = text.replace(/\{\{[^}]*\}?$/, "").replace(/\{$/, "").replace(/\[[a-z]{0,4}(?::[a-z-]*)?$/, "");
    // an unclosed **bold on the line being written would show its stars
    var last = text.slice(text.lastIndexOf("\n") + 1);
    if ((last.match(/\*\*/g) || []).length % 2) text = text.slice(0, text.lastIndexOf("**")) + text.slice(text.lastIndexOf("**") + 2);
    return text.replace(/\*$/, "");
  }
  // for Copy and screen readers: the same answer as plain sentences
  function toPlain(text){
    return stripMeta(text)
      .replace(FIG_RE, "$1 $2")
      .replace(/\[(?:case|page):([a-z-]+)\]/g, function(m, id){ var c = CASES[id]; return c ? c.t + " (" + new URL(c.href, location.href).href + ")" : ""; })
      .replace(/\*\*/g, "").replace(/`/g, "");
  }
  // the meta line every answer ends with (answer-format.js): what to
  // ask next. Never shown as text.
  var DOC = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 1.8h5.2L12.5 5v9.2H4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 1.8V5.2h3.4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  function readMeta(text){
    var meta = { next: null, used: [] };
    // tolerant of a sloppy close (">" or none): read to the end of the line
    var u = text.match(/<<\s*used\s*:\s*([^>\n]*)/i);
    if (u) meta.used = u[1].split(",").map(function(x){ return x.trim().toLowerCase(); })
      .filter(function(x, i, a){ return USED[x] && a.indexOf(x) === i; });
    var n = text.match(/<<\s*next\s*:\s*([^>\n]*)/i);
    if (n) meta.next = n[1].split("|").map(function(x){ return x.trim(); })
      .filter(function(x){ return x && x.length < 90; }).slice(0, 3);
    return meta;
  }
  function stripMeta(text){
    // (and an "A:" the model sometimes copies from the prompt's examples)
    return text.replace(/^[ \t]*<<[^\n]*$/gm, "").replace(/<<[^>\n]*>>?/g, "").replace(/<<[^>]*$/, "").replace(/<$/, "").replace(/^\s+/, "").replace(/^A:\s*/, "");
  }
  function inlineCase(html){
    return html.replace(/\[(?:case|page):([a-z-]+)\]/g, function(m, id){
      var c = CASES[id];
      return c ? '<a href="' + c.href + '">' + escapeHtml(c.t) + "</a>" : "";
    });
  }

  function renderRich(el, text, streaming){
    text = stripMeta(text);
    if (streaming) text = holdPartial(text);
    var blocks = [], cur = null;
    function push(type){ cur = { t: type, items: [] }; blocks.push(cur); return cur; }
    text.replace(/\r/g, "").split("\n").forEach(function(line){
      var m;
      if ((m = line.match(/^\s*\[(?:case|page):([a-z-]+)\]\s*$/))){ push("case").id = m[1]; cur = null; return; }
      if (/^\s*(\{\{[^}]+\}\}[\s,·]*)+$/.test(line)){
        var figs = []; line.replace(FIG_RE, function(_, n, l){ figs.push([n, l]); });
        push("figs").items = figs; cur = null; return;
      }
      if ((m = line.match(/^\s*>\s?(.*)/))){ if (!cur || cur.t !== "bq") push("bq"); if (m[1].trim()) cur.items.push(m[1]); return; }
      var ul = line.match(/^\s*[-\u2022*]\s+(.*)/), ol = line.match(/^\s*\d+[.)]\s+(.*)/);
      if (ul || ol){ var t = ul ? "ul" : "ol"; if (!cur || cur.t !== t) push(t); cur.items.push((ul || ol)[1]); return; }
      cur = null;
      if ((m = line.match(/^\s*#{1,4}\s+(.*)/))){ push("h").text = m[1]; cur = null; return; }
      if (line.trim()){ push("p").text = line; cur = null; }
    });

    // the lead is one sentence; when the model runs straight on into the
    // rest of its answer, split there so only the answer itself is set big
    if (blocks[0] && blocks[0].t === "p" && blocks[0].text.length > 130){
      var sm = blocks[0].text.match(/^(.+?[.!?])\s+(?=["\u201c\u2018']?[A-Z])/);
      if (sm && (sm[1].match(/\*\*/g) || []).length % 2 === 0){
        blocks.splice(1, 0, { t: "p", text: blocks[0].text.slice(sm[0].length) });
        blocks[0] = { t: "p", text: sm[1] };
      }
    }

    // a "Source: …" line straight after a figures row belongs to it
    for (var k = blocks.length - 1; k > 0; k--){
      if (blocks[k].t === "p" && blocks[k - 1].t === "figs" && /^\s*source\s*:/i.test(blocks[k].text)){
        blocks[k - 1].source = blocks[k].text.replace(/^\s*source\s*:\s*/i, "");
        blocks.splice(k, 1);
      }
    }

    var out = [];
    blocks.forEach(function(b, i){
      if (b.t === "p"){
        if (i === 0){
          var lead = inline(b.text);
          // the device only works when a few words carry it; a sentence
          // bolded end to end is just the sentence, in ink
          var keyLen = (b.text.match(/\*\*(.+?)\*\*/g) || []).join("").length;
          var keyed = keyLen > 0 && keyLen < b.text.length * 0.6;
          if (!keyed) lead = lead.replace(/<\/?b>/g, "");
          out.push('<p class="ailead' + (keyed ? " has-key" : "") + '">' + inlineCase(lead) + "</p>");
        } else {
          out.push("<p>" + inlineCase(inline(b.text)) + "</p>");
        }
      } else if (b.t === "h"){
        out.push('<p class="aitext-h">' + inline(b.text) + "</p>");
      } else if (b.t === "figs"){
        out.push('<div class="aifigs-wrap"><div class="aifigs">' + b.items.map(function(f){
          return '<div class="aifig"><b>' + escapeHtml(f[0]) + "</b><span>" + escapeHtml(f[1]) + "</span></div>";
        }).join("") + "</div>" + (b.source ? '<p class="aifigs-src">Source: ' + escapeHtml(b.source.replace(/\*\*/g, "")) + "</p>" : "") + "</div>");
      } else if (b.t === "case"){
        out.push(caseCard(b.id));
      } else if (b.t === "bq"){
        out.push("<blockquote>" + b.items.map(function(l){ return "<p>" + inline(l) + "</p>"; }).join("") + "</blockquote>");
      } else if (b.t === "ul"){
        // decided by the settled items, so a half-written last one can't
        // flip the whole list between styles while it streams
        var settled = streaming ? b.items.slice(0, -1) : b.items;
        var facts = FACT_RE.test(b.items[0]) && (streaming || b.items.length > 1) &&
          settled.every(function(it){ return FACT_RE.test(it); });
        if (facts){
          out.push('<dl class="aifacts">' + b.items.map(function(it){
            var f = it.match(FACT_RE);
            if (!f) return '<div class="aifact"><dt></dt><dd>' + inlineCase(inline(it)) + "</dd></div>";
            var val = f[2].charAt(0).toUpperCase() + f[2].slice(1);
            return '<div class="aifact"><dt>' + escapeHtml(f[1].trim()) + "</dt><dd>" + inlineCase(inline(val)) + "</dd></div>";
          }).join("") + "</dl>");
        } else {
          out.push("<ul>" + b.items.map(function(it){ return "<li>" + inlineCase(inline(it)) + "</li>"; }).join("") + "</ul>");
        }
      } else if (b.t === "ol"){
        var stepsSettled = streaming ? b.items.slice(0, -1) : b.items;
        var steps = FACT_RE.test(b.items[0]) && stepsSettled.every(function(it){ return FACT_RE.test(it); });
        out.push('<ol' + (steps ? ' class="aisteps"' : "") + ">" + b.items.map(function(it){
          if (!steps) return "<li>" + inlineCase(inline(it)) + "</li>";
          var f = it.match(FACT_RE);
          if (!f) return '<li><span class="aistep-k">&#8203;</span>' + inlineCase(inline(it)) + "</li>";
          var body = f[2].charAt(0).toUpperCase() + f[2].slice(1);
          return '<li><span class="aistep-k">' + escapeHtml(f[1].trim()) + "</span>" + inlineCase(inline(body).replace(/<\/?b>/g, "")) + "</li>";
        }).join("") + "</ol>");
      }
    });
    var next = document.createElement("div");
    next.innerHTML = out.join("") || "<p></p>";
    if (streaming){
      var tail = next.lastElementChild;
      if (tail && /^(UL|OL|BLOCKQUOTE|DL)$/.test(tail.tagName)) tail = tail.lastElementChild || tail;
      if (tail && /^(A|DIV)$/.test(tail.tagName)) tail = null;
      (tail || next).insertAdjacentHTML("beforeend", '<span class="aicaret" aria-hidden="true"></span>');
    }
    morph(el, next, streaming);
  }
  // Update only what changed, so a block that's already on screen never
  // flashes: a growing paragraph has its text patched in place, a list
  // gains items one by one, and only genuinely new pieces arrive (with a
  // soft fade and rise). Rebuilding everything on each token is what
  // made answers jump.
  function baseClass(n){ return (n.getAttribute("class") || "").replace(/\s*ai-new\b/g, "").trim(); }
  function morph(el, next, animate){
    var incoming = Array.prototype.slice.call(next.children);
    incoming.forEach(function(n, i){
      var o = el.children[i];
      if (!o){
        if (animate) n.classList.add("ai-new");
        el.appendChild(n);
        return;
      }
      if (o.tagName !== n.tagName){
        el.replaceChild(n, o);
        return;
      }
      // same kind of block that has just been recognised as something more
      // specific (a list becoming a story track): restyle it, don't swap it
      if (baseClass(o) !== baseClass(n)){
        var fresh = o.classList.contains("ai-new");
        o.className = n.className;
        if (fresh) o.classList.add("ai-new");
      }
      if (/^(OL|UL|DL|DIV|BLOCKQUOTE)$/.test(o.tagName) && !o.classList.contains("aifig")) morph(o, n, animate);
      else if (o.innerHTML !== n.innerHTML) o.innerHTML = n.innerHTML;
    });
    while (el.children.length > incoming.length) el.removeChild(el.lastElementChild);
  }

  function nearBottom(){ return body.scrollHeight - body.scrollTop - body.clientHeight < 96; }
  function scrollDown(force){ if (force || nearBottom()) body.scrollTop = body.scrollHeight; }

  function addExchange(question){
    var x = document.createElement("section");
    x.className = "aix";
    var first = !body.querySelector(".aix");
    x.innerHTML =
      '<p class="aiturn' + (first ? " is-first" : "") + '"></p>' +
      '<div class="aistatus" aria-live="off"><ol class="aisteps2"></ol></div>' +
      '<div class="aians-x">' +
        '<div class="aitrace" hidden><button type="button" class="aitrace-sum"><span class="aitrace-sum-t"></span></button><ol class="aitrace-list"></ol></div>' +
        '<div class="aicard" hidden><div class="aitext"></div></div>' +
      "</div>";
    x.querySelector(".aiturn").textContent = question;
    body.appendChild(x);
    var trace = x.querySelector(".aitrace");
    // The agent's steps, shown one at a time and each held long enough to
    // read (the model moves faster than anyone can follow). The answer
    // waits for the last step, then the list collapses to what was read.
    var stepsEl = x.querySelector(".aisteps2"), statusEl = x.querySelector(".aistatus");
    var queue = [], timer = 0, lastShown = 0, doneCb = null, DWELL = 700;
    function markDone(li){
      if (!li) return;
      li.classList.remove("is-now"); li.classList.add("is-done");
      li.querySelector(".as-i").innerHTML = LI("check", 12, 2);
    }
    function show(label){
      if (busy) setHead(label + "\u2026"); // never after the answer or an error
      markDone(stepsEl.querySelector(".is-now"));
      var li = document.createElement("li");
      li.className = "as is-now" + (/^(Reading|Checking)/.test(label) ? " is-read" : "");
      li.innerHTML = '<span class="as-i"><span class="as-spin"></span></span><span class="as-t"></span>';
      li.lastChild.textContent = label;
      stepsEl.appendChild(li);
      lastShown = Date.now();
      scrollDown();
    }
    function pump(){
      timer = 0;
      var wait = DWELL - (Date.now() - lastShown);
      if (wait > 0){ timer = setTimeout(pump, wait); return; }
      if (queue.length){ show(queue.shift()); timer = setTimeout(pump, DWELL); return; }
      if (doneCb){ var f = doneCb; doneCb = null; f(); }
    }
    var api = {
      liveStep: function(label){ clearTimeout(timer); timer = 0; show(label); return stepsEl.lastChild.lastChild; },
      queueStep: function(label){ if (queue[queue.length - 1] === label) return; queue.push(label); if (!timer) pump(); },
      afterSteps: function(cb){ doneCb = cb; if (!timer) pump(); },
      cancelSteps: function(){ clearTimeout(timer); timer = 0; queue = []; doneCb = null; },
      summarize: function(){
        markDone(stepsEl.querySelector(".is-now"));
        // what was read stays, in the past tense
        Array.prototype.forEach.call(stepsEl.querySelectorAll(".is-read .as-t"), function(t){
          t.textContent = t.textContent.replace(/^Reading /, "Read ").replace(/^Checking /, "Checked ");
        });
        if (stepsEl.querySelector(".is-read")) statusEl.classList.add("is-summary"); else statusEl.remove();
      }
    };
    return { queueStep: api.queueStep, liveStep: api.liveStep, afterSteps: api.afterSteps, cancelSteps: api.cancelSteps, summarize: api.summarize,
             el: x, col: x.querySelector(".aians-x"), ans: x.querySelector(".aicard"), card: x.querySelector(".aicard"),
             text: x.querySelector(".aitext"), spark: document.createElement("span"),
             status: x.querySelector(".aistatus"), statusT: x.querySelector(".aistatus-t"),
             trace: trace, list: trace.querySelector(".aitrace-list"), sum: trace.querySelector(".aitrace-sum-t") };
  }
  // The answer emerges from a soft blur, word by word, in a wave. Only
  // text nodes are wrapped, so bold (shaded) words and links keep working.
  // The stagger shrinks for long answers so the whole reveal stays ~2s.
  var lastRevealMs = 0;
  function blurReveal(el){
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches){ lastRevealMs = 0; return; }
    var nodes = [], walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n;
    while ((n = walker.nextNode())) if (n.nodeValue.trim()) nodes.push(n);
    var words = 0;
    nodes.forEach(function(t){ words += (t.nodeValue.match(/\S+/g) || []).length; });
    var step = Math.max(8, Math.min(32, 1700 / Math.max(1, words))), i = 0;
    nodes.forEach(function(t){
      var frag = document.createDocumentFragment();
      t.nodeValue.split(/(\s+)/).forEach(function(part){
        if (!part) return;
        if (/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(part)); return; }
        var w = document.createElement("span");
        w.className = "bw";
        w.style.animationDelay = Math.round(i++ * step) + "ms";
        w.textContent = part;
        frag.appendChild(w);
      });
      t.parentNode.replaceChild(frag, t);
    });
    // blocks without words of their own (the case link) arrive at the end
    var end = Math.round(i * step);
    Array.prototype.forEach.call(el.querySelectorAll("a.aicase"), function(a){ a.style.animationDelay = end + "ms"; a.classList.add("bw-block"); });
    lastRevealMs = end + 600;
  }

  // the status line says what the agent is doing right now, in words
  var headStatus = document.getElementById("aiHeadStatus"), HEAD_REST = headStatus ? headStatus.textContent : "";
  // one pending swap at a time, always landing on the latest text, so a
  // late "Thinking…" can never overwrite the rest line after an error
  var headWant = null, headTimer = 0;
  function setHead(text){
    if (!headStatus) return;
    headWant = text;
    if (headTimer) return;
    if (headStatus.textContent === text) return;
    headStatus.classList.add("is-swap");
    headTimer = setTimeout(function(){
      headTimer = 0;
      headStatus.textContent = headWant;
      headStatus.classList.remove("is-swap");
    }, 160);
  }
  function present(label){
    return label.replace(/^Read /, "Reading ").replace(/^Checked /, "Checking ");
  }
  function step(ex, label, live, before){
    var li = document.createElement("li");
    li.className = "aistep" + (live ? " is-live" : " is-done");
    li.innerHTML = '<span class="aistep-i" aria-hidden="true"></span><span class="aistep-t"></span>';
    li.lastChild.textContent = label;
    if (before) ex.list.insertBefore(li, before); else ex.list.appendChild(li);
    if (ex.queueStep) ex.queueStep(present(label));
    return li;
  }
  function stepDone(li, label){
    if (!li) return;
    li.classList.remove("is-live");
    li.classList.add("is-done");
    if (label) li.lastChild.textContent = label;
  }
  function foldTrace(ex, summary, failed){
    Array.prototype.forEach.call(ex.list.querySelectorAll(".is-live"), function(li){
      li.classList.remove("is-live"); li.classList.add(failed ? "is-fail" : "is-done");
    });
    ex.sum.textContent = summary;
    ex.trace.classList.add("is-done");
  }
  var USED = {
    "app-merge": "Read the App Merge case study",
    "rise-portal": "Read the Rise Portal case study",
    "web-terminal": "Read the trading terminal case study",
    "resume": "Checked my r\u00e9sum\u00e9",
    "about": "Read my About page"
  };

  var ICON_COPY = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="5.2" y="5.2" width="8.3" height="8.3" rx="1.8" stroke="currentColor" stroke-width="1.4"/><path d="M10.8 3.2A1.6 1.6 0 0 0 9.2 2H4a2 2 0 0 0-2 2v5.2a1.6 1.6 0 0 0 1.2 1.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  var ICON_DONE = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_MAIL = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="1.8" y="3.3" width="12.4" height="9.4" rx="1.8" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 4.5 8 8.6l5.5-4.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var HIRING = /\b(salary|pay|compensation|ctc|interview|hire|hiring|role|offer|start|notice|available|availability|reach|contact|email|call|relocat)/i;

  // what's worth doing next depends on what was just said: the page it
  // came from if it isn't already on screen, the résumé when the answer
  // is about roles and dates, email when it's about working together
  // Under every answer, the prototype's three small icons. The thumbs are
  // real: they go to the site's analytics, so good and bad answers can be
  // read later; copy copies the answer as plain text.
  function addActions(ex, answer, meta, question){
    return; // removed at Lokesh's request: the answer ends cleanly, then the tray
    var bar = document.createElement("div");
    bar.className = "aifb";
    function btn(icon, label){
      var b = document.createElement("button");
      b.type = "button"; b.className = "aifb-b";
      b.setAttribute("aria-label", label); b.title = label;
      b.innerHTML = LI(icon, 14);
      bar.appendChild(b);
      return b;
    }
    var up = btn("thumbsUp", "Good answer"), down = btn("thumbsDown", "Bad answer"), copy = btn("copy", "Copy answer");
    function vote(b, other, v){
      var on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", String(on)); other.setAttribute("aria-pressed", "false");
      if (on && window.pfTrack) window.pfTrack("ai_feedback", { vote: v, q: question.slice(0, 80) });
    }
    up.setAttribute("aria-pressed", "false"); down.setAttribute("aria-pressed", "false");
    up.addEventListener("click", function(){ vote(up, down, "up"); });
    down.addEventListener("click", function(){ vote(down, up, "down"); });
    copy.addEventListener("click", function(){
      if (!navigator.clipboard || !navigator.clipboard.writeText) return;
      navigator.clipboard.writeText(toPlain(answer)).then(function(){
        copy.innerHTML = LI("check", 14); copy.setAttribute("aria-label", "Copied");
        setTimeout(function(){ copy.innerHTML = LI("copy", 14); copy.setAttribute("aria-label", "Copy answer"); }, 1600);
      }, function(){});
    });
    ex.ans.appendChild(bar);
  }
  // follow-ups the answer itself suggests; the pool only if it gave none
  // Follow-ups come from questions checked against the knowledge file,
  // so every suggestion has a real answer behind it. (Model-written ones
  // kept inviting questions the facts can't answer, and each dead end
  // was an "I don't know, email me".) Relevance comes from the topic of
  // the question just asked: one to go deeper, two neighbouring topics.
  // Each topic: an entry question that stands on its own, and deeper
  // ones that only make sense straight after that topic's answer. After
  // an answer: one deeper question from its own topic, then the entry
  // questions of neighbouring topics. Never a deep question out of
  // context ("Why was your new model paused?" after a Rise Portal answer).
  var TOPICS = {
    merge:   { entry: "What's the project you're proudest of?", deep: ["Why was your new model paused?", "Why not just keep the switch?", "How big was the revenue hit?"] },
    rise:    { entry: "What did Rise Portal actually change?", deep: ["Where do the Rise Portal numbers come from?"] },
    ai:      { entry: "What have you actually designed for AI?", deep: ["How do you use AI day to day?", "What won't you use AI for?"] },
    craft:   { entry: "How do you work with PMs and engineers?", deep: ["How do you approach a design problem?", "How did you build this site?"] },
    career:  { entry: "How did you get into design?", deep: ["What was it like being the only designer?", "What are you looking for next?"] },
    hiring:  { entry: "When can you start?", deep: ["Would you relocate?", "How do I reach you directly?"] },
    fintech: { entry: "Do you have fintech experience?", deep: [] }
  };
  var NEIGHBOURS = {
    merge: ["rise", "ai", "career", "hiring"], rise: ["merge", "craft", "ai", "hiring"],
    ai: ["craft", "merge", "career", "hiring"], craft: ["ai", "merge", "career", "hiring"],
    career: ["hiring", "merge", "ai", "craft"], hiring: ["career", "merge", "ai", "craft"],
    fintech: ["merge", "rise", "career", "hiring"]
  };
  // no clear topic: only questions that stand on their own, strongest first
  var OPENERS = ["merge", "ai", "career", "hiring", "craft", "rise"];
  function topicOf(q, used){
    var t = q.toLowerCase(); used = used || [];
    // what the answer actually drew on beats guessing from the question
    if (used.indexOf("app-merge") > -1) return "merge";
    if (used.indexOf("rise-portal") > -1) return "rise";
    if (/fintech|regulat|sebi|kyc|broking|trading/.test(t)) return "fintech";
    if (/merge|proudest|switch|investeezy|biggest project|revenue hit|paused/.test(t)) return "merge";
    if (/rise|partner/.test(t)) return "rise";
    if (/\bai\b|agent|claude|chatgpt/.test(t)) return "ai";
    if (/\bpms?\b|engineer|\bcode\b|work with|approach|process|how do you work|build this site/.test(t)) return "craft";
    if (/start|relocat|remote|reach|contact|email|notice|salary|hire|hiring|available/.test(t)) return "hiring";
    if (/compan|leave|left|runable|zzazz|gap|weak|looking for|career|experience|background|into design|taught|only designer|founding/.test(t)) return "career";
    if (used.indexOf("about") > -1) return "craft";
    if (used.indexOf("resume") > -1) return "career";
    return null;
  }
  function norm(q){ return q.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim(); }
  // topics already answered, however they were asked: once the app merge
  // has been explained, its opener isn't a useful suggestion any more
  var covered = [];
  function addNext(question, used){
    var seen = asked.map(norm);
    var topic = topicOf(question, used), out = [];
    if (topic && covered.indexOf(topic) === -1) covered.push(topic);
    var fresh = function(q){
      if (seen.indexOf(norm(q)) > -1) return false;
      for (var k in TOPICS){ if (TOPICS[k].entry === q && covered.indexOf(k) > -1) return false; }
      return true;
    };
    // a deeper question only when the answer was clearly about its topic;
    // otherwise, openers that make sense on their own
    if (topic){
      var deeper = TOPICS[topic].deep.filter(fresh)[0];
      if (deeper) out.push(deeper);
    }
    (topic ? NEIGHBOURS[topic] : OPENERS).forEach(function(tp){
      if (out.length < 3 && fresh(TOPICS[tp].entry) && out.indexOf(TOPICS[tp].entry) === -1) out.push(TOPICS[tp].entry);
    });
    if (!out.length) return;
    // after an answer, suggestions belong to the answer: right under it,
    // in the same pill rows as the opening tray
    var box = document.createElement("div");
    box.className = "ainext";
    box.style.animationDelay = lastRevealMs + "ms";
    box.style.setProperty("--d", lastRevealMs + "ms");
    box.innerHTML = '<p class="ailabel">You could also ask</p>';
    var list = document.createElement("div");
    list.className = "airows";
    out.forEach(function(q){ list.appendChild(trayRow(q)); });
    box.appendChild(list);
    body.appendChild(box);
  }

  // The card of a thumbnail: the same image and title as the work card on
  // the homepage, so the agent hands over the real thing, not a link.
  function caseThumb(href){
    var card = document.querySelector('a.workrow[href$="' + href.replace("./", "") + '"]');
    if (!card) return null;
    var img = card.querySelector(".cardframe img:not(.macdevice):not(.bg)"), src = img && (img.currentSrc || img.src);
    if (!src){ var shot = card.querySelector(".rz-shot"); var bg = shot && getComputedStyle(shot).backgroundImage.match(/url\("?(.*?)"?\)/); src = bg && bg[1]; }
    var h3 = card.querySelector("h3");
    return { src: src, title: h3 ? h3.textContent.trim() : "", tint: (card.querySelector(".cardframe") || {}).style ? card.querySelector(".cardframe").style.background : "" };
  }
  var PAGE_TITLES = { "./about.html": "About me", "./resume.html": "My r\u00e9sum\u00e9" };
  var PAGE_THUMBS = { "./about.html": { src: "./assets/about-portrait.webp", tint: "var(--lavender)" } };

  function showError(ex, kind, message, question, wait){
    var box = document.createElement("div");
    box.setAttribute("role", "status");
    function again(){ dropRetry(); ex.el.remove(); sendMessage(question); }

    // the plain cases keep a plain line
    if (kind === "long" || kind === "stopped"){
      box.className = "aierr aierr-plain";
      box.innerHTML = '<p class="aierr-m"></p><div class="aierr-a"></div>';
      box.firstChild.textContent = message;
      var b = document.createElement("button"); b.type = "button"; b.className = "aipill is-primary";
      b.innerHTML = ICON_RETRY + "<span>" + (kind === "long" ? "Start a new chat" : "Ask again") + "</span>";
      b.addEventListener("click", kind === "long" ? function(){ dropRetry(); resetChat(); sendMessage(question); } : again);
      box.lastChild.appendChild(b);
      ex.card.hidden = true; ex.col.appendChild(box);
      return;
    }

    // the line is lost: the hand comes apart, the words type in, and the
    // agent hands over what it can: the page that holds the answer, and
    // a note to the real me with the question already written
    box.className = "ailost";
    var lead = kind === "busy" ? "Every line to my live brain is busy." : kind === "offline" ? "You\u2019re offline, so I can\u2019t reach my live brain." : "I lost the line to my live brain.";
    var page = pageFor(question), thumb = page && (caseThumb(page.href) || (PAGE_THUMBS[page.href] ? { src: PAGE_THUMBS[page.href].src, tint: PAGE_THUMBS[page.href].tint, title: PAGE_TITLES[page.href] } : null));
    box.innerHTML =
      '<div class="ailost-top"><canvas class="ailost-hand" aria-hidden="true"></canvas>' +
        '<div class="ailost-w"><p class="ailost-t"></p><p class="ailost-m"></p></div></div>' +
      '<div class="ailost-hand-over"></div>';
    var leadEl = box.querySelector(".ailost-t"), msgEl = box.querySelector(".ailost-m"), over = box.querySelector(".ailost-hand-over");

    // what it can hand over
    if (page){
      var go = document.createElement("a");
      go.className = "ailost-case"; go.href = page.href;
      if (thumb && thumb.src){
        go.innerHTML = '<span class="ailost-shot"><img alt=""></span><span class="ailost-ct"><span class="ailost-k">' +
          (page.href.indexOf("about") > -1 || page.href.indexOf("resume") > -1 ? "Page" : "Case study") +
          '</span><span class="ailost-title"></span></span>' + LI("arrowRight", 14);
        go.querySelector("img").src = thumb.src;
        go.querySelector(".ailost-title").textContent = thumb.title;
        if (thumb.tint) go.querySelector(".ailost-shot").style.background = thumb.tint;
      } else {
        go.innerHTML = '<span class="ailost-ct"><span class="ailost-k">Page</span><span class="ailost-title"></span></span>' + LI("arrowRight", 14);
        go.querySelector(".ailost-title").textContent = PAGE_TITLES[page.href] || page.label;
      }
      over.appendChild(go);
    }
    var note = document.createElement("a");
    note.className = "ailost-note";
    note.href = "mailto:" + MAIL + "?subject=" + encodeURIComponent("A question from your portfolio") +
      "&body=" + encodeURIComponent("Hi Lokesh,\n\nI asked your AI: \u201c" + question + "\u201d\n\n");
    note.innerHTML = '<span class="ailost-nh"><span class="ailost-k">The real me</span><span class="ailost-nto">hi.lokeshux@gmail.com</span></span>' +
      '<span class="ailost-nq">Want to know more? Reach out and I\u2019ll answer this myself.</span>' +
      '<span class="ailost-ns">' + ICON_MAIL + ' Email me, your question comes along</span>';
    over.appendChild(note);

    ex.card.hidden = true;
    ex.col.appendChild(box);

    // the hand, and the words after it
    var hand = lostHand(box.querySelector(".ailost-hand"), kind === "busy" ? wait : 0, kind === "busy" ? function(){ cancelRetry = null; again(); } : null);
    function typeInto(el, text, delay, cb){
      el.innerHTML = text.split(" ").map(function(w, wi, arr){
        var before = arr.slice(0, wi).join(" ").length + (wi ? 1 : 0);
        return '<span class="tw-word">' + w.split("").map(function(ch, ci){
          return '<span class="tw-char" style="animation-delay:' + (delay + (before + ci) * 14) + 'ms">' + escapeHtml(ch) + "</span>";
        }).join("") + "</span>";
      }).join(" ");
      if (cb) setTimeout(cb, delay + text.length * 14 + 200);
    }
    typeInto(leadEl, lead, 500);
    var left = wait || 0, timer = 0;
    function body(){
      if (kind === "busy" && wait) return "I\u2019ll try again as the dots come back together, in " + left + "s. Meanwhile, this is where the answer lives.";
      if (kind === "offline") return "I\u2019ll ask again the moment you\u2019re back. Meanwhile, this is where the answer lives.";
      return "You can ask me to try again, or take the answer from where it lives.";
    }
    typeInto(msgEl, body(), 500 + lead.length * 14 + 250, function(){ box.classList.add("is-in"); });
    if (kind === "busy" && wait){
      timer = setInterval(function(){
        left -= 1;
        if (left <= 0){ clearInterval(timer); return; } // the hand fires the retry when it's whole
        msgEl.textContent = body();
      }, 1000);
      cancelRetry = function(){ clearInterval(timer); hand.stop(); msgEl.textContent = "Ask me to try again whenever you like."; };
    } else if (kind === "offline"){
      var back = function(){ cancelRetry = null; again(); };
      window.addEventListener("online", back, { once: true });
      cancelRetry = function(){ window.removeEventListener("online", back); hand.stop(); };
    } else {
      cancelRetry = function(){ hand.stop(); };
    }
    // ask it to try: click the hand or the words
    var tryBtn = document.createElement("button");
    tryBtn.type = "button"; tryBtn.className = "ailost-try";
    tryBtn.innerHTML = "<span>Try again</span>";
    tryBtn.addEventListener("click", function(){
      tryBtn.disabled = true; tryBtn.firstChild.textContent = "Gathering\u2026";
      if (timer) clearInterval(timer);
      hand.stop();
      var cv = box.querySelector(".ailost-hand");
      lostHand(cv, 1.6, function(){ cancelRetry = null; again(); });
    });
    box.querySelector(".ailost-w").appendChild(tryBtn);
  }

  // ── the slot ──────────────────────────────────────────────────────────
  function autosize(){
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 128) + "px";
  }
  // one button, three states: quiet when empty, ink when there's a
  // question, and a stop square while an answer is being written
  function syncSend(){
    var ready = !busy && input.value.trim().length > 0;
    sendBtn.disabled = !busy && !ready;
    sendBtn.classList.toggle("is-ready", ready);
    sendBtn.classList.toggle("is-busy", busy);
    panel.classList.toggle("is-working", busy);
    if (!busy && HEAD_REST) setHead(HEAD_REST);
    sendBtn.setAttribute("aria-label", busy ? "Stop" : "Send");
  }
  input.addEventListener("input", function(){ autosize(); syncSend(); });
  input.addEventListener("keydown", function(e){
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing){
      e.preventDefault();
      sendMessage(input.value);
    }
  });
  form.addEventListener("submit", function(e){
    e.preventDefault();
    if (busy){ if (stopCurrent) stopCurrent(); return; }
    sendMessage(input.value);
  });

  function resetChat(){
    if (busy) return;
    dropRetry();
    history = [];
    asked = [];
    renderRail();
    Array.prototype.slice.call(body.querySelectorAll(".aix, .ainext")).forEach(function(m){ m.remove(); });
    intro.style.display = "";
    playHand(false);
    typeHero(SCOPES[scope].hero, false);
    document.getElementById("aiChatFoot").classList.remove("is-chatting");
    panel.classList.remove("has-chat");
    renderTry();
    body.scrollTop = 0;
    if (canHover) input.focus({ preventScroll: true });
  }
  resetBtn.addEventListener("click", resetChat);

  // ── asking ────────────────────────────────────────────────────────────
  function sendMessage(raw){
    var text = (raw || "").trim();
    if (!text || busy) return;
    dropRetry();
    if (asked.indexOf(text) === -1) asked.push(text);
    renderRail();
    var oldNext = body.querySelector(".ainext");
    if (oldNext) oldNext.remove();
    intro.style.display = "none";
    document.getElementById("aiChatFoot").classList.add("is-chatting");
    panel.classList.add("has-chat");

    Array.prototype.forEach.call(body.querySelectorAll(".aix"), function(x){ x.classList.add("is-past"); });
    var ex = addExchange(text);
    suggest.parentNode.hidden = true;
    history.push({ role: "user", content: text + (scope !== "all" ? "\n\n(Answer about: " + SCOPES[scope].label + ")" : "") });
    input.value = "";
    autosize();
    busy = true;
    headSpark.classList.add("is-busy");
    scrollDown(true);

    var controller = window.AbortController ? new AbortController() : null;
    var full = "", stopped = false, done = false;
    // the agent's work, as steps: thinking (the wait before the first
    // word is the model reasoning, so it's timed), what it read (the
    // model names it in its first line), then writing
    var t0 = Date.now(), firstAt = 0, readDone = false, writeStep = null;
    var thinkStep = step(ex, "Thinking", true);
    headSpark.classList.remove("is-writing");
    setState("Thinking\u2026");
    var tick = setInterval(function(){ thinkStep.lastChild.textContent = "Thinking \u00b7 " + ((Date.now() - t0) / 1000).toFixed(1) + "s"; }, 100);
    function thought(){
      if (firstAt) return;
      firstAt = Date.now();
      clearInterval(tick);
      stepDone(thinkStep, "Thought for " + Math.max(0.1, (firstAt - t0) / 1000).toFixed(1) + "s");
      headSpark.classList.add("is-writing");
      setState("Writing\u2026");
    }
    function reading(force){
      if (readDone) return;
      var hasLine = /<<\s*used[^>]*>>/i.test(full);
      // the first line is still arriving: wait for it to close
      if (!hasLine && !force && /^\s*</.test(full) && full.length < 160) return;
      readDone = true;
      readMeta(full).used.forEach(function(id){ step(ex, USED[id], false); });
      writeStep = step(ex, "Writing the answer", true);
    }
    stopCurrent = function(){
      stopped = true;
      if (controller) controller.abort();
    };
    syncSend();

    // The network hands text over in bursts; the reader should see it
    // arrive at an even pace. Everything received goes into `full`, and
    // each frame reveals a little more of it: a few characters when the
    // stream is keeping up, more when a burst has built a backlog, so it
    // never falls far behind.
    var shown = 0, raf = 0, whenShown = null, lastT = 0, carry = 0;
    // A calm, steady reading pace, whole words at a time. The model hands
    // the answer over in well under a second; racing to catch up with it
    // made answers feel hurried. ~140 characters a second reads as
    // someone writing to you, a typical answer unfolds over 3 to 4 s,
    // and only a genuinely long one speeds up a little so it never drags.
    var CPS = 140;
    function paint(t){
      raf = 0;
      if (document.hidden) shown = Math.max(shown, full.length - 1);
      // the hidden first line isn't reading material: skip straight past it
      if (shown === 0 && /^\s*<</.test(full)){
        var nl = full.indexOf("\n");
        if (nl > -1) shown = nl + 1; else { raf = requestAnimationFrame(paint); return; }
      }
      var dt = lastT ? Math.min(64, t - lastT) : 16;
      lastT = t;
      var back = full.length - shown;
      if (back > 0){
        var cps = CPS + Math.max(0, back - 500) * 0.25;
        carry += cps * dt / 1000;
        // spend the budget a whole word at a time (the word plus the space
        // after it), so the pace stays exact and nothing appears half-typed
        var moved = false;
        while (shown < full.length){
          var m = /^\s*\S+\s?/.exec(full.slice(shown, shown + 60));
          var len = m ? m[0].length : full.length - shown;
          if (len > carry) break;
          carry -= len; shown += len; moved = true;
        }
        if (moved){
          renderRich(ex.text, full.slice(0, shown), true);
          scrollDown();
        }
      }
      if (shown < full.length) raf = requestAnimationFrame(paint);
      else if (whenShown){
        // a breath after the last word before anything else arrives
        var f = whenShown; whenShown = null;
        setTimeout(f, 280);
      }
    }
    function reveal(){
      if (document.hidden){
        // no frames to pace with: write it straight in
        shown = full.length;
        renderRich(ex.text, full, true);
        if (whenShown){ var f = whenShown; whenShown = null; f(); }
        return;
      }
      if (!raf) raf = requestAnimationFrame(paint);
    }
    function afterReveal(fn){ whenShown = fn; reveal(); }
    function stopReveal(){ if (raf) cancelAnimationFrame(raf); raf = 0; whenShown = null; }

    function settle(){
      clearInterval(tick);
      var steps = ex.list.children.length;
      if (!ex.trace.classList.contains("is-done"))
        foldTrace(ex, "Worked for " + ((Date.now() - t0) / 1000).toFixed(1) + "s \u00b7 " + steps + (steps > 1 ? " steps" : " step"));
      done = true;
      busy = false;
      stopCurrent = null;
      ex.spark.classList.remove("is-busy");
      headSpark.classList.remove("is-busy");
      headSpark.classList.remove("is-writing");
      setState();
      syncSend();
    }
    function fail(message, kind, wait){
      if (done) return;
      // the question never got an answer, so it shouldn't sit in history
      // unanswered — a retry would otherwise send it twice in a row
      history.pop();
      clearInterval(tick);
      stopReveal();
      foldTrace(ex, kind === "stopped" ? "Stopped" : "Didn\u2019t get through", true);
      ex.cancelSteps();
      if (ex.status.parentNode) ex.status.remove();
      ex.text.innerHTML = "";
      settle();
      showError(ex, kind || "error", message, text, wait);
      live.textContent = message;
      scrollDown();
    }
    function finish(){
      if (done) return;
      if (!full) return stopped ? fail("Stopped before I could answer.", "stopped") : fail(FALLBACK, "error");
      thought();
      reading(true);
      stepDone(writeStep, "Wrote the answer");
      if (ex.finishing) return;
      ex.finishing = true;
      var meta = readMeta(full);
      ex.afterSteps(function(){
        ex.summarize();
        // the résumé card only when the question is about the résumé or a
        // career history: the model adds it too eagerly
        if (!/r[eé]sum[eé]|\bcv\b|experience|career|background|history|roles?\b|worked/i.test(text))
          full = full.replace(/^[ \t]*\[page:resume\][ \t]*$/gm, "").replace(/\[page:resume\]/g, "");
        renderRich(ex.text, full, false);
        if (ex.saved){
          var note = document.createElement("p");
          note.className = "aisaved";
          note.textContent = "The live AI is at capacity, so this is an answer I saved for this question.";
          ex.text.insertBefore(note, ex.text.firstChild);
        }
        ex.card.hidden = false;
        blurReveal(ex.text);
        history.push({ role: "assistant", content: full });
        addActions(ex, full, meta, text);
        settle();
        addNext(text, meta.used);
        pointAtCase(full);
        live.textContent = ex.text.textContent;
        scrollDown();
      });
    }

    // The live AI can be out of free capacity (every model busy) or down.
    // Neither should end in a dead end: first retry quietly, in the
    // agent's own step list; then, for a suggested question, answer from
    // the saved copy; only a typed question with no saved answer gets a
    // card, and that card offers the page that would answer it and an
    // email with the question already written.
    var RETRIES = 2;
    function useSaved(saved, why){
      ex.queueStep(why);
      ex.saved = true;
      full = saved;
      finish();
    }
    function giveUp(kind, message, wait){
      var saved = savedAnswerFor(text);
      if (saved) return useSaved(saved, kind === "busy" ? "Live AI is busy, using a saved answer" : "Live AI is down, using a saved answer");
      fail(message, kind, wait);
    }
    function attempt(n){
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller ? controller.signal : undefined
      }).then(function(res){
        if (res.status === 429){
          var ra = parseInt(res.headers.get("Retry-After"), 10);
          var wait = isFinite(ra) ? Math.min(Math.max(ra, 6), 20) : 12;
          if (n < RETRIES && !stopped){
            // wait it out in the open, then try again on our own
            var label = ex.liveStep("Waiting for a free line \u00b7 " + wait + "s"), left = wait;
            if (busy) setHead("Waiting for a free line\u2026");
            var t = setInterval(function(){
              left -= 1;
              if (stopped || done){ clearInterval(t); return; }
              if (left <= 0){ clearInterval(t); label.textContent = "Trying again"; attempt(n + 1); return; }
              label.textContent = "Waiting for a free line \u00b7 " + left + "s";
            }, 1000);
            return;
          }
          return giveUp("busy", BUSY, Math.min(Math.max(isFinite(ra) ? ra : 20, 8), 45));
        }
        if (res.status === 400){
          return res.json().catch(function(){ return {}; }).then(function(j){
            return /new chat/i.test((j && j.error) || "") ? fail(LONG, "long") : giveUp("error", FALLBACK);
          });
        }
        if (!res.ok || !res.body) return giveUp("error", FALLBACK);
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var buffer = "";
        function pump(){
          return reader.read().then(function(step){
            if (step.done){ finish(); return; }
            buffer += decoder.decode(step.value, { stream: true });
            var lines = buffer.split("\n");
            buffer = lines.pop();
            lines.forEach(function(line){
              line = line.trim();
              if (line.slice(0, 5) !== "data:") return;
              var payload = line.slice(5).trim();
              if (!payload || payload === "[DONE]") return;
              try {
                var json = JSON.parse(payload);
                var delta = json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content;
                if (delta){
                  full += delta;
                  thought();
                  reading(false);
                }
              } catch (e) { /* a partial line or a keep-alive — skip it */ }
            });
            return pump();
          });
        }
        return pump();
      }).catch(function(){
        // a stop lands here as an abort: whatever was written stands as
        // the answer; nothing written means there's nothing to keep
        if (stopped){ stopReveal(); return finish(); }
        if (navigator.onLine === false) return fail(OFFLINE, "offline");
        giveUp("error", BROKEN);
      });
    }
    attempt(0);
  }
})();
