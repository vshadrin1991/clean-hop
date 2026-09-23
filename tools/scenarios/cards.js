// Card text + the hero's advice (v9.3). One viewport per run:
//   python3 tools/run-scenario.py tools/scenarios/cards.js --size 390x844
//   python3 tools/run-scenario.py tools/scenarios/cards.js --size 844x390
// k1  readable sizes: tip >= 17px (>= 14px on screens under 620px tall),
//     eco message >= 16px (13.5px), stats >= 13px (12px) in sentence case
// k2  contrast >= 4.5:1 for the eco message on both card backgrounds and
//     for the "who" line on the white bubble
// k3  the advice: the chosen hero's name and voice, its face painted, and
//     exactly one highlighted action in the tip
// k4  the fade shows only while the card body can still scroll
// k5  sideways (under 460px tall, landscape): the whole tip is visible
//     without scrolling the card body
// k6  the pause card gives advice the same way
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [];
const out = { vw: innerWidth, vh: innerHeight };
const compact = innerHeight <= 620;
const sideways = innerHeight <= 460 && innerWidth > innerHeight;
const px = el => parseFloat(getComputedStyle(el).fontSize);
const rgb = s => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
const lum = c => { const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const $ = id => document.getElementById(id);

for (let i = 0; i < 60 && !t.spritesReady; i++) await sleep(100);
await sleep(300);

/* play as the dog, so the bubble has to follow the picker */
const dogBtn = document.querySelector('#picker [data-kind="dog"]');
if (dogBtn) dogBtn.click();
$('playBtn').click();
await sleep(400);
for (let i = 0; i < 3 && t.mode === 'play'; i++) {
  const n = t.stones.filter(s => !s.visited && s.type !== 'finish' && s.ax > t.hop.x + 1)
                    .sort((a, b) => a.ax - b.ax)[0];
  if (!n) break;
  t.hop.x = n.x + (n.gadget ? n.gadget.dx * n.w : 0);
  t.land(n, t.stoneTop(n));
  await sleep(300);
}

/* k6 first, while the run is live: pause */
$('pauseBtn').click();
await sleep(900);
const pWho = $('pauseWho'), pTip = $('pauseTip');
out.pause = { who: pWho ? pWho.textContent : null,
              marks: pTip ? pTip.querySelectorAll('mark').length : -1 };
if (!pWho || !/Собачка советует:$/.test(pWho.textContent))
  fails.push('k6: pause card has no "Собачка советует:" line');
if (out.pause.marks !== 1) fails.push('k6: pause tip has ' + out.pause.marks + ' highlighted actions');
$('resumeBtn').click();
await sleep(200);

/* the over card with the longest title */
try { t.leaves = 3; } catch (e) {}
t.gameOver();
await sleep(2400);                               // the bubble pops in at ~0.75 s
const tip = $('tipMsg'), eco = $('ecoMsg'), stats = document.querySelector('#over .stats');
const who = $('tipWho'), face = $('tipFace');

/* k1 */
out.sizes = { tip: px(tip), eco: px(eco), stats: px(stats),
              statsCase: getComputedStyle(stats).textTransform };
const want = compact ? { tip: 14, eco: 13.5, stats: 12 } : { tip: 17, eco: 16, stats: 13 };
for (const k of ['tip', 'eco', 'stats'])
  if (out.sizes[k] < want[k] - 0.01) fails.push('k1: ' + k + ' ' + out.sizes[k] + 'px < ' + want[k] + 'px');
if (out.sizes.statsCase === 'uppercase') fails.push('k1: stats still in CAPITALS');

/* k2: against the two card backgrounds and the bubble */
const ecoC = rgb(getComputedStyle(eco).color);
out.contrast = { ecoOnCream: +ratio(ecoC, [255, 250, 240]).toFixed(2),
                 ecoOnWin: +ratio(ecoC, [255, 246, 226]).toFixed(2) };
if (who) {
  const bub = who.closest('.bubble');
  const bg = bub ? rgb(getComputedStyle(bub).backgroundColor) : [255, 243, 201];
  out.contrast.who = +ratio(rgb(getComputedStyle(who).color), bg).toFixed(2);
}
for (const k in out.contrast)
  if (out.contrast[k] < 4.5) fails.push('k2: ' + k + ' contrast ' + out.contrast[k] + ':1 < 4.5:1');

/* k3 */
out.who = who ? who.textContent : null;
if (!who || who.textContent !== 'Гав-гав! Собачка советует:')
  fails.push('k3: who line is "' + out.who + '", want "Гав-гав! Собачка советует:"');
out.marks = tip.querySelectorAll('mark').length;
if (out.marks !== 1) fails.push('k3: tip has ' + out.marks + ' highlighted actions, want 1');
if (/\*/.test(tip.textContent)) fails.push('k3: raw * left in the tip text');
let inked = 0;
if (face && face.width) {
  const d = face.getContext('2d').getImageData(0, 0, face.width, face.height).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 128) inked++;
}
out.facePx = inked;
if (inked < 200) fails.push('k3: the hero face is not painted (' + inked + ' px)');

/* k4 */
const card = document.querySelector('#over .card'), body = card.querySelector('.cbody');
const canScroll = body.scrollTop + body.clientHeight < body.scrollHeight - 2;
out.fade = { canScroll, more: card.classList.contains('more'),
             oldFade: getComputedStyle(card.querySelector('.cfoot'), '::before').content };
if (out.fade.more !== canScroll)
  fails.push('k4: fade is ' + (out.fade.more ? 'on' : 'off') + ' but the body ' +
             (canScroll ? 'can' : 'cannot') + ' scroll');
if (out.fade.oldFade && out.fade.oldFade !== 'none')
  fails.push('k4: the always-on cream fade (.cfoot::before) is still there');
if (canScroll) {
  body.scrollTop = body.scrollHeight;
  await sleep(200);
  if (card.classList.contains('more')) fails.push('k4: fade stays on at the end of the scroll');
  body.scrollTop = 0;
  await sleep(150);
}

/* k5 */
if (sideways) {
  const b = body.getBoundingClientRect(), bub = tip.getBoundingClientRect();
  out.sideways = { tipBottom: Math.round(bub.bottom), bodyBottom: Math.round(b.bottom) };
  if (bub.bottom > b.bottom + 1 || bub.top < b.top - 1)
    fails.push('k5: the tip is outside the visible card body (scroll needed)');
}

({ ...out, fails, pass: fails.length === 0 })
