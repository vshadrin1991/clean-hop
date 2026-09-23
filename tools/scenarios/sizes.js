// Size & proportion guard - the §3.4 rules, run at the 8 §0.1 viewports by
// tools/sizes.py. Plays landings on the easiest dial, then restarts on the
// hardest with score pushed to LVL.ramp so the spawn tail is measured too.
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [];
const out = { vw: t.VW, vh: t.VH, z: +(t.Z || 1).toFixed(3) };
const dial = v => {
  const r = document.getElementById('diffRange');
  r.value = String(v);
  r.dispatchEvent(new Event('input', { bubbles: true }));
};
const nextStone = () => t.stones
  .filter(s => !s.visited && s.type !== 'finish' && s.type !== 'crumble' &&
              s.ax > t.hop.x + 1)
  .sort((a, b) => a.ax - b.ax)[0];
const nextAhead = () => t.stones                    // r6 counts every island type
  .filter(s => !s.visited && s.type !== 'finish' && s.ax > t.hop.x + 1)
  .sort((a, b) => a.ax - b.ax)[0];
const playW = () => t.stones.filter(s => s.type !== 'finish' && s.type !== 'start');
async function hopOnce(tag) {
  const s = nextStone();
  if (!s) return false;
  t.hop.x = s.x + (s.gadget ? s.gadget.dx * s.w : 0);
  t.land(s, t.stoneTop(s));
  await sleep(430);
  const a = nextAhead();                    // §3.4-6: next island on screen
  if (a) {
    const L = t.scrX(a.x - a.w / 2), R = t.scrX(a.x + a.w / 2);
    const T = t.scrY(t.stoneTop(a));
    if (!(L >= -2 && R <= t.VW + 2 && T >= -2 && T <= t.VH))
      fails.push('r6: next island off screen ' + tag +
                 ' L' + Math.round(L) + ' R' + Math.round(R) + ' T' + Math.round(T));
  }
  return true;
}

/* ---- pass 1: easiest dial ------------------------------------------- */
dial(0);
document.getElementById('playBtn').click();
await sleep(400);

// §3.4-7: HUD inside the viewport, bottom edge within 20% of VH
const hr = document.querySelector('.hud').getBoundingClientRect();
out.hudBottom = Math.round(hr.bottom);
if (!(hr.left >= -1 && hr.top >= -1 && hr.right <= t.VW + 1))
  fails.push('r7: HUD outside viewport: ' + JSON.stringify(hr));
if (hr.bottom > t.VH * 0.2 + 1)
  fails.push('r7: HUD bottom ' + Math.round(hr.bottom) + 'px > 20% VH (' +
             Math.round(t.VH * 0.2) + 'px)');

let lands = 0;
for (let i = 0; i < 12 && t.mode === 'play'; i++) {
  if (!(await hopOnce('easy#' + i))) break;
  lands++;
}
let wSeen = playW().map(s => s.w);
out.isl0 = wSeen.length ? Math.round(playW()[0].w * 1.1 * (t.Z || 1)) : 0;

/* ---- measurements ----------------------------------------------------- */
const Z = t.Z || 1;
const B = t.B !== undefined ? t.B : t.U * 1.07;    // world units; screen = *Z
const Bpx = B * Z;
const heroPx = t.heroH;                            // measured, screen px
const heroW = t.HERO_W !== undefined ? t.HERO_W : t.KW * 0.9;
out.b = Math.round(Bpx);
out.hero = Math.round(heroPx);
out.heroPct = +(heroPx / t.VH * 100).toFixed(1);
out.water = Math.round((t.VH - t.groundY) / t.VH * 100);

// r9 (v9.1 C1): an upright screen spends at most 31% of its height on water
if (t.VW / t.VH < 1 && out.water > 31)
  fails.push('r9: water ' + out.water + '% of VH > 31% on an upright screen');

// r1: hero 9-13% of VH in landscape, B*Z in 48..150 everywhere
if (Bpx < 47 || Bpx > 152)
  fails.push('r1: B ' + Math.round(Bpx) + 'px outside 48-150');
if (heroPx < 44) fails.push('r1: hero drawn ' + Math.round(heroPx) + 'px < ~48');
if (t.VW / t.VH >= 1) {
  const rr = heroPx / t.VH;
  if (rr < 0.09 || rr > 0.13)
    fails.push('r1: hero ' + (rr * 100).toFixed(1) + '% of VH outside 9-13%');
}

