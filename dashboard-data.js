/* dashboard-data.js — data, filtering, interaction. No design decisions here.
 *
 * POST {range, filters:{source,page,day}} → JSON.  No auth: the endpoint
 * is public and returns aggregates only.
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

  var state = { range: 28, metric: 'visitors', level: 'country', filters: { source: null, page: null, day: null } };
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

  /* ================= the sequential scale =================
   * One quantitative variable, so one hue in steps. The map used to rank
   * countries good/average/poor by finish rate — a variable the endpoint no
   * longer returns, which left band() falling through to its "average" branch
   * and painting every country amber: a verdict about data that did not
   * exist. Volume has no good or bad direction, so nothing here implies one.
   */
  var SEQ = ['s0', 's1', 's2', 's3', 's4'];
  function seqBand(v, max) {
    if (!v || !max) return SEQ[0];
    var r = v / max;
    if (r > 0.66) return SEQ[4];
    if (r > 0.33) return SEQ[3];
    if (r > 0.12) return SEQ[2];
    return SEQ[1];
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
    html('filters', any
      ? '<span class="scope">Filtered to</span>' + out.join('') +
        '<button class="chip ghost" data-clear="all">Clear all</button>'
      : '<span class="scope">All visitors</span>');
  }

  document.addEventListener('click', function (e) {
    var c = e.target.closest ? e.target.closest('[data-clear]') : null;
    if (!c) return;
    if (c.dataset.clear === 'all') state.filters = { source: null, page: null, day: null };
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
             '" style="stroke:var(--rule);stroke-width:1"/>' +
             '<text x="' + (CH.L - 6) + '" y="' + y(v) + '" text-anchor="end" ' +
             'dominant-baseline="middle" class="ytick">' + v + '</text>';
    }).join('');

    // The steepest fall is the finding; the last point is just the end of the
    // line. Neither is good or bad, so neither gets a verdict colour — the
    // fall is marked by accent and radius, which survives colour blindness.
    var dots = s.map(function (sec, i) {
      var fill = i === worst ? 'var(--mark)' : 'currentColor';
      return '<circle cx="' + x(i) + '" cy="' + y(sec.reach) + '" r="' +
        (i === worst ? CH.R_MAX : 2.2) + '" style="fill:' + fill + '"/>';
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
        '<polyline points="' + pts + '" style="fill:none;stroke:currentColor;stroke-width:1.5;stroke-linejoin:round"/>' +
        '<line x1="' + x(worst - 1) + '" y1="' + y(s[worst - 1].reach) + '" x2="' + x(worst) +
          '" y2="' + y(s[worst].reach) + '" style="stroke:var(--mark);stroke-width:1.9"/>' +
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
  /* ================= depth by device =================
   * Two bars per row on one common scale, which is the comparison worth
   * making: how many sections a device's readers actually reach. Counts, not
   * rates — Umami returns event totals and unique visitors, and dividing one
   * by the other is what produced a 400% completion rate. No colour: there
   * are two series and a legend does that job without spending a hue.
   */
  /* ================= the verdict =================
   * The page's own conclusion, stated before any chart. A reader should not
   * have to assemble the funnel out of four boxes and a line chart, and a
   * number nobody can turn into a sentence was probably not worth plotting.
   * Every clause is dropped when its number is zero, so this never claims a
   * step nobody took.
   */
  function renderVerdict(d) {
    var v = d.totals.visitors.v, hero = d.totals.passedHero.v, act = d.totals.contacts.v;
    if (!v) { set('verdict', 'Nothing recorded in this window yet.'); return; }

    var deepest = null;
    (d.retention || []).forEach(function (p) {
      var last = p.sections[p.sections.length - 1];
      if (!deepest || last.count > deepest.count) deepest = { page: p.page, n: last.count };
    });

    var out = v + (v === 1 ? ' visitor' : ' visitors');
    out += hero ? ', ' + hero + ' got past the hero' : ', none scrolled past the hero';
    if (deepest && deepest.n) out += ', ' + deepest.n + ' reached the end of ' + deepest.page;
    out += act ? ', and ' + act + (act === 1 ? ' got in touch.' : ' got in touch.') : ', and nobody got in touch.';
    set('verdict', out.charAt(0).toUpperCase() + out.slice(1));
  }

  /* ================= where they came from ================= */
  function renderSources(rows) {
    var el = slot('sources.rows');
    if (!el) return;
    rows = (rows || []).filter(function (r) { return r.visitors > 0; })
      .sort(function (a, b) { return b.visitors - a.visitors; }).slice(0, 7);
    if (!rows.length) { el.innerHTML = '<p class="empty">No referrers in this segment</p>'; return; }
    var max = rows[0].visitors || 1;
    el.innerHTML = rows.map(function (r) {
      var on = state.filters.source === r.label;
      return '<button class="dvrow srow" data-filter-source="' + esc(r.label) + '" aria-pressed="' + on + '">' +
        '<span class="nm">' + esc(r.label) + '</span>' +
        '<span class="bars"><i style="width:' + pct((r.visitors / max) * 100) + '%"></i></span>' +
        '<span class="vv">' + num(r.visitors) + '</span></button>';
    }).join('');
  }

  function renderDevices(rows) {
    var el = slot('devices.rows');
    if (!el) return;
    rows = (rows || []).filter(function (r) { return r.visitors > 0; })
      .sort(function (a, b) { return (b.sectionsReached || 0) - (a.sectionsReached || 0); });
    if (!rows.length) { el.innerHTML = '<p class="empty">No devices in this segment</p>'; return; }

    // One bar, one scale. Plotting visitors beside sections reached put an
    // 8x magnitude gap on a shared axis and squashed the smaller series into
    // a sliver — two series that do not share a unit do not share an axis.
    // Sections reached is the question; visitors is the context, and context
    // reads fine as a number.
    var max = rows.reduce(function (m, r) { return Math.max(m, r.sectionsReached || 0); }, 0) || 1;

    el.innerHTML = rows.map(function (r) {
      var unknown = r.sectionsReached == null;
      var per = (!unknown && r.visitors) ? (r.sectionsReached / r.visitors) : null;
      return '<div class="dvrow">' +
        '<span class="nm">' + esc(r.device) + '</span>' +
        '<span class="bars">' +
          (unknown ? '' : '<i style="width:' + pct(((r.sectionsReached || 0) / max) * 100) + '%"></i>') +
        '</span>' +
        '<span class="vv">' + (unknown ? '—' : num(r.sectionsReached)) +
          '<small>' + num(r.visitors) + ' vis' +
          (per == null ? '' : ' · ' + (Math.round(per * 10) / 10) + ' each') + '</small></span>' +
      '</div>';
    }).join('');
  }


  /* ================= payload hardening =================
   * A half-rendered dashboard is worse than a broken one: stale numbers sit
   * beside fresh ones and nothing says which is which. So the payload is
   * normalised once, up front, and render() is wrapped — any throw leaves the
   * previous view intact and says so out loud.
   */
  /* ================= adapt =================
   * api/stats.js answers with what Umami can honestly provide; the renderers
   * below were written against an earlier, more optimistic payload. This maps
   * one to the other in a single place, so the charts keep their maths and
   * the endpoint keeps its honesty.
   *
   * Only runs on a real response. Demo data is already in the internal shape,
   * so it passes straight through and the two paths cannot drift.
   */
  function adapt(a) {
    var h = a.headline || {}, prev = a.previous || {};
    var evt = {};
    (a.events || []).forEach(function (e) { evt[e.name] = e.count; });

    // Four counts, each with a real previous-period figure behind it. The
    // rates that used to sit here divided event totals by unique visitors and
    // reported 103%; the endpoint returns null for them now, and the counts
    // are what it can actually stand behind.
    var t = function (v, p) { return { v: v || 0, prev: (prev && prev[p]) || 0, n: null }; };

    // ofPeak is already a 0-100 reach, which is exactly what the curve wants.
    // Pages nobody has opened are dropped rather than drawn as a flat zero.
    var retention = (a.sections && a.sections.byPage ? a.sections.byPage : [])
      .map(function (p) {
        var peak = (p.sections || []).reduce(function (m, s) { return Math.max(m, s.count || 0); }, 0);
        return {
          page: p.path,
          visitors: peak,
          monotonic: p.monotonic !== false,
          sections: (p.sections || []).map(function (s) {
            return { name: s.name, reach: s.ofPeak == null ? 0 : s.ofPeak, count: s.count || 0 };
          })
        };
      })
      .filter(function (p) { return p.visitors > 0 && p.sections.length >= 2; });

    return {
      range: a.range || {},
      updated: a.updated,
      totals: {
        visitors: t(h.visitors, 'visitors'),
        pageviews: t(h.pageviews, 'pageviews'),
        passedHero: t(h.passedHero, 'passedHero'),
        contacts: t(h.contacts, 'contacts')
      },
      retention: retention,
      devices: a.devices || [],
      sources: (a.sources || []).map(function (r) {
        return { label: r.name === 'direct' || !r.name ? 'direct' : r.name, visitors: r.count };
      }),
      notes: a.notes || [],
      // No per-country read rate exists, so the map carries location only and
      // the counts live in the list beside it.
      places: { country: (a.countries || []).map(function (c) {
                  return { code: c.code, visitors: c.visitors, readRate: null }; }),
                city: (a.cities || []).map(function (c) {
                  return { code: null, label: c.city, visitors: c.visitors, readRate: null }; }) },
      days: (a.daily || []).map(function (x) {
        return { date: x.date, visitors: x.visitors, pageviews: x.pageviews };
      }),
      pages: (a.pages || []).map(function (p) {
        return { path: p.path, visitors: p.views, median: null, read: null };
      }),
      cta: (a.ctas && a.ctas.byName ? a.ctas.byName : []).map(function (c) {
        return { label: c.name, clicks: c.count };
      })
    };
  }

  function shape(d) {
    d = d || {};
    // A real response carries `headline`; demo data does not.
    if (d.headline) d = adapt(d);
    var z = { v: 0, prev: 0, n: 0 };
    d.range = d.range || {};
    d.totals = d.totals || {};
    ['visitors', 'pageviews', 'passedHero', 'contacts'].forEach(function (k) {
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
    d.devices = Array.isArray(d.devices) ? d.devices : [];
    d.sources = Array.isArray(d.sources) ? d.sources : [];
    d.days = (Array.isArray(d.days) ? d.days : []).filter(function (x) { return x && x.date; });
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
  // Two metrics, because two are what the daily series honestly contains.
  var METRIC_LABEL = { visitors: 'visitors', pageviews: 'pageviews' };

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
    fig('pageviews', d.totals.pageviews);
    fig('passedHero', d.totals.passedHero);
    fig('contacts', d.totals.contacts);

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

    renderDevices(d.devices);
    renderSources(d.sources);
    renderVerdict(d);




    html('pages.rows', d.pages.map(function (r) {
      return '<tr data-filter-page="' + esc(r.path) + '" aria-pressed="' + (state.filters.page === r.path) + '">' +
        '<td class="trunc mono">' + esc(r.path) + '</td>' +
        '<td class="r">' + r.visitors + '</td>' +
        '<td class="r">' + (r.median == null ? '—' : secs(r.median)) + '</td>' +
        '<td class="r">' + (r.read == null ? '—' : r.read + '%') + '</td></tr>';
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
    // No password. The endpoint is public and every field it returns is an
    // aggregate, so there is nothing here to authenticate.
    return fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: state.range, filters: state.filters })
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (j) {
      if (!j || j.ok !== true) throw new Error((j && j.error) || 'Bad response');
      render(j);
      return j;
    });
  }

  // Public: load on arrival. There is no gate to pass and nothing to type.
  function boot() {
    load().catch(function (ex) {
      if (OFFLINE) return startDemo();
      fail('Could not load the numbers: ' + ex.message);
    });
  }

  /* ================= sample data ================= */
  // Demo mode fills the page with synthetic numbers off-domain so the layout
  // can be worked on without a live endpoint. ?live opts out of it, to test
  // the real fetch and its failure state from anywhere.
  var SHOW_LIVE = /[?&]live\b/.test(location.search);
  var OFFLINE = !SHOW_LIVE && !/lokeshbhatia\.com$/.test(location.hostname), DEMO_ON = false;

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
    // count is derived from the page's own visitors, not the site total: the
    // real payload counts section-reached events per page, and a sample that
    // did otherwise would exercise a shape the live data never produces.
    var shape = function (base, pv) {
      return base.map(function (s, i) {
        var rr = i === 0 ? 100 : Math.max(4, Math.min(99,
          rnd(s.reach * (lift > 1 ? 1.22 : lift < 1 ? 0.78 : 1) * (0.94 + rand() * 0.12))));
        return { name: s.name, reach: rr, count: Math.round((rr / 100) * pv) };
      });
    };
    var pvA = n(31), pvB = n(20), pvC = n(17);
    var R = [
      { page: '/app-merge', visitors: pvA, sections: shape([
        { name: 'Hero', reach: 100 }, { name: 'Problem', reach: 86 }, { name: 'Research', reach: 71 },
        { name: 'Merge rules', reach: 41 }, { name: 'Testing', reach: 34 }, { name: 'Outcome', reach: 29 }], pvA) },
      { page: '/rise-portal', visitors: pvB, sections: shape([
        { name: 'Hero', reach: 100 }, { name: 'Context', reach: 82 }, { name: 'System', reach: 66 },
        { name: 'Rollout', reach: 52 }, { name: 'Outcome', reach: 44 }], pvB) },
      { page: '/about', visitors: pvC, sections: shape([
        { name: 'Intro', reach: 100 }, { name: 'How I work', reach: 74 },
        { name: 'Background', reach: 61 }, { name: 'Contact', reach: 55 }], pvC) }
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
        pageviews: { v: vis * 3 + n(40), prev: n(220) },
        passedHero: { v: Math.round(vis * 0.68), prev: n(44) },
        contacts: { v: Math.round(vis * 0.11), prev: n(9) }
      },
      retention: R,
      payoff: { deep: { n: n(24), resume: n(11), contact: n(4) }, shallow: { n: n(39), resume: n(3), contact: n(1) } },
      sources: [
        { label: 'linkedin.com', visitors: n(96) }, { label: 'direct', visitors: n(74) },
        { label: 'google.com', visitors: n(41) }, { label: 'read.cv', visitors: n(23) },
        { label: 'x.com', visitors: n(11) }
      ],
      devices: [
        { device: 'laptop', visitors: n(35), sectionsReached: n(290), scrollDepthEvents: n(157) },
        { device: 'mobile', visitors: n(27), sectionsReached: n(66), scrollDepthEvents: n(42) },
        { device: 'desktop', visitors: n(4), sectionsReached: n(8), scrollDepthEvents: n(10) }
      ],
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
    // Before anything renders. If the guard above ever fails open, this is
    // what stops an invented number being read as a real one.
    document.body.classList.add('demo');
    render(demo(state.range, state.filters));
    set('meta.footer', 'SAMPLE DATA — api/stats.js not reachable from this host. Filtering is live; the numbers are synthetic.');
  }

  boot();

}());
