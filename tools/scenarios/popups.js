// Popup readability (v9.1 P1). A popup stays solid and fades only at the
// end; switch-off labels live long enough to read.
//   python3 tools/run-scenario.py tools/scenarios/popups.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [];
const out = {};

/* 1. the opacity curve itself */
const a = (life, max) => t.popAlpha({ life: life, max: max });
out.curve = [a(1.8, 1.8), a(0.9, 1.8), a(0.45, 1.8), a(0.2, 1.8), a(0, 1.8),
             a(0.6, 0.95)];
if (out.curve[0] !== 1 || out.curve[1] !== 1 || out.curve[2] !== 1)
  fails.push('label not solid before its last 0.45 s: ' + out.curve);
if (!(out.curve[3] > 0.3 && out.curve[3] < 0.6))
  fails.push('no fade in the last 0.45 s: ' + out.curve[3]);
if (out.curve[4] !== 0) fails.push('still visible at life 0: ' + out.curve[4]);
if (out.curve[5] !== 1)
  fails.push('score pop fades from its first frame: ' + out.curve[5]);

/* 2. a real switch-off: the label lasts >= 1.7 s and is solid at ~1.1 s */
document.getElementById('playBtn').click();
await sleep(350);
const s = t.stones
  .filter(s => !s.visited && s.type !== 'finish' && s.type !== 'crumble' &&
               s.ax > t.hop.x - 1)
  .sort((a, b) => a.ax - b.ax)[0];
s.gadget = { kind: 'tv', dx: 0.28, on: true, glow: 1, wait: 0,
             ph: 0, speed: 1, spin: 0 };
t.hop.x = s.x + s.w * (s.strip ? 0.35 : 0);   // never onto the strip
t.land(s, t.stoneTop(s));
await sleep(400);                             // 0.2 s click delay + margin
const label = () => t.pops.find(p => p.t === 'ТЕЛЕВИЗОР ВЫКЛ!');
const L0 = label();
if (!L0) fails.push('no switch-off label after the landing');
else {
  out.labelMax = L0.max;
  if (!(L0.max >= 1.7)) fails.push('label lasts ' + L0.max + ' s < 1.7 s');
  await sleep(900);                           // the label is ~1.1 s old
  const L1 = label();
  out.alphaAt1s = L1 ? t.popAlpha(L1) : null;
  if (!L1) fails.push('label gone after ~1.1 s');
  else if (!(out.alphaAt1s >= 0.99)) fails.push('label fading at ~1.1 s: ' + out.alphaAt1s);
}

({ ...out, fails, pass: fails.length === 0 })
