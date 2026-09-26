// v10 focus face: while the jump is held the hero frowns at its target -
// lids down and slanting to the nose, eyes on the aim ring, no blinking -
// and the face relaxes again after take-off or a cancelled hold.
//   python3 tools/run-scenario.py tools/scenarios/face.js
const t = __t, fails = [], out = {};
const wait = ms => new Promise(r => setTimeout(r, ms));
const near = (a, b, e) => Math.abs(a - b) <= e;
const key = type => window.dispatchEvent(new KeyboardEvent(type, { code: 'Space', key: ' ' }));
async function until(fn, ms) {
  for (let i = 0; i < ms / 50; i++) { if (fn()) return true; await wait(50); }
  return fn();
}
const standing = () => t.mode === 'play' && t.phase === 'stand';
const fresh = async () => { if (!standing()) { t.startGame(); await until(standing, 4000); } };
for (let i = 0; i < 60 && !t.spritesReady; i++) await wait(100);
document.getElementById('playBtn').click();
await until(standing, 3000);

/* 1. the face table */
const F = t.focusFace;
const calm = F(0, 0, false), low = F(1, 0.2, false), half = F(1, 0.5, false), full = F(1, 1, false);
out.table = { calm, half, full };
if (calm.lid !== 0 || calm.look !== 0) fails.push('focus 0 is not the calm face: ' + JSON.stringify(calm));
if (!near(half.lid, 1, 1e-6)) fails.push('full focus lid ' + half.lid + ' (want 1)');
if (!near(half.look, 0.60, 0.005)) fails.push('half power look ' + half.look + ' (want 0.60)');
if (!near(full.look, 0.80, 0.005)) fails.push('full power look ' + full.look + ' (want 0.80)');
if (!(low.look < half.look && half.look < full.look)) fails.push('the eyes do not follow the ring out');

/* 2. holding: the focus eases in, the eyes go to the ring, no blinking */
key('keydown');
await wait(400);
t.hop.blink = 0.1;                               // a blink falls due mid-hold
const held = t.heroOpts();
out.held = { phase: t.phase, focus: +t.hop.focus.toFixed(3), look: +held.look.toFixed(2),
             blink: held.blink, lid: +held.focus.toFixed(3) };
if (t.phase !== 'charge') fails.push('holding Space did not charge: ' + t.phase);
if (!(t.hop.focus > 0.9)) fails.push('focus 0.4 s into the hold ' + t.hop.focus + ' (want > 0.9)');
if (!(held.focus > 0.9)) fails.push('heroOpts lid ' + held.focus + ' (want > 0.9)');
if (!(held.look > 0.3)) fails.push('eyes not on the target: look ' + held.look + ' (want > 0.3)');
if (held.blink) fails.push('blinked while focused');

/* 3. take-off: the frown melts within half a second, blinking comes back */
key('keyup');
await wait(550);
out.afterJump = +t.hop.focus.toFixed(3);
if (!(t.hop.focus < 0.05)) fails.push('focus 0.55 s after take-off ' + t.hop.focus + ' (want < 0.05)');
t.hop.blink = 0.1;
if (!t.heroOpts().blink) fails.push('blinking did not come back after take-off');

/* 4. a hold cut short by losing the window relaxes the face too */
await until(() => t.phase !== 'air', 3000);
await fresh();
key('keydown');
await wait(300);
window.dispatchEvent(new Event('blur'));
await wait(550);
out.cancelled = { phase: t.phase, focus: +t.hop.focus.toFixed(3) };
if (t.phase !== 'stand') fails.push('blur did not cancel the hold: ' + t.phase);
if (!(t.hop.focus < 0.05)) fails.push('focus 0.55 s after a cancelled hold ' + t.hop.focus + ' (want < 0.05)');
key('keyup');

/* 5. a new run starts calm, even from the middle of a hold */
key('keydown');
await wait(300);
t.startGame();
out.newRun = t.hop.focus;
if (t.hop.focus !== 0) fails.push('a new run starts with focus ' + t.hop.focus);
key('keyup');
await until(standing, 4000);

/* 6. the lids, in pixels: W = 100, feet at (100, 190) on a 200 px canvas */
const W = 100;
const EYE = k => ({                              // mirrors drawAnimal's eye block
  ey: -W * (0.80 + 0.37 * 0.06), ex: W * 0.20,
  erx: W * (k === 'dog' ? 0.17 : k === 'owlet' ? 0.185 : 0.155),
  ery: W * (k === 'dog' ? 0.195 : k === 'owlet' ? 0.225 : 0.175) });
