// v10.3 turning the phone mid-run (plan §3.1). Every screen:
//   python3 tools/phones.py rotate.js
// Headless Chrome can't rotate, so turn() swaps innerWidth/innerHeight and
// fires 'resize' - layout() reads nothing else.
// menu     the menu's islands are rebuilt for the new screen
// scenery  a resize to the same width keeps the factories and the shore
// standing every island ahead has a landing spot inside MIN_D..MAX_D
// charge   a held jump is let go by the turn; the release fires nothing
// air      a turn mid-air rebuilds the course right after the landing
// finish   with the bar full the meadow is still ahead, once, reachable,
//          and «ФИНИШ ВПЕРЕДИ!» does not pop up a second time
const t = __t, wait = ms => new Promise(r => setTimeout(r, ms));
const W0 = innerWidth, H0 = innerHeight;
const turn = (w, h) => {
  Object.defineProperty(window, 'innerWidth', { value: w, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: h, configurable: true });
  window.dispatchEvent(new Event('resize'));
};
const ahead = () => t.stones.filter(s => s !== t.hop.onStone && s.ax > t.hop.x)
                            .sort((a, b) => a.ax - b.ax);
function unreachable() {           // gaps with no landing spot in MIN_D..MAX_D
  let x = t.hop.x; const bad = [];
  for (const s of ahead()) {
    const g = s.ax - x, half = s.w / 2;
    if (g - half > t.MAX_D || g + half < t.MIN_D) bad.push(Math.round(g));
    x = s.ax;
  }
  return bad;
}
const nextIsland = () => ahead().filter(s => !s.visited && s.type !== 'finish')[0];
async function hopOn(n) {
  for (let i = 0; i < n && t.mode === 'play'; i++) {
    const s = nextIsland(); if (!s) break;
    t.hop.x = s.x; t.land(s, t.stoneTop(s)); await wait(250);
  }
}
const cv = document.getElementById('game');
const down = () => cv.dispatchEvent(new PointerEvent('pointerdown',
  { bubbles: true, clientX: 100, clientY: 300, pointerId: 1 }));
const up = () => window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));
const scenery = () => JSON.stringify([t.shore.slice(0, 4).map(o => Math.round(o.x)),
                                      t.factories.slice(0, 4).map(f => Math.round(f.x))]);
const fails = [], out = { vw: W0, vh: H0 };
const check = (name, bad) => { out[name] = bad; if (bad.length) fails.push(name + ': ' + bad); };

for (let i = 0; i < 60 && !t.spritesReady; i++) await wait(100);
turn(H0, W0); await wait(150);
check('menu', unreachable());
turn(W0, H0); await wait(150);

const sc = scenery();
window.dispatchEvent(new Event('resize')); await wait(100);
if (scenery() !== sc) fails.push('scenery: a same-size resize reshuffled it');

document.getElementById('playBtn').click();
await wait(1800);
await hopOn(3);
turn(H0, W0); await wait(200);
check('standing', unreachable());
turn(W0, H0); await wait(200);
check('back', unreachable());

down(); await wait(200);
turn(H0, W0); await wait(200);
if (t.phase !== 'stand') fails.push('charge: the turn did not let go (' + t.phase + ')');
up(); await wait(100);
if (t.phase !== 'stand') fails.push('charge: the release after the turn jumped (' + t.phase + ')');
check('charge', unreachable());
turn(W0, H0); await wait(200);

down(); await wait(250); up(); await wait(60);
out.airPhase = t.phase;
turn(H0, W0); await wait(50);
const s = nextIsland();
t.hop.x = s.x; t.land(s, t.stoneTop(s)); await wait(300);
check('air', unreachable());
turn(W0, H0); await wait(200);

t.energy = 999;                                   // the bar is full: the meadow comes
for (let i = 0; i < 12 && t.mode === 'play' && !ahead().some(s => s.type === 'finish'); i++)
  await hopOn(1);
const cheer = p => p.t === 'ФИНИШ ВПЕРЕДИ!';
for (let i = 0; i < 30 && !t.pops.some(cheer); i++) await wait(100);   // cued once
await wait(400);
turn(H0, W0); await wait(150);
const again = t.pops.filter(p => cheer(p) && p.max - p.life < 0.3).length;
const meadows = ahead().filter(s => s.type === 'finish').length;
if (meadows !== 1) fails.push('finish: ' + meadows + ' meadows ahead after the turn');
check('finish', unreachable());
if (again) fails.push('finish: «ФИНИШ ВПЕРЕДИ!» popped up again');
({ ...out, fails, pass: fails.length === 0 })
