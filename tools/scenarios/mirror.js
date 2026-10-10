// v10.3 the far shore mirrored in the water (plan §3.3, Review Focus 4-5).
// Needs a frozen scene:
//   python3 tools/run-scenario.py tools/scenarios/mirror.js --url shot=1,7 --size 390x844
//   python3 tools/run-scenario.py tools/scenarios/mirror.js --url shot=0,7 --no-inline
// band  the copied band is 12 px .. 80 % of the water band tall
// lean  at QUALITY 0 there is no mirror and nothing throws
// file  with --no-inline the sprites are real file:// images: the copy
//       still works (drawImage only - reading pixels would throw)
for (let i = 0; i < 200 && document.body.getAttribute('data-ready') !== '1'; i++)
  await new Promise(r => setTimeout(r, 50));
if (document.body.getAttribute('data-ready') !== '1')
  return { skipped: 'needs --url shot=<clean>,<seed>' };
const t = __t, fails = [];
const band = t.VH - t.groundY;
let err = null;
try { t.render(); } catch (e) { err = String(e); }
if (err) fails.push('render threw: ' + err);
const mh = t.mirH;
if (!(mh >= 12 && mh <= band * 0.8 + 0.5))
  fails.push('mirror band ' + mh + ' px for ' + Math.round(band) + ' px of water');
const q = t.quality;
err = null;
try { t.quality = 0; t.render(); } catch (e) { err = String(e); }
const lean = t.mirH;
t.quality = q; t.render();
if (err) fails.push('QUALITY 0 render threw: ' + err);
if (lean !== 0) fails.push('QUALITY 0 still mirrors ' + lean + ' px');
({ vw: t.VW, vh: t.VH, band: Math.round(band), mirH: mh, lean, fails, pass: fails.length === 0 })