// r3: gadget order lamp>fan>tv>charger; lamp <= 1.3 hero; charger <= 0.55
const g = k => (t.gadgetH ? t.gadgetH(k) : 0) * Z;
const gh = { lamp: g('lamp'), fan: g('fan'), tv: g('tv'), charger: g('charger') };
out.gadgets = [gh.lamp, gh.tv, gh.charger, gh.fan].map(v => Math.round(v));
if (!(gh.lamp > gh.fan && gh.fan > gh.tv && gh.tv > gh.charger))
  fails.push('r3: gadget order broken: ' + JSON.stringify(out.gadgets));
if (gh.lamp > 1.3 * heroPx)
  fails.push('r3: lamp ' + Math.round(gh.lamp) + ' > 1.3x hero ' + out.hero);
if (gh.charger > 0.55 * heroPx + 0.5)
  fails.push('r3: charger ' + Math.round(gh.charger) + ' > 0.55x hero');

// r4: drawn island aspect within 5% of 240:170 (stones record dws/dhs when
// actually painted - on older builds nothing is recorded and this skips)
for (const s of t.stones) {
  if (!s.dws || s.type === 'finish') continue;
  const a = s.dws / s.dhs, want = 240 / 170;
  if (Math.abs(a - want) > want * 0.05) {
    fails.push('r4: island ' + s.id + ' aspect ' + a.toFixed(2) + ' != 1.41');
    break;
  }
}

// r8 on the HUD: the counter never reads past the goal
const goal0 = t.LVL.target;
const m = /(\d+)\s*\/\s*(\d+)/.exec(t.energyText || '');
const shown = m ? +m[1] : -1;
if (!m || shown !== Math.min(t.energy, goal0) || +m[2] !== goal0)
  fails.push('r8: HUD reads "' + t.energyText + '" at energy ' + t.energy +
             '/' + goal0);
const chip = document.getElementById('energyExtra');
const wantChip = t.energy > goal0 ? '+' + (t.energy - goal0) : '';
if ((chip ? chip.textContent : '') !== wantChip)
  fails.push('r8: extra chip "' + (chip ? chip.textContent : '<none>') +
             '" != "' + wantChip + '"');

// r8 on the card, with energy forced past the goal when the hook allows
try { t.energy = t.LVL.target + 2; } catch (e) {}
if (t.updateHud) t.updateHud();
t.gameOver();
await sleep(200);
const wantCard = t.energy > goal0
  ? t.energy + ' · цель ' + goal0 : t.energy + ' из ' + goal0;
if ((t.finalEnergyText || '') !== wantCard)
  fails.push('r8: card reads "' + t.finalEnergyText + '" != "' + wantCard + '"');

/* ---- pass 2: hardest dial, score pushed to the end of the ramp -------- */
dial(100);
document.getElementById('againBtn').click();
await sleep(350);
try { t.score = t.LVL.ramp; } catch (e) {}         // diff = 1 from here on
const mark = Math.max(0, ...t.stones.map(s => s.id));
for (let i = 0; i < 14 && t.mode === 'play'; i++) {
  if (!(await hopOnce('hard#' + i))) { await sleep(200); continue; }
  lands++;
}
wSeen = wSeen.concat(playW().map(s => s.w));
const tail = t.stones.filter(s => s.id > mark &&
                              s.type !== 'finish' && s.type !== 'start');
const tailW = tail.map(s => s.w);
out.isl1 = tail.length ? Math.round(tail[tail.length - 1].w * 1.1 * Z) : 0;
const minTail = tailW.length ? Math.min(...tailW) : Infinity;

// r5: spark diameter <= 0.5 x hero (read late - more have spawned by now)
const spark = t.items.filter(i => i.kind === 'spark')[0];
if (spark) {
  out.spark = Math.round(spark.r * 2 * Z);
  if (spark.r * 2 * Z > 0.5 * heroPx)
    fails.push('r5: spark ' + out.spark + 'px > 0.5x hero ' + out.hero);
}

// r2: hero body / island width <= 0.5 at every point of the ramp.
// Spec ratio on the nominal end width + a measured floor on the smallest
// island seen (the spawn jitter is +-10%, so allow 15% under nominal).
const tOr = Math.min(1, Math.max(0, (t.VW / t.VH - 0.6) / 0.9));
const wEnd = (1.6 + 0.4 * tOr) * B;
if (heroW / wEnd > 0.5)
  fails.push('r2: hero/island spec ' + (heroW / wEnd).toFixed(2) + ' > 0.5');
const minW = wSeen.length ? Math.min(...wSeen) : Infinity;
if (minW < wEnd * 0.85)
  fails.push('r2: smallest island ' + Math.round(minW) + ' < 0.85x spec end ' +
             Math.round(wEnd));
out.heroIsl = minTail < Infinity ? +(heroW / minTail).toFixed(2) : null;
out.tailN = tail.length;
out.lands = lands;

({ ...out, fails, pass: fails.length === 0 })
