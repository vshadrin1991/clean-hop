// A1 «Щекотно!»: five taps on one hero in three seconds (v9.5).
//   python3 tools/run-scenario.py tools/scenarios/egg-tickle.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
const btn = k => document.querySelector('.pick[data-kind="' + k + '"]');
const label = k => btn(k).querySelector('.nm').textContent;
async function taps(k, n, gap) { for (let i = 0; i < n; i++) { btn(k).click(); if (gap) await sleep(gap); } }

/* ---- A: four fast taps - nothing -------------------------------------- */
await taps('kitten', 4, 50);
out.A = { found: !!t.eggsFound.tickle, label: label('kitten') };
if (out.A.found) fails.push('A: four taps found the egg');
await sleep(3200);                               // let the window expire

/* ---- B: five slow taps (800 ms apart) - nothing ----------------------- */
await taps('kitten', 5, 800);
out.B = { found: !!t.eggsFound.tickle };
if (out.B.found) fails.push('B: five slow taps found the egg');
await sleep(3200);

/* ---- C: another hero in the middle restarts the count ----------------- */
await taps('kitten', 2, 50);
await taps('bunny', 1, 50);
await taps('kitten', 3, 50);
out.C = { found: !!t.eggsFound.tickle };
if (out.C.found) fails.push('C: a mixed sequence found the egg');
await sleep(3200);

/* ---- D: five fast taps - found, label says it ------------------------- */
await taps('fox', 5, 60);
await sleep(50);
out.D = { found: !!t.eggsFound.tickle, label: label('fox') };
if (!out.D.found) fails.push('D: five fast taps did not find the egg');
if (out.D.label !== 'Щекотно!') fails.push('D: label says "' + out.D.label + '"');
await sleep(1800);
out.D.after = label('fox');
if (out.D.after !== 'Лисёнок') fails.push('D: label did not come back, "' + out.D.after + '"');

({ ...out, fails, pass: fails.length === 0 })
