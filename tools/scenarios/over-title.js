// Game-over title vs sparks caught (v9.1 T1, D2-A).
//   python3 tools/run-scenario.py tools/scenarios/over-title.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const want = {
  0: 'Ой-ёй!',
  1: 'Ой-ёй! Зато искорка поймана.',
  2: 'Ой-ёй! Зато искорки пойманы.',
  4: 'Ой-ёй! Зато искорки пойманы.',
  5: 'Ой-ёй! Зато искорок много.',
  12: 'Ой-ёй! Зато искорок много.'
};
const got = {}, fails = [];
document.getElementById('playBtn').click();
await sleep(300);
for (const n of Object.keys(want).map(Number)) {
  document.getElementById('againBtn').click();   // fresh run: lastFall = null
  await sleep(300);
  t.leaves = n;
  t.gameOver();
  await sleep(150);
  got[n] = document.getElementById('overTitle').textContent;
  if (got[n] !== want[n]) fails.push(n + ': "' + got[n] + '" != "' + want[n] + '"');
}

({ got, fails, pass: fails.length === 0 })
