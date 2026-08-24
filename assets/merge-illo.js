(function () {
  var React = window.React;
  var TOTAL = 9.6;
  var CUES = { Opening: 0, Character: 1.2, Labels: 3.0, Float: 5.4, Outro: 8.2 };

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function easeOutBack(t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function easeInCubic(t) { return t * t * t; }
  function easeInOutSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
  function ramp(T, start, end, ease) { if (end <= start) return T >= end ? 1 : 0; return ease(clamp((T - start) / (end - start), 0, 1)); }

  var MOTION = {
    pop: function (T, s, d) { return ramp(T, s, s + d, easeOutBack); },
    out: function (T, s, d) { return ramp(T, s, s + d, easeInCubic); },
    drift: function (T, period, phase) { return Math.sin((T * Math.PI * 2) / period + (phase || 0)); }
  };

  var CHIP_RANK = [2, 3, 0, 1];

  function useClock(reduced) {
    var st = React.useState(reduced ? CUES.Float + 0.8 : 0);
    var T = st[0], setT = st[1];
    React.useEffect(function () {
      if (reduced) return;
      var t0 = performance.now(), raf = 0, live = true;
      var tick = function () { if (live) setT(((performance.now() - t0) / 1000) % TOTAL); };
      var loop = function () { tick(); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
      var iv = setInterval(tick, 1000 / 30);
      return function () { live = false; cancelAnimationFrame(raf); clearInterval(iv); };
    }, [reduced]);
    return T;
  }

  function useFit(w, h) {
    var ref = React.useRef(null);
    var st = React.useState(1);
    var s = st[0], setS = st[1];
    React.useEffect(function () {
      var el = ref.current;
      if (!el) return;
      var measure = function () {
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        setS(Math.max(0.05, Math.min(r.width / w, r.height / h)));
      };
      measure();
      var ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
      if (ro) ro.observe(el);
      window.addEventListener('resize', measure);
      return function () { if (ro) ro.disconnect(); window.removeEventListener('resize', measure); };
    }, [w, h]);
    return [ref, s];
  }

  function Screen(props) {
    var T = useClock(props.reduced);
    var P = window.ILLO;
    var end = TOTAL;
    var amb = props.reduced ? 0 : 1;
    var chipColor = props.chipColor;

    var floatRamp = clamp(ramp(T, CUES.Float, CUES.Float + 1, easeInOutSine), 0, 1)
      * (1 - clamp(MOTION.out(T, CUES.Outro, 0.5), 0, 1));

    var circleS = Math.max(0, MOTION.pop(T, 0.1, 0.9) * (1 - MOTION.out(T, CUES.Outro + 0.55, end - CUES.Outro - 0.6)));
    var pIn = MOTION.pop(T, CUES.Character, 1.25);
    var personY = 150 * (1 - pIn) + 150 * MOTION.out(T, CUES.Outro + 0.1, 0.9);
    var personRot = amb * floatRamp * 0.8 * MOTION.drift(T, 4.5, 1);

    var ticks = P.ticks.map(function (d, i) {
      var tin = MOTION.pop(T, CUES.Character + 0.55 + i * 0.07, 0.5);
      var tout = clamp(MOTION.out(T, CUES.Outro, 0.35), 0, 1);
      var sc = Math.max(0, tin * (1 - tout));
      var twinkle = 1 - 0.35 * amb * floatRamp * (0.5 + 0.5 * MOTION.drift(T, 2.2, i * 1.3));
      return React.createElement('g', {
        key: i,
        style: { transformBox: 'fill-box', transformOrigin: '50% 50%', transform: 'scale(' + sc + ')', opacity: clamp(tin, 0, 1) * (1 - tout) * twinkle },
        dangerouslySetInnerHTML: { __html: d }
      });
    });

    var chips = P.chips.map(function (h, i) {
      var rank = CHIP_RANK.indexOf(i);
      var cin = MOTION.pop(T, CUES.Labels + rank * 0.32, 0.7);
      var cout = clamp(MOTION.out(T, CUES.Outro + rank * 0.08, 0.45), 0, 1);
      var sc = Math.max(0, cin * (1 - cout));
      var bob = amb * floatRamp * 3 * MOTION.drift(T, 2.6 + i * 0.5, i * 2);
      return React.createElement('g', {
        key: i,
        style: { transformBox: 'fill-box', transformOrigin: '50% 50%', transform: 'translate(0px, ' + bob + 'px) scale(' + sc + ')', opacity: clamp(cin, 0, 1) * (1 - cout) },
        dangerouslySetInnerHTML: { __html: h.split('#4683FC').join(chipColor) }
      });
    });

    var accents = [
      { html: P.arcOrange, start: CUES.Labels + 1.3, fromRot: -70 },
      { html: P.wedgeBlue, start: CUES.Labels + 1.5, fromRot: 60 },
      { html: P.arcPurple, start: CUES.Labels + 1.7, fromRot: -50 }
    ].map(function (a, i) {
      var ain = MOTION.pop(T, a.start, 0.7);
      var aout = clamp(MOTION.out(T, CUES.Outro + 0.1 + i * 0.07, 0.5), 0, 1);
      var rot = a.fromRot * (1 - clamp(ain, 0, 1)) + amb * floatRamp * 7 * MOTION.drift(T, 5 + i, i * 1.7);
      return React.createElement('g', {
        key: i,
        style: { transformBox: 'fill-box', transformOrigin: '50% 50%', transform: 'rotate(' + rot + 'deg) scale(' + Math.max(0, ain * (1 - aout)) + ')', opacity: clamp(ain, 0, 1) * (1 - aout) },
        dangerouslySetInnerHTML: { __html: a.html }
      });
    });

    var zi = ramp(T, CUES.Float - 0.3, CUES.Outro, easeInOutSine);
    var zo = ramp(T, CUES.Outro, end, easeInOutSine);
    var cam = 1 + 0.04 * zi * (1 - zo);

    return React.createElement(React.Fragment, null,
      props.bg ? React.createElement('div', {
        style: { position: 'absolute', left: 0, top: 0, width: '375px', height: '812px' },
        dangerouslySetInnerHTML: { __html: window.HOME_BG || '' }
      }) : null,
      React.createElement('div', { style: props.bg
        ? { position: 'absolute', left: '16px', top: '310px', width: '343px', height: '220px', transform: 'scale(' + cam + ')' }
        : { position: 'absolute', inset: 0, transform: 'scale(' + cam + ')' } },
        React.createElement('svg', {
          viewBox: '0 0 343 220', preserveAspectRatio: 'xMidYMid meet', width: '100%', height: '100%',
          style: { display: 'block', overflow: 'visible' }
        },
          React.createElement('defs', { dangerouslySetInnerHTML: { __html: P.defsInner + P.maskEl } }),
          React.createElement('circle', {
            cx: 171.045, cy: 114.624, r: 85.376, fill: '#DDE8FF',
            style: { transformBox: 'fill-box', transformOrigin: '50% 50%', transform: 'scale(' + circleS + ')' }
          }),
          React.createElement('g', { mask: 'url(#mask0_0_7262)' },
            React.createElement('g', { clipPath: 'url(#clip0_0_7262)' },
              React.createElement('g', {
                style: { transformBox: 'fill-box', transformOrigin: '50% 100%', transform: 'translate(0px, ' + personY + 'px) rotate(' + personRot + 'deg)' },
                dangerouslySetInnerHTML: { __html: P.person }
              }),
              ticks
            )
          ),
          chips,
          accents
        )
      )
    );
  }

  function MergeIllo(props) {
    var bg = (props && props.bg === 'none') ? '' : (typeof window.HOME_BG === 'string' && window.HOME_BG ? '1' : '');
    var fit = useFit(bg ? 375 : 343, bg ? 812 : 220);
    var ref = fit[0], s = fit[1];
    var reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ground = (props && props.ground) || 'var(--tint,#EDF0F6)';
    var chipColor = (props && props.chipColor) || '#4683FC';

    return React.createElement('div', {
      ref: ref,
      role: 'img',
      'aria-label': 'The in-app migration prompt announcing the merge — “Stocks & Mutual Funds now together” — over the Rupeezy home screen, with its illustration animating and a dismiss button still available',
      style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible', background: 'transparent' }
    },
      React.createElement('div', {
        style: { position: 'relative', width: (bg ? 375 : 343) + 'px', height: (bg ? 812 : 220) + 'px', flexShrink: 0, transform: 'scale(' + s + ')', transformOrigin: 'center center', overflow: 'visible' }
      },
        React.createElement(Screen, { reduced: reduced, chipColor: chipColor, bg: bg })
      )
    );
  }

  window.MergeIllo = MergeIllo;
})();
