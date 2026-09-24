// A lone card on the picker's last row sits centred (v9.8).
//   S  six heroes: the grid is full, the last card keeps the right column
//   L  three wins: the locked «?» alone on the last row is centred
//   O  six wins: the owlet alone on the last row is centred
//      (on a sideways phone the picker is one row of 7 - nothing to centre)
//   python3 tools/run-scenario.py tools/scenarios/picker-center.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
const picks = () => Array.from(document.querySelectorAll('#picker .pick'));
const cx = el => { const r = el.getBoundingClientRect(); return r.left + r.width / 2; };
const winsOf = ks => Object.fromEntries(ks.map(k => [k, true]));
/* the last card, and whether it has a row of its own; if it does, `off`
   is its distance from the middle card of the row above */
function lastCard() {
  const ps = picks(), m = new Map();
  for (const el of ps) {
    const k = Math.round(el.getBoundingClientRect().top);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(el);
  }
  const rs = [...m.values()], row = rs[rs.length - 1], el = row[row.length - 1];
  const above = rs.length > 1 ? rs[rs.length - 2] : null;
  return { n: ps.length, el, row, alone: row.length === 1,
           off: above ? +(cx(el) - cx(above[Math.floor(above.length / 2)])).toFixed(1) : 0 };
}

for (let i = 0; i < 60 && !t.spritesReady; i++) await sleep(100);
if (t.mode !== 'menu') fails.push('setup: not on the menu');
const six = t.ORDER.filter(k => k !== 'owlet');

/* ---- S: six heroes fill the grid ----------------------------------------- */
t.winsSet = {};
t.buildPicker();
let lc = lastCard();
out.S = { n: lc.n, alone: lc.alone,
          rightmost: Math.abs(cx(lc.el) - Math.max(...lc.row.map(cx))) < 1 };
if (lc.n !== 6) fails.push('S: ' + lc.n + ' cards, expected 6');
if (lc.alone) fails.push('S: the 6th card sits on a row of its own');
if (!out.S.rightmost) fails.push('S: the 6th card is not rightmost in its row');

/* ---- L: the locked «?» alone on the last row ------------------------------ */
t.winsSet = winsOf(six.slice(0, 3));
t.buildPicker();
lc = lastCard();
out.L = { n: lc.n, locked: lc.el.classList.contains('locked'),
          alone: lc.alone, off: lc.off };
if (lc.n !== 7 || !lc.el.classList.contains('locked'))
  fails.push('L: the «?» slot is not the last of 7 cards');
else if (lc.alone && Math.abs(lc.off) > 1)
  fails.push('L: the «?» is off centre by ' + lc.off + ' px');

/* ---- O: the owlet alone on the last row ----------------------------------- */
t.winsSet = winsOf(six);
t.buildPicker();
lc = lastCard();
out.O = { n: lc.n, kind: lc.el.dataset.kind, alone: lc.alone, off: lc.off };
if (lc.n !== 7 || lc.el.dataset.kind !== 'owlet')
  fails.push('O: the owlet is not the last of 7 cards');
else if (lc.alone && Math.abs(lc.off) > 1)
  fails.push('O: the owlet is off centre by ' + lc.off + ' px');

({ ...out, fails, pass: fails.length === 0 })
