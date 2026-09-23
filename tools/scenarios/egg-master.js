// B4 «Мастер выключателей»: every gadget kind off in one run (v9.5).
//   python3 tools/run-scenario.py tools/scenarios/egg-master.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
const $ = id => document.getElementById(id);
const dial = v => { const r = $('diffRange'); r.value = String(v);
                    r.dispatchEvent(new Event('input', { bubbles: true })); };
const medal = () => !!$('medal') && !$('medal').classList.contains('hidden');
async function endRun(kinds, strips) {
  Object.assign(t.offByKind, kinds);
  t.stripsOff = strips;
  t.gameOver();
  await sleep(150);
  return { medal: medal(), tip: $('tipMsg').textContent };
}

/* ---- A: a strip level, all four kinds but no strip - no medal --------- */
dial(67);
$('playBtn').click();
await sleep(300);
out.A = await endRun({ lamp: 2, tv: 1, charger: 1, fan: 1 }, 0);
if (!$('medal')) fails.push('A: no #medal element');
if (out.A.medal) fails.push('A: medal without a power strip');

/* ---- B: all four kinds and a strip - medal, tip, egg ------------------ */
$('againBtn').click();
await sleep(300);
out.B = await endRun({ lamp: 1, tv: 1, charger: 1, fan: 1 }, 1);
if (!out.B.medal) fails.push('B: no medal');
if (!/всё выключено/.test(out.B.tip)) fails.push('B: tip is "' + out.B.tip + '"');
if (!t.eggsFound.master) fails.push('B: egg not found');

/* ---- C: one kind missing - no medal ----------------------------------- */
$('againBtn').click();
await sleep(300);
out.C = await endRun({ lamp: 1, tv: 1, charger: 1 }, 2);
if (out.C.medal) fails.push('C: medal with the fan missing');

/* ---- D: the calm level has no strips - four kinds are enough ---------- */
$('changeBtn').click();
await sleep(300);
dial(0);
$('playBtn').click();
await sleep(300);
out.D = await endRun({ lamp: 1, tv: 1, charger: 1, fan: 1 }, 0);
if (!out.D.medal) fails.push('D: no medal on the calm level');

({ ...out, fails, pass: fails.length === 0 })
