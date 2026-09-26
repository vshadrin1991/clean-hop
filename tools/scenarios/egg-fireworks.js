// v10 «Салют»: finishing on «Сложный» fires fireworks over the meadow.
//   python3 tools/run-scenario.py tools/scenarios/egg-fireworks.js
const t = __t, fails = [], out = {};
const wait = ms => new Promise(r => setTimeout(r, ms));
async function winAt(dial) {
  t.setDifficulty(dial);
  t.startGame(); await wait(200);
  const f = t.spawnFinish();
  t.hop.x = f.x;
  t.land(f, t.stoneTop(f));
  return { won: t.won, fw: +(t.fireworksT || 0).toFixed(2) };
}
out.medium = await winAt(67);
if (!out.medium.won) fails.push('«Средний»: landing on the meadow did not win');
if (out.medium.fw > 0 || t.eggsFound.fireworks) fails.push('«Средний» fired the fireworks');
out.hard = await winAt(100);
if (!out.hard.won) fails.push('«Сложный»: landing on the meadow did not win');
if (!(out.hard.fw > 2.5)) fails.push('«Сложный»: no fireworks clock (' + out.hard.fw + ')');
if (!t.eggsFound.fireworks) fails.push('«Сложный»: the egg was not noted');
await wait(700);
out.hard.bursts = t.fireworkBursts;
if (!(t.fireworkBursts >= 2)) fails.push('only ' + t.fireworkBursts + ' bursts in 0.7 s');
await wait(2600);
out.hard.after = t.fireworkBursts;
if (t.fireworksT > 0) fails.push('the fireworks never stopped');
if (t.fireworkBursts > 10) fails.push('too many bursts: ' + t.fireworkBursts);
({ ...out, fails, pass: fails.length === 0 })
