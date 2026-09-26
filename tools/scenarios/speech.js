// v10: the hero's own words stay up long enough for a child to read them.
//   python3 tools/run-scenario.py tools/scenarios/speech.js
//   python3 tools/run-scenario.py tools/scenarios/speech.js --size 320x568
//   python3 tools/run-scenario.py tools/scenarios/speech.js --size 568x320
const t = __t, fails = [], out = {}, errs = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
window.addEventListener('error', e => errs.push(String(e.message)));
const key = type => window.dispatchEvent(new KeyboardEvent(type, { code: 'Space', key: ' ' }));
async function until(fn, ms) {
  for (let i = 0; i < ms / 50; i++) { if (fn()) return true; await sleep(50); }
  return fn();
}
const standing = () => t.mode === 'play' && t.phase === 'stand';
const fresh = async () => { if (!standing()) { t.startGame(); await until(standing, 4000); } };
const says = () => t.pops.filter(p => p.say);
const LONG = 'Совёнок видит в темноте — ему лампа не нужна!';   // the longest idle line, 45 letters
for (let i = 0; i < 60 && !t.spritesReady; i++) await sleep(100);
document.getElementById('playBtn').click();
await until(standing, 3000);
t.voiceAt = 999;                                        // the real idle voice keeps out of the way

/* ---- 1. the reading-time table (Decision 1 −: all four are 3) ---- */
out.table = { meow: t.sayDur('Мяу!'), dizzy: t.sayDur('Ой, голова кружится!'),
              long: t.sayDur(LONG), huge: t.sayDur('x'.repeat(120)) };
if (out.table.meow !== 1.8) fails.push('1: «Мяу!» lasts ' + out.table.meow + ' s (want 1.8)');
if (!(out.table.dizzy > 2.5 && out.table.dizzy < 2.7)) fails.push('1: the dizzy line lasts ' + out.table.dizzy);
if (!(out.table.long > 4.2 && out.table.long <= 4.5)) fails.push('1: the long line lasts ' + out.table.long);
if (out.table.huge !== 4.5) fails.push('1: no cap at 4.5 s: ' + out.table.huge);

/* ---- 2. the idle voice: «Мяу!» is still solid at 1.2 s (it used to be gone at 0.95 s) ---- */
const d0 = t.speakUp();
const p0 = says()[0];
out.idle = p0 ? { t: p0.t, max: p0.max, d: d0 } : null;
if (!p0) fails.push('2: speakUp left no spoken line');
else {
  if (Math.abs(p0.max - t.sayDur(p0.t)) > 1e-9) fails.push('2: lasts ' + p0.max + ', sayDur says ' + t.sayDur(p0.t));
  if (d0 !== p0.max) fails.push('2: speakUp returned ' + d0 + ' (want ' + p0.max + ')');
  await sleep(1200);
  if (!says().includes(p0)) fails.push('2: the line was gone after 1.2 s');
  else if (t.popAlpha(p0) !== 1) fails.push('2: already fading at 1.2 s: ' + t.popAlpha(p0));
}

/* ---- 3. the longest line is still solid at 3.5 s ---- */
t.heroSay(LONG, '#ffffff', 0.55, 1.75);
const pL = says().find(p => p.t === LONG);
await sleep(3500);
out.long = pL ? { left: +pL.life.toFixed(2), alpha: t.popAlpha(pL) } : null;
if (!pL || !says().includes(pL) || t.popAlpha(pL) !== 1) fails.push('3: the long line was not solid for 3.5 s: ' + JSON.stringify(out.long));

/* ---- 4. one line at a time (Decision 2 −: delete this block) ---- */
t.heroSay('Мяу!', '#ffffff', 0.55, 1.75);
t.heroSay('Угу-угу!', '#ffffff', 0.55, 1.75);
out.one = says().map(p => p.t);
if (out.one.length !== 1 || out.one[0] !== 'Угу-угу!') fails.push('4: lines on screen: ' + JSON.stringify(out.one));

/* ---- 5. the idle voice waits until the last line has gone ---- */
t.pops.length = 0;
t.voiceAt = t.idleT;                                    // due now
await sleep(150);
const pv = says()[0];
out.rhythm = pv ? { gap: +(t.voiceAt - t.idleT).toFixed(2), life: +pv.life.toFixed(2) } : null;
if (!pv) fails.push('5: the idle voice did not speak');
else if (!(t.voiceAt - t.idleT >= pv.life + 1.4)) fails.push('5: the next line is due before this one is gone: ' + JSON.stringify(out.rhythm));
t.voiceAt = 999;

