const r = document.getElementById('diffRange');
r.value = '100';
r.dispatchEvent(new Event('input', { bubbles: true }));
document.getElementById('playBtn').click();
await new Promise(r => setTimeout(r, 300));
const t = __t;
const sleep = ms => new Promise(r => setTimeout(r, ms));
// hop one island forward, gadget side if it has one; skip strips and crumblers
async function step() {
  const n = t.stones.find(s => !s.visited && !s.strip &&
                               s.type !== 'finish' && s.type !== 'crumble');
  if (!n) return false;
  t.hop.x = n.x + (n.gadget ? n.gadget.dx * n.w : 0);
  t.land(n, t.stoneTop(n));
  await sleep(420);
  return true;
}
// every hazard island must carry a gadget for the strip to power
let lonely = 0, seen = 0, hintShown = false;
for (let run = 0; run < 3; run++) {
  for (let i = 0; i < 30 && t.mode === 'play'; i++) {
    if (t.stripHint) hintShown = true;
    t.stones.forEach(s => { if (s.strip && !s.__seen) { s.__seen = 1; seen++; if (!s.gadget) lonely++; } });
    if (!(await step())) break;
  }
  if (t.mode === 'over') { document.getElementById('againBtn').click(); await sleep(300); }
}
// power strips are an early-run hazard: search, restart, search again
let vs = null;
for (let run = 0; run < 5 && !vs; run++) {
  for (let i = 0; i < 26 && t.mode === 'play' && !vs; i++) {
    vs = t.stones.find(s => !s.visited && s.strip);
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
let safe = null, fell = null, offPopup = false, ouchPopup = false, scoreGain = 0;
if (vs) {
  // the gadget's half is safe: land there - gadget off, then its strip too
  const before = t.score;
  t.hop.x = vs.x + (vs.gadget ? vs.gadget.dx * vs.w : vs.w * 0.28);
  t.land(vs, t.stoneTop(vs));
  await sleep(1200);
  scoreGain = t.score - before;
  offPopup = t.pops.some(p => p.t === 'УДЛИНИТЕЛЬ ВЫКЛ! +2');
  safe = { mode: t.mode, gadget: vs.gadget ? vs.gadget.kind : null,
           gadgetOff: vs.gadget ? !vs.gadget.on : null,
           stripCut: vs.stripCut, stripLive: vs.stripLive };
  // now land right on the strip - already off, so it's «ОЙ-ЁЙ!» per D2
  t.hop.x = vs.x + vs.stripX;
  t.land(vs, t.stoneTop(vs));
  await sleep(400);
  ouchPopup = t.pops.some(p => p.t === 'ОЙ-ЁЙ!');
  await sleep(1400);
  fell = { mode: t.mode, phase: t.phase, lastFall: t.lastFall };
}

// fresh run: land on a LIVE strip - sparks, zap, the sparks title and tip
let live = null, livePopup = false, title = null, tip = null;
if (fell && fell.mode === 'over') {
  document.getElementById('againBtn').click();
  await sleep(300);
  for (let run = 0; run < 5 && !live; run++) {
    for (let i = 0; i < 26 && t.mode === 'play' && !live; i++) {
      live = t.stones.find(s => !s.visited && s.strip && !s.stripCut);
      if (!live && !(await step())) break;
    }
    if (!live && t.mode === 'over') { document.getElementById('againBtn').click(); await sleep(300); }
  }
  if (live) {
    t.hop.x = live.x + live.stripX;
    t.land(live, t.stoneTop(live));
    await sleep(400);
    livePopup = t.pops.some(p => p.t === 'ИСКРЫ!');
    await sleep(1600);
    title = document.getElementById('overTitle').textContent;
    tip = document.getElementById('tipMsg').textContent;
  }
}
const TIPS_STRIP = ['Не включай много приборов в один удлинитель.',
                    'Уходишь из дома — выключи удлинитель кнопкой.',
                    'Искрит розетка? Не трогай её и позови взрослых!'];
({ goal: t.LVL.target, found: !!vs, seen, lonely, safe, fell, offPopup, ouchPopup, scoreGain,
   hintShown, liveFound: !!live, livePopup, lastFall: t.lastFall, title, tip,
   pass: !!(seen > 0 && lonely === 0 && hintShown &&
            vs && safe && safe.mode === 'play' && safe.gadgetOff === true &&
            safe.stripCut === true && safe.stripLive < 0.1 &&
            offPopup && scoreGain >= 4 &&
            fell && fell.mode === 'over' && fell.lastFall === 'strip' && ouchPopup &&
            live && livePopup && t.lastFall === 'sparks' &&
            title === 'Ой-ёй! Искры!' && TIPS_STRIP.includes(tip)) })
