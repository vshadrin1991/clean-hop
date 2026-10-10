// v10 balloon (plan §3.4, Review Focus 5): drifts over a clean sky only -
// never while the air is dirty, never in the menu's secret night. Needs a
// frozen scene; run it both ways:
//   python3 tools/run-scenario.py tools/scenarios/balloon.js --url shot=1,7
//   python3 tools/run-scenario.py tools/scenarios/balloon.js --url shot=0,7
for (let i = 0; i < 200 && document.body.getAttribute('data-ready') !== '1'; i++)
  await new Promise(r => setTimeout(r, 50));
if (document.body.getAttribute('data-ready') !== '1')
  return { skipped: 'needs --url shot=<clean>,<seed>' };
const t = __t;
const day = t.balloonAt();
t.night = 1;
const atNight = t.balloonAt();
t.night = 0;
const loaded = !!(t.BIT.balloon && t.BIT.balloon.img);
({ clean: t.cleanShown, day, atNight, loaded,
   pass: atNight === null && (t.cleanShown >= 0.8
     ? !!(day && day.a > 0.99 && day.w >= 26 && day.y < t.groundY * 0.5) && loaded
     : day === null) })
