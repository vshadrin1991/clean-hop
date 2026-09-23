#!/usr/bin/env python3
"""Run tools/scenarios/sizes.js at the 8 plan viewports and print the
§0.1-style measurement table plus each rule failure:
    python3 tools/sizes.py
Exits 1 when any viewport fails a §3.4 rule."""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCENARIO = ROOT / 'tools/scenarios/sizes.js'
VIEWPORTS = [(390, 844), (844, 390), (768, 1024), (1024, 768),
             (1280, 720), (1512, 780), (1920, 1080), (2560, 1300)]

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
        rows.append(('%dx%d' % (w, h), 'NO RESULT', '', '', '', '', ''))
        all_fails.append('%dx%d: %s' % (w, h, (r.stdout + r.stderr).strip()[-200:]))
        continue
    fails = res.get('fails') or []
    hero = '%s (%s%%)' % (res.get('hero'), res.get('heroPct'))
    isl = '%s -> %s' % (res.get('isl0'), res.get('isl1'))
    ratio = res.get('heroIsl')
    gadgets = res.get('gadgets') or []
    rows.append(('%dx%d' % (w, h), hero, isl,
                 '%s' % (ratio if ratio is not None else '-'),
                 ' / '.join(str(x) for x in gadgets),
                 '%s' % (res.get('spark') if res.get('spark') is not None else '-'),
                 '%s%%' % res.get('water')))
    for f in fails:
        all_fails.append('%dx%d: %s' % (w, h, f))

hdr = ('viewport', 'hero px(%VH)', 'island first->last', 'hero/isl',
       'lamp/tv/chg/fan', 'spark o', 'water')
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