const img = (k, o) => { const c = t.paintAnimal(k, o, W);
  return c.getContext('2d').getImageData(0, 0, c.width, c.height).data; };
const at = (d, x, y) => { const i = (Math.round(y + W * 1.9) * W * 2 + Math.round(x + W)) * 4;
  return [d[i], d[i + 1], d[i + 2]]; };
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const dist = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
const same = (A, B) => A.length === B.length && A.every((v, i) => v === B[i]);

/* Smiling eyes, not a frown: the eye closes up from BELOW along a curve
   that rises in the middle (cheeks pushing up), and the top of the eye -
   where a frown would sit - is never touched. */
const L = t.lidEdge;
if (!(L(0, 0) >= 1 && L(0, 0.5) >= 1 && L(0, 1) >= 1)) fails.push('the eyes are not fully open at focus 0');
if (!near(L(1, 0.2), L(1, 0.8), 1e-9)) fails.push('the lids are not symmetric: ' + L(1, 0.2) + ' / ' + L(1, 0.8));
if (!(L(1, 0.5) < L(1, 0.1) - 0.15)) fails.push('the lower lids do not curve up into a smile: ' + L(1, 0.1) + ' / ' + L(1, 0.5));
if (!(L(1, 0.5) > 0.08 + 0.2)) fails.push('full focus hides the pupil centre: edge ' + L(1, 0.5));
out.lids = {};
for (const k of Object.keys(t.ANIMALS)) {
  const e = EYE(k);
  const calm = img(k, { t: 0 }), on = img(k, { t: 0, focus: 1 });
  if (!same(calm, img(k, { t: 0, focus: 0 }))) fails.push(k + ': focus 0 is not the old face');
  if (!same(img(k, { t: 0, yuck: true }), img(k, { t: 0, yuck: true, focus: 1 })))
    fails.push(k + ': lids drawn over the "yuck" eyes');
  if (!same(img(k, { t: 0, blink: true }), img(k, { t: 0, blink: true, focus: 1 })))
    fails.push(k + ': lids drawn over shut eyes');
  const r = [];
  for (const side of [-1, 1]) {                  // -1 = the left eye
    const cx = side * e.ex, where = k + (side < 0 ? ' left' : ' right') + ' eye';
    let top = 0, low = 0, box = 0;
    for (let y = e.ey - e.ery * 1.2; y <= e.ey + e.ery * 1.2; y++)
      for (let x = cx - e.erx * 1.2; x <= cx + e.erx * 1.2; x++) {
        box++;
        if (dist(at(on, x, y), at(calm, x, y)) <= 40) continue;
        if (y < e.ey) top++; else low++;
      }
    r.push({ top, low: +(low / box).toFixed(3) });
    if (top > 0) fails.push(where + ': ' + top + ' px changed in the top half - that is a frown');
    if (!(low / box >= 0.03)) fails.push(where + ': the lower lid hides almost nothing (' + low + ' px)');
  }
  out.lids[k] = r;
}

/* 7. (Decision 1) the concentration tongue: out on the jump side, never
   through a beak, never over "yuck" or an open mouth */
const pink = hex('#ff7f9c');
const pinkIn = (d, k) => {                       // pink pixels right of the nose, under it
  const e = EYE(k); let n = 0;
  for (let y = e.ey + e.ery * 1.0; y <= e.ey + e.ery * 2.4; y++)
    for (let x = 0; x <= W * 0.3; x++) if (dist(at(d, x, y), pink) <= 12) n++;
  return n;
};
out.tongue = {};
for (const k of Object.keys(t.ANIMALS)) {
  const n0 = pinkIn(img(k, { t: 0, focus: 1 }), k);
  const n1 = pinkIn(img(k, { t: 0, focus: 1, focusTongue: 1 }), k);
  const beak = k === 'duck' || k === 'owlet' || k === 'penguin';
  out.tongue[k] = n1 - n0;
  if (beak && n1 !== n0) fails.push(k + ': a tongue through the beak');
  if (!beak && !(n1 - n0 >= 12)) fails.push(k + ': no tongue at full focus (' + (n1 - n0) + ' px)');
  if (!same(img(k, { t: 0, yuck: true }), img(k, { t: 0, yuck: true, focusTongue: 1 })))
    fails.push(k + ': tongue over the "yuck" face');
  if (!same(img(k, { t: 0, speak: true }), img(k, { t: 0, speak: true, focusTongue: 1 })))
    fails.push(k + ': tongue over the open mouth');
}
if (t.focusFace(0.3, 0.5, false).tongue !== 0) fails.push('tongue out before the focus builds');
if (!near(t.focusFace(1, 0.5, false).tongue, 1, 1e-6)) fails.push('no full tongue at full focus');

