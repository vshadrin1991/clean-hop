// v10 «Пингвинёнок»: the ninth and last secret hero - twenty games played.
//   python3 tools/run-scenario.py tools/scenarios/egg-penguin.js
//   python3 tools/run-scenario.py tools/scenarios/egg-penguin.js --size 320x568
//   python3 tools/run-scenario.py tools/scenarios/egg-penguin.js --size 568x320
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t, fails = [], out = {}, errs = [];
window.addEventListener('error', e => errs.push(String(e.message)));
for (let i = 0; i < 60 && !t.spritesReady; i++) await sleep(100);
const picks = () => Array.from(document.querySelectorAll('#picker .pick:not(.locked)'));
const lock = () => document.querySelector('#picker .pick.locked[data-lock="penguin"]');
const txt = id => document.getElementById(id).textContent;
const oneGame = async () => { t.startGame(); await sleep(60); t.gameOver(); await sleep(60); };
const menu = async () => { t.toMenu(); await sleep(120); };

/* ---- A: a fresh game - no penguin, no lock ---- */
await menu();
out.A = { order: t.ORDER.slice(), lock: !!lock() };
if (t.ORDER.indexOf('penguin') > -1) fails.push('A: the penguin is already out');
if (out.A.lock) fails.push('A: a penguin lock on a fresh game');

/* ---- A2: the choir has a rung for every possible hero ---- */
if (!(t.SCALE.length >= 9)) fails.push('A2: SCALE has ' + t.SCALE.length + ' rungs (want 9)');

/* ---- B: nine games - still nothing ---- */
t.runsPlayed = 8;
await oneGame(); await menu();                          // the 9th
out.B = { runs: t.runsPlayed, lock: !!lock(), order: t.ORDER.slice() };
if (out.B.runs !== 9) fails.push('B: runs ' + out.B.runs + ' (want 9)');
if (out.B.lock) fails.push('B: the lock came before the 10th game');
if (t.ORDER.indexOf('penguin') > -1) fails.push('B: the penguin came early');
await oneGame(); await menu();                          // the 10th (the lock: block C)

/* ---- C: from the 10th game, a locked card counts to twenty ---- */
const lb = lock();
out.C = lb ? { cap: lb.querySelector('.nm').textContent, aria: lb.getAttribute('aria-label') } : null;
if (!lb) fails.push('C: no penguin lock at 10 games');
else {
  if (out.C.cap !== '10/20') fails.push('C: caption "' + out.C.cap + '"');
  if (out.C.aria.indexOf('10 из 20') < 0) fails.push('C: aria-label "' + out.C.aria + '"');
  lb.click(); await sleep(50);
  out.C.howto = txt('howto');
  if (out.C.howto.indexOf('осталось 10') < 0) fails.push('C: tap says "' + out.C.howto + '"');
  if (t.chosen === 'penguin') fails.push('C: a locked card could be picked');
}
/* the owlet's lock is untouched: still «???» at three wins */
t.winsSet = { kitten: true, bunny: true, duck: true };
await menu();
const ol = document.querySelector('#picker .pick.locked[data-lock="owlet"]');
if (!ol || ol.querySelector('.nm').textContent !== '???') fails.push('C: the owlet lock changed');
t.winsSet = {};

/* ---- D: the 20th game's card names him; the egg is noted ---- */
t.runsPlayed = 19;
await oneGame();                                        // the 20th
out.D = { runs: t.runsPlayed, msg: txt('ecoMsg'), found: !!t.eggsFound.penguin };
if (out.D.runs !== 20) fails.push('D: runs ' + out.D.runs + ' (want 20)');
if (!/Пингвинёнок/.test(out.D.msg)) fails.push('D: message "' + out.D.msg + '"');
if (!out.D.found) fails.push('D: the egg was not noted');

/* ---- E: the next menu has him - named, pickable, last; no lock ---- */
await menu();
/* ---- E2: the first menu with the penguin throws a party ---- */
out.E2 = { banner: txt('dayBanner'),
           arrive: !!document.querySelector('#picker .pick.arrive[data-kind="penguin"]') };
if (!/Пингвинёнок приплыл/.test(out.E2.banner)) fails.push('E2: banner "' + out.E2.banner + '"');
if (!out.E2.arrive) fails.push('E2: the penguin card did not hop in');
const pg = picks().find(b => b.dataset.kind === 'penguin');
out.E = { order: t.ORDER.slice(), lock: !!lock() };
if (!pg) fails.push('E: no penguin card');
else {
  const nm = pg.querySelector('.nm').textContent;
  if (nm !== 'Пингвинёнок') fails.push('E: the card says "' + nm + '"');
  pg.click();
  if (t.chosen !== 'penguin') fails.push('E: picked ' + t.chosen);
}
if (out.E.order[out.E.order.length - 1] !== 'penguin') fails.push('E: not last: ' + out.E.order.join());
if (out.E.lock) fails.push('E: the lock is still there');

/* ---- F2: only once - and never on a page load ---- */
await menu();
if (/приплыл/.test(txt('dayBanner')) && !document.getElementById('dayBanner').classList.contains('hidden'))
  fails.push('F2: the party ran twice');
