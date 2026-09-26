#!/usr/bin/env python3
"""v10 look guard. Renders the same frozen #shot scene in the old and the
new game and checks the v10 graphics goals with numbers:
    python3 tools/look.py                  # every rule
    python3 tools/look.py --only island    # island | water | perf
Rules (v10 against clean-hop-v9, same seed, same screen):
  island  soil warmth (mean r-b) at clean 1 rises by >= 12
  island  light (right third - left third luminance) >= +3 at clean 0 and 1
  water   detail (luminance sd, lower water) at clean 1 >= 1.25x v9
  water   detail at clean 0 >= 0.9x v9 (no regression)
  perf    render() ms at 390x844, CPU x4: v10 <= 2x v9 + 0.3, QUALITY held
Exits 1 when any rule fails."""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OLD, NEW = 'clean-hop-v9', 'clean-hop-v10'
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


fails = []
if only in (None, 'island', 'water'):
    print('%-12s %-15s %-15s %-15s' % ('scene', 'warm v9>v10', 'light v9>v10', 'water sd v9>v10'))
    for size in SIZES:
        for c in (0, 1):
            a = run('look.js', OLD, '--size', size, '--url', 'shot=%d,7' % c)
            b = run('look.js', NEW, '--size', size, '--url', 'shot=%d,7' % c)
            tag = '%s c%d' % (size, c)
            print('%-12s %-15s %-15s %-15s' % (tag,
                  '%s>%s' % (a['island']['warm'], b['island']['warm']),
                  '%s>%s' % (a['island']['light'], b['island']['light']),
                  '%s>%s' % (a['water']['sd'], b['water']['sd'])))
            if not a['islands'] or not b['islands']:
                fails.append(tag + ': no island fully on screen to measure')
                continue
            if only in (None, 'island'):
                if c == 1 and b['island']['warm'] < a['island']['warm'] + 12:
                    fails.append('%s: island warmth %s (want >= %s)' % (
                        tag, b['island']['warm'], a['island']['warm'] + 12))
                if b['island']['light'] < 3:
                    fails.append('%s: islands lit from the wrong side (%s, want >= +3)' % (
                        tag, b['island']['light']))
            if only in (None, 'water'):
                want = a['water']['sd'] * (1.25 if c == 1 else 0.9)
                if b['water']['sd'] < want:
                    fails.append('%s: water detail %s (want >= %.1f)' % (
                        tag, b['water']['sd'], want))
if only in (None, 'perf'):
    a = run('perf.js', OLD, '--size', '390x844', '--cpu', '4')
    b = run('perf.js', NEW, '--size', '390x844', '--cpu', '4')
    print('perf 390x844 cpu4: v9 %s ms (q%s)  v10 %s ms (q%s)' % (
        a['renderMs'], a['quality'], b['renderMs'], b['quality']))
    if b['quality'] < a['quality']:
        fails.append('perf: v10 dropped to QUALITY %s (v9 held %s)' % (b['quality'], a['quality']))
    if b['renderMs'] > a['renderMs'] * 2 + 0.3:
        fails.append('perf: render %s ms (want <= %.2f)' % (b['renderMs'], a['renderMs'] * 2 + 0.3))
if fails:
    print('\nFAIL\n' + '\n'.join('  ' + f for f in fails))
    sys.exit(1)
print('\nPASS')