/* ---- 6. a jump mid-sentence: the line rides along and fades out within 0.45 s ---- */
await fresh();
t.pops.length = 0;
t.heroSay(LONG, '#ffffff', 0.55, 1.75);
const pr = says()[0];
const x0 = pr.x;
key('keydown'); await sleep(220); key('keyup');
await sleep(150);
out.ride = { phase: t.phase, moved: +(pr.x - x0).toFixed(1),
             off: +(pr.x - (t.hop.x + pr.ox)).toFixed(2), left: +pr.life.toFixed(2) };
if (t.phase !== 'air') fails.push('6: no flight to test (phase ' + t.phase + ')');
else {
  if (!(Math.abs(out.ride.moved) > 5)) fails.push('6: the line stayed behind: ' + JSON.stringify(out.ride));
  if (Math.abs(out.ride.off) > 0.5) fails.push('6: the line is off the hero: ' + JSON.stringify(out.ride));
  if (!(pr.life <= 0.45)) fails.push('6: ' + pr.life.toFixed(2) + ' s left after take-off (want <= 0.45)');
}
await sleep(450);
if (says().length) fails.push('6: the line outlived the take-off by 0.6 s');
await until(() => t.phase !== 'air', 3000);

/* ---- 7. riding while standing: the line keeps its place over the head ---- */
await fresh();
t.voiceAt = 999;
t.heroSay('Мяу!', '#ffffff', 0.55, 1.75);
const ps = says()[0];
await sleep(300);
out.stand = { off: +(ps.x - (t.hop.x + ps.ox)).toFixed(2), above: +(t.hop.y - ps.y).toFixed(1) };
if (Math.abs(out.stand.off) > 0.5) fails.push('7: the line drifted off the hero: ' + JSON.stringify(out.stand));
if (!(out.stand.above > t.KW * 1.7)) fails.push('7: the line is not above the head: ' + JSON.stringify(out.stand));

/* ---- 8. falling asleep hushes it; waking says «ОЙ! Я НЕ СПЛЮ!» for its reading time ---- */
t.heroSay(LONG, '#ffffff', 0.55, 1.75);
t.idleT = 40;
await sleep(700);
out.sleep = { asleep: t.hop.sleep > 0, said: says().map(p => p.t) };
if (!out.sleep.asleep) fails.push('8: did not fall asleep');
if (out.sleep.said.length) fails.push('8: still talking in its sleep: ' + out.sleep.said.join(' | '));
key('keydown'); await sleep(80); key('keyup');
await sleep(80);
const pw = says()[0];
out.wake = pw ? { t: pw.t, max: pw.max } : null;
if (!pw || pw.t !== 'ОЙ! Я НЕ СПЛЮ!') fails.push('8: waking said ' + JSON.stringify(out.wake));
else if (Math.abs(pw.max - t.sayDur(pw.t)) > 1e-9) fails.push('8: the wake line lasts ' + pw.max);
t.voiceAt = 999;

/* ---- 9. long lines stay on screen; short ones are left alone (run at 3 sizes) ---- */
await fresh();
t.voiceAt = 999;
t.heroSay(LONG, '#ffffff', 0.55, 1.75);
const bl = t.sayScreenBox(says()[0]);
out.boxLong = bl;
if (!bl) fails.push('9: no sayLayout');
else {
  if (bl.left < 0 || bl.right > bl.vw) fails.push('9: the long line runs off screen: ' + JSON.stringify(bl));
  if (bl.lines > 2) fails.push('9: split into ' + bl.lines + ' lines');
}
t.heroSay('Мяу!', '#ffffff', 0.55, 1.75);
const bs = t.sayScreenBox(says()[0]);
out.boxShort = bs;
if (bs && (bs.lines !== 1 || Math.abs(bs.cx - bs.ownCx) > 0.5))
  fails.push('9: a short line was moved or split: ' + JSON.stringify(bs));

/* ---- 10. the firefly's hello gets reading time too, and stays where it was said ---- */
await fresh();
t.pops.length = 0;
t.fireflyWake();
const pf = t.pops.find(p => p.t === 'Свет без розетки!');
out.firefly = pf ? { max: pf.max, say: !!pf.say } : null;
if (!pf) fails.push('10: no firefly hello');
else {
  if (Math.abs(pf.max - t.sayDur(pf.t)) > 1e-9) fails.push('10: the hello lasts ' + pf.max);
  if (pf.say) fails.push('10: the firefly\'s words ride with the hero');
}

if (errs.length) fails.push('page errors: ' + errs.join(' | '));
({ ...out, fails, pass: fails.length === 0 })
