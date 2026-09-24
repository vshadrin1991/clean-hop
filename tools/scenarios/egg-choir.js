// A2 «Хор зверят»: picker portraits tapped left to right sing (v9.6).
//   A  a tap out of order just picks the hero - no song
//   B  all six in order: the choir sings, confetti falls, the egg is found
//   python3 tools/run-scenario.py tools/scenarios/egg-choir.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
const menu = document.getElementById('menu');
const picks = () => Array.from(document.querySelectorAll('#picker .pick:not(.locked)'));

/* ---- A: starting anywhere but the first portrait is just a pick -------- */
const btns = picks();
out.A0 = { count: btns.length, order: t.ORDER };
if (btns.length !== 6) fails.push('A: picker shows ' + btns.length + ' heroes, expected 6');
btns[2].click();                                  // the fox, mid-scale
await sleep(60);
out.A = { pos: t.choirPos, found: !!(t.eggsFound && t.eggsFound.choir) };
if (t.choirPos !== 0) fails.push('A: a stray tap moved the choir to ' + t.choirPos);
if (out.A.found) fails.push('A: choir found out of order');

/* ---- B: left to right, inside five seconds ------------------------------ */
for (const b of picks()) { b.click(); await sleep(30); }
await sleep(120);
out.B = { pos: t.choirPos, choir: menu.classList.contains('choir'),
          found: !!(t.eggsFound && t.eggsFound.choir) };
if (!out.B.found) fails.push('B: six in order did not sing');
if (!out.B.choir) fails.push('B: no confetti on the menu card');
await sleep(3300);
if (menu.classList.contains('choir')) fails.push('B: the confetti never stopped');

({ ...out, fails, pass: fails.length === 0 })
