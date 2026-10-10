#!/usr/bin/env python3
"""Run one tools/scenarios/*.js file at every phone screen, upright and
sideways, plus a tablet and a desktop; one line per screen:
    python3 tools/phones.py rotate.js
    python3 tools/phones.py hudfit.js --game clean-hop-v9
390x664 is an iPhone 14 in Safari with its toolbars showing.
Exits 1 when any screen fails or gives no result."""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PHONES = [(320, 568), (360, 640), (375, 667), (390, 664), (390, 844),
          (412, 915), (430, 932), (568, 320), (844, 390), (932, 430),
          (768, 1024), (1280, 720)]

scenario = ROOT / 'tools/scenarios' / sys.argv[1]
extra = sys.argv[2:]
bad = 0
for w, h in PHONES:
    r = subprocess.run([sys.executable, str(ROOT / 'tools/run-scenario.py'),
                        str(scenario), '--size', '%dx%d' % (w, h)] + extra,
                       capture_output=True, text=True, timeout=240)
    res = None
    for line in r.stdout.splitlines():
        line = line.strip()
        if line.startswith('{'):
            try:
                res = json.loads(line)
            except ValueError:
                pass
    ok = bool(res and res.get('pass'))
    bad += not ok
    why = '; '.join(res.get('fails') or []) if res else \
        (r.stdout + r.stderr).strip()[-200:]
    print('%4dx%-4d %s  %s' % (w, h, 'pass' if ok else 'FAIL', why), flush=True)
sys.exit(1 if bad else 0)
