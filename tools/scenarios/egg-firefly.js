// B3 «Светлячок»: the fifth spark of a run wakes a friend (v9.6).
//   A  sparks four: nothing yet
//   B  the fifth spark mid-jump: the firefly wakes and follows
//   python3 tools/run-scenario.py tools/scenarios/egg-firefly.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
async function until(fn, ms) {
  for (let i = 0; i < ms / 50; i++) { if (fn()) return true; await sleep(50); }
  return fn();
}
const standing = () => t.mode === 'play' && t.phase === 'stand';
const down = () => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ' }));
const up = () => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ' }));

for (let i = 0; i < 60 && !t.spritesReady; i++) await sleep(100);
t.startGame();
await until(standing, 4000);

/* ---- A: four sparks is still just sparks -------------------------------- */
t.leaves = 4;
out.A = { leaves: t.leaves, firefly: t.firefly && t.firefly.on };
if (t.firefly && t.firefly.on) fails.push('A: the firefly woke early');

/* ---- B: the fifth spark, mid-jump --------------------------------------- */
t.spawnItemOnHero();                               // parked on the hero already...
down(); await sleep(250); up();                    // ...caught the moment we hop
await sleep(60);
for (let i = 0; i < 25 && !(t.firefly && t.firefly.on); i++) {
  t.spawnItemOnHero();                             // one drifts into the hero
  await sleep(60);
}
out.B = { leaves: t.leaves, firefly: t.firefly && t.firefly.on,
          found: !!(t.eggsFound && t.eggsFound.firefly) };
if (!out.B.firefly) fails.push('B: the fifth spark never woke the friend');
if (!out.B.found) fails.push('B: the egg was not noted');
if (t.leaves < 5) fails.push('B: only ' + t.leaves + ' sparks counted');

({ ...out, fails, pass: fails.length === 0 })
