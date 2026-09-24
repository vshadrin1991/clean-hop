// D1 «Совёнок»: the seventh hero for champions (v9.7).
//   A  a fresh picker shows six heroes and no mystery slot
//   B  three champions: a locked «?» slot hints at the seventh
//   C  all six champions: the owlet joins the picker - that is the egg
//   D  the owlet can be picked like anyone else
//   python3 tools/run-scenario.py tools/scenarios/egg-owlet.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
const picks = () => Array.from(document.querySelectorAll('#picker .pick:not(.locked)'));
const locked = () => document.querySelector('#picker .pick.locked');

/* ---- A: a fresh picker --------------------------------------------------- */
t.buildPicker();
out.A = { order: t.ORDER.slice(), picks: picks().length, locked: !!locked() };
if (t.ORDER.indexOf('owlet') > -1) fails.push('A: the owlet is already out');
if (out.A.picks !== 6) fails.push('A: ' + out.A.picks + ' heroes, expected 6');
if (out.A.locked) fails.push('A: a locked slot with no champions');

/* ---- B: three champions - the «?» appears -------------------------------- */
t.winsSet = { kitten: true, bunny: true, duck: true };
t.buildPicker();
out.B = { wins: t.winsCount(), order: t.ORDER.slice(), locked: !!locked(),
          label: locked() && locked().getAttribute('aria-label') };
if (t.ORDER.indexOf('owlet') > -1) fails.push('B: the owlet came early');
if (!out.B.locked) fails.push('B: three champions, but no mystery slot');
if (picks().length !== 6) fails.push('B: the locked slot is pickable');

/* a tap on the «?» slot explains how to open it */
const howto0 = document.getElementById('howto').textContent;
if (locked()) {
  locked().click();
  await sleep(60);
  out.B.hint = document.getElementById('howto').textContent;
  out.B.nm = locked().querySelector('.nm').textContent;
  if (!/Победи каждым/.test(out.B.hint)) fails.push('B: the hint says "' + out.B.hint + '"');
  if (out.B.nm !== 'Победи всех!') fails.push('B: the slot says "' + out.B.nm + '"');
  await sleep(2800);
  if (document.getElementById('howto').textContent !== howto0)
    fails.push('B: the howto line did not come back');
}

/* ---- C: all six - the seventh arrives ------------------------------------- */
t.winsSet = { kitten: true, bunny: true, duck: true, fox: true, beaver: true, dog: true };
t.buildPicker();
await sleep(60);
out.C = { order: t.ORDER.slice(), picks: picks().length, locked: !!locked(),
          found: !!(t.eggsFound && t.eggsFound.owlet),
          name: picks()[6] && picks()[6].querySelector('.nm').textContent };
if (t.ORDER.indexOf('owlet') === -1) fails.push('C: the owlet never joined');
if (out.C.picks !== 7) fails.push('C: ' + out.C.picks + ' heroes, expected 7');
if (out.C.locked) fails.push('C: the mystery slot stayed after the unlock');
if (!out.C.found) fails.push('C: the egg was not noted');
if (out.C.name !== 'Совёнок') fails.push('C: the seventh is "' + out.C.name + '"');

/* ---- D: pickable, like anyone else ---------------------------------------- */
if (t.ORDER.indexOf('owlet') > -1) {
  picks()[6].click();
  out.D = { chosen: t.chosen };
  if (t.chosen !== 'owlet') fails.push('D: picked ' + t.chosen);
}

({ ...out, fails, pass: fails.length === 0 })
