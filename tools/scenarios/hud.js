// v10 HUD: yellow round buttons, coin / trophy badges, a battery that
// glows when full and goes plain again for the next run.
//   python3 tools/run-scenario.py tools/scenarios/hud.js
//   python3 tools/run-scenario.py tools/scenarios/hud.js --size 568x320
const t = __t, fails = [], out = {};
const wait = ms => new Promise(r => setTimeout(r, ms));
document.getElementById('playBtn').click();
await wait(500);
const cs = el => getComputedStyle(el);
for (const id of ['mute', 'pauseBtn']) {
  const bg = cs(document.getElementById(id)).backgroundColor;
  out[id] = bg;
  if (bg !== 'rgb(255, 201, 60)') fails.push(id + ' is not volt yellow: ' + bg);
}
for (const id of ['score', 'best']) {
  const ico = document.getElementById(id).parentNode.querySelector('.ico');
  if (!ico) { fails.push(id + ': no .ico badge'); continue; }
  const r = ico.getBoundingClientRect();
  out[id] = [Math.round(r.width), Math.round(r.height)];
  if (r.width < 16 || r.height < 16) fails.push(id + ': badge ' + out[id].join('x') + ' under 16px');
  if (!/svg/.test(cs(ico).backgroundImage)) fails.push(id + ': badge has no picture');
}
const meter = document.getElementById('cleanFill').parentNode;
t.energy = 999; t.updateHud();
out.fullOn = meter.classList.contains('full');
if (!out.fullOn) fails.push('meter is not .full with the goal reached');
t.startGame(); await wait(200);
out.fullAfterRestart = meter.classList.contains('full');
if (out.fullAfterRestart) fails.push('a new run still shows the full-battery glow');
({ ...out, fails, pass: fails.length === 0 })
