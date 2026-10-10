#!/usr/bin/env python3
"""Look guard. Renders the same frozen #shot scene in an old and the new
game and checks the graphics goals with numbers:
    python3 tools/look.py                          # every rule, old = clean-hop-v9
    python3 tools/look.py --old "$TMPDIR/ch-base"  # against a saved baseline
    python3 tools/look.py --only island            # island | water | perf
Rules (new against old, same seed, same screen):
  island  light (right third - left third luminance) >= +3 at clean 0 and 1
  island  warmth (mean r-b of the soil) >= old - 5: the earth stays warm
  water   veil (soil just above the waterline minus soil under the lid)
          <= 0: no pale stripe where an island meets the water
  water   detail (luminance sd, lower water) >= 0.9x old: no regression
  water   brightness (mean luminance, lower water) <= old + 15: the
          v10.3 mirror must not wash the water out
  perf    render() ms at 390x844, CPU x4, median of 3 runs each:
          new <= 1.25x old + 0.3, QUALITY held
  seam and under print for information only.
Exits 1 when any rule fails."""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OLD = sys.argv[sys.argv.index('--old') + 1] if '--old' in sys.argv else 'clean-hop-v9'
NEW = 'clean-hop-v10'
SIZES = ['1280x720', '390x844', '844x390']
only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None


def run(scenario, game, *args):
    cmd = [sys.executable, str(ROOT / 'tools/run-scenario.py'),
           str(ROOT / 'tools/scenarios' / scenario), '--game', game] + list(args)
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=240)
    for line in r.stdout.splitlines():
        if line.strip().startswith('{'):
            return json.loads(line)
    sys.exit('%s %s %s: no result\n%s' % (scenario, game, ' '.join(args),
                                          (r.stdout + r.stderr)[-400:]))


def pair(a, b):
    return '%s>%s' % (a, b)


fails = []
if only in (None, 'island', 'water'):
    print('%-12s %-13s %-13s %-13s %-13s %-13s' % (
        'scene', 'light', 'seam', 'veil', 'under', 'water sd'))
    for size in SIZES:
        for c in (0, 1):
            a = run('look.js', OLD, '--size', size, '--url', 'shot=%d,7' % c)
            b = run('look.js', NEW, '--size', size, '--url', 'shot=%d,7' % c)
            tag = '%s c%d' % (size, c)
            if not a['islands'] or not b['islands']:
                fails.append(tag + ': no island fully on screen to measure')
                continue
            ai, bi, aw, bw = a['island'], b['island'], a['water'], b['water']
            print('%-12s %-13s %-13s %-13s %-13s %-13s' % (tag,
                  pair(ai['light'], bi['light']), pair(ai['seam'], bi['seam']),
                  pair(aw['veil'], bw['veil']), pair(aw['under'], bw['under']),
                  pair(aw['sd'], bw['sd'])))
            if only in (None, 'island'):
                if bi['light'] < 3:
                    fails.append('%s: islands lit from the wrong side (%s, want >= +3)' % (
                        tag, bi['light']))
                if bi['warm'] < ai['warm'] - 5:
                    fails.append('%s: soil warmth %s (want >= %s)' % (
                        tag, bi['warm'], ai['warm'] - 5))
            if only in (None, 'water'):
                if bw['veil'] is not None and bw['veil'] > 0:
                    fails.append('%s: pale veil at the waterline %s (want <= 0)' % (
                        tag, bw['veil']))
                if bw['sd'] < aw['sd'] * 0.9:
                    fails.append('%s: water detail %s (want >= %.1f)' % (
                        tag, bw['sd'], aw['sd'] * 0.9))
                if bw['lum'] > aw['lum'] + 15:
                    fails.append('%s: water washed out %s (want <= %.1f)' % (
                        tag, bw['lum'], aw['lum'] + 15))
def perf(game):
    """median of three runs - one headless run swings by +-50 %"""
    rs = [run('perf.js', game, '--size', '390x844', '--cpu', '4') for _ in range(3)]
    return {'renderMs': sorted(r['renderMs'] for r in rs)[1],
            'quality': min(r['quality'] for r in rs)}


if only in (None, 'perf'):
    a, b = perf(OLD), perf(NEW)
    print('perf 390x844 cpu4 (median of 3): old %s ms (q%s)  new %s ms (q%s)' % (
        a['renderMs'], a['quality'], b['renderMs'], b['quality']))
    if b['quality'] < a['quality']:
        fails.append('perf: new dropped to QUALITY %s (old held %s)' % (b['quality'], a['quality']))
    if b['renderMs'] > a['renderMs'] * 1.25 + 0.3:
        fails.append('perf: render %s ms (want <= %.2f)' % (b['renderMs'], a['renderMs'] * 1.25 + 0.3))
if fails:
    print('\nFAIL\n' + '\n'.join('  ' + f for f in fails))
    sys.exit(1)
print('\nPASS')
