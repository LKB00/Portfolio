/* dashboard-data.js — data, filtering, interaction. No design decisions here.
 *
 * POST {password, range, filters:{source,page,day}} → JSON:
 * { ok, range:{from,to,days,prevFrom,prevTo},
 *   totals:{visitors:{v,prev}, opened:{v,prev,n}, read:{v,prev,n}, acted:{v,prev,n}},
 *   retention:[{page,visitors,sections:[{name,reach}]}],
 *   payoff:{deep:{n,resume,contact}, shallow:{n,resume,contact}},
 *   quality:[{label,visitors,readRate}],
 *   places:{ country:[{code,visitors,readRate}],    // ISO-3166-1 alpha-2, as Umami reports it
 *            region:[{code,label,visitors,readRate}],
 *            city:[{code,label,visitors,readRate}] },  // code = the country it sits in
 *   (metrics?type=country|region|city — all three exist in Umami)
 *   days:[{date,visitors,opened,read,acted,note}],
 *   apps:[{company,campaign,sent,opened,stage,stages,seconds,resume}],
 *   pages:[{path,visitors,median,read}], cta:[{label,clicks}] }
 *
 * Filters cross-cut everything: the server recomputes the whole payload for the
 * selected segment. MIN_N is the honesty rule — below it, counts not percentages.
 */
