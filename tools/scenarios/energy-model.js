// Paste into the test build's console with the tab in front.
document.getElementById('playBtn').click();
await new Promise(r => setTimeout(r, 300));
const t = __t, s = t.stones.find(s => (s.gadget || s.lamp) && s.type !== 'start');
t.hop.x = s.x; t.land(s, t.stoneTop(s));
const landed = { score: t.score, energy: t.energy, clean: t.clean };
await new Promise(r => setTimeout(r, 450));
const after = { score: t.score, energy: t.energy, clean: t.clean, goal: t.LVL.target };
({ landed, after,
   pass: landed.energy === 0 && landed.clean === 0 && after.energy === 1 &&
         Math.abs(after.clean - 1 / after.goal) < 1e-9 && after.score === landed.score + 1 })
