// B3 «Светлячок» glows all around (v9.8).
//   W  the firefly is awake in play
//   P  its glow: on between flashes, full and wider in a flash; under
//      reduced motion it does not breathe
//   D  every frame it lights the air all around its body and keeps a small
//      ember in its tail - between flashes too - and the flashes still come
//   python3 tools/run-scenario.py tools/scenarios/firefly-glow.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
async function until(fn, ms) {
  for (let i = 0; i < ms / 50; i++) { if (fn()) return true; await sleep(50); }
  return fn();
}
const standing = () => t.mode === 'play' && t.phase === 'stand';

for (let i = 0; i < 60 && !t.spritesReady; i++) await sleep(100);
t.REDUCED = false;
t.startGame();
await until(standing, 4000);
const KW = t.KW;

/* ---- W: wake it --------------------------------------------------------- */
t.fireflyWake();
out.W = { on: !!(t.firefly && t.firefly.on) };
if (!out.W.on) fails.push('W: the firefly did not wake');

/* ---- P: the glow itself ------------------------------------------------- */
const a0 = t.fireflyAura(0, 0), a1 = t.fireflyAura(1, 0);
if (!a0 || !a1) fails.push('P: there is no fireflyAura()');
else {
  out.P = { dimA: +a0.a.toFixed(2), flashA: +a1.a.toFixed(2),
            dimRKW: +(a0.r / KW).toFixed(2), flashRKW: +(a1.r / KW).toFixed(2) };
  if (a0.a < 0.3) fails.push('P: between flashes the glow is only ' + out.P.dimA);
  if (a1.a < 0.99) fails.push('P: a flash does not light it fully (' + out.P.flashA + ')');
  if (a0.r < KW * 0.5) fails.push('P: the glow reaches only ' + out.P.dimRKW + ' KW');
  if (a1.r < a0.r * 1.4) fails.push('P: a flash does not widen the glow');
}
t.REDUCED = true;
const q1 = t.fireflyAura(0, 0.3), q2 = t.fireflyAura(0, 1.1);
t.REDUCED = false;
if (!q1 || !q2 || q1.a !== q2.a) fails.push('P: the glow breathes under reduced motion');

/* ---- D: what is drawn, frame by frame ----------------------------------- */
await sleep(1500);                                 // it catches up with the hero
t.spyFirefly(true);
await sleep(6000);                                 // two or more flash cycles
const calls = t.spyFirefly(false) || [];
const frames = new Map();                          // one render per game time T
for (const c of calls) {
  if (!frames.has(c.T)) frames.set(c.T, []);
  frames.get(c.T).push(c);
}
let n = 0, dark = 0, flash = 0, noAura = 0, noEmber = 0;
for (const cs of frames.values()) {
  n++;
  if (cs[0].lit === 0) dark++;
  if (cs[0].lit > 0.5) flash++;
  const onBody = c => Math.hypot(c.x - c.bx, c.y - c.by);
  if (!cs.some(c => onBody(c) < 0.5 && c.r >= KW * 0.5)) noAura++;
  if (!cs.some(c => c.r <= KW * 0.13 && onBody(c) < KW * 0.3)) noEmber++;
}
out.D = { frames: n, dark, flash, noAura, noEmber };
if (n < 100) fails.push('D: only ' + n + ' frames with any firefly light in 6 s');
if (!dark) fails.push('D: between flashes it gives no light at all');
if (!flash) fails.push('D: no flash in 6 s - the flashes must still come');
if (noAura) fails.push('D: ' + noAura + ' frames without the glow around its body');
if (noEmber) fails.push('D: ' + noEmber + ' frames without the ember in its tail');

({ ...out, fails, pass: fails.length === 0 })
