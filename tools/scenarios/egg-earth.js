// A4 «Час Земли» + C1: the menu's secret night (v9.6).
//   A  three taps on the sun bring dusk: nightSeq on, night eases up, egg found
//   B  the sequence ends on its own / a tap brings the morning back
//   C  the real Earth Hour (last Saturday of March, 20:30-21:30) opens the
//      menu already dark, with its own line and its own egg
//   D  the hour either side does nothing
//   python3 tools/run-scenario.py tools/scenarios/egg-earth.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
async function until(fn, ms) {
  for (let i = 0; i < ms / 50; i++) { if (fn()) return true; await sleep(50); }
  return fn();
}

/* ---- A: three sun taps make the night ---------------------------------- */
out.A0 = { mode: t.mode, night: t.night };
if (t.mode !== 'menu') fails.push('A: not on the menu');
if (t.night !== 0) fails.push('A: night before any tap');
t.sunTap(); t.sunTap();
await sleep(300);
if (t.nightSeq) fails.push('A: two taps already started the night');
t.sunTap();
out.A = { seq: t.nightSeq, found: !!(t.eggsFound && t.eggsFound['earth-hour']) };
if (t.nightSeq !== 1) fails.push('A: third tap did not start the night');
if (!out.A.found) fails.push('A: the egg was not noted');
const dark = await until(() => t.night > 0.7, 3000);
out.A.night = t.night;
if (!dark) fails.push('A: night never fell (' + t.night + ')');
if (!/звёзд/.test(t.nightLine)) fails.push('A: line "' + t.nightLine + '"');

/* ---- B: the morning comes back ----------------------------------------- */
await sleep(200);
t.nightStop();
const light = await until(() => t.night < 0.05, 4000);
out.B = { night: t.night };
if (!light) fails.push('B: the night never lifted (' + t.night + ')');

/* ---- C: the real Earth Hour -------------------------------------------- */
/* March 2026: Saturdays are the 7/14/21/28 - the hour is 20:30-21:30 */
t.clock = new Date(2026, 2, 28, 20, 45).getTime();
out.C0 = { real: t.earthHourReal() };
if (out.C0.real !== true) fails.push('C: 28 Mar 2026 20:45 is not Earth Hour');
t.eggsAtMenu();
await sleep(50);
out.C = { seq: t.nightSeq, line: t.nightLine,
          real: !!(t.eggsFound && t.eggsFound['earth-hour-real']) };
if (t.nightSeq !== 1) fails.push('C: the menu did not open at night');
if (t.nightLine !== 'Сегодня Час Земли!') fails.push('C: line "' + t.nightLine + '"');
if (!out.C.real) fails.push('C: the real visit was not noted as its own egg');

/* ---- D: an hour later it is an ordinary evening ------------------------- */
t.nightStop();
t.clock = new Date(2026, 2, 28, 21, 45).getTime();
if (t.earthHourReal() !== false) fails.push('D: 21:45 still counted');
t.clock = new Date(2026, 2, 27, 20, 45).getTime();      // Friday, not Saturday
if (t.earthHourReal() !== false) fails.push('D: Friday counted');
t.clock = new Date(2026, 8, 23, 12, 0).getTime();       // back to the test noon
t.eggsAtMenu();
out.D = { seq: t.nightSeq };
if (t.nightSeq) fails.push('D: an ordinary day kept the night on');

({ ...out, fails, pass: fails.length === 0 })
