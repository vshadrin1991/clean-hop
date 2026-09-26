// v10 «Голова кружится»: three full-power somersaults landed in a row.
//   python3 tools/run-scenario.py tools/scenarios/egg-dizzy.js
const t = __t, fails = [], out = {};
const wait = ms => new Promise(r => setTimeout(r, ms));
const nextStone = () => t.stones
  .filter(s => !s.visited && s.x > t.hop.x + 1 && s.type !== 'finish')
  .sort((a, b) => a.x - b.x)[0];
const hopTo = async p => {                        // one jump at power p, landed
  t.jumpWith(p);
  const s = nextStone();
  if (s.type === 'crumble') s.type = 'normal';
  t.hop.x = s.x + (s.gadget ? s.gadget.dx * s.w : 0);
  t.hop.vy = t.hop.v0;
  t.land(s, t.stoneTop(s));
  await wait(150);                                // let the road spawn ahead
};
document.getElementById('playBtn').click();
await wait(600);
await hopTo(1); await hopTo(1);
await hopTo(0.5);                                 // a plain hop breaks the streak
await hopTo(1); await hopTo(1);
out.afterBreak = { found: !!t.eggsFound.dizzy, dizzy: t.hop.dizzy || 0 };
if (out.afterBreak.found || out.afterBreak.dizzy > 0) fails.push('a plain hop in between still counted');
await hopTo(1);
out.third = { found: !!t.eggsFound.dizzy, dizzy: +(t.hop.dizzy || 0).toFixed(2) };
if (!out.third.found) fails.push('three flips in a row found nothing');
if (!(t.hop.dizzy > 2.5)) fails.push('no dizzy stars (dizzy ' + t.hop.dizzy + ')');
await wait(3300);
if (t.hop.dizzy > 0) fails.push('the stars never went away: ' + t.hop.dizzy);
({ ...out, fails, pass: fails.length === 0 })
