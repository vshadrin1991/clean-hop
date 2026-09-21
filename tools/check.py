#!/usr/bin/env python3
"""Static checks for the v8 game folder. Run from the project root:
    python3 tools/check.py
Prints OK, or every problem found and exits 1."""
import pathlib, re, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
GAME = ROOT / 'clean-hop-v8'
problems = []

html = (GAME / 'index.html').read_text(encoding='utf-8')
script = re.findall(r'<script>(.*?)</script>', html, re.S)[-1]
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
on_disk = {'assets/sprites/' + p.name for p in (GAME / 'assets/sprites').glob('*.svg')}
for extra in sorted(on_disk - files):
    problems.append('sprite on disk but not cached (unused? delete it): ' + extra)

print('\n'.join(problems) if problems else 'OK')
sys.exit(1 if problems else 0)
