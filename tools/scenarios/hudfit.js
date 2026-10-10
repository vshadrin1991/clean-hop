// v10.3 the HUD on every screen (plan §3.2):
//   python3 tools/phones.py hudfit.js
// edges  every pill and button sits at least 6 px inside both screen edges
// apart  no two HUD pieces overlap
// words  the pill words show exactly on screens 375 px and wider, except
//        a narrow sideways phone (the existing max-height:500/max-width:720 rule)
const t = __t, wait = ms => new Promise(r => setTimeout(r, ms));
for (let i = 0; i < 60 && !t.spritesReady; i++) await wait(100);
document.getElementById('playBtn').click();
await wait(800);
const hud = document.querySelector('.hud');
const els = [...hud.querySelectorAll('.pill, .meter-wrap, .iconbtn')].filter(e => e.offsetParent);
const rs = els.map(e => { const r = e.getBoundingClientRect();
  return { id: e.id || e.className.split(' ')[0], l: r.left, r: r.right, t: r.top, b: r.bottom }; });
const fails = [];
for (const r of rs)
  if (r.l < 6 || r.r > innerWidth - 6)
    fails.push(r.id + ' off the edge: ' + Math.round(r.l) + '..' + Math.round(r.r));
for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
  const a = rs[i], b = rs[j];
  if (a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b) fails.push(a.id + ' overlaps ' + b.id);
}
const lbl = document.querySelector('.pill .lbl');
const words = !!(lbl && lbl.offsetParent);
const want = innerWidth >= 375 && !(innerHeight <= 500 && innerWidth <= 720);
if (words !== want) fails.push('pill words ' + (words ? 'shown' : 'hidden'));
({ vw: innerWidth, vh: innerHeight, words, pieces: rs.length,
   hudBottom: Math.round(Math.max(...rs.map(r => r.b))), fails, pass: fails.length === 0 })
