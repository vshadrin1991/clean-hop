const r = document.getElementById('diffRange');
r.value = '100';
r.dispatchEvent(new Event('input', { bubbles: true }));
document.getElementById('playBtn').click();
await new Promise(r => setTimeout(r, 300));
const t = __t;
const sleep = ms => new Promise(r => setTimeout(r, ms));
// hop one island forward, gadget side if it has one; skip vampires and crumblers
async function step() {
  const n = t.stones.find(s => !s.visited && !s.vamp &&
                               s.type !== 'finish' && s.type !== 'crumble');
  if (!n) return false;
  t.hop.x = n.x + (n.gadget ? n.gadget.dx * n.w : 0);
  t.land(n, t.stoneTop(n));
  await sleep(420);
  return true;
}
// vampires are an early-run hazard: search, restart, search again
let vs = null;
for (let run = 0; run < 5 && !vs; run++) {
  for (let i = 0; i < 26 && t.mode === 'play' && !vs; i++) {
    vs = t.stones.find(s => !s.visited && s.vamp);
    if (!vs && !(await step())) break;
  }
  if (!vs) {
    // close out the run: land on the finish if it's all that's left
    if (t.mode === 'play') {
      const f = t.stones.find(s => !s.visited && s.type === 'finish');
      if (f) { t.hop.x = f.x; t.land(f, t.stoneTop(f)); }
      await sleep(3600);
    }
    if (t.mode === 'over') { document.getElementById('againBtn').click(); await sleep(300); }
  }
}
let safe = null, fell = null, vampPopup = false;
if (vs) {
  // the gadget's half is safe: land there, the vampire should lose heart
  t.hop.x = vs.x + (vs.gadget ? vs.gadget.dx * vs.w : vs.w * 0.28);
  t.land(vs, t.stoneTop(vs));
  await sleep(700);
  safe = { mode: t.mode, gadget: vs.gadget ? vs.gadget.kind : null,
           gadgetOff: vs.gadget ? !vs.gadget.on : null };
  // now land right on the vampire - the check fires even on a visited island
  t.hop.x = vs.x + vs.vampX;
  t.land(vs, t.stoneTop(vs));
  await sleep(400);
  vampPopup = t.pops.some(p => p.t === 'ЭНЕРГОВАМПИР!');
  await sleep(1400);
  fell = { mode: t.mode, phase: t.phase };
}
({ goal: t.LVL.target, found: !!vs, safe, fell, vampPopup,
   pass: !!(vs && safe && safe.mode === 'play' && fell && fell.mode === 'over' &&
            vampPopup) })
