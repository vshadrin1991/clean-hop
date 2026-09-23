// Visual scale checks from plan §2.3. Run twice:
//   --size 1280x720  -> asserts hero height / VH is in [0.09, 0.13]
//   --size 390x844   -> asserts the next island is fully on screen after
//                       every landing, 10 landings in a row
document.getElementById('playBtn').click();
await new Promise(r => setTimeout(r, 400));
const t = __t;
const out = { vw: t.VW, vh: t.VH, z: t.Z, u: t.U };

out.heroRatio = t.heroH / t.VH;
if (t.VW / t.VH >= 1.6) {          // desktop/landscape: §2.3 size check
  out.heroOK = out.heroRatio >= 0.09 && out.heroRatio <= 0.13;
}

const nextStone = () => t.stones
  .filter(s => !s.visited && s.x > t.hop.x + 1 && s.type !== 'finish')
  .sort((a, b) => a.x - b.x)[0];

let lands = 0, badLand = -1, badScr = null;
for (let i = 0; i < 10 && t.mode === 'play'; i++) {
  const next = nextStone();
  if (!next) break;
  t.hop.x = next.x + (next.gadget ? next.gadget.dx * next.w : 0);
  t.land(next, t.stoneTop(next));
  lands++;
  await new Promise(r => setTimeout(r, 450));   // let the camera settle
  const ahead = nextStone();
  if (!ahead) break;
  const L = t.scrX(ahead.x - ahead.w / 2), R = t.scrX(ahead.x + ahead.w / 2);
  const T = t.scrY(t.stoneTop(ahead));
  if (!(L >= -2 && R <= t.VW + 2 && T >= -2 && T <= t.VH)) {
    badLand = i; badScr = [Math.round(L), Math.round(R), Math.round(T)];
    break;
  }
}

({ ...out, lands, badLand, badScr,
   pass: (out.heroOK === undefined || out.heroOK) && lands >= 10 && badLand < 0 })
