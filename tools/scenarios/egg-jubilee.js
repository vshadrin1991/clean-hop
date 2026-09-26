// v10 «Юбилей»: the 10th game (then 25th, 50th, 100th) gets a menu banner.
//   python3 tools/run-scenario.py tools/scenarios/egg-jubilee.js
//   python3 tools/run-scenario.py tools/scenarios/egg-jubilee.js --size 320x568
const t = __t, fails = [], out = {};
const wait = ms => new Promise(r => setTimeout(r, ms));
const banner = document.getElementById('dayBanner');
const shown = () => !banner.classList.contains('hidden');
const oneGame = async () => { t.startGame(); await wait(60); t.toMenu(); await wait(120); };
t.runsPlayed = 8;
await oneGame();                                  // the 9th: nothing yet
out.ninth = { runs: t.runsPlayed, shown: shown() };
if (out.ninth.shown) fails.push('9th game: the banner already shows');
await oneGame();                                  // the 10th
out.tenth = { runs: t.runsPlayed, text: banner.textContent, shown: shown(),
              party: document.getElementById('menu').classList.contains('party'),
              found: !!t.eggsFound.jubilee };
if (!out.tenth.shown || !/10-я игра/.test(out.tenth.text)) fails.push('10th game: banner "' + out.tenth.text + '"');
if (!out.tenth.party) fails.push('10th game: no confetti');
if (!out.tenth.found) fails.push('10th game: the egg was not noted');
const play = document.getElementById('playBtn').getBoundingClientRect();
if (play.bottom > innerHeight + 1) fails.push('the banner pushes «Начать игру» off screen');
await oneGame();                                  // the 11th: once is enough
if (shown()) fails.push('11th game: the banner came back');
if (localStorage.getItem('cleanHop.runs.v1') !== '11')
  fails.push('runs not saved: ' + localStorage.getItem('cleanHop.runs.v1'));
({ ...out, fails, pass: fails.length === 0 })
