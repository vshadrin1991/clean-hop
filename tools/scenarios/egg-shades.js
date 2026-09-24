// B2 «Крутые очки»: a run of bullseye landings earns shades (v9.6).
//   A  an off-centre landing starts no streak
//   B  four bullseyes in a row on the default road: КРУТО! + shades + the egg
//   C  a sloppy landing breaks the count
//   python3 tools/run-scenario.py tools/scenarios/egg-shades.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
async function until(fn, ms) {
  for (let i = 0; i < ms / 50; i++) { if (fn()) return true; await sleep(50); }
  return fn();
}
const standing = () => t.mode === 'play' && t.phase === 'stand';
/* any live island will do - a gadget only changes where the hero settles,
   the accuracy is measured before that */
const nextStone = () => t.stones.find(s => !s.visited && !s.dead &&
                                          s.type !== 'finish');
async function landOn(s, off) {
  t.hop.x = s.x + off;
  t.land(s, t.stoneTop(s));
  await sleep(450);                                // the camera follows; the road grows
}

for (let i = 0; i < 60 && !t.spritesReady; i++) await sleep(100);
t.startGame();
await until(standing, 4000);

/* ---- A: a sloppy landing counts for nothing ----------------------------- */
let s = nextStone();
if (!s) fails.push('A: no free island to land on');
else {
  await landOn(s, s.w * 0.45);
  out.A = { streak: t.bullseyes, shades: t.shadesOn };
  if (t.bullseyes !== 0) fails.push('A: a rim landing counted as a bullseye');
}

/* ---- B: four bullseyes in a row ----------------------------------------- */
for (let i = 0; i < 4; i++) {
  s = nextStone();
  if (!s) { fails.push('B: ran out of islands at streak ' + i); break; }
  await landOn(s, 0);
}
out.B = { streak: t.bullseyes, shades: t.shadesOn,
          found: !!(t.eggsFound && t.eggsFound.shades),
          wear: t.heroWear(true) };
if (t.bullseyes !== 4) fails.push('B: streak is ' + t.bullseyes + ', expected 4');
if (!t.shadesOn) fails.push('B: no shades after four bullseyes');
if (!out.B.found) fails.push('B: the egg was not noted');
if (!/shades/.test(out.B.wear || '')) fails.push('B: the hero wears "' + out.B.wear + '"');

/* ---- C: a sloppy landing ends the streak, not the shades ----------------- */
s = nextStone();
if (s) {
  await landOn(s, s.w * 0.45);
  out.C = { streak: t.bullseyes, shades: t.shadesOn };
  if (t.bullseyes !== 0) fails.push('C: the streak survived a rim landing');
  if (!t.shadesOn) fails.push('C: the shades came off mid-run');   // worn all run
}

({ ...out, fails, pass: fails.length === 0 })
