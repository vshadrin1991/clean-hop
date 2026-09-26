// v10 hero jump body language: crouch and lean while held, a take-off
// stretch that grows with power, stretched at speed and round at the apex,
// a landing squash that grows with the fall, and the full-power flip.
//   python3 tools/run-scenario.py tools/scenarios/jump.js
const t = __t, fails = [], out = {};
const wait = ms => new Promise(r => setTimeout(r, ms));
const near = (a, b, e) => Math.abs(a - b) <= e;
const key = type => window.dispatchEvent(new KeyboardEvent(type, { code: 'Space', key: ' ' }));
const nextStone = () => t.stones
  .filter(s => !s.visited && s.x > t.hop.x + 1 && s.type !== 'finish')
  .sort((a, b) => a.x - b.x)[0];
const landNext = vy => {                  // touch down on the next island at speed vy
  const s = nextStone();
  if (s.type === 'crumble') s.type = 'normal';     // never sink mid-test
  t.hop.x = s.x + (s.gadget ? s.gadget.dx * s.w : 0);
  t.hop.vy = vy;
  t.land(s, t.stoneTop(s));
};
document.getElementById('playBtn').click();
await wait(700);

/* 1. the pose table */
const P = t.jumpPose;
const c0 = P('charge', 0, 0, 0), c5 = P('charge', 0.5, 0, 0), c1 = P('charge', 1, 0, 0);
out.pose = { c0, c5, c1 };
if (!near(c0.sqz, 0, 1e-6) || !near(c0.lean, 0, 1e-6)) fails.push('charge 0 is not neutral');
if (!near(c1.sqz, -0.24, 0.005)) fails.push('full crouch sqz ' + c1.sqz + ' (want -0.24)');
if (!near(c1.lean, -0.12, 0.005)) fails.push('full crouch lean ' + c1.lean + ' (want -0.12)');
if (!near(c1.crouch, 1, 0.005)) fails.push('full crouch head dip ' + c1.crouch + ' (want 1)');
if (!(c5.sqz <= -0.17)) fails.push('half-charge crouch ' + c5.sqz + ' is not eased out (want <= -0.17)');
const up = P('air', 0, -10, 10), apex = P('air', 0, 0, 10), down = P('air', 0, 10, 10);
if (!near(up.sqz, 0.10, 0.005) || !near(down.sqz, 0.10, 0.005))
  fails.push('flight stretch ' + up.sqz + ' / ' + down.sqz + ' (want 0.10)');
if (!near(apex.sqz, 0, 1e-6)) fails.push('the apex is not round: ' + apex.sqz);
if (!near(P('air', 0, 5, 0).sqz, 0, 1e-6)) fails.push('v0 = 0 must give a neutral pose');
if (!near(P('stand', 1, 0, 10).sqz, 0, 1e-6)) fails.push('standing pose is not neutral');

/* 2. holding the jump: the live spring sinks into the crouch and leans back */
key('keydown');
await wait(t.LVL.swing * 900);            // near the top of the power swing
out.held = { phase: t.phase, charge: +t.charge.toFixed(2), sqz: +t.hop.sqz.toFixed(3),
             lean: t.hop.pose ? +t.hop.pose.lean.toFixed(3) : null };
if (t.phase !== 'charge') fails.push('holding Space did not charge: ' + t.phase);
if (!(t.hop.sqz < -0.12)) fails.push('held crouch sqz ' + t.hop.sqz + ' (want < -0.12)');
if (!(t.hop.pose && t.hop.pose.lean < -0.08)) fails.push('no lean-back while held');

/* 3. release: the take-off stretch scales with power */
const pw = t.charge;
key('keyup');
out.takeoff = { p: +pw.toFixed(2), sqz: +t.hop.sqz.toFixed(3) };
if (t.phase !== 'air') fails.push('release did not jump: ' + t.phase);
if (!(t.hop.sqz >= 0.10 + 0.14 * pw - 0.01)) fails.push('take-off stretch ' + t.hop.sqz + ' at power ' + pw);

/* 4. a hard landing squashes harder, then settles */
landNext(t.hop.v0);
out.landHard = +t.hop.sqz.toFixed(3);
if (!(t.hop.sqz <= -0.19)) fails.push('hard landing squash ' + t.hop.sqz + ' (want <= -0.19)');
await wait(500);
if (Math.abs(t.hop.sqz) > 0.05) fails.push('landing squash did not settle: ' + t.hop.sqz);

/* 5. (Decision 3) full power flips; landing half-way rights itself fast */
t.jumpWith(1);
out.flip = !!t.hop.flip;
if (!t.hop.flip) fails.push('a full-power jump did not flip');
t.hop.flipT = t.hop.flipDur * 0.5;        // the island arrived early: mid-flip
landNext(t.hop.v0);
out.spinAtLand = +(t.hop.spin || 0).toFixed(3);
if (!(Math.abs(t.hop.spin) > 1)) fails.push('mid-flip landing lost its angle (snapped): ' + t.hop.spin);
await wait(400);
out.spinAfter = +(t.hop.spin || 0).toFixed(3);
if (Math.abs(t.hop.spin || 0) > 0.05) fails.push('still tilted ' + t.hop.spin + ' rad 0.4 s after a mid-flip landing');

/* 6. a tap-jump is still a jump */
await wait(300);
const s0 = t.jumpWith(0.04);
out.tap = { sqz: +s0.toFixed(3), flip: !!t.hop.flip };
if (!(s0 >= 0.10)) fails.push('tap take-off stretch ' + s0 + ' (want >= 0.10)');
if (t.hop.flip) fails.push('a tap must not flip');
landNext(t.hop.v0 * 0.2);
out.landSoft = +t.hop.sqz.toFixed(3);
if (!(t.hop.sqz <= -0.12 && t.hop.sqz > -0.15)) fails.push('soft landing squash ' + t.hop.sqz + ' (want -0.12 .. -0.15)');
({ ...out, fails, pass: fails.length === 0 })
