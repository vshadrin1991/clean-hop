// v10 «Водичка чистая!»: a fall into water that is already clean.
//   python3 tools/run-scenario.py tools/scenarios/egg-swim.js
const t = __t, fails = [], out = {};
const wait = ms => new Promise(r => setTimeout(r, ms));
const $ = id => document.getElementById(id);
const nextStone = () => t.stones
  .filter(s => !s.visited && s.x > t.hop.x + 1 && s.type !== 'finish')
  .sort((a, b) => a.x - b.x)[0];
async function fallAt(c) {                        // land once, then drop into the next gap
  t.startGame(); await wait(300);
  t.clean = c; t.cleanShown = c;
  const s = nextStone();
  if (s.type === 'crumble') s.type = 'normal';
  t.hop.x = s.x + (s.gadget ? s.gadget.dx * s.w : 0);
  t.land(s, t.stoneTop(s));
  const n = nextStone();
  t.jumpWith(0.04);
  t.hop.x = (s.x + s.w / 2 + n.x - n.w / 2) / 2;  // over open water
  t.hop.vx = 0; t.hop.vy = 60;
  for (let i = 0; i < 80 && t.phase !== 'fall'; i++) await wait(25);
  const r = { phase: t.phase, swim: !!t.hop.swim };
  for (let i = 0; i < 240 && t.mode !== 'over'; i++) await wait(25);
  r.mode = t.mode; r.title = $('overTitle').textContent;
  return r;
}
out.dirty = await fallAt(0);
if (out.dirty.phase !== 'fall') fails.push('dirty: the hero did not fall (' + out.dirty.phase + ')');
if (out.dirty.swim) fails.push('dirty water counted as a swim');
if (/Водичка чистая/.test(out.dirty.title)) fails.push('dirty: the swim title showed');
if (t.eggsFound.swim) fails.push('dirty: the egg was noted');
out.clean = await fallAt(1);
if (!out.clean.swim) fails.push('clean: the fall was not a swim');
if (out.clean.mode !== 'over') fails.push('clean: no game-over card (' + out.clean.mode + ')');
if (out.clean.title !== 'Буль! Водичка чистая!') fails.push('clean: title "' + out.clean.title + '"');
if (!t.eggsFound.swim) fails.push('clean: the egg was not noted');
({ ...out, fails, pass: fails.length === 0 })
