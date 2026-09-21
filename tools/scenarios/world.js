document.getElementById('playBtn').click();
await new Promise(r => setTimeout(r, 300));
const t = __t;
let prevLit = Infinity, monotonic = true, stalledAt = -1;
for (let i = 0; i < 80 && t.clean < 1; i++) {
  const s = t.stones.find(s => !s.visited && s.gadget);
  if (!s) { stalledAt = i; break; }
  t.hop.x = s.x + s.gadget.dx * s.w;      // the gadget's side, clear of any vampire
  t.land(s, t.stoneTop(s));
  await new Promise(r => setTimeout(r, 600));
  const lit = t.factories.filter(f => f.lightOn > 0.5).length +
              t.shore.filter(o => o.kind === 'lamp' && o.lightOn > 0.5).length;
  if (lit > prevLit) monotonic = false;
  prevLit = lit;
  if (t.mode !== 'play') { stalledAt = i + 0.5; break; }
}
({ clean: t.clean, litNow: prevLit, monotonic, mode: t.mode, phase: t.phase,
   energy: t.energy, stones: t.stones.length, stalledAt,
   pass: monotonic && t.clean === 1 && prevLit === 0 && t.mode === 'play' })
