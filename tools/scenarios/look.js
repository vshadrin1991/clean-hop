// v10 look probe: measures the frozen #shot scene in pixels. It needs the
// shot hash, so run it through tools/look.py, or by hand:
//   python3 tools/run-scenario.py tools/scenarios/look.js --url shot=1,7 --size 390x844
// island.warm  = mean (r - b) of the island soil      (warm earth > 0)
// island.light = right-third minus left-third luminance (the sun is right)
// water.sd     = luminance spread of the lower water band (flat wash ~ 5)
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
const isl = [];
for (const s of t.stones) {                        // islands fully on screen
  if (s.type === 'finish' || !s.dws) continue;
  const ws = s.dws, hs = s.dhs, top = t.stoneTop(s);
  if (t.scrX(s.x - ws / 2) < 0 || t.scrX(s.x + ws / 2) > t.VW) continue;
  const y0 = t.scrY(top + hs * 18 / 170), y1 = t.scrY(t.groundY) - 3;   // under the lid
  const L = stats(t.scrX(s.x - ws * 0.33), y0, t.scrX(s.x - ws * 0.11), y1);
  const R = stats(t.scrX(s.x + ws * 0.11), y0, t.scrX(s.x + ws * 0.33), y1);
  const B = stats(t.scrX(s.x - ws * 0.33), y0, t.scrX(s.x + ws * 0.33), y1);
  if (L && R && B) isl.push({ warm: B.warm, light: R.lum - L.lum });
}
const avg = f => isl.length ? r1(isl.reduce((a, o) => a + o[f], 0) / isl.length) : null;
const gy = t.groundY;
const W = stats(0, gy + (t.VH - gy) * 0.45, t.VW, t.VH - 4);
({ clean: t.cleanShown, islands: isl.length,
   island: { warm: avg('warm'), light: avg('light') },
   water: { sd: r1(W.sd), lum: r1(W.lum) } })
