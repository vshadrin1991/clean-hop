const r = document.getElementById('diffRange');
r.value = '100';
r.dispatchEvent(new Event('input', { bubbles: true }));
document.getElementById('playBtn').click();
await new Promise(r => setTimeout(r, 300));
const t = __t;
// advance on gadget-free, strip-free islands so nothing else gets switched off
async function step() {
  const n = t.stones.find(s => !s.visited && !s.gadget && !s.strip &&
                               s.type !== 'finish');
  if (!n) return false;
  t.hop.x = n.x;
  t.land(n, t.stoneTop(n));
  await new Promise(r => setTimeout(r, 450));
  return true;
}
// switch off at least two TVs and nothing else
let tvs = 0;
for (let i = 0; i < 120 && tvs < 2 && t.mode === 'play'; i++) {
  const s = t.stones.find(s => !s.visited && s.gadget &&
                               s.gadget.kind === 'tv');
  if (s) {
    t.hop.x = s.x + s.gadget.dx * s.w;
    t.land(s, t.stoneTop(s));
    await new Promise(r => setTimeout(r, 500));
    tvs++;
  } else if (!(await step())) break;
}
t.gameOver();
await new Promise(r => setTimeout(r, 200));
const tipAfterTVs = document.getElementById('tipMsg').textContent;
// fresh run, no switch-offs: the tip must come from the general list
document.getElementById('againBtn').click();
await new Promise(r => setTimeout(r, 300));
t.gameOver();
await new Promise(r => setTimeout(r, 200));
const tipEmpty = document.getElementById('tipMsg').textContent;
({ tvs, byKind: t.offByKind, tipAfterTVs, tipEmpty,
   pass: tvs >= 2 &&
         tipAfterTVs === 'Никто не смотрит телевизор? Выключи его совсем, а не только пультом.' &&
         ['Закрывай дверцу холодильника побыстрее.',
          'Горячая вода — это тоже энергия. Не оставляй кран открытым.',
          'Приборы в режиме ожидания тоже тратят энергию. Выключай их кнопкой.']
           .includes(tipEmpty) })
