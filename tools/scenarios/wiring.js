// Power-line coverage + strip-cord reach (plan §W1/W2).
//   1. for camX 0..60000 step 13: the pylon list spans the whole screen -
//      xs[0] <= 0 and xs[last] >= VW - so the wire never ends in mid-air
//   2. for each gadget kind: the cord's far end lands inside that sprite's
//      base footprint (lamp foot, TV leg, charger post, fan base ellipse)
//      and within 15% of the sprite height above its base
//   python3 tools/run-scenario.py tools/scenarios/wiring.js --size 1280x720
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [];

for (let i = 0; i < 60 && !t.spritesReady; i++) await sleep(100);

/* --- W1: unbroken wire at every camera position --- */
let breaks = 0, worstGap = 0, n = 0;
for (let cx = 0; cx <= 60000; cx += 13) {
  const xs = t.pylonXs(cx);
  n++;
  if (!xs || !xs.length || xs[0] > 0 || xs[xs.length - 1] < t.VW) {
    breaks++;
    const gap = xs && xs.length ? t.VW - xs[xs.length - 1] : t.VW;
    if (gap > worstGap) worstGap = gap;
  }
}
if (breaks)
  fails.push(`wire breaks in ${breaks}/${n} frames, worst gap ${Math.round(worstGap)}px`);

/* --- W2: the cord plugs into the gadget's base, not the grass --- */
const FOOT = {            // base footprint, fraction of gw from the left edge
  lamp:    [0.22, 0.78],  // foot ellipse x 9-31 of 40
  tv:      [0.19, 0.33],  // left leg x 12-19 of 60
  charger: [0.32, 0.68],  // post x 13-27 of 40
  fan:     [0.08, 0.92]   // base ellipse x 4-46 of 50
};
document.getElementById('playBtn').click();
await sleep(300);
const host = t.stones.filter(s => s.type !== 'finish' && s.type !== 'start')[2]
          || t.stones[2];
const cordGaps = {};
for (const k of Object.keys(FOOT)) {
  host.gadget = { kind: k, dx: 0.28, on: true, glow: 1, wait: 0,
                  ph: 0, speed: 1, spin: 0 };
  const e = t.cordEnd(host);
  if (!e) { fails.push(k + ': no cordEnd'); continue; }
  const f = (e.x - (e.gx - e.gw / 2)) / e.gw;
  cordGaps[k] = +f.toFixed(3);
  if (f < FOOT[k][0] || f > FOOT[k][1])
    fails.push(`${k}: cord lands at ${f.toFixed(2)} of sprite width, base is [${FOOT[k]}]`);
  if (e.y > e.base || e.y < e.base - e.gh * 0.15)
    fails.push(`${k}: cord end ${(e.base - e.y).toFixed(1)}px above base`);
}

({ breakPct: +(100 * breaks / n).toFixed(1), worstGap: Math.round(worstGap),
   cordGaps, fails, pass: fails.length === 0 })
