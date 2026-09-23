// Menu -> game intro (plan §Task 6, D4-A "the lights come on").
// The test build leaves the intro off unless loaded with #intro:
//   python3 tools/run-scenario.py tools/scenarios/intro.js --url intro
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [];

for (let i = 0; i < 60 && !t.spritesReady; i++) await sleep(100);
await sleep(400);                             // let the menu world settle

/* 1: the menu is a real restored world, not a paint-over */
const menuC = t.cleanShown;
if (menuC !== 1) fails.push('menu cleanShown ' + menuC);
const darkF = t.factories.filter(f => f.lightOn < 0.05).length;
if (darkF !== t.factories.length)
  fails.push('menu factories lit: ' + (t.factories.length - darkF));
const woke = t.stones.filter(s => s.gadget && s.gadget.wake !== 0).length;
if (woke) fails.push('menu gadgets awake: ' + woke);

/* 2: start - the sky greys smoothly, never snapping */
document.getElementById('playBtn').click();
const samples = [];
for (let i = 0; i < 36; i++) { await sleep(50); samples.push(t.cleanShown); }
let maxJump = 0;
for (let i = 1; i < samples.length; i++)
  maxJump = Math.max(maxJump, samples[i - 1] - samples[i]);
if (menuC < 0.95 || samples[0] < 0.5)   // a snap would read ~0 at +50ms
  fails.push('intro did not keep the clean world: ' + menuC + ' -> ' + samples[0]);
if (samples[31] > 0.08)
  fails.push('cleanShown still ' + samples[31].toFixed(2) + ' at 1.6s');
if (maxJump > 0.15)
  fails.push('sky snapped: ' + maxJump.toFixed(2) + ' in one 50ms step');

/* 3: at 1.6s every factory is lit and every gadget awake */
const lit = t.factories.filter(f => f.lightOn > 0.9).length;
if (lit !== t.factories.length)
  fails.push('factories still dark at 1.6s: ' + (t.factories.length - lit));
const gs = t.stones.filter(s => s.gadget);
const awake = gs.filter(s => s.gadget.wake === 1).length;
if (awake !== gs.length)
  fails.push('gadgets still asleep at 1.6s: ' + (gs.length - awake));

/* 4: a tap skips the intro without starting a charge */
t.clean = 1;                                  // stand the world back up
await sleep(1400);                            // cleanShown ~ 1 again
t.startGame();                                // restart -> intro plays
await sleep(300);
document.getElementById('game')
  .dispatchEvent(new PointerEvent('pointerdown'));
await sleep(60);                              // ~3 frames
if (t.cleanShown >= 0.05)
  fails.push('skip left cleanShown ' + t.cleanShown.toFixed(2));
if (t.phase === 'charge') fails.push('skip started a charge');

({ menuClean: menuC, samples0: samples[0], maxJump: +maxJump.toFixed(3),
   lit, fails, pass: fails.length === 0 })
