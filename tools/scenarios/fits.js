// Screen-fit guard (v9.2). Every card's main button must be on screen, and
// the HUD must stay one row inside 20% of the height:
//   python3 tools/fits.py                     (all viewports)
//   python3 tools/run-scenario.py tools/scenarios/fits.js --size 844x390
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [];
const out = { vw: innerWidth, vh: innerHeight };
const R = el => { const r = el.getBoundingClientRect();
  return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height),
           w: Math.round(r.width) }; };
const inView = r => r.t >= -1 && r.b <= innerHeight + 1;
const coarse = matchMedia('(pointer: coarse)').matches;

for (let i = 0; i < 60 && !t.spritesReady; i++) await sleep(100);
await sleep(300);

/* f1 + f2: the menu's button is on screen, big enough, and the body of the
   card can reach the picker and the dial (either it fits, or it scrolls) */
const menuCard = document.querySelector('#menu .card');
const play = R(document.getElementById('playBtn'));
out.menu = { card: R(menuCard).h, play };
if (!inView(play)) fails.push('f1: «Начать игру» outside the screen (bottom ' + play.b + ' of ' + innerHeight + ')');
if (play.h < 40) fails.push('f1: play button only ' + play.h + 'px tall');
const body = menuCard.querySelector('.cbody');
const cardFits = R(menuCard).h <= innerHeight - 32;
const scrolls = !!body && body.scrollHeight > body.clientHeight;
const reachable = cardFits || scrolls;
out.menu.mode = cardFits ? 'fits' : (scrolls ? 'scrolls' : 'clipped');
if (!reachable) fails.push('f2: the card is taller than the screen and does not scroll');
if (!inView(R(document.getElementById('diffRange'))) && !scrolls)
  fails.push('f2: the difficulty slider cannot be reached');

/* f3: the control hint matches the input the device has */
const keys = (document.getElementById('keysMenu') ||
              document.querySelector('#menu .keys'));
out.keys = keys ? keys.textContent.trim() : null;
const keysShown = keys && getComputedStyle(keys).display !== 'none';
if (keysShown && coarse && /Пробел/.test(out.keys))
  fails.push('f3: touch screen is told to hold the space bar');
if (keysShown && !coarse && !/Пробел/.test(out.keys))
  fails.push('f3: keyboard screen lost its key hint');

/* f4: the HUD stays one row inside 20% of the height, with 44px buttons */
document.getElementById('playBtn').click();
await sleep(400);
try { t.score = 128; } catch (e) {}
t.updateHud();
await sleep(150);
const hud = R(document.querySelector('.hud'));
const mute = R(document.getElementById('mute'));
out.hud = { h: hud.h, pct: +(hud.b / innerHeight * 100).toFixed(1),
            btn: mute.w + 'x' + mute.h };
if (hud.b > innerHeight * 0.2 + 1)
  fails.push('f4: HUD reaches ' + out.hud.pct + '% of the height (max 20%)');
if (mute.w < 44 || mute.h < 44)
  fails.push('f4: sound button ' + out.hud.btn + ' under 44x44');

/* f5: the pause card's button is on screen */
document.getElementById('pauseBtn').click();
await sleep(250);
const resume = R(document.getElementById('resumeBtn'));
out.pause = { card: R(document.querySelector('#pause .card')).h, resume };
if (!inView(resume)) fails.push('f5: «Продолжить» outside the screen');
document.getElementById('resumeBtn').click();
await sleep(200);

/* f6: the over card with the longest copy there is */
try { t.leaves = 3; } catch (e) {}
t.gameOver();
await sleep(300);
document.getElementById('overTitle').textContent = 'Ой-ёй! Зато искорки пойманы.';
document.getElementById('ecoMsg').textContent = 'Новый рекорд отряда энергосбережения!';
document.getElementById('tipMsg').textContent =
  'Горячая вода — это тоже энергия. Не оставляй кран открытым.';
document.getElementById('newbest').classList.remove('hidden');
await sleep(250);
const again = R(document.getElementById('againBtn'));
out.over = { card: R(document.querySelector('#over .card')).h, again };
if (!inView(again))
  fails.push('f6: «Ещё раз» outside the screen (bottom ' + again.b + ' of ' + innerHeight + ')');

({ ...out, fails, pass: fails.length === 0 })
