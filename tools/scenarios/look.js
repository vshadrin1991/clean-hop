// v10 look probe: measures the frozen #shot scene in pixels. It needs the
// shot hash, so run it through tools/look.py, or by hand:
//   python3 tools/run-scenario.py tools/scenarios/look.js --url shot=1,7 --size 390x844
// island.warm  = mean (r - b) of the island soil      (warm earth > 0)
// island.light = right-third minus left-third luminance (the sun is right)
// island.seam  = largest jump between neighbouring 3-px soil columns, over
//                the islands the hero is not standing on (hard light edges)
// water.sd     = luminance spread of the lower water band (flat wash ~ 5)
// water.veil   = soil just above the waterline minus soil under the lid
//                (> 0: a pale stripe lies across the island at the water)
// water.under  = warmth of the island's submerged column minus the open
//                water's (a solid second island under the surface is warm)
for (let i = 0; i < 200 && document.body.getAttribute('data-ready') !== '1'; i++)
  await new Promise(r => setTimeout(r, 50));
if (document.body.getAttribute('data-ready') !== '1')
  return { skipped: 'needs --url shot=<clean>,<seed>' };
const t = __t;
const cv = document.getElementById('game');
const g = cv.getContext('2d');
const k = cv.width / t.VW;
const lum = (r, gg, b) => 0.2126 * r + 0.7152 * gg + 0.0722 * b;
function stats(x0, y0, x1, y1) {
  const X0 = Math.max(0, Math.round(x0 * k)), Y0 = Math.max(0, Math.round(y0 * k));
  const X1 = Math.min(cv.width, Math.round(x1 * k)), Y1 = Math.min(cv.height, Math.round(y1 * k));
  if (X1 - X0 < 2 || Y1 - Y0 < 2) return null;
  const d = g.getImageData(X0, Y0, X1 - X0, Y1 - Y0).data;
  let n = 0, s = 0, s2 = 0, warm = 0;
  for (let i = 0; i < d.length; i += 4) {
    const L = lum(d[i], d[i + 1], d[i + 2]);
    n++; s += L; s2 += L * L; warm += d[i] - d[i + 2];
  }
  const m = s / n;
  return { lum: m, sd: Math.sqrt(Math.max(0, s2 / n - m * m)), warm: warm / n };
}
const r1 = v => Math.round(v * 10) / 10;
const sgy = t.scrY(t.groundY);
const isl = [];
for (const s of t.stones) {                        // islands fully on screen
  if (s.type === 'finish' || !s.dws) continue;
  const ws = s.dws, hs = s.dhs, top = t.stoneTop(s);
  if (t.scrX(s.x - ws / 2) < 0 || t.scrX(s.x + ws / 2) > t.VW) continue;
  const y0 = t.scrY(top + hs * 18 / 170), y1 = sgy - 3;   // under the lid
  const L = stats(t.scrX(s.x - ws * 0.33), y0, t.scrX(s.x - ws * 0.11), y1);
  const R = stats(t.scrX(s.x + ws * 0.11), y0, t.scrX(s.x + ws * 0.33), y1);
  const B = stats(t.scrX(s.x - ws * 0.33), y0, t.scrX(s.x + ws * 0.33), y1);
  if (!L || !R || !B) continue;
  const xl = t.scrX(s.x - ws * 0.25), xr = t.scrX(s.x + ws * 0.25);
  const lo = stats(xl, sgy - 10, xr, sgy - 3), hi = stats(xl, y0 + 4, xr, y0 + 12);
  const sub = stats(xl, sgy + 6, xr, t.scrY(t.groundY + hs * 0.30));
  let seam = null;
  if (t.hop.onStone !== s) {                       // the hero would hide a seam
    let prev = null;
    seam = 0;
    for (let x = t.scrX(s.x - ws * 0.38); x < t.scrX(s.x + ws * 0.38); x += 3) {
      const c = stats(x, y0, x + 3, y1);
      if (prev && c) seam = Math.max(seam, Math.abs(c.lum - prev.lum));
      prev = c;
    }
  }
  isl.push({ warm: B.warm, light: R.lum - L.lum, seam,
             veil: lo && hi ? lo.lum - hi.lum : null, subWarm: sub ? sub.warm : null });
}
const avg = f => {
  const v = isl.map(o => o[f]).filter(x => x !== null);
  return v.length ? r1(v.reduce((a, b) => a + b, 0) / v.length) : null;
};
const gy = t.groundY;
const W = stats(0, gy + (t.VH - gy) * 0.45, t.VW, t.VH - 4);
const sw = avg('subWarm');
({ clean: t.cleanShown, islands: isl.length,
   island: { warm: avg('warm'), light: avg('light'), seam: avg('seam') },
   water: { sd: r1(W.sd), lum: r1(W.lum), veil: avg('veil'),
            under: sw === null ? null : r1(sw - W.warm) } })
