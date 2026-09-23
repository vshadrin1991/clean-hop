// The secret long-hold jump (v9.4). Four runs, with real key events:
//   A  hold 10 s before the goal: the aim arms, the meadow appears on release
//      exactly where the aim pointed, the hero lands on it, and the card calls
//      it a secret - no record saved
//   B  hold 9 s: nothing special - an ordinary jump, no meadow
//   C  arm, then the window loses focus: disarmed, and the late key-up does
//      nothing
//   D  after the energy goal: the secret still works, and it is a real win
//   python3 tools/run-scenario.py tools/scenarios/egg.js
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
/* the hold itself is real; only the clock is wound forward to just short of
   the mark, then the game's own frames carry it over */
async function holdFor(seconds) {
  down();
  await sleep(150);
  t.chargeT = seconds - 0.15;
  await sleep(400);
}

for (let i = 0; i < 60 && !t.spritesReady; i++) await sleep(100);
await sleep(300);

/* ---- A: the secret, before the goal ---------------------------------- */
$('playBtn').click();
await until(standing, 3000);
const bestBefore = $('best').textContent;        // the HUD record at score 0
await holdFor(10);
out.A = { armed: t.eggArmed, meadowBefore: !!t.finishStone };
if (t.eggArmed !== true) fails.push('A: not armed after 10 s of holding');
if (t.finishStone) fails.push('A: the meadow appeared before the release');
const promised = t.eggTarget ? t.eggTarget() : null;
up();
await sleep(100);
const f = t.finishStone;
if (!f) fails.push('A: no meadow after the release');
if (!t.eggsFound || !t.eggsFound['secret-jump'])
  fails.push('A: the secret jump was not noted as found');
else if (promised && Math.abs(f.x - promised.x) > 1)
  fails.push('A: meadow at ' + Math.round(f.x) + ', the aim pointed at ' + Math.round(promised.x));
const reached = await until(() => t.won, 4000);
out.A.flight = { won: t.won, phase: t.phase, lastFall: t.lastFall };
if (!reached) fails.push('A: never reached the meadow (' + JSON.stringify(out.A.flight) + ')');
else if (t.hop.onStone !== f) fails.push('A: won, but not standing on the meadow');
await until(() => t.mode === 'over', 6000);
out.A.title = $('overTitle').textContent;
out.A.best = $('finalBest').textContent;
if (out.A.title !== 'Секретный прыжок!') fails.push('A: card title "' + out.A.title + '"');
if (!$('newbest').classList.contains('hidden')) fails.push('A: a secret finish set a record');
if (out.A.best !== bestBefore)
  fails.push('A: record went from ' + bestBefore + ' to ' + out.A.best + ' on a secret finish');

/* ---- B: 9 s is just an ordinary jump --------------------------------- */
$('againBtn').click();
await until(standing, 3000);
await holdFor(9);
out.B = { armed: t.eggArmed };
if (t.eggArmed) fails.push('B: armed after only 9 s');
up();
await sleep(80);
out.B.phase = t.phase;
if (t.phase !== 'air') fails.push('B: no ordinary jump on release');
if (t.finishStone) fails.push('B: an ordinary jump made the meadow appear');
await until(() => t.phase !== 'air', 3000);

/* ---- C: losing focus disarms ----------------------------------------- */
if (!standing()) { t.startGame(); await until(standing, 4000); }
await holdFor(10);
if (t.eggArmed !== true) fails.push('C: not armed');
window.dispatchEvent(new Event('blur'));
await sleep(100);
out.C = { armed: t.eggArmed, phase: t.phase };
if (t.eggArmed || t.phase !== 'stand') fails.push('C: losing focus did not disarm');
up();                                            // the key comes back up late
await sleep(200);
if (t.phase !== 'stand') fails.push('C: the late key-up still jumped');
if (t.finishStone) fails.push('C: the meadow appeared without a jump');

/* ---- D: after the goal it is a real win ------------------------------ */
t.startGame();
await until(standing, 4000);
t.energy = t.LVL.target;                         // the bar is full
await sleep(200);
await holdFor(10);
up();
const reachedD = await until(() => t.won, 4000);
await until(() => t.mode === 'over', 6000);
out.D = { won: reachedD, title: $('overTitle').textContent };
if (!reachedD) fails.push('D: never reached the meadow');
if (out.D.title !== 'Энергия сбережена!') fails.push('D: card title "' + out.D.title + '"');

({ ...out, fails, pass: fails.length === 0 })
