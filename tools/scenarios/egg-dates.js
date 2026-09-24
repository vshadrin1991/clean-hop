// C2 + C3: the calendar eggs (v9.6/v9.7).
//   A  11 November: the menu banner greets Energy Saving Day - that is the egg
//   B  an ordinary November day shows no banner
//   C  the New Year week: snow instead of pollen, knit hats, the egg
//   D  the week's edges: 25 Dec and 10 Jan in, 24 Dec and 11 Jan out
//   python3 tools/run-scenario.py tools/scenarios/egg-dates.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
const banner = document.getElementById('dayBanner');

/* ---- A: 11 November ------------------------------------------------------ */
t.clock = new Date(2026, 10, 11, 12, 0).getTime();
out.A0 = { energyDay: t.isEnergyDay() };
if (out.A0.energyDay !== true) fails.push('A: 11 Nov is not Energy Day');
t.eggsAtMenu();
await sleep(50);
out.A = { text: banner.textContent, shown: !banner.classList.contains('hidden'),
          found: !!(t.eggsFound && t.eggsFound['energy-day']) };
if (!out.A.shown) fails.push('A: the banner stayed hidden');
if (!/энергосбережения/.test(out.A.text)) fails.push('A: banner says "' + out.A.text + '"');
if (!out.A.found) fails.push('A: the egg was not noted');

/* ---- B: the day after ----------------------------------------------------- */
t.clock = new Date(2026, 10, 12, 12, 0).getTime();
t.eggsAtMenu();
out.B = { shown: !banner.classList.contains('hidden') };
if (out.B.shown) fails.push('B: the banner stayed up past the day');

/* ---- C: the New Year week -------------------------------------------------- */
t.clock = new Date(2026, 11, 30, 12, 0).getTime();
out.C0 = { newYear: t.isNewYear() };
if (out.C0.newYear !== true) fails.push('C: 30 Dec is not the New Year week');
t.eggsAtMenu();
await sleep(50);
out.C = { found: !!(t.eggsFound && t.eggsFound['new-year']),
          wearMenu: t.heroWear(false), wearPlay: t.heroWear(true) };
if (!out.C.found) fails.push('C: the egg was not noted');
if (!/hat-knit/.test(out.C.wearMenu || '')) fails.push('C: portraits wear "' + out.C.wearMenu + '"');
if (!/hat-knit/.test(out.C.wearPlay || '')) fails.push('C: the hero wears "' + out.C.wearPlay + '"');

/* ---- D: the edges ----------------------------------------------------------- */
out.D = {};
for (const [m, d, want] of [[11, 24, false], [11, 25, true], [0, 10, true], [0, 11, false]]) {
  t.clock = new Date(2026, m, d, 12, 0).getTime();
  const got = t.isNewYear();
  out.D[(m + 1) + '/' + d] = got;
  if (got !== want) fails.push('D: ' + (m + 1) + '/' + d + ' gave ' + got + ', wanted ' + want);
}
t.clock = new Date(2026, 8, 23, 12, 0).getTime();        // back to the test noon

({ ...out, fails, pass: fails.length === 0 })
