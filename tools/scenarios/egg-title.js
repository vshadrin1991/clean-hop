// A3 «Выключатель»: the menu title switches off and on (v9.5).
//   python3 tools/run-scenario.py tools/scenarios/egg-title.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
const $ = id => document.getElementById(id);
const howto0 = $('howto').textContent;

/* ---- A: the title has a lamp word ------------------------------------- */
if (!$('title') || !$('titleLamp')) {
  fails.push('A: no #title / #titleLamp');
} else {
  /* ---- B: one tap switches it off, two back on, no egg yet ------------ */
  $('title').click();
  out.B1 = $('titleLamp').classList.contains('off');
  $('title').click();
  out.B2 = $('titleLamp').classList.contains('off');
  if (out.B1 !== true) fails.push('B: first tap did not switch off');
  if (out.B2 !== false) fails.push('B: second tap did not switch on');
  if (t.eggsFound.title) fails.push('B: found after two taps');

  /* ---- C: the third tap praises and is the egg ------------------------ */
  $('title').click();
  await sleep(50);
  out.C = { off: $('titleLamp').classList.contains('off'), howto: $('howto').textContent,
            found: !!t.eggsFound.title };
  if (!out.C.found) fails.push('C: third tap did not find the egg');
  if (!/Свет зря не горит/.test(out.C.howto)) fails.push('C: howto says "' + out.C.howto + '"');

  /* ---- D: the how-to line comes back ---------------------------------- */
  await sleep(2700);
  out.D = { howto: $('howto').textContent };
  if (out.D.howto !== howto0) fails.push('D: howto did not come back');
}

({ ...out, fails, pass: fails.length === 0 })
