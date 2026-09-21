const r = document.getElementById('diffRange');
r.value = '0';
r.dispatchEvent(new Event('input', { bubbles: true }));
document.getElementById('playBtn').click();
await new Promise(r => setTimeout(r, 300));
const t = __t;
for (let i = 0; i < 60 && !t.won; i++) {
  const s = t.stones.find(s => !s.visited && !s.strip);
  if (!s) break;
  t.hop.x = s.x + (s.gadget ? s.gadget.dx * s.w : 0);
  t.land(s, t.stoneTop(s));
  await new Promise(r => setTimeout(r, 500));
}
const cheer = { won: t.won, phase: t.phase };
await new Promise(r => setTimeout(r, 3600));
({ cheer, mode: t.mode, phase: t.phase,
   cardShown: !document.getElementById('over').classList.contains('hidden'),
   winClass: document.getElementById('over').classList.contains('win'),
   pass: t.won && t.mode === 'over' &&
         !document.getElementById('over').classList.contains('hidden') })
