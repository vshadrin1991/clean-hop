// Gadget lit-layer check (plan §Task 2). Two assertions:
//   1. every gadget sprite actually has its lit layer (B1 - the file:// bug
//      left BIT[name].lit null, so switched-off gadgets kept glowing)
//   2. 0.5 s after a landing each gadget is fully dark: on=false, glow=0,
//      litAlpha=0 - no halo, no picture, no LED
// Run on both builds:
//   python3 tools/run-scenario.py tools/scenarios/lights.js
//   python3 tools/run-scenario.py tools/scenarios/lights.js --no-inline
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [];
const NAMES = ['island-lamp', 'gadget-tv', 'gadget-charger', 'gadget-fan',
               'shore-lamp'];
const KINDS = ['lamp', 'tv', 'charger', 'fan'];

/* real <img> loads over file:// take real time - wait for them */
for (let i = 0; i < 60 && !t.spritesReady; i++) await sleep(100);
await sleep(1500);

const litOK = t.litOK || {};
for (const n of NAMES)
  if (!litOK[n]) fails.push('no lit layer: ' + n);

const byKind = {};
document.getElementById('playBtn').click();
await sleep(350);

for (const k of KINDS) {
  const s = t.stones
    .filter(s => !s.visited && s.type !== 'finish' && s.type !== 'crumble' &&
                 s.ax > t.hop.x - 1)
    .sort((a, b) => a.ax - b.ax)[0];
  if (!s) { fails.push('no island left for ' + k); break; }
  /* force the kind so a short run covers all four - the point is the light
     behaviour, not the spawn lottery */
  s.gadget = { kind: k, dx: 0.28, on: true, glow: 1, wait: 0,
               ph: 0, speed: 1, spin: 0 };
  t.hop.x = s.x + s.w * (s.strip ? 0.35 : 0);   // never onto the strip
  t.land(s, t.stoneTop(s));
  await sleep(500);                             // 0.2 s wait + 0.18 s fade
  const L = t.gadgetLight(s);
  byKind[k] = L;
  if (!L) { fails.push(k + ': no gadget light state'); continue; }
  if (L.on !== false) fails.push(k + ': still on');
  if (L.glow > 0.01) fails.push(k + ': glow ' + L.glow.toFixed(2));
  if (L.litAlpha > 0.01) fails.push(k + ': litAlpha ' + L.litAlpha.toFixed(2));
}

/* 3. street lamps (v9.1 L1): once the world is saved, every lamp is dark -
   no cone, no halo, no yellow bulb */
t.clean = 1;
await sleep(1500);                            // 0.4 s off-blink, then 0
const lamps = t.shoreLamps ? t.shoreLamps() : null;
if (!lamps || !lamps.length) fails.push('no street lamps to check');
else lamps.forEach((L, i) => {
  if (L.lightOn > 0.02) fails.push('street lamp ' + i + ': lightOn ' + L.lightOn.toFixed(2));
  if (!(L.glow <= 0.005)) fails.push('street lamp ' + i + ': glow ' + L.glow);
});

({ litOK, byKind, lamps, fails, pass: fails.length === 0 })
