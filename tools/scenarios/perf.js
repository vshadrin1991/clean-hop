// render() cost with the whole scene on (clean water: pads and fish too).
//   python3 tools/run-scenario.py tools/scenarios/perf.js --size 390x844 --cpu 4
document.getElementById('playBtn').click();
await new Promise(r => setTimeout(r, 300));
__t.energy = 999;                               // clean -> 1, cleanShown eases up
await new Promise(r => setTimeout(r, 4000));
({ renderMs: +__t.renderMs.toFixed(2), quality: __t.quality,
   clean: +__t.cleanShown.toFixed(2) })
