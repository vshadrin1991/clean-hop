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

/* f1 + f2: the menu's button is on screen, big enough, and the whole card
   fits with no scrolling - every hero and the difficulty dial in view at
   once (v9.6: the menu never scrolls) */
const menuCard = document.querySelector('#menu .card');
const play = R(document.getElementById('playBtn'));
out.menu = { card: R(menuCard).h, play };
if (!inView(play)) fails.push('f1: «Начать игру» outside the screen (bottom ' + play.b + ' of ' + innerHeight + ')');
if (play.h < 40) fails.push('f1: play button only ' + play.h + 'px tall');
const body = menuCard.querySelector('.cbody');
const menuFits = tag => {
  const scrolls = body.scrollHeight > body.clientHeight + 1;
  const dial = R(document.getElementById('diffRange')), b = R(body);
  if (scrolls) fails.push('f2' + tag + ': the menu scrolls (' + body.scrollHeight + ' in ' + body.clientHeight + ')');
  if (!inView(dial) || dial.b > b.b + 1)
    fails.push('f2' + tag + ': the difficulty slider is cut off (bottom ' + dial.b + ', body ends ' + b.b + ')');
  return scrolls ? 'scrolls' : 'fits';
};
out.menu.mode = menuFits('');
/* the tallest menu there is: the day banner and a third row of heroes
   (the locked «?» slot / the owlet) */
const banner = document.getElementById('dayBanner');
banner.textContent = '11 ноября — День энергосбережения!';
banner.classList.remove('hidden');
const extra = document.querySelector('#picker .pick').cloneNode(true);
extra.classList.add('locked');
document.getElementById('picker').appendChild(extra);
dispatchEvent(new Event('resize'));
await sleep(150);
out.menu.tall = menuFits(' (banner + 7th hero)');
extra.remove();
banner.classList.add('hidden');
dispatchEvent(new Event('resize'));
await sleep(100);

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
