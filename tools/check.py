#!/usr/bin/env python3
"""Static checks for a game folder (default clean-hop-v10). Run from the project root:
    python3 tools/check.py
    python3 tools/check.py --game clean-hop-v9
Prints OK, or every problem found and exits 1."""
import ast, pathlib, re, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
GAME = ROOT / 'clean-hop-v10'
if '--game' in sys.argv:
    GAME = ROOT / sys.argv[sys.argv.index('--game') + 1]
problems = []

html = (GAME / 'index.html').read_text(encoding='utf-8')
# every <script> block - [-1] alone was only the service-worker one
for script in re.findall(r'<script>(.*?)</script>', html, re.S):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False) as f:
        f.write(script)
    r = subprocess.run(['node', '--check', f.name], capture_output=True, text=True)
    if r.returncode:
        problems.append('script syntax:\n' + r.stderr)

# every sprite the game asks for exists and is cached for offline play
block = re.search(r'var SPRITES = \{(.*?)\n\};', html, re.S).group(1)
sprites = set(re.findall(r"'([a-z0-9-]+)':\s*\{", block))
sw = (GAME / 'sw.js').read_text(encoding='utf-8')
files = set(re.findall(r"'([^']+)'", re.search(r'var FILES = \[(.*?)\];', sw, re.S).group(1)))
for name in sorted(sprites):
    if not (GAME / 'assets/sprites' / (name + '.svg')).exists():
        problems.append('missing sprite file: ' + name + '.svg')
    if 'assets/sprites/' + name + '.svg' not in files:
        problems.append('sprite not in sw.js FILES: ' + name)
for path in sorted(files):
    if path != './' and not (GAME / path).exists():
        problems.append('sw.js lists a missing file: ' + path)

# gadget lit layers: every lit:1 sprite needs a real <name>-lit.svg on disk
# and in FILES, and its body SVG must no longer carry an id="lit" group
for name in sorted(sprites):
    if not re.search(r"'" + name + r"':\s*\{[^}]*lit:\s*1", block):
        continue
    lit_svg = name + '-lit.svg'
    if not (GAME / 'assets/sprites' / lit_svg).exists():
        problems.append('lit layer missing on disk: ' + lit_svg)
    if 'assets/sprites/' + lit_svg not in files:
        problems.append('lit layer not in sw.js FILES: ' + name)
    body = GAME / 'assets/sprites' / (name + '.svg')
    if body.exists() and 'id="lit"' in body.read_text(encoding='utf-8'):
        problems.append('body svg still has id="lit": ' + name + '.svg')

on_disk = {'assets/sprites/' + p.name for p in (GAME / 'assets/sprites').glob('*.svg')}
for extra in sorted(on_disk - files):
    problems.append('sprite on disk but not cached (unused? delete it): ' + extra)

# factory windows: every FMETA entry lists the glass <rect> panes of its
# sprite (either inside a fill="url(#glass…)" group or carrying the fill
# itself). A mismatch > 1 unit means the lit overlay drifts off the art.
fm = re.search(r'var FMETA = \{(.*?)\n\};', html, re.S)
if not fm:
    problems.append('no FMETA block found')
else:
    fblock = fm.group(1)
    if 'flare' in fblock:
        problems.append('FMETA still carries a flare key')
    for em in re.finditer(r'(\w+):\s*\{(.*?)\}\s*(?=,|$)', fblock, re.S):
        kind, body = em.group(1), em.group(2)
        spr = re.search(r"spr:\s*'([^']+)'", body)
        pane = re.search(r'pane:\s*([\d.]+)', body)
        panes = re.search(r'panes:\s*(\[\[.*?\]\])', body, re.S)
        if not (spr and pane and panes):
            problems.append('FMETA ' + kind + ': missing spr/pane/panes')
            continue
        svg = GAME / 'assets/sprites' / (spr.group(1) + '.svg')
        if not svg.exists():
            problems.append('FMETA ' + kind + ': missing sprite ' + svg.name)
            continue
        st = svg.read_text(encoding='utf-8')
        rects = []
        for gm in re.finditer(r'<g[^>]*fill="url\(#glass[^)]*\)"[^>]*>(.*?)</g>',
                              st, re.S):
            rects += re.findall(r'<rect[^>]*>', gm.group(1))
        rects += re.findall(r'<rect[^>]*fill="url\(#glass[^)]*\)"[^>]*/?>', st)

        def dims(r):
            def a(n): return float(re.search(n + r'="([\d.]+)"', r).group(1))
            return (a('x'), a('y'), a('width'), a('height'))
        want = sorted(dims(r) for r in rects)
        ps = float(pane.group(1))
        got = sorted(tuple(p) if len(p) == 4 else (p[0], p[1], ps, ps)
                     for p in ast.literal_eval(panes.group(1)))
        if len(want) != len(got) or any(
                abs(a - b) > 1 for w, g in zip(want, got)
                for a, b in zip(w, g)):
            problems.append('FMETA ' + kind + ': panes ' + str(got) +
                            ' != svg glass ' + str(want))

# v9.3 tips: every tip marks exactly one action as *...* and stays short
tb = re.search(r'var TIPS = \{(.*?)\n\};', html, re.S)
if not tb:
    problems.append('no TIPS block found')
else:
    tips = re.findall(r"'((?:[^'\\]|\\.)*)'", tb.group(1))
    if len(tips) < 10:
        problems.append('TIPS: only %d tips found' % len(tips))
    for tip in tips:
        if tip.count('*') != 2:
            problems.append('tip needs exactly one *action*: ' + tip)
        if len(tip.replace('*', '')) > 80:
            problems.append('tip over 80 characters: ' + tip)

# v10+: checks below only apply from this version on (--game v9 skips them)
m = re.search(r'-v(\d+)$', GAME.name)
VER = int(m.group(1)) if m else 0

# island light is soft - one sideways gradient and a rim light that
# fades in towards the sun through an untransformed mask (so the mirrored
# twins stay lit on the right), never hard-edged wedges
if VER >= 10:
    for p in sorted((GAME / 'assets/sprites').glob('island-[0-9]*.svg')):
        st = p.read_text(encoding='utf-8')
        if 'fill="url(#side)"' not in st or '<g mask="url(#sunside)">' not in st:
            problems.append('island light is not the soft v10 gradient: ' + p.name)
        if 'url(#sun)' in st or 'L108 30' in st:
            problems.append('island still has a hard-edged light wedge: ' + p.name)

# every island sprite meets the water through drawIslandBody - no other
# code paints a whole island over its own submerged part (the finish
# meadow's bank is an island-2 too). Searches `html`: `script`
# above is the last <script>, the service-worker one, not the game.
if VER >= 10:
    direct = re.findall(r"\bspr\((?:isl\b|'island-)", html)
    if direct:
        problems.append('island sprite drawn whole, not via drawIslandBody: %d call(s)' % len(direct))
    if len(re.findall(r'\bdrawIslandBody\(', html)) < 3:       # definition + 2 callers
        problems.append('drawIslandBody must serve both drawStone and drawMeadow')

# v10.3: the start jetty meets the water like the islands, at a depth by
# the hero's ruler - never drawn whole, never sized by the screen height
if VER >= 10:
    if re.search(r"\bspr\('jetty'", html) or 'VH * 0.062' in html:
        problems.append('jetty drawn whole or sized by VH, not via drawIslandBody')

print('\n'.join(problems) if problems else 'OK')
sys.exit(1 if problems else 0)
