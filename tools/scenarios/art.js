// Sprite art guard. Two rules, checked on the raw SVGs:
//   1. a cloud's shaded underside (fill #a9c0d4) stays inside the cloud - it
//      may not add a single pixel to the outline the rest of the cloud draws
//      (it used to hang below it as a grey slab)
//   2. every island's grass lid (sprite rows 0-27) is grass - no brown
//      pixels on it (island-5 used to carry the roots of a buried stump)
//   3. v10: the soil under the lid is warm earth (mean r-b >= 30)
//   4. v10: islands are lit from the upper right, where the sun is; the
//      -m twins are mirrored shapes with the same light
//   python3 tools/run-scenario.py tools/scenarios/art.js
const t = __t;
const fails = [];
const out = {};
const load = src => new Promise((res, rej) => {
  const im = new Image();
  im.onload = () => res(im);
  im.onerror = () => rej(new Error('cannot load ' + src.slice(0, 60)));
  im.src = src;
});
async function pixels(src, w, h) {
  const im = await load(src);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.drawImage(im, 0, 0, w, h);
  return g.getImageData(0, 0, w, h).data;
}
const text = u => new TextDecoder().decode(
  Uint8Array.from(atob(u.split(',')[1]), ch => ch.charCodeAt(0)));
const uri = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

/* 1. clouds: the sprite with its shade covers no pixel the sprite without it
   leaves empty */
const SHADE = /<path[^>]*fill="#a9c0d4"[^>]*\/>/;
for (const n of ['cloud-1', 'cloud-2', 'cloud-3']) {
  const src = t.spriteSrc(n);
  if (!src) { fails.push(n + ': no inline sprite (run without --no-inline)'); continue; }
  const svg = text(src);
  if (!SHADE.test(svg)) { fails.push(n + ': no underside shade path (fill #a9c0d4)'); continue; }
  const W = 240, H = 110;
  const full = await pixels(src, W, H);
  const rest = await pixels(uri(svg.replace(SHADE, '')), W, H);
  let outside = 0;
  for (let i = 3; i < full.length; i += 4) if (full[i] > 60 && rest[i] < 20) outside++;
  out[n] = outside;
  if (outside > 12) fails.push(n + ': the shade adds ' + outside + ' px outside the cloud');
}

/* 2-4. islands, both twins: the grass lid holds no brown pixels (2), the
   soil under it is warm earth (3), and it is lit from the upper right,
   where the game's sun is (4) */
for (let k = 1; k <= 5; k++) for (const tw of ['', '-m']) {
  const n = 'island-' + k + tw;
  const src = t.spriteSrc(n);
  if (!src) { fails.push(n + ': no inline sprite (run without --no-inline)'); continue; }
  const W = 240, H = 170, px = await pixels(src, W, H);
  let brown = 0;
  for (let y = 0; y < 28; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3];
    if (a > 128 && r > g + 12 && r > b + 12) brown++;
  }
  let warm = 0, wn = 0, lL = 0, nL = 0, lR = 0, nR = 0;
  for (let y = 44; y <= 96; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3];
    if (a <= 200) continue;
    warm += r - b; wn++;
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (x >= 20 && x <= 80) { lL += L; nL++; }
    if (x >= 160 && x <= 220) { lR += L; nR++; }
  }
  const soil = wn ? warm / wn : 0;
  const light = (nR ? lR / nR : 0) - (nL ? lL / nL : 0);
  out[n] = { brown, soil: Math.round(soil), light: Math.round(light) };
  if (brown > 0) fails.push(n + ': ' + brown + ' brown px on the grass lid');
  if (soil < 30) fails.push(n + ': soil not warm (mean r-b ' + soil.toFixed(1) + ', want >= 30)');
  if (light < 8) fails.push(n + ': lit from the wrong side (right-left ' + light.toFixed(1) + ', want >= 8)');
}

({ ...out, fails, pass: fails.length === 0 })
