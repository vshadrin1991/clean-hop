// v9.6-v10 registry: the catalogue's eggs, in order.
//   python3 tools/run-scenario.py tools/scenarios/eggs2-registry.js
const t = __t;
const fails = [], out = {};
const IDS = ['secret-jump', 'chatter', 'tickle', 'title', 'sleep', 'master',
             'diver', 'bedtime', 'earth-hour', 'choir', 'shades', 'firefly',
             'cape', 'iron', 'earth-hour-real', 'energy-day', 'new-year', 'owlet',
             /* v10 */ 'unicorn', 'dizzy', 'swim', 'fireworks', 'jubilee', 'penguin'];

out.count = t.EGGS ? t.EGGS.length : null;
out.ids = t.EGGS ? t.EGGS.map(function (e) { return e.id; }) : null;
if (out.count !== IDS.length)
  fails.push('registry has ' + out.count + ' eggs, expected ' + IDS.length);
else {
  const seen = {};
  for (let i = 0; i < IDS.length; i++) {
    if (out.ids[i] !== IDS[i]) fails.push('egg #' + i + ' is ' + out.ids[i]);
    if (seen[out.ids[i]]) fails.push('egg ' + out.ids[i] + ' listed twice');
    seen[out.ids[i]] = true;
  }
}
/* the date eggs and the chatterbox keep hint:null - never suggested aloud */
const NO_HINT = ['chatter', 'bedtime', 'energy-day', 'new-year'];
if (t.EGGS) for (const e of t.EGGS) {
  const wantNull = NO_HINT.indexOf(e.id) > -1;
  if (wantNull && e.hint !== null) fails.push(e.id + ' has a hint, wants null');
  if (!wantNull && typeof e.hint !== 'string') fails.push(e.id + ' lost its hint');
}

({ ...out, fails, pass: fails.length === 0 })
