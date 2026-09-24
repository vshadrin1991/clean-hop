// Heroes who reached the finish wear a green border in the picker (v9.8).
//   N  no wins: no green border anywhere
//   W  a hero with a win is green and says so to screen readers; heroes
//      without one stay clear
//   S  the selected hero keeps its yellow fill and tick when it turns green
//   L  the locked «?» slot never turns green
//   O  the owlet is green only after its own win
//   M  a win recorded during a run shows as soon as the menu opens
//   python3 tools/run-scenario.py tools/scenarios/picker-won.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
async function until(fn, ms) {
  for (let i = 0; i < ms / 50; i++) { if (fn()) return true; await sleep(50); }
  return fn();
}
const GREEN = 'rgb(47, 143, 67)';                  // --leaf-dk
const card = k => document.querySelector('#picker .pick[data-kind="' + k + '"]');
const border = el => getComputedStyle(el).borderTopColor;
const greens = () => Array.from(document.querySelectorAll('#picker .pick'))
  .filter(el => border(el) === GREEN).map(el => el.dataset.kind || 'locked');
const winsOf = ks => Object.fromEntries(ks.map(k => [k, true]));

for (let i = 0; i < 60 && !t.spritesReady; i++) await sleep(100);
if (t.mode !== 'menu') fails.push('setup: not on the menu');
const six = t.ORDER.filter(k => k !== 'owlet');
const me = t.chosen;
const others = six.filter(k => k !== me);

/* ---- N: no wins, no green ----------------------------------------------- */
t.winsSet = {};
t.buildPicker();
out.N = { greens: greens() };
if (out.N.greens.length) fails.push('N: green with no wins: ' + out.N.greens.join(', '));

/* ---- W: the chosen hero and two others have won ------------------------- */
const won3 = [me, others[0], others[1]];
t.winsSet = winsOf(won3);
t.buildPicker();
out.W = { greens: greens(), label: card(others[0]).getAttribute('aria-label'),
          tip: card(others[0]).title };
for (const k of won3)
  if (border(card(k)) !== GREEN) fails.push('W: ' + k + ' has a win but no green border');
for (const k of others.slice(2))
  if (border(card(k)) === GREEN) fails.push('W: ' + k + ' is green without a win');
if (!/финиш пройден/.test(out.W.label || ''))
  fails.push('W: screen readers are not told (label "' + out.W.label + '")');
if (out.W.tip !== 'Финиш пройден!') fails.push('W: the tooltip says "' + out.W.tip + '"');
const plain = card(others[2]);
if (plain.hasAttribute('aria-label') || plain.title)
  fails.push('W: a hero without a win is labelled as finished');

/* ---- S: selected and green ---------------------------------------------- */
const sel = card(me), cs = getComputedStyle(sel);
out.S = { checked: sel.getAttribute('aria-checked'), bg: cs.backgroundColor,
          tick: getComputedStyle(sel, '::after').content };
if (out.S.checked !== 'true') fails.push('S: the chosen hero is not selected');
if (out.S.bg !== 'rgb(255, 243, 201)')             // --volt-soft
  fails.push('S: the selected fill turned ' + out.S.bg);
if (!/✓/.test(out.S.tick)) fails.push('S: the selected tick is gone');

/* ---- L: three wins bring the «?» slot, and it stays clear ---------------- */
const lk = document.querySelector('#picker .pick.locked');
out.L = { locked: !!lk, border: lk && border(lk) };
if (!lk) fails.push('L: three wins but no «?» slot');
else if (out.L.border === GREEN) fails.push('L: the «?» slot is green');

/* ---- O: the owlet, before and after its own win ------------------------- */
t.winsSet = winsOf(six);                           // all six: the owlet comes
t.buildPicker();
out.O = { before: card('owlet') && border(card('owlet')) };
if (!card('owlet')) fails.push('O: all six won but no owlet');
else if (out.O.before === GREEN) fails.push('O: the owlet is green before its own win');
t.winsSet = winsOf(six.concat('owlet'));
t.buildPicker();
out.O.after = card('owlet') && border(card('owlet'));
out.O.greens = greens().length;
if (out.O.after !== GREEN) fails.push('O: the owlet won but is not green');
if (out.O.greens !== 7) fails.push('O: ' + out.O.greens + ' green heroes, expected 7');

/* ---- M: a win from a run shows when the menu opens ---------------------- */
t.winsSet = {};
t.buildPicker();
t.startGame();
await until(() => t.mode === 'play', 4000);
t.winsSet = winsOf([me]);                          // what a real finish records
document.getElementById('menuBtn').click();        // «В меню»
await until(() => t.mode === 'menu', 2000);
out.M = { mode: t.mode, greens: greens() };
if (out.M.mode !== 'menu') fails.push('M: «В меню» did not open the menu');
if (!out.M.greens.includes(me)) fails.push('M: the new win does not show in the menu');

({ ...out, fails, pass: fails.length === 0 })
