document.getElementById('playBtn').click();
await new Promise(r => setTimeout(r, 300));
const t = __t, kinds = new Set();
for (let i = 0; i < 40; i++) {                          // walk 40 islands
  const s = t.stones.find(s => !s.visited && s.type !== 'finish');
  if (!s) break;
  t.hop.x = s.x; t.land(s, t.stoneTop(s));
  if (s.gadget) kinds.add(s.gadget.kind);
  await new Promise(r => setTimeout(r, 260));
}
({ kinds: [...kinds], energy: t.energy, byKind: t.offByKind,
   pass: kinds.size === 4 && Object.values(t.offByKind).reduce((a, b) => a + b, 0) === t.energy })
