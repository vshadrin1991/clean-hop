#!/usr/bin/env python3
"""Build an instrumented copy of the game for scripted browser checks:
    python3 tools/test-build.py      -> $TMPDIR/clean-hop-test/
Exposes window.__t and skips the service worker, so a test run never
touches the real offline cache."""
import os, pathlib, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
GAME = ROOT / 'clean-hop-v8'
OUT = pathlib.Path(os.environ.get('CLEAN_HOP_TEST',
                   pathlib.Path(tempfile.gettempdir()) / 'clean-hop-test'))
OUT.mkdir(parents=True, exist_ok=True)
if not (OUT / 'assets').exists():
    (OUT / 'assets').symlink_to(GAME / 'assets')

HOOK = '''
function __get(f) { try { return f(); } catch (e) { return undefined; } }
window.__t = {
  get stones() { return stones; },        // live: update() reassigns on prune
  get items() { return items; },
  get factories() { return factories; },
  get shore() { return shore; },
  get pops() { return pops; },
  hop: hop, land: land, stoneTop: stoneTop, gameOver: gameOver,
  get score() { return score; }, get clean() { return clean; }, get mode() { return mode; },
  get phase() { return phase; }, get won() { return won; }, get LVL() { return LVL; },
  get energy() { return __get(function () { return energy; }); },
  get offByKind() { return __get(function () { return offByKind; }); }
};
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
(OUT / 'index.html').write_text(src, encoding='utf-8')
print(OUT)
