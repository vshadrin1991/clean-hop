#!/usr/bin/env python3
"""Build an instrumented copy of the game for scripted browser checks:
    python3 tools/test-build.py [--game clean-hop-v9] -> $TMPDIR/clean-hop-test/
    python3 tools/test-build.py --no-inline           -> $TMPDIR/clean-hop-test-file/
Exposes window.__t and skips the service worker, so a test run never
touches the real offline cache. --no-inline skips the DATA_SPRITES table:
sprites load as real files over file://, exactly what a player gets when
they double-click index.html (the gadget "lit" split lives or dies there).

A URL hash freezes a scene for the screenshot harness:
    index.html#shot=<clean>,<seed>
starts the game on a seeded Math.random, lands on the first three
islands, forces clean = cleanShown = <clean>, then stops time and marks
<body data-ready="1">."""
import base64, json, os, pathlib, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
GAME = ROOT / 'clean-hop-v9'
if '--game' in sys.argv:
    GAME = ROOT / sys.argv[sys.argv.index('--game') + 1]
NO_INLINE = '--no-inline' in sys.argv
OUT = pathlib.Path(os.environ.get('CLEAN_HOP_TEST',
                   pathlib.Path(tempfile.gettempdir()) /
                   ('clean-hop-test-file' if NO_INLINE else 'clean-hop-test')))
OUT.mkdir(parents=True, exist_ok=True)
if not (OUT / 'assets').exists():
    (OUT / 'assets').symlink_to(GAME / 'assets')
elif os.readlink(str(OUT / 'assets')) != str(GAME / 'assets'):
    (OUT / 'assets').unlink()
    (OUT / 'assets').symlink_to(GAME / 'assets')

