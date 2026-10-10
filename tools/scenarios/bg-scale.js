// v10 background ruler (plan §3.3, Review Focus 3): the far works keep
// landscape proportions to the hero on every screen, and wide screens are
// untouched (SU === VH). Run it at six sizes:
//   for s in 1280x720 844x390 1024x768 390x844 320x640 768x1024; do
//     python3 tools/run-scenario.py tools/scenarios/bg-scale.js --size $s; done
// ratio = the pylon's drawn height (drawFarWorks: SU * 0.22) over the
//         hero's drawn height on screen (B * Z)
document.getElementById('playBtn').click();
await new Promise(r => setTimeout(r, 400));
const t = __t;
const ratio = (0.22 * t.SU) / (t.B * t.Z);
const wide = t.VW / t.VH >= 1 / 1.1;
({ vw: t.VW, vh: t.VH, su: t.SU, ratio: Math.round(ratio * 100) / 100,
   pass: ratio >= 1.5 && ratio <= 2.2 && (!wide || t.SU === t.VH) })
