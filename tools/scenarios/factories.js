// Factory overlay checks (plan §Tasks 1-5):
//   1. no FMETA entry still carries a flare
//   2. pane counts per factory (stack includes the annex-shed window)
//   3. driving clean 0 -> 1 never raises the lit-factory count; it ends at 0
//   4. the double blink must replay on a SECOND run (M3: blinked is reset)
//   python3 tools/run-scenario.py tools/scenarios/factories.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [];

for (let i = 0; i < 60 && !t.spritesReady; i++) await sleep(100);

const FM = t.FMETA || {};
for (const k of Object.keys(FM))
  if ('flare' in FM[k]) fails.push('flare still on ' + k);
const COUNT = { plant: 12, works: 5, stack: 5, towers: 2, tanks: 2 };
const paneN = {};
for (const k of Object.keys(FM)) {
  paneN[k] = (FM[k].panes || []).length;
  if (paneN[k] !== COUNT[k]) fails.push(`${k}: ${paneN[k]} panes, want ${COUNT[k]}`);
}

document.getElementById('playBtn').click();
await sleep(400);

/* 3: lights only ever go OUT as clean rises */
let prev = Infinity, monotonic = true;
for (let c = 0; c <= 1.001; c += 0.05) {
  t.clean = c;
  await sleep(600);
  const lit = t.factories.filter(f => f.lightOn > 0.5).length;
  if (lit > prev) monotonic = false;
  prev = lit;
}
await sleep(1400);                            // let the last fade finish
prev = t.factories.filter(f => f.lightOn > 0.5).length;
if (prev !== 0) fails.push('lights still on at clean=1: ' + prev);
if (!monotonic) fails.push('lit count rose while cleaning');

/* 4: second run - the blink must replay (reset() clears blinked) */
t.startGame();
await sleep(300);
t.clean = 0;
await sleep(400);
const f0 = t.factories.slice().sort((a, b) => a.offAt - b.offAt)[0];
t.clean = Math.min(1, f0.offAt + 0.02);
let dipped = false, rose = false;
for (let i = 0; i < 10; i++) {
  await sleep(50);
  if (f0.lightOn < 0.2) dipped = true;
  if (dipped && f0.lightOn > 0.8) rose = true;
}
if (!dipped || !rose)
  fails.push(`no blink in run 2 (dipped ${dipped}, rose ${rose})`);

({ paneN, monotonic, dipped, rose, fails, pass: fails.length === 0 })