HOOK = '''
function __get(f) { try { return f(); } catch (e) { return undefined; } }
window.__t = {
  get stones() { return stones; },        // live: update() reassigns on prune
  get items() { return items; },
  get factories() { return factories; },
  get shore() { return shore; },
  get pops() { return pops; },
  get hop() { return hop; },
  land: land, stoneTop: stoneTop, gameOver: gameOver,
  /* v9-only helpers need lazy wrappers: an eager `scrX: scrX` throws on
     game versions that don't define it and kills this whole block */
  scrX: function (x) { return typeof scrX === 'function' ? scrX(x) : x - camX; },
  scrY: function (y) { return typeof scrY === 'function' ? scrY(y) : y; },
  get score() { return score; }, get clean() { return clean; }, get mode() { return mode; },
  get phase() { return phase; }, get won() { return won; }, get LVL() { return LVL; },
  get energy() { return __get(function () { return energy; }); },
  get offByKind() { return __get(function () { return offByKind; }); },
  get lastFall() { return __get(function () { return lastFall; }); },
  get stripHint() { return __get(function () { return stripHint; }); },
  get stripHintSeen() { return __get(function () { return stripHintSeen; }); },
  get VW() { return VW; }, get VH() { return VH; },
  get BIT() { return __get(function () { return BIT; }); },
  get Z() { return typeof Z !== 'undefined' ? Z : 1; },
  get U() { return typeof U !== 'undefined' ? U : KW; },
  get KW() { return KW; }, get groundY() { return groundY; },
  /* sizes.js probes: the one-ruler spec + live DOM texts */
  get B() { return __get(function () { return B; }); },
  get HERO_W() { return __get(function () { return HERO_W; }); },
  gadgetH: function (k) { return __get(function () { return gadgetH(k); }); },
  get MIN_D() { return __get(function () { return MIN_D; }); },
  get MAX_D() { return __get(function () { return MAX_D; }); },
  get energyText() { return __get(function () { return elCleanPct.textContent; }); },
  get finalEnergyText() { return __get(function () { return elFinalEnergy.textContent; }); },
  updateHud: function () { __get(function () { updateHud(); }); },
  set energy(v) { energy = v;
    __get(function () { clean = clamp(energy / ENERGY_GOAL, 0, 1); }); },
  set score(v) { score = v; },
  get heroH() { return __get(function () {
    return (typeof heroH === 'function' ? heroH() : KW) *
           (typeof Z !== 'undefined' ? Z : 1); }); },
  get fps() { return __get(function () { return fpsAvg; }); },
  get quality() { return __get(function () { return QUALITY; }); },
  get renderMs() { return __get(function () { return __renderMs; }); },
  /* lights.js probes: did the gadget lit layers load, and is a switched-off
     gadget actually dark this frame */
  get spritesReady() { return __get(function () { return spritesReady; }); },
  get litOK() { return __get(function () {
    var n = ['island-lamp', 'gadget-tv', 'gadget-charger', 'gadget-fan',
             'shore-lamp'], r = {};
    for (var i = 0; i < n.length; i++) r[n[i]] = !!(BIT[n[i]] && BIT[n[i]].lit);
    return r; }); },
  gadgetLight: function (s) { return __get(function () {
    var G = s && s.gadget; if (!G) return null;
    var g = G.glow;
    if (!G.on) g *= 0.5 + 0.5 * Math.abs(Math.sin(T * 40));
    else g *= 0.9 + 0.1 * Math.sin(T * TAU * 1.2 + G.ph);
    return { on: G.on, glow: G.glow, litAlpha: g }; }); },
  /* wiring.js probes: pylon coverage at any camera, and where the strip
     cord's far end lands on the gadget sprite */
  pylonXs: function (cx) { return __get(function () {
    var o = camX; camX = cx; var r = pylonXs(); camX = o; return r; }); },
  cordEnd: function (s) { return __get(function () {
    var G = s && s.gadget; if (!G) return null;
    var gx = s.x - camX + G.dx * s.w, base = stoneTop(s) + 2;
    var r = (typeof stripCordEnd === 'function')
      ? stripCordEnd(G, gx, base)
      : { x: gx - gadgetH(G.kind) * 0.22, y: base - 1 };
    r.gx = gx; r.base = base; r.gw = gadgetW(G.kind); r.gh = gadgetH(G.kind);
    r.kind = G.kind;
    return r; }); },
  /* factories.js / intro.js probes: overlay metadata, the shown-cleanliness
     easing, and the menu->game intro clock. The intro is OFF in test builds
     unless the page is loaded with #intro. */
  get FMETA() { return __get(function () { return FMETA; }); },
  get cleanShown() { return __get(function () { return cleanShown; }); },
  get introT() { return __get(function () { return introT; }); },
  set clean(v) { clean = clamp(v, 0, 1); },
  /* v9.1 probes: street lamps, popup opacity, sparks caught */
  shoreLamps: function () { return __get(function () {
    var r = [];
    for (var i = 0; i < shore.length; i++) {
      var o = shore[i];
      if (o.kind !== 'lamp') continue;
      r.push({ lightOn: o.lightOn,
               glow: typeof streetLampGlow === 'function' ? streetLampGlow(o) : undefined });
    }
    return r; }); },
  popAlpha: function (o) { return __get(function () {
    return typeof popAlpha === 'function' ? popAlpha(o) : undefined; }); },
  get leaves() { return __get(function () { return leaves; }); },
  set leaves(v) { leaves = v; },
  /* art.js probe: a sprite's inlined SVG source (null with --no-inline) */
  spriteSrc: function (n) { return __get(function () {
    return (typeof DATA_SPRITES !== 'undefined' && DATA_SPRITES[n]) || null; }); },
  /* egg.js probes: the secret long-hold jump */
  get eggArmed() { return __get(function () { return eggArmed; }); },
  get eggSecret() { return __get(function () { return eggSecret; }); },
  get finishStone() { return __get(function () { return finishStone; }); },
  get chargeT() { return __get(function () { return chargeT; }); },
  set chargeT(v) { chargeT = v; },
  eggTarget: function () { return __get(function () { return eggTarget(); }); },
  startGame: function () { __get(function () { startGame(); }); },
  /* eggs-*.js probes: the v9.5 Easter eggs. Names a later task defines
     read as undefined until it lands - __get swallows the ReferenceError */
  get eggsFound() { return __get(function () { return eggsFound; }); },
  get EGGS() { return __get(function () { return EGGS; }); },
  eggFound: function (id) { return __get(function () { return eggFound(id); }); },
  loadEggs: function () { __get(function () { loadEggs(); }); },
  set clock(v) { __get(function () { clockOverride = v; }); },
  clockNow: function () { return __get(function () { return clockNow(); }); },
  isLate: function () { return __get(function () { return isLate(); }); },
  fallIn: function (why) { __get(function () { fallIn(why); }); },
  get stripsOff() { return __get(function () { return stripsOff; }); },
  set stripsOff(v) { __get(function () { stripsOff = v; }); },
  get idleT() { return __get(function () { return idleT; }); },
  set idleT(v) { __get(function () { idleT = v; }); },
  /* v9.6/v9.7 probes: the phase 2-3 Easter eggs */
  get night() { return __get(function () { return night; }); },
  get nightSeq() { return __get(function () { return nightSeq; }); },
  get nightLine() { return __get(function () { return nightLine; }); },
  sunTap: function () { __get(function () { sunTap(); }); },
  nightStop: function () { __get(function () { nightStop(); }); },
  earthHourReal: function () { return __get(function () { return earthHourReal(); }); },
  isNewYear: function () { return __get(function () { return isNewYear(); }); },
  isEnergyDay: function () { return __get(function () { return isEnergyDay(); }); },
  eggsAtMenu: function () { __get(function () { return eggsAtMenu(); }); },
  heroWear: function (p) { return __get(function () { return heroWear(p); }); },
  get bullseyes() { return __get(function () { return bullseyes; }); },
  get shadesOn() { return __get(function () { return shadesOn; }); },
  get firefly() { return __get(function () { return firefly; }); },
  get ORDER() { return __get(function () { return ORDER; }); },
  get winsSet() { return __get(function () { return winsSet; }); },
  set winsSet(v) { __get(function () { winsSet = v; }); },
  winsCount: function () { return __get(function () { return winsCount(); }); },
  owletIn: function () { return __get(function () { return owletIn(); }); },
  buildPicker: function () { __get(function () { buildPicker(); }); },
  get choirPos() { return __get(function () { return choirPos; }); },
  get chosen() { return __get(function () { return chosen; }); },
  speakUp: function (k, o) { __get(function () { speakUp(k, o); }); },
  makeIron: function (s) { return __get(function () {
    if (!s) return null;
    s.gadget = { kind: 'iron', on: true, glow: 1, dx: 0.25, ph: 0,
                 speed: 1, spin: 0, wait: 0 };
    return s.gadget; }); },
  spawnItemOnHero: function () { return __get(function () {
    var it = { x: hop.x, y: hop.y - KW * 0.62, r: 12, taken: false };
    items.push(it); return it; }); }
};
var INTRO_ON = /[#&]intro/.test(location.hash);
/* scenarios run at any hour: pin the egg clock to midday so the bedtime tip
   never replaces the tip a scenario expects - egg-bedtime.js moves it.
   Older game versions have no clockOverride: the ReferenceError is caught */
try { clockOverride = new Date(2026, 8, 23, 12, 0).getTime(); } catch (e) {}
/* render() timing, measured the same way on every game version */
var __renderMs = -1;
try {
  var __origRender = render;
  render = function () {
    var __t0 = performance.now();
    __origRender();
    var __d = performance.now() - __t0;
    __renderMs = __renderMs < 0 ? __d : __renderMs * 0.9 + __d * 0.1;
  };
} catch (e) {}
/* #fps: a tiny live meter for performance runs */
if (/[#&]fps/.test(location.hash || '')) {
  var __fd = document.createElement('div');
  __fd.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99;' +
    'background:rgba(0,0,0,.62);color:#9f8;font:12px monospace;' +
    'padding:3px 7px;border-radius:4px';
  document.body.appendChild(__fd);
  setInterval(function () {
    var f = window.__t.fps(), q = window.__t.quality();
    __fd.textContent = (f ? Math.round(f) : '–') + ' fps q' +
                       (q === undefined ? '?' : q);
  }, 400);
}
/* #shot=<clean>,<seed>: a deterministic frozen scene for screenshots.
   Reseed Math.random, play a short scripted opening, force the clean
   level, let two seconds of sim settle the camera and effects, then
   freeze time so every capture of the same scene is identical. */
var __shot = /[#&]shot=([0-9.]+),(\\d+)/.exec(location.hash || '');
if (__shot) try {
  var __seed = +__shot[2] >>> 0;
  Math.random = function () {                       // mulberry32
    __seed = (__seed + 0x6D2B79F5) >>> 0;
    var t = __seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  startGame();
  var __n = 0;
  for (var __i = 0; __i < stones.length && __n < 3; __i++) {
    var __s = stones[__i];
    if (__s.visited || __s.type === 'finish') continue;
    if (__s.type === 'crumble') __s.type = 'normal';   // never sink mid-shot
    hop.x = __s.x + (__s.gadget ? __s.gadget.dx * __s.w : 0);
    land(__s, stoneTop(__s));
    if (__s.gadget && __s.gadget.on) switchOff(__s);
    __n++;
  }
  pops.length = 0; parts.length = 0; flyers.length = 0; ripples.length = 0;
  stripHint = null; stripHintSeen = true;              // no tutorial bubble in shots
  clean = cleanShown = clamp(+__shot[1], 0, 1);
  energy = Math.round(clean * ENERGY_GOAL);
  updateHud();
  for (var __k = 0; __k < 300; __k++) update(1 / 120);  // camera + lights settle
  pops.length = 0; parts.length = 0; flyers.length = 0;
  update = function () {};                             // freeze: T stops here
  frame = function () {};                              // and stop repainting it
  /* #shot=c,s&so: re-fire one switch-off and freeze it mid-sequence */
  if (/[,&]so([,&]|$)/.test(location.hash || '')) {
    for (var __q = 0; __q < stones.length; __q++) {
      var __g = stones[__q].gadget;
      if (__g) { __g.on = true; __g.glow = 1; switchOff(stones[__q]); break; }
    }
    if (flyers.length) flyers[flyers.length - 1].t = 0.28;
    if (ripples.length) {
      var __rp = ripples[ripples.length - 1];
      __rp.r = U * 1.7; __rp.life = 0.4;
    }
    T += 0.09;
  }
  /* paint once the sprites are in. Headless Chrome never commits a
     script-painted canvas to the screenshot, so swap in an <img> of
     the same pixels instead */
  var __poll = setInterval(function () {
    if (!spritesReady) return;
    clearInterval(__poll);
    render();
    var __img = new Image();
    __img.src = canvas.toDataURL();
    __img.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;';
    canvas.parentNode.insertBefore(__img, canvas.nextSibling);
    canvas.style.display = 'none';
    document.body.setAttribute('data-ready', '1');
  }, 40);
} catch (e) {
  window.__shotErr = String(e && e.stack || e);
  document.body.setAttribute('data-ready', 'err');
}
/* headless runs: rAF is throttled without a compositor, so the game loop
   rides on virtual-time-friendly timers instead */
window.requestAnimationFrame = function (f) {
  return setTimeout(function () { f(performance.now()); }, 16);
};
})();'''
src = (GAME / 'index.html').read_text(encoding='utf-8')
i = src.rindex('\n})();')
src = src[:i + 1] + HOOK + src[i + 6:]
src = src.replace("navigator.serviceWorker.register('sw.js')", 'Promise.reject()')
# Headless Chrome starves real file:// image loads under --virtual-time-budget
# (the clock races past the 46 pending fetches and aborts them at expiry).
# Inline the SVGs as data: URIs instead - decoding is an ordinary task, so the
# sprite cache fills deterministically inside the budget. --no-inline keeps
# the real files so scenarios see exactly what a double-click player sees.
if not NO_INLINE:
    sprites = {}
    for f in sorted((GAME / 'assets/sprites').glob('*.svg')):
        sprites[f.stem] = ('data:image/svg+xml;base64,'
                           + base64.b64encode(f.read_bytes()).decode())
    src = src.replace(
        "loadSprites(function () { paintPortraits(); });",
        'var DATA_SPRITES = ' + json.dumps(sprites) + ';\n'
        "loadSprites(function () { paintPortraits(); });")
    src = src.replace(
        "img.src = SPR_DIR + name + '.svg';",
        "img.src = (typeof DATA_SPRITES !== 'undefined' && DATA_SPRITES[name]) "
        "|| (SPR_DIR + name + '.svg');")
(OUT / 'index.html').write_text(src, encoding='utf-8')
print(OUT)