/* 8. (Decision 2) full power: pink cheeks and a sweat drop - none before */
const drop = hex('#8fd8ff');
const count = (d, c) => { let n = 0;
  for (let i = 0; i < d.length; i += 4)
    if (Math.max(Math.abs(d[i] - c[0]), Math.abs(d[i + 1] - c[1]), Math.abs(d[i + 2] - c[2])) <= 10) n++;
  return n; };
out.flush = {};
for (const k of Object.keys(t.ANIMALS)) {
  const e = EYE(k), cy = e.ey + e.ery * 1.40;
  const calm = img(k, { t: 0 }), hot = img(k, { t: 0, flush: 1 });
  const dl = dist(at(hot, -W * 0.31, cy), at(calm, -W * 0.31, cy));
  const dr = dist(at(hot, W * 0.31, cy), at(calm, W * 0.31, cy));
  const drops = count(hot, drop) - count(calm, drop);
  out.flush[k] = { dl, dr, drops };
  if (!(dl > 15 && dr > 15)) fails.push(k + ': no pink cheeks at full power (' + dl + ', ' + dr + ')');
  if (!(drops >= 15)) fails.push(k + ': no sweat drop at full power (' + drops + ' px)');
  if (!same(img(k, { t: 0, yuck: true }), img(k, { t: 0, yuck: true, flush: 1 })))
    fails.push(k + ': strain drawn over the "yuck" face');
}
if (t.focusFace(1, 0.85, false).flush !== 0) fails.push('flushed below full power');
if (!near(t.focusFace(1, 0.925, false).flush, 0.5, 0.01))
  fails.push('half-way flush ' + t.focusFace(1, 0.925, false).flush + ' (want 0.5)');
if (!near(t.focusFace(1, 1, false).flush, 1, 1e-6)) fails.push('full power flush is not 1');

/* 9. (Decision 3) the secret jump armed: star eyes, and the frown lifts */
const A = t.focusFace(1, 1, true);
out.armed = A;
if (A.lid !== 0 || A.wow !== true) fails.push('armed face ' + JSON.stringify(A));
if (A.tongue || A.flush) fails.push('the armed face still strains: ' + JSON.stringify(A));
if (t.focusFace(0.3, 1, true).wow) fails.push('star eyes before the focus builds');
if (t.focusFace(1, 1, false).wow) fails.push('star eyes without the secret');
const gold = hex('#ffd44a');
const goldIn = (d, k, side) => { const e = EYE(k); let n = 0;
  for (let y = e.ey - e.ery; y <= e.ey + e.ery; y++)
    for (let x = side * e.ex - e.erx; x <= side * e.ex + e.erx; x++)
      if (dist(at(d, x, y), gold) <= 12) n++;
  return n; };
out.stars = {};
for (const k of Object.keys(t.ANIMALS)) {
  const plain = img(k, { t: 0 }), wow = img(k, { t: 0, wow: true });
  const nl = goldIn(wow, k, -1) - goldIn(plain, k, -1), nr = goldIn(wow, k, 1) - goldIn(plain, k, 1);
  out.stars[k] = [nl, nr];
  if (!(nl >= 10 && nr >= 10)) fails.push(k + ': no star eyes (' + nl + ', ' + nr + ')');
}
/* live: hold to the secret, then let the window go, so no leap is taken */
await fresh();
key('keydown');
await wait(150);
t.chargeT = 9.85;                                // wind the hold clock to just short of 10 s
await wait(450);
const live = t.heroOpts();
out.armedLive = { armed: t.eggArmed, wow: live.wow, lid: live.focus };
if (!t.eggArmed) fails.push('the secret did not arm');
if (!live.wow || live.focus !== 0) fails.push('armed in play, but the face is ' + JSON.stringify(out.armedLive));
window.dispatchEvent(new Event('blur'));
key('keyup');
await until(standing, 2000);

/* 10. (Decision 4) take-off: the mouth pops open for a moment, then shuts */
await fresh();
key('keydown');
await wait(300);
key('keyup');
await wait(60);
out.whee = { early: t.heroOpts().speak };
if (!t.heroOpts().speak) fails.push('no "Хоп!" mouth just after take-off');
await wait(450);
out.whee.late = t.heroOpts().speak;
if (t.heroOpts().speak && !(t.hop.speak > 0)) fails.push('the take-off mouth is still open 0.5 s later');
({ ...out, fails, pass: fails.length === 0 })
