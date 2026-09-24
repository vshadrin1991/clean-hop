// Sun sparks float up and down in play (v9.8).
//   A  every spark the level lays out has its own float: 0.34-0.44 KW each
//      way, 1.6-2.4 rad/s
//   B  over one slow period a spark really travels about 2 x amp, centred
//      on its resting place
//   D  the spark is drawn where sparkY() says, not at its resting place
//   R  reduced motion: sparks hold still
//   C  (Task 2) a spark is caught where it is drawn, and its +3 shows there
//   G  (Task 2) no catch at the empty resting place
//   python3 tools/run-scenario.py tools/scenarios/spark-float.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const frame = () => new Promise(r => requestAnimationFrame(r));
const t = __t;
const fails = [], out = {};
async function until(fn, ms) {
  for (let i = 0; i < ms / 50; i++) { if (fn()) return true; await sleep(50); }
  return fn();
}
const standing = () => t.mode === 'play' && t.phase === 'stand';

for (let i = 0; i < 60 && !t.spritesReady; i++) await sleep(100);
t.REDUCED = false;
/* the level puts a spark on 45% of gaps: restart until one is laid out */
let sparks = [];
for (let k = 0; k < 6 && !sparks.length; k++) {
  t.startGame();
  await until(standing, 4000);
  sparks = t.items.filter(o => o.kind === 'spark' && !o.taken);
}
if (!sparks.length) fails.push('setup: no spark on the level after 6 starts');

/* ---- A: each spark has its own float ------------------------------------ */
out.A = sparks.map(o => ({ amp: o.amp, sp: o.sp }));
for (const o of sparks) {
  if (!(o.amp >= 0.34 && o.amp <= 0.44))
    fails.push('A: float ' + o.amp + ' KW each way (want 0.34-0.44)');
  if (!(o.sp >= 1.6 && o.sp <= 2.4))
    fails.push('A: speed ' + o.sp + ' rad/s (want 1.6-2.4)');
}

/* ---- B: it really travels, around its resting place --------------------- */
if (sparks.length) {
  const o = sparks[0];
  let lo = Infinity, hi = -Infinity;
  const t0 = performance.now();
  while (performance.now() - t0 < 4000) {      // the slowest period is 3.9 s
    const y = t.sparkY(o);
    lo = Math.min(lo, y); hi = Math.max(hi, y);
    await frame();
  }
  const travel = (hi - lo) / t.KW, mid = ((hi + lo) / 2 - o.y) / t.KW;
  out.B = { travelKW: +travel.toFixed(2), wantKW: +(2 * o.amp).toFixed(2),
            midKW: +mid.toFixed(2) };
  if (!(travel >= 2 * o.amp * 0.9))
    fails.push('B: the spark travels only ' + out.B.travelKW + ' KW (want ' +
               out.B.wantKW + ')');
  if (!(Math.abs(mid) < 0.05))
    fails.push('B: the float is not centred on the resting place (' + out.B.midKW + ' KW)');
}

/* ---- D: drawn where sparkY() says --------------------------------------- */
/* a test spark frozen at the bottom of a big float (sp 0, sin(PI/2) = 1),
   parked on screen ahead of the hero; its radius marks its drawSpark calls */
const probe = { x: t.hop.x + t.KW * 2, y: t.hop.y - t.KW * 3, r: t.KW * 0.3,
                amp: 0.5, sp: 0, ph: Math.PI / 2, taken: false, kind: 'spark' };
t.items.push(probe);
t.spySparks(true);
await frame(); await frame(); await frame();
const calls = (t.spySparks(false) || []).filter(c => Math.abs(c.r - probe.r) < 1e-6);
const wantY = probe.y + 0.5 * t.KW;
out.D = { calls: calls.length,
          offPx: calls.length ? +(calls[0].y - wantY).toFixed(2) : null };
if (!calls.length) fails.push('D: the test spark was never drawn');
else if (calls.some(c => Math.abs(c.y - wantY) > 0.5))
  fails.push('D: the spark is drawn ' + out.D.offPx + ' px from where sparkY() puts it');
probe.taken = true;                                // out of the way

/* ---- R: reduced motion holds every spark still -------------------------- */
if (sparks.length) {
  t.REDUCED = true;
  const o = sparks[0], ys = [];
  for (let i = 0; i < 8; i++) { ys.push(t.sparkY(o)); await sleep(100); }
  t.REDUCED = false;
  out.R = { moved: +(Math.max(...ys) - Math.min(...ys)).toFixed(2), off: ys[0] - o.y };
  if (ys.some(y => y !== o.y)) fails.push('R: sparks float under reduced motion');
}

/* The next two parts pin a test spark to the hero every frame of one jump.
   It is frozen (sp 0) 2 KW away from its resting place, far outside the
   catch reach (the spark's r + 0.42 KW, here about 0.72 KW). */
const down = () => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ' }));
const up = () => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ' }));
const reach = () => t.hop.y - t.KW * 0.62;         // the centre of the hero's catch
async function jumpWith(o, place) {
  t.items.push(o);
  place(o);
  down(); await sleep(250); up();
  const tEnd = performance.now() + 2000;
  while (!o.taken && performance.now() < tEnd && t.mode === 'play') {
    place(o);
    await frame();
    if (t.phase === 'stand' && performance.now() > tEnd - 1500) break;  // landed
  }
}

/* ---- C: caught where it is drawn, and the +3 shows there ---------------- */
t.startGame();
await until(standing, 4000);
const seen = { x: 0, y: 0, r: t.KW * 0.3, amp: 2, sp: 0, ph: Math.PI / 2,
               taken: false, kind: 'spark' };      // drawn 2 KW below its rest
let drawnY = 0;
await jumpWith(seen, o => {
  o.x = t.hop.x;
  o.y = reach() - 2 * t.KW;                        // rest 2 KW above the hero...
  drawnY = reach();                                // ...drawn right on it
});
const pop = t.pops.filter(p => p.t === 'ИСКОРКА +3').pop();
out.C = { taken: seen.taken,
          popOffKW: pop ? +((pop.y - (drawnY - 8)) / t.KW).toFixed(2) : null };
if (!seen.taken) fails.push('C: a spark drawn right on the hero was not caught');
else if (!pop) fails.push('C: no ИСКОРКА +3 popup');
else if (Math.abs(pop.y - (drawnY - 8)) > t.KW)
  fails.push('C: the +3 shows ' + out.C.popOffKW + ' KW from the drawn spark');
seen.taken = true;

/* ---- G: no catch at the empty resting place ----------------------------- */
t.startGame();
await until(standing, 4000);
const ghost = { x: 0, y: 0, r: t.KW * 0.3, amp: 2, sp: 0, ph: -Math.PI / 2,
                taken: false, kind: 'spark' };     // drawn 2 KW above its rest
await jumpWith(ghost, o => {
  o.x = t.hop.x;
  o.y = reach();                                   // rest right on the hero
});
out.G = { taken: ghost.taken };
if (ghost.taken) fails.push('G: caught through its empty resting place');
ghost.taken = true;

({ ...out, fails, pass: fails.length === 0 })
