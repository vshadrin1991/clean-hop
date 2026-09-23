// B5 «Бульк-бульк!»: three first-jump falls in a row (v9.5).
//   python3 tools/run-scenario.py tools/scenarios/egg-diver.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
const $ = id => document.getElementById(id);
async function until(fn, ms) {
  for (let i = 0; i < ms / 50; i++) { if (fn()) return true; await sleep(50); }
  return fn();
}
const standing = () => t.mode === 'play' && t.phase === 'stand';
async function newRun(first) {
  $(first ? 'playBtn' : 'againBtn').click();
  await until(standing, 3000);
}
async function fallNow() {
  t.fallIn('sludge');
  await until(() => t.mode === 'over', 3000);
  await sleep(100);
  return { title: $('overTitle').textContent, msg: $('ecoMsg').textContent };
}

/* ---- A: two first-jump falls - still the usual card ------------------- */
await newRun(true);
out.A1 = await fallNow();
await newRun(false);
out.A2 = await fallNow();
if (out.A1.title === 'Бульк-бульк!' || out.A2.title === 'Бульк-бульк!')
  fails.push('A: diver after fewer than three falls');

/* ---- B: the third one is the diver ------------------------------------ */
await newRun(false);
out.B = await fallNow();
if (out.B.title !== 'Бульк-бульк!') fails.push('B: title is "' + out.B.title + '"');
if (!/колечко/.test(out.B.msg)) fails.push('B: message is "' + out.B.msg + '"');
if (!t.eggsFound.diver) fails.push('B: egg not found');

/* ---- C: a run that lands first resets the count ----------------------- */
await newRun(false);
const s = t.stones.find(s => !s.visited && s.type === 'normal' && !s.strip);
t.hop.x = s.x;
t.land(s, t.stoneTop(s));
await sleep(100);
out.C = await fallNow();
if (out.C.title === 'Бульк-бульк!') fails.push('C: diver after landing an island');
await newRun(false);
out.C2 = await fallNow();
if (out.C2.title === 'Бульк-бульк!') fails.push('C: the count did not restart');

({ ...out, fails, pass: fails.length === 0 })