t.ORDER.splice(t.ORDER.indexOf('penguin'), 1);
t.pickerBuilt = false;                                  // as on a page load
t.buildPicker();
await menu();
if (document.querySelector('#picker .pick.arrive')) fails.push('F2: a party on page load');

/* ---- F: remembered - a page load with 20+ games brings him straight back ---- */
t.ORDER.splice(t.ORDER.indexOf('penguin'), 1);
t.runsPlayed = 30;
t.pickerBuilt = false;                                  // as on a page load (a probe from Task 5)
t.buildPicker();
out.F = { order: t.ORDER.slice(), lock: !!lock() };
if (t.ORDER.indexOf('penguin') < 0) fails.push('F: 30 games and no penguin');
if (out.F.lock) fails.push('F: a lock next to the penguin');

/* ---- G: all nine heroes fit, nothing clipped, the choir sings all nine ---- */
t.winsSet = { kitten: true, bunny: true, duck: true, fox: true, beaver: true, dog: true };
localStorage.setItem('cleanHop.stars.v1', '1');          // the unicorn too
await menu();
const all = Array.from(document.querySelectorAll('#picker .pick'));
const pr = document.getElementById('picker').getBoundingClientRect();
const play = document.getElementById('playBtn').getBoundingClientRect();
out.G = { order: t.ORDER.join(), cards: all.length,
          playBottom: Math.round(play.bottom), vh: innerHeight };
if (out.G.order !== 'kitten,bunny,duck,fox,beaver,dog,owlet,unicorn,penguin')
  fails.push('G: order ' + out.G.order);
if (out.G.cards !== 9) fails.push('G: ' + out.G.cards + ' cards (want 9)');
const clipped = all.filter(b => { const r = b.getBoundingClientRect();
  return r.left < pr.left - 1 || r.right > pr.right + 1; }).map(b => b.dataset.kind);
if (clipped.length) fails.push('G: cards outside the picker: ' + clipped.join(', '));
const spill = all.filter(b => {
  const n = b.querySelector('.nm');
  if (!n.getClientRects().length) return false;          // label hidden on purpose
  const r = n.getBoundingClientRect(), c = b.getBoundingClientRect();
  return r.left < c.left - 1 || r.right > c.right + 1;
}).map(b => b.dataset.kind);
if (spill.length) fails.push('G: names spill out of their cards: ' + spill.join(', '));
const tiny = all.filter(b => b.querySelector('canvas').clientWidth < 30).map(b => b.dataset.kind);
if (tiny.length) fails.push('G: portraits under 30 px: ' + tiny.join(', '));
if (play.bottom > innerHeight + 1) fails.push('G: «Начать игру» is off screen');
/* upright, the ninth card starts no fourth row */
if (innerHeight > 460) {
  const rows = new Set(all.map(b => Math.round(b.getBoundingClientRect().top))).size;
  if (rows !== 3) fails.push('G: ' + rows + ' rows upright (want 3)');
}
for (const b of picks()) b.click();                       // left to right: the choir
await sleep(100);
if (!t.eggsFound.choir) fails.push('G: the nine-hero choir did not sing');
localStorage.removeItem('cleanHop.stars.v1');
t.winsSet = {};

/* ---- H: the penguin draws - dark cap, white mask, orange beak, no tongue ---- */
const W = 60;                                           // canvas 120 x 120, feet at (60, 114)
const P = t.paintAnimal('penguin', { t: 0 }, W);
const at = (c, x, y) => Array.from(c.getContext('2d').getImageData(x, y, 1, 1).data);
const lum = p => 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2];
out.H = { cap: at(P, 60, 47), mask: at(P, 51, 82), beak: at(P, 60, 77) };
if (!P) fails.push('H: paintAnimal("penguin") drew nothing');
else {
  if (!(lum(out.H.cap) < 90)) fails.push('H: the cap is not dark: ' + out.H.cap);
  if (!(lum(out.H.mask) > 225)) fails.push('H: the face mask is not white: ' + out.H.mask);
  const b = out.H.beak;
  if (!(b[0] > 200 && b[1] > 110 && b[1] < 200 && b[2] < 100)) fails.push('H: the beak is not orange: ' + b);
  const calm = t.paintAnimal('penguin', { t: 0 }, W).toDataURL();
  const tongue = t.paintAnimal('penguin', { t: 0, focusTongue: 1 }, W).toDataURL();
  if (calm !== tongue) fails.push('H: a beak with a tongue - focusTongue changed the penguin');
  for (const o of [{ yuck: true }, { speak: true }, { wow: true }, { focus: 1 },
                   { air: true, t: 1 }, { blink: true }, { sil: true }])
    t.paintAnimal('penguin', Object.assign({ t: 0 }, o), W);   // each must draw without throwing
  if (t.ANIMALS.penguin.name !== 'Пингвинёнок') fails.push('H: name ' + t.ANIMALS.penguin.name);
}

if (errs.length) fails.push('page errors: ' + errs.join(' | '));
({ ...out, fails, pass: fails.length === 0 })
