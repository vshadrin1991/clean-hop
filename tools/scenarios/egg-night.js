// Night egg polish (v9.7): the moon in the sun's corner, the sparks over
// the islands.
//   R  reduced motion: the moon is simply there, in its final place
//   H  three taps on the sky's sun (the real hit test) start the night
//   M  the crescent rises into the upper right, clear of the HUD and of the
//      night's line, and the sun is fully gone
//   E  a tap on the moon brings the morning, like any tap
//   S  when the lights go out, sun sparks come out over the islands on
//      screen, left to right, and bob up and down in place
//   SR reduced motion: the sparks come out but hold still
//   SE the real Earth Hour opens the menu with its sparks
//   SP play is always day: no night sparks there
//   python3 tools/run-scenario.py tools/scenarios/egg-night.js --size 1280x720
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
async function until(fn, ms) {
  for (let i = 0; i < ms / 50; i++) { if (fn()) return true; await sleep(50); }
  return fn();
}
const cv = document.querySelector('canvas');
const tap = (x, y) => cv.dispatchEvent(new PointerEvent('pointerdown',
  { clientX: x, clientY: y, bubbles: true, cancelable: true }));
const dayAgain = async () => { t.nightStop(); return until(() => t.night < 0.02, 4000); };
/* the moon's gap to an element's box, negative when they overlap */
const gap = (c, el) => {
  const r = el.getBoundingClientRect();
  const dx = Math.max(r.left - c.x, 0, c.x - r.right);
  const dy = Math.max(r.top - c.y, 0, c.y - r.bottom);
  return Math.hypot(dx, dy) - c.r;
};

for (let i = 0; i < 60 && !t.spritesReady; i++) await sleep(100);
if (t.mode !== 'menu') fails.push('setup: not on the menu');

/* ---- R: reduced motion - no rise, the moon is simply there -------------- */
t.REDUCED = true;
t.sunTap(); t.sunTap(); t.sunTap();
await until(() => t.night > 0.99, 2000);
const mr = t.moonPos();
out.R = { y: Math.round(mr.y), a: +mr.a.toFixed(2) };
if (Math.abs(mr.y - t.VH * 0.18) > 1)
  fails.push('R: the moon is still rising under reduced motion (y ' + out.R.y + ')');
if (mr.a < 0.95) fails.push('R: the moon is not up at once (a ' + out.R.a + ')');
await dayAgain();
t.REDUCED = false;

/* ---- H: the sky's sun, tapped three times, brings the night ------------- */
const s0 = t.sunPos();
tap(s0.x, s0.y); tap(s0.x, s0.y); tap(s0.x, s0.y);
out.H = { seq: t.nightSeq };
if (t.nightSeq !== 1) fails.push('H: three taps on the sky sun did not start the night');

/* ---- M: the crescent in the upper right --------------------------------- */
await until(() => t.nightT > 1.0, 3000);
const m0 = t.moonPos();
const early = (t.nightSparks || []).map(p => t.nightSparkPos(p).a);
await until(() => t.nightT > 2.6, 4000);
const m = t.moonPos(), s = t.sunPos();
out.M = { x: Math.round(m.x), y: Math.round(m.y), r: Math.round(m.r),
          a: +m.a.toFixed(2), rose: Math.round(m0.y - m.y), sunA: +s.a.toFixed(2) };
if (m.x < t.VW * 0.6) fails.push('M: the moon is not on the right (x ' + out.M.x + ' of ' + t.VW + ')');
if (m.y > t.VH * 0.25) fails.push('M: the moon is not up high (y ' + out.M.y + ' of ' + t.VH + ')');
if (m.a < 0.95) fails.push('M: the moon never came fully out (a ' + out.M.a + ')');
if (out.M.rose < t.VH * 0.04) fails.push('M: the moon did not rise (' + out.M.rose + ' px)');
if (s.a > 0.01) fails.push('M: the sun still shows at night (a ' + out.M.sunA + ')');
for (const el of document.querySelectorAll('.hud .pill, .meter-wrap, #mute, #pauseBtn')) {
  if (!el.offsetParent) continue;                      // hidden in the menu
  const g = gap(m, el);
  if (g < 4) fails.push('M: the moon touches ' + (el.id || el.className) +
                        ' (gap ' + Math.round(g) + ' px)');
}
/* the night's line is centred at VH*0.10 with a VH*0.034 font */
if (m.y - m.r < t.VH * (0.10 + 0.034 * 0.6))
  fails.push('M: the moon reaches into the night\'s line');

/* ---- S: sparks of saved energy bob over the islands --------------------- */
const sparks = t.nightSparks || [];
out.S = { n: sparks.length };
if (sparks.length < 2) fails.push('S: only ' + sparks.length + ' sparks at night');
if (early.some(a => a > 0)) fails.push('S: sparks out before the lights went off');
for (let i = 1; i < sparks.length; i++)
  if (sparks[i].at < sparks[i - 1].at ||
      t.nightSparkPos(sparks[i]).x < t.nightSparkPos(sparks[i - 1]).x - 1) {
    fails.push('S: the sparks do not come out left to right'); break;
  }
