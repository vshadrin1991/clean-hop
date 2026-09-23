// B1 «Спящий режим»: 40 s idle and the hero nods off (v9.5).
//   python3 tools/run-scenario.py tools/scenarios/egg-sleep.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
const $ = id => document.getElementById(id);
const down = () => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ' }));
const up = () => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ' }));
async function until(fn, ms) {
  for (let i = 0; i < ms / 50; i++) { if (fn()) return true; await sleep(50); }
  return fn();
}
const standing = () => t.mode === 'play' && t.phase === 'stand';
const said = () => t.pops.map(p => p.t);

$('playBtn').click();
await until(standing, 3000);

/* ---- A: 40 s of standing still - asleep ------------------------------- */
t.idleT = 40;
await sleep(400);
out.A = { sleep: t.hop.sleep, said: said(), found: !!t.eggsFound.sleep };
if (!(t.hop.sleep > 0)) fails.push('A: not asleep after 40 s');
if (!out.A.found) fails.push('A: egg not found');
if (!out.A.said.includes('СПЯЩИЙ РЕЖИМ')) fails.push('A: no sleep label');

/* ---- B: asleep it stays quiet, only z-z-z ----------------------------- */
await sleep(2500);
out.B = { said: said() };
if (out.B.said.includes('Мяу!')) fails.push('B: meowed in its sleep');
if (!out.B.said.includes('z')) fails.push('B: no z letters');

/* ---- C: pausing keeps it asleep --------------------------------------- */
$('pauseBtn').click();
await sleep(300);
$('resumeBtn').click();
await sleep(100);
if (!(t.hop.sleep > 0)) fails.push('C: pause woke it');

/* ---- D: the first press only wakes - no charge, no jump --------------- */
down();
await sleep(80);
out.D = { sleep: t.hop.sleep, phase: t.phase, said: said() };
if (t.hop.sleep) fails.push('D: press did not wake');
if (t.phase !== 'stand') fails.push('D: the waking press started a ' + t.phase);
if (!out.D.said.includes('ОЙ! Я НЕ СПЛЮ!')) fails.push('D: no wake-up line');
up();
await sleep(80);
if (t.phase !== 'stand') fails.push('D: the waking release jumped');

/* ---- E: the next press charges and jumps as usual --------------------- */
down();
await sleep(150);
out.E = { phase: t.phase };
if (t.phase !== 'charge') fails.push('E: second press did not charge');
up();
await sleep(80);
if (t.phase !== 'air') fails.push('E: second release did not jump');

({ ...out, fails, pass: fails.length === 0 })
