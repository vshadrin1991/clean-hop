// A5 «Болтушка»: tap the hero's face on a card for a hint (v9.5).
//   python3 tools/run-scenario.py tools/scenarios/egg-hints.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
const $ = id => document.getElementById(id);
const FUN = /Все секреты найдены|Секретов больше нет/;

$('playBtn').click();
await sleep(400);

/* ---- A: first tap on the pause face gives the first hint -------------- */
$('pauseBtn').click();
await sleep(200);
const tipBefore = $('pauseTip').textContent;
$('pauseFace').click();
await sleep(100);
out.A = { before: tipBefore, after: $('pauseTip').textContent };
if (!/держать прыжок/.test(out.A.after)) fails.push('A: first tap gave "' + out.A.after + '"');
if (t.eggsFound.chatter) fails.push('A: chatter found after one tap');

/* ---- B: the third tap on the same card is the chatter egg ------------- */
$('pauseFace').click();
$('pauseFace').click();
await sleep(100);
out.B = { chatter: !!t.eggsFound.chatter };
if (!t.eggsFound.chatter) fails.push('B: three taps did not find chatter');

/* ---- C: a found egg is never hinted ----------------------------------- */
t.eggFound('secret-jump');
const seen = [];
for (let i = 0; i < 8; i++) { $('pauseFace').click(); await sleep(30); seen.push($('pauseTip').textContent); }
out.C = { seen };
if (seen.some(s => /держать прыжок/.test(s))) fails.push('C: hinted an egg already found');

/* ---- D: the game-over face gives hints too ---------------------------- */
$('resumeBtn').click();
await sleep(100);
t.gameOver();
await sleep(200);
const overBefore = $('tipMsg').textContent;
$('tipFace').click();
await sleep(100);
out.D = { before: overBefore, after: $('tipMsg').textContent };
if (out.D.after === out.D.before) fails.push('D: game-over face tap changed nothing');

/* ---- E: everything found - fun lines only ----------------------------- */
t.EGGS.forEach(e => t.eggFound(e.id));
$('tipFace').click();
await sleep(100);
out.E = { tip: $('tipMsg').textContent };
if (!FUN.test(out.E.tip)) fails.push('E: all found, but tip is "' + out.E.tip + '"');

({ ...out, fails, pass: fails.length === 0 })
