// v10 living water. Needs a frozen scene; run it four ways:
//   python3 tools/run-scenario.py tools/scenarios/water.js --url shot=1,7 --size 390x844
//   python3 tools/run-scenario.py tools/scenarios/water.js --url shot=1,7 --size 1280x720
//   python3 tools/run-scenario.py tools/scenarios/water.js --url shot=0,7
//   python3 tools/run-scenario.py tools/scenarios/water.js --url shot=1,7 --no-inline
for (let i = 0; i < 200 && document.body.getAttribute('data-ready') !== '1'; i++)
  await new Promise(r => setTimeout(r, 50));
if (document.body.getAttribute('data-ready') !== '1')
  return { skipped: 'needs --url shot=<clean>,<seed>' };
const t = __t, fails = [];
const need = ['lily-pad', 'lily-pad-flower', 'island-1-m', 'island-2-m',
              'island-3-m', 'island-4-m', 'island-5-m'];
const missing = need.filter(n => !(t.BIT && t.BIT[n]));
const out = { clean: t.cleanShown, pads: t.padsShown, fish: t.fishShown, missing };
if (missing.length) fails.push('sprites did not load: ' + missing.join(', '));
if (t.cleanShown < 0.35) {
  if (t.padsShown) fails.push('dirty water shows ' + t.padsShown + ' lily pads');
  if (t.fishShown) fails.push('dirty water shows ' + t.fishShown + ' fish');
} else if (t.cleanShown >= 0.8) {
  if (!(t.padsShown >= 3)) fails.push('clean water shows only ' + t.padsShown + ' pads (want >= 3)');
  if (!(t.fishShown >= 1)) fails.push('clean water shows no fish');
}
/* every pad floats on open water: its top edge is below the waterline */
for (const r of t.padRects || []) {
  if (r[1] < t.groundY + 4)
    fails.push('pad above the waterline: top ' + Math.round(r[1]) + ', water ' + Math.round(t.groundY));
}
/* weak devices: QUALITY 0 draws no fish */
const q = t.quality;
t.quality = 0; t.render(); out.fishLean = t.fishShown;
t.quality = q; t.render();
if (out.fishLean) fails.push('QUALITY 0 still draws ' + out.fishLean + ' fish');
({ ...out, fails, pass: fails.length === 0 })