const last = sparks.reduce((a, p) => Math.max(a, p.at), 0);
await until(() => t.nightT > last + 0.6, 6000);
const tr = sparks.map(() => ({ xs: [], ys: [], a: 1 }));
const t0 = performance.now();
while (performance.now() - t0 < 4200) {          // longer than the slowest bob
  sparks.forEach((p, i) => {
    const q = t.nightSparkPos(p);
    tr[i].xs.push(q.x); tr[i].ys.push(q.y); tr[i].a = Math.min(tr[i].a, q.a);
  });
  await new Promise(r => requestAnimationFrame(r));
}
const half = t.VW / (2 * t.Z), heroTop = t.hop.y - t.B, glowR = t.B * 0.225 * 1.28;
let minRise = Infinity;
tr.forEach((q, i) => {
  const p = sparks[i];
  const rise = Math.max(...q.ys) - Math.min(...q.ys);
  const drift = Math.max(...q.xs) - Math.min(...q.xs);
  minRise = Math.min(minRise, rise);
  if (rise < t.KW * 0.3) fails.push('S' + i + ': moves only ' + Math.round(rise) + ' px up and down');
  if (drift > 1) fails.push('S' + i + ': drifts sideways ' + Math.round(drift) + ' px');
  if (q.a < 0.95) fails.push('S' + i + ': not fully out (a ' + q.a.toFixed(2) + ')');
  if (Math.abs(q.xs[0] - t.VW / 2) > half) fails.push('S' + i + ': off screen at x ' + Math.round(q.xs[0]));
  if (Math.max(...q.ys) > t.stoneTop(p.s) - t.KW) fails.push('S' + i + ': sinks into its island');
  if (Math.abs(p.s.x + p.off - t.hop.x) < t.B && Math.max(...q.ys) + glowR > heroTop)
    fails.push('S' + i + ': covers the hero');
});
out.S.minRiseKW = +(minRise / t.KW).toFixed(2);
/* a resize mid-night (layout() shifts the islands) keeps each on its island */
dispatchEvent(new Event('resize'));
await sleep(100);
sparks.forEach((p, i) => {
  if (!t.stones.includes(p.s)) fails.push('S' + i + ': its island is gone after a resize');
  else if (t.nightSparkPos(p).y > t.stoneTop(p.s) - t.KW)
    fails.push('S' + i + ': left its island after a resize');
});

/* ---- E: a tap on the moon brings the morning, like any tap -------------- */
tap(m.x, m.y);
out.E = { seq: t.nightSeq };
if (t.nightSeq !== 0) fails.push('E: tapping the moon did not end the night');
const morning = await until(() => t.night < 0.001, 4000);
if (!morning) fails.push('E: the night never lifted');
if (t.moonPos().a > 0.01) fails.push('E: the moon stayed out in the morning');

/* ---- S-end: the sparks go with the night -------------------------------- */
if ((t.nightSparks || []).some(p => t.nightSparkPos(p).a > 0.01))
  fails.push('S-end: sparks still glow in the morning');

/* ---- SR: reduced motion - the sparks come out but hold still ------------ */
t.REDUCED = true;
t.sunTap(); t.sunTap(); t.sunTap();
const lastR = (t.nightSparks || []).reduce((a, p) => Math.max(a, p.at), 0);
await until(() => t.nightT > lastR + 0.1, 6000);
const still = (t.nightSparks || []).map(p => ({ p, ys: [] }));
const t1 = performance.now();
while (performance.now() - t1 < 1500) {
  still.forEach(o => o.ys.push(t.nightSparkPos(o.p).y));
  await new Promise(r => requestAnimationFrame(r));
}
still.forEach((o, i) => {
  const mv = Math.max(...o.ys) - Math.min(...o.ys);   // the island's own ±2.5 px
  if (mv > 6) fails.push('SR' + i + ': moves ' + Math.round(mv) + ' px under reduced motion');
  if (t.nightSparkPos(o.p).a < 0.95) fails.push('SR' + i + ': not out under reduced motion');
});
await dayAgain();
t.REDUCED = false;

/* ---- SE: the real Earth Hour opens the menu with its sparks ------------- */
t.clock = new Date(2026, 2, 28, 20, 45).getTime();     // last Saturday of March
t.eggsAtMenu();
out.SE = { seq: t.nightSeq, n: (t.nightSparks || []).length };
if (t.nightSeq !== 1 || out.SE.n < 2)
  fails.push('SE: the real Earth Hour night has ' + out.SE.n + ' sparks');
t.nightStop();
t.clock = new Date(2026, 8, 23, 12, 0).getTime();      // back to the test noon

/* ---- SP: play is always day - no sparks there --------------------------- */
t.startGame();
await sleep(200);
out.SP = { n: (t.nightSparks || []).length, mode: t.mode };
if (out.SP.n !== 0) fails.push('SP: ' + out.SP.n + ' night sparks carried into play');

({ ...out, fails, pass: fails.length === 0 })
