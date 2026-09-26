#!/usr/bin/env python3
"""Screenshot harness for before/after review:
    python3 tools/shots.py --game clean-hop-v8 --tag before
    python3 tools/shots.py                          # v10, tagged 'clean-hop-v10'
Builds the instrumented copy via test-build.py (which understands the
#shot=<clean>,<seed> hash), then captures every viewport x clean level
through headless Chrome's DevTools protocol - Emulation gives the true CSS
viewport, so 390x844 really is 390x844 - into $TMPDIR/clean-hop-shots/<tag>/
and refreshes contact.html, a grid pairing each tag against 'before'."""
import argparse, os, pathlib, subprocess, sys, tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import chrome

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIEWPORTS = [(390, 844), (844, 390), (1280, 720)]
CLEANS = [0, 0.5, 1]
OUT = pathlib.Path(os.environ.get(
    'CLEAN_HOP_SHOTS', pathlib.Path(tempfile.gettempdir()) / 'clean-hop-shots'))

ap = argparse.ArgumentParser()
ap.add_argument('--game', default='clean-hop-v10',
                help='game folder under the project root')
ap.add_argument('--tag', default=None,
                help='name for this shot set (default: the game folder)')
ap.add_argument('--dpr', type=float, default=1, help='device scale factor')
ap.add_argument('--cpu', type=int, default=0, help='CPU throttle rate (e.g. 6)')
ap.add_argument('--url-extra', default='', help='extra hash params, e.g. fps')
args = ap.parse_args()
tag = args.tag or args.game

# an instrumented copy of just this game, so v8 and v9 can both be shot
test_dir = pathlib.Path(tempfile.gettempdir()) / ('clean-hop-test-' + args.game)
env = dict(os.environ, CLEAN_HOP_TEST=str(test_dir))
subprocess.run([sys.executable, str(ROOT / 'tools/test-build.py'),
                '--game', args.game], check=True, env=env, capture_output=True)

dest = OUT / tag
dest.mkdir(parents=True, exist_ok=True)
base = 'file://' + str(test_dir / 'index.html')
ready = ("document.body && document.body.getAttribute('data-ready') === '1'")
jobs = []
for (w, h) in VIEWPORTS:
    for c in CLEANS:
        png = dest / ('%dx%d_c%s.png' % (w, h, c))
        jobs.append({
            'type': 'shot', 'w': w, 'h': h, 'dsf': args.dpr,
            'cpu': args.cpu or 0, 'ready': ready,
            'url': '%s#shot=%s,7%s' % (base, c,
                                       ('&' + args.url_extra) if args.url_extra else ''),
            'out': str(png)})
for r in chrome.run(jobs):
    if r.get('ok'):
        print(r['out'])
    else:
        print('FAIL', r.get('out'), r.get('error'), file=sys.stderr)

# contact.html: rows are shots, columns are tag sets, 'before' first
tags = sorted(d.name for d in OUT.iterdir()
              if d.is_dir() and list(d.glob('*.png')))
tags.sort(key=lambda t: (t != 'before', t))
rows = []
for (w, h) in VIEWPORTS:
    for c in CLEANS:
        name = '%dx%d_c%s.png' % (w, h, c)
        cells = ''.join(
            '<td><img src="%s/%s" loading="lazy"></td>' % (t, name)
            if (OUT / t / name).exists() else '<td class="none">—</td>'
            for t in tags)
        rows.append('<tr><th>%d×%d<br>c%s</th>%s</tr>' % (w, h, c, cells))
head = ''.join('<th>%s</th>' % t for t in tags)
(OUT / 'contact.html').write_text(
    '<!DOCTYPE html><meta charset="utf-8"><title>clean-hop shots</title>'
    '<style>body{font-family:system-ui;background:#22242a;color:#eee;margin:16px}'
    'table{border-collapse:collapse}th,td{padding:6px;vertical-align:top;'
    'text-align:left;font-weight:600}'
    'img{display:block;max-width:430px;width:100%;border-radius:6px;'
    'background:#111}.none{color:#555}</style>'
    '<table><tr><th></th>' + head + '</tr>' + ''.join(rows) + '</table>',
    encoding='utf-8')
print(OUT / 'contact.html')
