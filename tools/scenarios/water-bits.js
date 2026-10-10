// v10.3 water details (plan §3.4):
//   python3 tools/phones.py water-bits.js
// slicks  every oily slick is at most 1.1 U in x-radius and at most 32 %
//         of the screen wide; only a trace (<= 0.07) once the water is clean
// reeds   every screen with VW >= VH keeps exactly the v10 reed size;
//         upright screens grow them with the water band (>= 0.30 of it, max 99)
const t = __t, wait = ms => new Promise(r => setTimeout(r, ms));
for (let i = 0; i < 60 && !t.spritesReady; i++) await wait(100);
document.getElementById('playBtn').click();
await wait(600);
const fails = [], out = { vw: t.VW, vh: t.VH, slicks: [] };
for (let i = 0; i < 5; i++) {
  const s = t.slickAt(i);
  if (!s) { fails.push('slicks: slickAt is missing'); break; }
  const share = 2 * s.rx * t.Z / t.VW;
  out.slicks.push(Math.round(share * 100));
  if (s.rx > t.U * 1.1 + 0.01) fails.push('slicks: ' + i + ' rx ' + s.rx.toFixed(1) + ' > 1.1 U');
  if (share > 0.32) fails.push('slicks: ' + i + ' is ' + Math.round(share * 100) + '% of the screen');
}
const keep = t.cleanShown;
t.cleanShown = 1;
const sc = t.slickAt(0);
if (sc && sc.a > 0.07) fails.push('slicks: still ' + sc.a.toFixed(2) + ' strong in clean water');
t.cleanShown = keep;
const r = t.reedU();
out.reed = typeof r === 'number' ? Math.round(r * 10) / 10 : r;
const v10 = Math.min(Math.max(Math.min(t.VW, t.VH) * 0.117, 36), 99);
if (typeof r !== 'number') fails.push('reeds: reedU is missing');
else if (t.VW >= t.VH) { if (Math.abs(r - v10) > 0.01) fails.push('reeds: landscape changed ' + v10.toFixed(1) + ' -> ' + r.toFixed(1)); }
else if (r < Math.min(99, (t.VH - t.groundY) * 0.30) - 0.01) fails.push('reeds: upright still small ' + r.toFixed(1));
({ ...out, fails, pass: fails.length === 0 })