(function () {
  'use strict';

  var MIN_N = 20;
  var API = /(^|\.)lokeshbhatia\.com$/.test(location.hostname)
    ? 'https://www.lokeshbhatia.com/api/stats' : '/api/stats';

  var state = { pw: null, range: 28, metric: 'visitors', level: 'country', filters: { source: null, page: null, day: null, country: null } };
  var last = null;

  var $ = function (s) { return document.querySelector(s); };
  var slot = function (n) { return document.querySelector('[data-slot="' + n + '"]'); };
  function set(n, v) { var e = slot(n); if (e) e.textContent = v; }
  function html(n, v) { var e = slot(n); if (e) e.innerHTML = v; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  var pct = function (n) { return Math.max(0, Math.min(100, n)); };
  var rnd = Math.round;
  var num = function (n) { return (n == null ? 0 : n).toLocaleString('en-GB'); };
  function secs(s) { return s == null ? '—' : s < 60 ? s + 's' : Math.floor(s / 60) + 'm ' + (s % 60) + 's'; }
  function day(iso) { return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }

  /* ================= uncertainty =================
   * A rate from 45 of 104 sessions is not 43%, it is 43% give or take 9. The
   * Wilson score interval is the standard choice for proportions at small n
   * (the normal approximation misbehaves near 0 and 1). Everything downstream
   * rounds to the precision the sample can actually support.
   */
  function wilson(k, n, z) {
    if (!n) return { lo: 0, hi: 100, half: 100 };
    z = z || 1.96;                                   // 95%
    var p = k / n, z2 = z * z;
    var d = 1 + z2 / n;
    var c = (p + z2 / (2 * n)) / d;
    var m = (z / d) * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n));
    return { lo: Math.max(0, (c - m) * 100), hi: Math.min(100, (c + m) * 100), half: m * 100 };
  }

  // Few's third mistake is excessive precision. Show only digits the sample earns.
  function sig(rate, half) {
    if (half >= 10) return Math.round(rate / 5) * 5;   // nearest 5
    if (half >= 3) return Math.round(rate);
    return Math.round(rate * 10) / 10;
  }
  function overlap(a, b) { return a.lo <= b.hi && b.lo <= a.hi; }

  /* ================= the quality scale =================
   * One meaning for colour on this page: how well a segment reads, measured
   * against the site average. Below MIN_N it gets no colour at all — grey is
   * "not judgeable yet", which is a statement, not a gap.
   */
  var BAND = [
    { k: 'good', cls: 'q-good', svg: 'g' },
    { k: 'mid',  cls: 'q-mid',  svg: 'm' },
    { k: 'poor', cls: 'q-poor', svg: 'p' },
    { k: 'none', cls: 'q-none', svg: 'n' }
  ];
  function band(rate, avg, n) {
    if (n != null && n < MIN_N) return BAND[3];
    if (!avg) return BAND[1];
    var r = rate / avg;
    if (r >= 1.25) return BAND[0];
    if (r >= 0.75) return BAND[1];
    return BAND[2];
  }

  /* ================= tooltip ================= */
  var tip = $('#tip');
  function showTip(x, y, label, value) {
    tip.innerHTML = '<b>' + esc(label) + '</b><span class="m">' + esc(value) + '</span>';
    tip.style.left = x + 'px';
    tip.style.top = (y - 10) + 'px';
    tip.style.opacity = '1';
  }
  function hideTip() { tip.style.opacity = '0'; }
  document.addEventListener('mouseover', function (e) {
    var t = e.target.closest ? e.target.closest('[data-tip-label]') : null;
    if (!t) return;
    var r = t.getBoundingClientRect();
    showTip(r.left + r.width / 2, r.top, t.dataset.tipLabel, t.dataset.tipValue);
  });
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest && e.target.closest('[data-tip-label]')) hideTip();
  });

  /* ================= filters ================= */
  function setFilter(kind, value) {
    state.filters[kind] = state.filters[kind] === value ? null : value;
    hideTip();
    refresh();
  }

  function renderFilters() {
    var f = state.filters, out = [], any = false;
    var chip = function (kind, label) {
      any = true;
      return '<button class="chip" data-clear="' + kind + '">' + esc(label) + '<span class="x">×</span></button>';
    };
    if (f.source) out.push(chip('source', f.source));
    if (f.page) out.push(chip('page', f.page));
    if (f.day) out.push(chip('day', day(f.day)));
    if (f.country) out.push(chip('country', cname(f.country)));
    html('filters', any
      ? '<span class="scope">Filtered to</span>' + out.join('') +
        '<button class="chip ghost" data-clear="all">Clear all</button>'
      : '<span class="scope">All visitors</span>');
  }

  document.addEventListener('click', function (e) {
    var c = e.target.closest ? e.target.closest('[data-clear]') : null;
    if (!c) return;
    if (c.dataset.clear === 'all') state.filters = { source: null, page: null, day: null, country: null };
    else state.filters[c.dataset.clear] = null;   // clearFilter would refresh again
    refresh();
  });

  /* ================= figures ================= */
  function fig(key, o, isRate) {
    var thin = o.n != null && o.n < MIN_N;
    set('f.' + key + '.value', thin && isRate ? '—' : (isRate ? o.v : num(o.v)));
    var d = slot('f.' + key + '.delta'); if (!d) return;
    if (thin) { d.className = 'dlt thin'; d.textContent = o.n + ' sessions'; }
    else if (!o.prev) { d.className = 'dlt'; d.textContent = '—'; }
    else {
      var ch = rnd(((o.v - o.prev) / o.prev) * 100);
      d.className = 'dlt ' + (ch > 0 ? 'up' : ch < 0 ? 'down' : '');
      d.textContent = (ch > 0 ? '+' : '') + ch + '%';
    }
  }

  /* ================= retention small multiples ================= */
  /* A mark at the exact edge of the viewBox renders half outside it. The plot
   * therefore lives inside an inset box with clearance for the largest dot, and
   * the axis labels live inside the SVG so they cannot drift out of alignment
   * with the gridlines when the chart scales.
   */
  var CH = { W: 240, H: 104, L: 27, R: 233, T: 9, B: 92, R_MAX: 3.4 };

  function curve(p) {
    var s = p.sections, n = s.length;
    if (n < 2) return null;
    var x = function (i) { return CH.L + (i * (CH.R - CH.L)) / (n - 1); };
    var y = function (v) { return CH.B - (v / 100) * (CH.B - CH.T); };

    var worst = 1, fall = -1;
    for (var i = 1; i < n; i++) { var f = s[i - 1].reach - s[i].reach; if (f > fall) { fall = f; worst = i; } }

    var pts = s.map(function (sec, i) { return x(i) + ',' + y(sec.reach); }).join(' ');
    var area = 'M' + x(0) + ',' + CH.B + ' L' +
      s.map(function (sec, i) { return x(i) + ',' + y(sec.reach); }).join(' L') +
      ' L' + x(n - 1) + ',' + CH.B + ' Z';

    var grid = [100, 50, 0].map(function (v) {
      return '<line x1="' + CH.L + '" y1="' + y(v) + '" x2="' + CH.R + '" y2="' + y(v) +
             '" style="stroke:var(--line);stroke-width:1"/>' +
             '<text x="' + (CH.L - 6) + '" y="' + y(v) + '" text-anchor="end" ' +
             'dominant-baseline="middle" class="ytick">' + v + '</text>';
    }).join('');

    var endBand = band(s[n - 1].reach, p.avgEnd, p.visitors);
    var dots = s.map(function (sec, i) {
      var fill = i === worst ? 'var(--q-poor)'
               : i === n - 1 ? 'var(--' + endBand.cls + ')' : 'var(--ink)';
      return '<circle cx="' + x(i) + '" cy="' + y(sec.reach) + '" r="' +
        (i === worst || i === n - 1 ? CH.R_MAX : 2.2) + '" style="fill:' + fill + '"/>';
    }).join('');

    var bw = (CH.R - CH.L) / (n - 1);
    var hits = s.map(function (sec, i) {
      var hx = Math.max(CH.L - bw / 2, x(i) - bw / 2);
      return '<rect class="hit" x="' + hx + '" y="' + CH.T + '" width="' + bw +
        '" height="' + (CH.B - CH.T) + '" data-tip-label="' + esc(sec.name) +
        '" data-tip-value="' + sec.reach + '% still reading"/>';
    }).join('');

    return {
      svg: '<svg viewBox="0 0 ' + CH.W + ' ' + CH.H + '" role="img" aria-label="Retention through ' +
        esc(p.page) + '">' + grid +
        '<path d="' + area + '" style="fill:var(--ink);fill-opacity:.07"/>' +
        '<polyline points="' + pts + '" style="fill:none;stroke:var(--ink);stroke-width:1.5;stroke-linejoin:round"/>' +
        '<line x1="' + x(worst - 1) + '" y1="' + y(s[worst - 1].reach) + '" x2="' + x(worst) +
          '" y2="' + y(s[worst].reach) + '" style="stroke:var(--q-poor);stroke-width:1.9"/>' +
        dots + hits + '</svg>',
      worst: s[worst].name, fall: fall
    };
  }

  function renderRetention(list) {
    var el = slot('retention.cells');
    if (!list.length) { el.innerHTML = '<p class="empty">No case-study sessions in this segment</p>'; return; }
    // the end-of-page dot is judged against the other case studies, not itself
    var tv = list.reduce(function (a, p) { return a + p.visitors; }, 0);
    var avgEnd = tv ? list.reduce(function (a, p) {
      return a + p.sections[p.sections.length - 1].reach * p.visitors; }, 0) / tv : 0;
    list.forEach(function (p) { p.avgEnd = avgEnd; });
    el.innerHTML = list.map(function (p) {
      var c = curve(p);
      if (!c) return '';
      var thin = p.visitors < MIN_N;
      var on = state.filters.page === p.page;
      return '<button class="cell" data-filter-page="' + esc(p.page) + '" aria-pressed="' + on + '">' +
        '<span class="top"><span class="nm">' + esc(p.page) + '</span>' +
          '<span class="cnt">' + p.visitors + (thin ? ' · thin' : '') + '</span></span>' +
        '<span class="chartwrap">' + c.svg + '</span>' +
        '<span class="xlab"><span>' + esc(p.sections[0].name) + '</span>' +
          '<span>' + esc(p.sections[p.sections.length - 1].name) + '</span></span>' +
        '<span class="drop">−' + c.fall + ' at ' + esc(c.worst) + '</span>' +
      '</button>';
    }).join('');
  }

  /* ================= payoff ================= */
  /* Two proportions with their uncertainty, on one axis that starts at zero and
   * is labelled. Position carries the value; the whisker carries the doubt; the
   * distance between the two dots is the finding. Same grammar as Source quality,
   * because it is the same kind of quantity.
   */
  function payoff(target, deepN, deepC, shalN, shalC, axisMax) {
    var thin = deepN < MIN_N || shalN < MIN_N;
    var A = wilson(deepC, deepN), B = wilson(shalC, shalN);
    var dr = deepN ? (deepC / deepN) * 100 : 0, sr = shalN ? (shalC / shalN) * 100 : 0;
    var at = function (v) { return pct((v / axisMax) * 100); };

    var row = function (nm, rate, ci, count, n, cls) {
      return '<div class="payrow ' + cls + '">' +
        '<span class="nm">' + nm + '</span>' +
        '<span class="tr" data-tip-label="' + nm + '" data-tip-value="' + count + ' of ' + n +
          ' · 95% CI ' + Math.round(ci.lo) + '–' + Math.round(ci.hi) + '%">' +
          (n ? '<u class="ci" style="left:' + at(ci.lo) + '%;right:' + (100 - at(ci.hi)) + '%"></u>' +
               '<b class="pt" style="left:' + at(rate) + '%"></b>' : '') +
        '</span>' +
        '<span class="pc">' + (thin ? count : sig(rate, ci.half) + '%') +
          '<small>/' + num(n) + '</small></span>' +
      '</div>';
    };
    html(target, row('Read to end', dr, A, deepC, deepN, 'deep') +
                 row('Did not', sr, B, shalC, shalN, 'shallow'));
    return { dr: dr, sr: sr, thin: thin, A: A, B: B, separable: !overlap(A, B) };
  }

  function payAxis(max) {
    var ticks = [0, max / 2, max].map(function (v) { return Math.round(v) + (v === max ? '%' : ''); });
    return '<div class="payaxis"><span></span><span class="ax">' +
      ticks.map(function (t) { return '<i>' + t + '</i>'; }).join('') +
      '</span><span></span></div>';
  }

  /* ================= source quality ================= */
  function renderQuality(rows) {
    var el = slot('quality.rows');
    if (!rows.length) { el.innerHTML = '<p class="empty">No sources in this segment</p>'; return; }
    var tv = rows.reduce(function (a, r) { return a + r.visitors; }, 0);
    var mean = tv ? rows.reduce(function (a, r) { return a + r.readRate * r.visitors; }, 0) / tv : 0;
    var sorted = rows.slice().sort(function (a, b) { return b.readRate - a.readRate; });

    el.innerHTML =
      '<div class="lgrid"><div></div><div class="reflab"><span style="position:absolute;left:' + pct(mean) +
        '%;transform:translateX(-50%);white-space:nowrap">avg ' + rnd(mean) + '%</span></div><div></div></div>' +
      sorted.map(function (r) {
        var thin = r.visitors < MIN_N, on = state.filters.source === r.label;
        var b = band(r.readRate, mean, r.visitors);
        return '<button class="lgrid lrow ' + b.cls + (thin ? ' low' : '') + '" data-filter-source="' + esc(r.label) +
          '" aria-pressed="' + on + '" data-tip-label="' + esc(r.label) +
          '" data-tip-value="' + r.visitors + ' visitors · ' + rnd(r.readRate) + '% finish, 95% CI ' +
            Math.round(wilson(r.readRate * r.visitors / 100, r.visitors).lo) + '–' +
            Math.round(wilson(r.readRate * r.visitors / 100, r.visitors).hi) + '%">' +
          '<span class="nm">' + esc(r.label) + '</span>' +
          '<span class="ax"><span class="refline" style="left:' + pct(mean) + '%"></span>' +
            '<span class="stem" style="width:' + pct(r.readRate) + '%"></span>' +
            '<span class="dot" style="left:' + pct(r.readRate) + '%;background:currentColor"></span></span>' +
          '<span class="pc">' + sig(r.readRate, wilson(r.readRate * r.visitors / 100, r.visitors).half) +
            '%<small>' + r.visitors + ' vis</small></span>' +
        '</button>';
      }).join('') +
      '<div class="lgrid"><div></div><div class="ticks"><span>0</span><span>50</span><span>100%</span></div><div></div></div>';
  }

  /* ================= world map =================
   * Choropleth by read rate, not by volume: a large country full of bouncers
   * must not look like a win. Area on a map already exaggerates big countries,
   * so the exact counts live in the ranked list beside it.
   */
  function cname(code) {
    var W = window.WORLD;
    return (W && W.n && W.n[code]) || (W && W.c[code] && W.c[code].n) || code;
  }

  function renderMap(places) {
    var el = slot('map.svg');
    if (!window.WORLD) { el.innerHTML = '<p class="noloc">Map failed to load.</p>'; return; }
    var by = {}, tot = 0, wsum = 0;
    places.forEach(function (p) { by[p.code] = p; tot += p.visitors; wsum += p.readRate * p.visitors; });
    var avg = tot ? wsum / tot : 0;

    var paths = Object.keys(WORLD.c).map(function (k) {
      var p = by[k];
      var cls = p ? band(p.readRate, avg, p.visitors).svg + ' on' : '';
      if (p && state.filters.country === k) cls += ' sel';
      var attrs = p
        ? ' data-filter-country="' + k + '" data-tip-label="' + esc(cname(k)) +
          '" data-tip-value="' + p.visitors + ' visitors · ' + rnd(p.readRate) + '% finish"'
        : '';
      return '<path class="' + cls + '" d="' + WORLD.c[k].d + '"' + attrs + '></path>';
    }).join('');

    el.innerHTML = '<svg viewBox="' + WORLD.viewBox + '" role="img" aria-label="Visitors by country">' +
      paths + '</svg>';
    set('map.hint', places.length + ' countries · avg ' + rnd(avg) + '% finish');
  }

  /* ================= places list =================
   * Country, region and city are the same rows at three zoom levels. The map
   * stays at country level because that is all the geometry can carry; the list
   * is where the resolution lives. A single city at n=1 is not a statistic —
   * it is a lead, which is exactly why it earns a place next to the map.
   */
  var lastPlaces = {};

  function renderPlaces(places) {
    var rows = places[state.level] || [];
    var el = slot('places.rows');
    if (!rows.length) {
      el.innerHTML = '<p class="empty">No ' + state.level + ' data in this segment</p>';
      return;
    }
    var max = rows.reduce(function (a, p) { return Math.max(a, p.visitors); }, 0) || 1;
    var tot = rows.reduce(function (a, p) { return a + p.visitors; }, 0);
    var avg = tot ? rows.reduce(function (a, p) { return a + p.readRate * p.visitors; }, 0) / tot : 0;

    el.innerHTML = rows.slice().sort(function (a, b) { return b.visitors - a.visitors; })
      .map(function (p) {
        var b = band(p.readRate, avg, p.visitors);
        // only country rows filter — Umami has no region/city filter on the
        // endpoints this dashboard uses, so those rows stay read-only
        var isCountry = state.level === 'country';
        var nm = isCountry ? cname(p.code) : p.label;
        var sub = !isCountry && p.code ? ' <span class="sub">' + esc(cname(p.code)) + '</span>' : '';
        var tag = isCountry ? 'button' : 'div';
        var attrs = isCountry
          ? ' data-filter-country="' + esc(p.code) + '" aria-pressed="' + (state.filters.country === p.code) + '"'
          : '';
        return '<' + tag + ' class="crow ' + b.cls + (isCountry ? '' : ' flat') + '"' + attrs +
          ' data-tip-label="' + esc(nm) + '" data-tip-value="' + p.visitors + ' visitors · ' +
            rnd(p.readRate) + '% finish">' +
          '<span class="nm">' + esc(nm) + sub + '</span>' +
          '<span class="vb"><i style="width:' + pct((p.visitors / max) * 100) + '%"></i></span>' +
          '<span class="vv">' + p.visitors + '</span></' + tag + '>';
      }).join('');
  }

  document.querySelectorAll('[data-level]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.level = b.dataset.level;
      renderPlaces(lastPlaces);
    });
  });

  /* ================= payload hardening =================
   * A half-rendered dashboard is worse than a broken one: stale numbers sit
   * beside fresh ones and nothing says which is which. So the payload is
   * normalised once, up front, and render() is wrapped — any throw leaves the
   * previous view intact and says so out loud.
   */
  function shape(d) {
    d = d || {};
    var z = { v: 0, prev: 0, n: 0 };
    d.range = d.range || {};
    d.totals = d.totals || {};
    ['visitors', 'opened', 'read', 'acted'].forEach(function (k) {
      var t = d.totals[k];
      d.totals[k] = (t && typeof t.v === 'number') ? t : z;
    });
    d.payoff = d.payoff || {};
    ['deep', 'shallow'].forEach(function (k) {
      var p = d.payoff[k] || {};
      d.payoff[k] = { n: p.n || 0, resume: p.resume || 0, contact: p.contact || 0 };
    });
    // a curve needs at least two points to have a shape
    d.retention = (Array.isArray(d.retention) ? d.retention : []).filter(function (p) {
      return p && Array.isArray(p.sections) && p.sections.length >= 2;
    });
    d.quality = Array.isArray(d.quality) ? d.quality : [];
    d.days = (Array.isArray(d.days) ? d.days : []).filter(function (x) { return x && x.date; });
    d.apps = Array.isArray(d.apps) ? d.apps : [];
    d.pages = Array.isArray(d.pages) ? d.pages : [];
    d.cta = Array.isArray(d.cta) ? d.cta : [];
    d.places = Array.isArray(d.places) ? { country: d.places } : (d.places || {});
    return d;
  }

  function fail(msg) {
    var e = slot('load.error');
    if (e) { e.textContent = msg || ''; e.hidden = !msg; }
  }

  /* ================= render ================= */
  var METRIC_LABEL = { visitors: 'visitors', opened: 'opened a case study', read: 'read to the end', acted: 'then acted' };

  function render(raw) {
    var d = shape(raw);
    last = raw;
    fail('');
    renderFilters();

    // context: which period, against which period, and how fresh
    if (d.range.from && d.range.to) {
      set('meta.period', day(d.range.from) + ' – ' + day(d.range.to) +
        (d.range.prevFrom ? '  vs  ' + day(d.range.prevFrom) + ' – ' + day(d.range.prevTo) : ''));
    }
    set('meta.updated', 'as of ' + new Date().toLocaleTimeString('en-GB',
      { hour: '2-digit', minute: '2-digit' }));

    fig('visitors', d.totals.visitors);
    fig('opened', d.totals.opened, true);
    fig('read', d.totals.read, true);
    fig('acted', d.totals.acted, true);

    renderRetention(d.retention);

    var p = d.payoff;
    var his = [wilson(p.deep.resume, p.deep.n).hi, wilson(p.shallow.resume, p.shallow.n).hi,
               wilson(p.deep.contact, p.deep.n).hi, wilson(p.shallow.contact, p.shallow.n).hi];
    var axisMax = Math.min(100, Math.max(20, Math.ceil(Math.max.apply(null, his) / 10) * 10));
    var r1 = payoff('pay.resume', p.deep.n, p.deep.resume, p.shallow.n, p.shallow.resume, axisMax);
    payoff('pay.contact', p.deep.n, p.deep.contact, p.shallow.n, p.shallow.contact, axisMax);
    html('pay.axis', payAxis(axisMax));
    set('pay.line', r1.thin
      ? 'Counts, not rates — under ' + MIN_N + ' sessions.'
      : r1.separable
        ? 'Finishers are roughly ' + Math.round(r1.sr ? r1.dr / r1.sr : 0) +
          '× likelier to open the CV. The 95% intervals do not overlap, so the gap is real.'
        : 'The two intervals overlap — at this sample size the difference is not yet real.');

    renderQuality(d.quality);

    var places = d.places;
    lastPlaces = places;
    renderMap(places.country || []);
    renderPlaces(places);

    /* traffic — plots whichever figure is selected */
    var m = state.metric;
    set('days.metric', METRIC_LABEL[m]);
    if (!d.days.length) {
      html('days.bars', '');
      set('days.peak', 'no data'); set('days.from', '—'); set('days.to', '—');
    } else {
    var max = d.days.reduce(function (a, x) { return Math.max(a, x[m] || 0); }, 0) || 1;
    html('days.bars', d.days.map(function (x) {
      var on = state.filters.day === x.date;
      return '<button class="d' + (x.note ? ' mark' : '') + '" data-filter-day="' + x.date + '" aria-pressed="' + on +
        '" data-tip-label="' + day(x.date) + (x.note ? ' — ' + esc(x.note) : '') +
        '" data-tip-value="' + (x[m] || 0) + (m === 'visitors' ? ' visitors' : '%') +
        '"><i style="height:' + pct(((x[m] || 0) / max) * 100) + '%"></i></button>';
    }).join(''));
    set('days.peak', 'peak ' + max + (m === 'visitors' ? '' : '%'));
    set('days.from', day(d.days[0].date));
    set('days.to', day(d.days[d.days.length - 1].date));
    }

    /* applications */
    var apps = d.apps.slice().sort(function (a, b) {
      return (!!b.opened - !!a.opened) || (b.stage - a.stage) || (b.seconds - a.seconds);
    });
    html('apps.rows', apps.length ? apps.map(function (a) {
      var steps = '';
      for (var i = 0; i < a.stages; i++) steps += '<i class="' + (i < a.stage ? (i === a.stages - 1 ? 'end' : 'on') : '') + '"></i>';
      var src = 'apply · ' + a.campaign;
      return '<tr class="' + (a.opened ? '' : 'cold') + '" data-filter-source="' + esc(src) +
        '" aria-pressed="' + (state.filters.source === src) + '">' +
        '<td class="trunc"><span class="dot6' + (a.opened ? ' on' : '') + '"></span>' + esc(a.company) + '</td>' +
        '<td class="dim mono">' + esc(a.sent) + '</td>' +
        '<td class="dim mono">' + (a.opened ? esc(a.opened) : '—') + '</td>' +
        '<td><span class="track">' + steps + '</span></td>' +
        '<td class="r">' + (a.opened ? secs(a.seconds) : '—') + '</td>' +
        '<td class="r">' + (a.resume ? '✓' : '') + '</td></tr>';
    }).join('') : '<tr><td colspan="6" class="empty">No tagged applications</td></tr>');

    var pv = d.pages.reduce(function (a, r) { return a + r.visitors; }, 0);
    var pavg = pv ? d.pages.reduce(function (a, r) { return a + r.read * r.visitors; }, 0) / pv : 0;
    html('pages.rows', d.pages.map(function (r) {
      return '<tr data-filter-page="' + esc(r.path) + '" aria-pressed="' + (state.filters.page === r.path) + '">' +
        '<td class="trunc mono">' + esc(r.path) + '</td>' +
        '<td class="r">' + r.visitors + '</td>' +
        '<td class="r">' + secs(r.median) + '</td>' +
        '<td class="r ' + band(r.read, pavg, r.visitors).cls + '">' +
          (r.visitors < MIN_N ? '<span class="thin-flag">thin</span>' : r.read + '%') + '</td></tr>';
    }).join(''));

    var cmax = d.cta.reduce(function (a, r) { return Math.max(a, r.clicks); }, 0) || 1;
    html('cta.rows', d.cta.map(function (r) {
      return '<tr><td class="trunc">' + esc(r.label) + '</td>' +
        '<td><span class="bwrap" style="display:block"><span class="bar" style="display:block;width:' +
          pct((r.clicks / cmax) * 100) + '%"></span></span></td>' +
        '<td class="r">' + r.clicks + '</td></tr>';
    }).join(''));
  }

  /* ================= click wiring ================= */
  document.addEventListener('click', function (e) {
    var t = e.target.closest
      ? e.target.closest('[data-filter-source],[data-filter-page],[data-filter-day],[data-filter-country]')
      : null;
    if (!t) return;
    var ds = t.dataset || {};
    if (ds.filterSource != null) setFilter('source', ds.filterSource);
    else if (ds.filterPage != null) setFilter('page', ds.filterPage);
    else if (ds.filterDay != null) setFilter('day', ds.filterDay);
    else if (ds.filterCountry != null) setFilter('country', ds.filterCountry);
  });

  document.querySelectorAll('[data-metric]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-metric]').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      state.metric = b.dataset.metric;
      if (last) render(last);
    });
  });

  document.querySelectorAll('[data-range]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-range]').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      state.range = Number(b.dataset.range);
      state.filters.day = null;
      refresh();
    });
  });

  /* ================= transport ================= */
  function refresh() {
    if (DEMO_ON) {
      try { render(demo(state.range, state.filters)); }
      catch (ex) { console.error(ex); fail('Could not draw this view — the figures above are from the previous one.'); }
      return Promise.resolve();
    }
    return load().catch(function (ex) { console.error(ex); fail(ex.message); });
  }
  function load() {
    return fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: state.pw, range: state.range, filters: state.filters })
    }).then(function (r) {
      if (r.status === 401) throw new Error('Wrong password');
      if (!r.ok) throw new Error('API returned ' + r.status);
      return r.json();
    }).then(function (d) {
      if (!d || d.ok !== true) throw new Error((d && d.error) || 'Unexpected response');
      try { render(d); }
      catch (ex) {
        console.error(ex);
        fail('Could not draw this view — the figures above are from the previous one.');
      }
    });
  }
  function unlock() { var g = $('#gate'); if (g) g.remove(); document.body.classList.remove('locked'); }

  $('#gate-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = slot('gate.error'); err.textContent = '';
    state.pw = $('#pw').value;
    load().then(function () { sessionStorage.setItem('dashpw', state.pw); unlock(); })
      .catch(function (ex) { err.textContent = ex.message; });
  });

  /* ================= sample data ================= */
  var OFFLINE = !/lokeshbhatia\.com$/.test(location.hostname), DEMO_ON = false;

  // deterministic per-segment jitter, so filtering visibly changes the page
  function seed(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; } return h; }
  function mk(s) { var x = s; return function () { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }

  function demo(days, f) {
    f = f || {};
    var key = [f.source, f.page, f.day, f.country, days].join('|');
    var rand = mk(seed(key));
    var narrowed = !!(f.source || f.page || f.day || f.country);
    // a filter selects a subset: fewer people, and a different shape
    var vol = narrowed ? (f.day ? 0.16 : f.country ? 0.3 : 0.42) : 1;
    var lift = f.source && /apply|resume/.test(f.source) ? 1.9 : f.source ? 0.55 : 1;
    // some countries read far better than others; the filter should show that
    if (f.country) lift *= /DE|IE|NL|PL|SG/.test(f.country) ? 1.7 : /US|BR|ZA|AU/.test(f.country) ? 0.6 : 1;
    var k = (days / 7) * vol;
    var n = function (base) { return Math.max(1, rnd(base * k * (0.85 + rand() * 0.3))); };
    var rate = function (base) { return Math.max(2, Math.min(96, rnd(base * lift * (0.9 + rand() * 0.2)))); };

    var end = new Date();
    var iso = function (o) { var x = new Date(end); x.setDate(end.getDate() - o); return x.toISOString().slice(0, 10); };
    var notes = { 2: 'Applied to 4 companies', 5: 'Posted App Merge on LinkedIn' };
    var series = [];
    for (var i = days - 1; i >= 0; i--) {
      series.push({
        date: iso(i), note: notes[i] || null,
        visitors: n(3 + rand() * 9) + (notes[i] ? n(11) : 0),
        opened: rate(46), read: rate(19), acted: rate(11)
      });
    }
    var shape = function (base) {
      return base.map(function (s, i) {
        return { name: s.name, reach: i === 0 ? 100 : Math.max(4, Math.min(99, rnd(s.reach * (lift > 1 ? 1.22 : lift < 1 ? 0.78 : 1) * (0.94 + rand() * 0.12)))) };
      });
    };
    var R = [
      { page: '/app-merge', visitors: n(31), sections: shape([
        { name: 'Hero', reach: 100 }, { name: 'Problem', reach: 86 }, { name: 'Research', reach: 71 },
        { name: 'Merge rules', reach: 41 }, { name: 'Testing', reach: 34 }, { name: 'Outcome', reach: 29 }]) },
      { page: '/rise-portal', visitors: n(20), sections: shape([
        { name: 'Hero', reach: 100 }, { name: 'Context', reach: 82 }, { name: 'System', reach: 66 },
        { name: 'Rollout', reach: 52 }, { name: 'Outcome', reach: 44 }]) },
      { page: '/about', visitors: n(17), sections: shape([
        { name: 'Intro', reach: 100 }, { name: 'How I work', reach: 74 },
        { name: 'Background', reach: 61 }, { name: 'Contact', reach: 55 }]) }
    ];
    if (f.page) R = R.filter(function (r) { return r.page === f.page; });

    var Q = [
      { label: 'apply · stripe', visitors: n(9), readRate: rate(58) },
      { label: 'apply · linear', visitors: n(7), readRate: rate(46) },
      { label: 'resume PDF', visitors: n(8), readRate: rate(44) },
      { label: 'direct', visitors: n(17), readRate: rate(24) },
      { label: 'linkedin', visitors: n(31), readRate: rate(11) },
      { label: 'behance', visitors: n(9), readRate: rate(8) }
    ];
    if (f.source) Q = Q.filter(function (q) { return q.label === f.source; });

    var vis = n(63);
    return {
      ok: true,
      range: { from: iso(days - 1), to: iso(0), days: days, prevFrom: iso(days * 2 - 1), prevTo: iso(days) },
      totals: {
        visitors: { v: vis, prev: n(58) },
        opened: { v: rate(46), prev: rate(41), n: vis },
        read: { v: rate(19), prev: rate(22), n: n(30) },
        acted: { v: rate(12), prev: rate(9), n: n(30) }
      },
      retention: R,
      payoff: { deep: { n: n(24), resume: n(11), contact: n(4) }, shallow: { n: n(39), resume: n(3), contact: n(1) } },
      quality: Q,
      days: series,
      places: (function () {
        var mk = function (list, keyed) {
          var out = list.map(function (c) {
            return keyed
              ? { code: c[0], label: c[1], visitors: n(c[2]), readRate: rate(c[3]) }
              : { code: c[0], visitors: n(c[1] * 1.9), readRate: rate(c[2]) };
          }).filter(function (c) { return c.visitors > 0; });
          return f.country ? out.filter(function (c) { return c.code === f.country; }) : out;
        };
        return {
          country: mk([['IN',28,21],['DE',11,54],['IE',9,61],['US',24,12],['NL',7,38],
                       ['GB',13,33],['SG',5,44],['AU',4,18],['CA',6,26],['FR',3,30],
                       ['BR',3,9],['ZA',2,14],['JP',2,40],['AE',3,22],['PL',2,47]], false),
          region: mk([['IN','Karnataka',34,26],['IN','Maharashtra',18,17],['IN','Delhi',12,14],
                      ['DE','Berlin',14,58],['IE','Leinster',13,63],['US','California',21,15],
                      ['US','New York',12,11],['GB','England',19,34],['NL','North Holland',9,41],
                      ['SG','Singapore',7,46],['AE','Dubai',5,23],['PL','Masovia',4,49]], true),
          city: mk([['IN','Bengaluru',29,28],['IN','Mumbai',14,18],['IN','Pune',8,22],
                    ['IN','New Delhi',10,13],['DE','Berlin',13,59],['DE','Munich',5,47],
                    ['IE','Dublin',13,64],['US','San Francisco',12,17],['US','New York',11,12],
                    ['US','Seattle',4,9],['GB','London',17,36],['NL','Amsterdam',8,42],
                    ['SG','Singapore',7,46],['AE','Dubai',5,23],['PL','Warsaw',4,49]], true)
        };
      }()),
      apps: [
        { company: 'Stripe', campaign: 'stripe', sent: '31 Aug', opened: '2 Sep', stage: 5, stages: 5, seconds: 412, resume: true },
        { company: 'Razorpay', campaign: 'razorpay', sent: '1 Sep', opened: '1 Sep', stage: 4, stages: 5, seconds: 268, resume: true },
        { company: 'Linear', campaign: 'linear', sent: '2 Sep', opened: '4 Sep', stage: 2, stages: 5, seconds: 74, resume: false },
        { company: 'Zerodha', campaign: 'zerodha', sent: '3 Sep', opened: '3 Sep', stage: 1, stages: 5, seconds: 21, resume: false },
        { company: 'Notion', campaign: 'notion', sent: '4 Sep', opened: null, stage: 0, stages: 5, seconds: 0, resume: false }
      ],
      pages: [
        { path: '/', visitors: n(63), median: 42, read: rate(18) },
        { path: '/app-merge', visitors: n(31), median: 214, read: rate(41) },
        { path: '/rise-portal', visitors: n(20), median: 176, read: rate(33) },
        { path: '/about', visitors: n(17), median: 88, read: rate(47) },
        { path: '/resume', visitors: n(12), median: 61, read: rate(52) }
      ],
      cta: [
        { label: 'card · app-merge', clicks: n(26) }, { label: 'card · rise-portal', clicks: n(17) },
        { label: 'resume-open', clicks: n(11) }, { label: 'out · linkedin', clicks: n(9) },
        { label: 'email-click', clicks: n(3) }, { label: 'email-copy', clicks: n(2) }
      ]
    };
  }

  function startDemo() {
    DEMO_ON = true;
    render(demo(state.range, state.filters));
    set('meta.footer', 'SAMPLE DATA — api/stats.js not reachable from this host. Filtering is live; the numbers are synthetic.');
    unlock();
  }

  var saved = sessionStorage.getItem('dashpw');
  if (saved) {
    state.pw = saved;
    // a stored password can go stale. Drop it, and off-domain fall through to
    // the sample data rather than leaving the page locked behind a dead gate.
    load().then(unlock).catch(function () {
      sessionStorage.removeItem('dashpw');
      state.pw = null;
      if (OFFLINE) startDemo();
    });
  } else if (OFFLINE) {
    startDemo();
  }
}());
