// B7 «Утюг!»: the rare forgotten iron (v9.6).
//   A  landing on an island with an iron switches it off like any gadget
//   B  that is the find - counted, toasted, on the card parade
//   python3 tools/run-scenario.py tools/scenarios/egg-iron.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
async function until(fn, ms) {
  for (let i = 0; i < ms / 50; i++) { if (fn()) return true; await sleep(50); }
  return fn();
}
const standing = () => t.mode === 'play' && t.phase === 'stand';

for (let i = 0; i < 60 && !t.spritesReady; i++) await sleep(100);
t.startGame();
await until(standing, 4000);

/* ---- A: put an iron on the next island and land on it ------------------- */
const s = t.stones.find(s => !s.visited && s.type !== 'finish' &&
                             s.type !== 'crumble');
if (!s) fails.push('A: no free island for the iron');
else {
  const G = t.makeIron(s);
  out.A0 = { kind: G && G.kind, on: G && G.on };
  if (!G || G.kind !== 'iron' || !G.on) fails.push('A: makeIron gave ' + JSON.stringify(G));
  t.hop.x = s.x;
  t.land(s, t.stoneTop(s));
  const offed = await until(() => t.offByKind && t.offByKind.iron >= 1, 3000);
  out.A = { off: t.offByKind && t.offByKind.iron, on: G.on };
  if (!offed) fails.push('A: the iron never switched off (' + JSON.stringify(out.A) + ')');

  /* ---- B: the find ------------------------------------------------------- */
  out.B = { found: !!(t.eggsFound && t.eggsFound.iron) };
  if (!out.B.found) fails.push('B: switching the iron off did not find the egg');
}

({ ...out, fails, pass: fails.length === 0 })
