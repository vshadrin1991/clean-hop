#!/usr/bin/env python3
"""Run tools/scenarios/fits.js at every screen the game has to survive:
    python3 tools/fits.py
Exits 1 when any viewport fails a fit rule."""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCENARIO = ROOT / 'tools/scenarios/fits.js'
VIEWPORTS = [(320, 568), (360, 640), (390, 844), (430, 932),
             (568, 320), (640, 360), (844, 390), (932, 430),
             (1280, 600), (1366, 650), (1512, 860), (1920, 1080)]

rows, all_fails = [], []
for w, h in VIEWPORTS:
    r = subprocess.run(
        [sys.executable, str(ROOT / 'tools/run-scenario.py'),
         str(SCENARIO), '--size', '%dx%d' % (w, h)],
        capture_output=True, text=True, timeout=180)
    res = None
    for line in r.stdout.splitlines():
        line = line.strip()
        if line.startswith('{'):
            try:
                res = json.loads(line)
            except ValueError:
                pass
    if res is None:
        rows.append(('%dx%d' % (w, h), 'NO RESULT', '', '', '', ''))
        all_fails.append('%dx%d: %s' % (w, h, (r.stdout + r.stderr).strip()[-200:]))
        continue
    rows.append(('%dx%d' % (w, h),
                 '%s (%s)' % (res['menu']['card'], res['menu']['mode']),
                 str(res['menu']['play']['b']),
                 '%s%% %s' % (res['hud']['pct'], res['hud']['btn']),
                 str(res['over']['again']['b']),
                 'PASS' if res['pass'] else 'FAIL'))
    for f in res.get('fails') or []:
        all_fails.append('%dx%d: %s' % (w, h, f))

hdr = ('viewport', 'menu card', 'play bottom', 'hud / button', 'again bottom', '')
wdt = [max(len(str(r[i])) for r in [hdr] + rows) for i in range(len(hdr))]
print('  '.join(h.ljust(w) for h, w in zip(hdr, wdt)))
print('  '.join('-' * w for w in wdt))
for r in rows:
    print('  '.join(str(c).ljust(w) for c, w in zip(r, wdt)))
if all_fails:
    print('\nFAIL')
    print('\n'.join('  ' + f for f in all_fails))
    sys.exit(1)
print('\nPASS')
