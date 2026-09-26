#!/usr/bin/env python3
"""Run every tools/scenarios/*.js once at the default size and print one
line per scenario - '<name> pass', '<name> FAIL' or '<name> -' (the result
has no pass field, e.g. a scenario that needs --url shot=...):
    python3 tools/scenarios.py                       # the default game
    python3 tools/scenarios.py --game clean-hop-v9   # an older one
Diff two runs to see exactly what a change broke."""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
extra = []
if '--game' in sys.argv:
    extra = ['--game', sys.argv[sys.argv.index('--game') + 1]]

for f in sorted((ROOT / 'tools/scenarios').glob('*.js')):
    try:
        r = subprocess.run([sys.executable, str(ROOT / 'tools/run-scenario.py'),
                            str(f)] + extra, capture_output=True, text=True,
                           timeout=240)
        out = r.stdout
    except subprocess.TimeoutExpired:
        out = ''
    res = None
    for line in out.splitlines():
        line = line.strip()
        if line.startswith('{'):
            try:
                res = json.loads(line)
            except ValueError:
                pass
    if not isinstance(res, dict) or 'pass' not in res:
        state = '-'
    else:
        state = 'pass' if res['pass'] else 'FAIL'
    print(f.stem, state, flush=True)
