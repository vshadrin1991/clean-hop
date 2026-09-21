document.getElementById('playBtn').click();
await new Promise(r => setTimeout(r, 300));
const t = __t;
// pause shows a tip
window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
await new Promise(r => setTimeout(r, 100));
const pauseTip = document.getElementById('pauseTip').textContent;
const paused = !document.getElementById('pause').classList.contains('hidden');
window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
await new Promise(r => setTimeout(r, 100));
const resumed = document.getElementById('pause').classList.contains('hidden');
// one switch-off, then game over: record lands under the goal's own key
const s = t.stones.find(s => !s.visited && s.gadget);
t.hop.x = s.x + s.gadget.dx * s.w;
t.land(s, t.stoneTop(s));
await new Promise(r => setTimeout(r, 600));
t.gameOver();
await new Promise(r => setTimeout(r, 200));
const key18 = localStorage.getItem('cleanHop.best.v1.energy18');
// a second run on a different goal writes a different record slot
document.getElementById('againBtn').click();
await new Promise(r => setTimeout(r, 200));
({ pauseTip, paused, resumed, key18,
   tipShown: document.getElementById('tipMsg').textContent.length > 0,
   pass: paused && resumed && pauseTip.length > 3 && !!key18 })
