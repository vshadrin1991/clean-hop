// v10 «Единорожек»: the eighth hero, for star collectors.
//   A  a fresh picker has no unicorn
//   B  a win that missed one spark earns nothing
//   C  every spark on «Простой» earns nothing - the dial must show «Средний»+
//   D  the secret leap never counts
//   E  every spark + the finish on «Средний»: the unicorn arrives - the egg
//   F  it is remembered (own key), can be picked; the owlet stays before it
//   G  eight heroes still fit the menu; the choir sings all eight
//   python3 tools/run-scenario.py tools/scenarios/egg-unicorn.js
//   python3 tools/run-scenario.py tools/scenarios/egg-unicorn.js --size 320x568
//   python3 tools/run-scenario.py tools/scenarios/egg-unicorn.js --size 568x320
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {}, errs = [];
window.addEventListener('error', e => errs.push(String(e.message)));
const picks = () => Array.from(document.querySelectorAll('#picker .pick:not(.locked)'));
/* one finished run at dial `dial` with `got` of `made` sparks caught */
async function run(dial, made, got, secret) {
  t.setDifficulty(dial);
  t.startGame();
  await sleep(50);
  t.sparksMade = made; t.leaves = got; t.won = true; t.eggSecret = !!secret;
  t.gameOver();
  await sleep(50);
  return t.ORDER.indexOf('unicorn') > -1;
}

/* ---- A ---- */
t.buildPicker();
out.A = { order: t.ORDER.slice() };
if (t.ORDER.indexOf('unicorn') > -1) fails.push('A: the unicorn is already out');

/* ---- B, C, D ---- */
if (await run(67, 9, 8)) fails.push('B: a missed spark still earned the unicorn');
if (await run(33, 9, 9)) fails.push('C: «Простой» earned the unicorn');
if (await run(67, 9, 9, true)) fails.push('D: the secret leap earned the unicorn');
if (t.eggsFound.unicorn) fails.push('B-D: the egg was noted too early');

/* ---- E ---- */
const gotIt = await run(67, 9, 9);
out.E = { order: t.ORDER.slice(), found: !!t.eggsFound.unicorn,
          key: localStorage.getItem('cleanHop.stars.v1'),
          title: document.getElementById('overTitle').textContent,
          msg: document.getElementById('ecoMsg').textContent };
if (!gotIt) fails.push('E: every spark on «Средний» did not bring the unicorn');
if (!out.E.found) fails.push('E: the egg was not noted');
if (out.E.key !== '1') fails.push('E: not saved under cleanHop.stars.v1');
if (out.E.title !== 'Все искорки!') fails.push('E: title "' + out.E.title + '"');
if (!/Единорожек/.test(out.E.msg)) fails.push('E: message "' + out.E.msg + '"');

/* ---- F: remembered, pickable, and the owlet keeps his place before it ---- */
t.ORDER.splice(t.ORDER.indexOf('unicorn'), 1);          // as if freshly loaded
t.winsSet = { kitten: true, bunny: true, duck: true, fox: true, beaver: true, dog: true };
t.toMenu();
await sleep(120);
out.F = { order: t.ORDER.slice() };
if (out.F.order.join() !== 'kitten,bunny,duck,fox,beaver,dog,owlet,unicorn')
  fails.push('F: order ' + out.F.order.join());
const uni = picks().find(b => b.dataset.kind === 'unicorn');
if (!uni) fails.push('F: no unicorn card after a reload');
else {
  const nm = uni.querySelector('.nm').textContent;
  if (nm !== 'Единорожек') fails.push('F: the card says "' + nm + '"');
  uni.click();
  if (t.chosen !== 'unicorn') fails.push('F: picked ' + t.chosen);
}

/* ---- G: eight fit; hidden labels still leave a name for screen readers ---- */
await sleep(100);
const spill = picks().filter(b => {
  const n = b.querySelector('.nm');
  if (!n.getClientRects().length) return false;          // label hidden on purpose
  const r = n.getBoundingClientRect(), c = b.getBoundingClientRect();
  return r.left < c.left - 1 || r.right > c.right + 1;
}).map(b => b.dataset.kind);
const unnamed = picks().filter(b => {
  if (b.getAttribute('aria-label')) return false;
  const n = b.querySelector('.nm');                 // hidden labels stay in the a11y tree
  return !n || !n.textContent.trim() || getComputedStyle(n).display === 'none';
}).map(b => b.dataset.kind);
const play = document.getElementById('playBtn').getBoundingClientRect();
out.G = { spill, unnamed, playBottom: Math.round(play.bottom), vh: innerHeight };
if (spill.length) fails.push('G: names spill out of their cards: ' + spill.join(', '));
if (unnamed.length) fails.push('G: cards without an accessible name: ' + unnamed.join(', '));
if (play.bottom > innerHeight + 1)
  fails.push('G: «Начать игру» is off screen (' + Math.round(play.bottom) + ' > ' + innerHeight + ')');
for (const b of picks()) b.click();                       // left to right: the choir
await sleep(100);
if (!t.eggsFound.choir) fails.push('G: the eight-hero choir did not sing');
if (errs.length) fails.push('G: page errors: ' + errs.join(' | '));
({ ...out, fails, pass: fails.length === 0 })
