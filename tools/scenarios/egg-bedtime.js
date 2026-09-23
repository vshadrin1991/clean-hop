// C4 «Пора спать»: a bedtime tip once per session after 21:00 (v9.5).
//   python3 tools/run-scenario.py tools/scenarios/egg-bedtime.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
const $ = id => document.getElementById(id);
const at = (h, m) => new Date(2026, 8, 23, h, m).getTime();
const LATE = /Уже поздно/;

/* ---- A: the clock is settable, and the boundaries are right ----------- */
const cases = [[20, 59, false], [21, 0, true], [5, 59, true], [6, 0, false]];
out.A = {};
for (const [h, m, want] of cases) {
  t.clock = at(h, m);
  const got = t.isLate();
  out.A[h + ':' + m] = got;
  if (got !== want) fails.push('A: ' + h + ':' + m + ' late=' + got);
}
t.clock = at(12, 0);
const cn = t.clockNow && t.clockNow();
if (!cn || cn.getHours() !== 12) fails.push('A: clockNow ignores the override');

/* ---- B: midday - no bedtime tip --------------------------------------- */
$('playBtn').click();
await sleep(300);
t.gameOver();
await sleep(150);
out.B = { tip: $('tipMsg').textContent };
if (LATE.test(out.B.tip)) fails.push('B: bedtime tip at midday');

/* ---- C: 22:00 - the bedtime tip, once --------------------------------- */
t.clock = at(22, 0);
$('againBtn').click();
await sleep(300);
t.gameOver();
await sleep(150);
out.C = { tip: $('tipMsg').textContent, found: !!t.eggsFound.bedtime };
if (!LATE.test(out.C.tip)) fails.push('C: no bedtime tip at 22:00, "' + out.C.tip + '"');
if (!out.C.found) fails.push('C: egg not found');

/* ---- D: the next card that session is back to normal ------------------ */
$('againBtn').click();
await sleep(300);
t.gameOver();
await sleep(150);
out.D = { tip: $('tipMsg').textContent };
if (LATE.test(out.D.tip)) fails.push('D: bedtime tip shown twice');

t.clock = null;
({ ...out, fails, pass: fails.length === 0 })
