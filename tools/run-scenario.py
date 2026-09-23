#!/usr/bin/env python3
"""Run a tools/scenarios/*.js file against the instrumented test build in
headless Chrome (via the DevTools protocol) and print its result object:
    python3 tools/run-scenario.py tools/scenarios/energy-model.js
    python3 tools/run-scenario.py tools/scenarios/visual.js --size 390x844
The scenario file stays verbatim - it runs as an awaited async expression,
so top-level await and the trailing ( ... ) result literal both work."""
import json, os, pathlib, subprocess, sys, tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import chrome

ROOT = pathlib.Path(__file__).resolve().parent.parent

scenario = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
size = (1280, 720)
if '--size' in sys.argv:                       # --size WxH for visual.js
    w, h = sys.argv[sys.argv.index('--size') + 1].split('x')
    size = (int(w), int(h))
cpu = 0                                        # --cpu 6 = 6x throttle
if '--cpu' in sys.argv:
    cpu = int(sys.argv[sys.argv.index('--cpu') + 1])
url_extra = ''                                 # --url fps -> #fps meter etc.
if '--url' in sys.argv:
    url_extra = '#' + sys.argv[sys.argv.index('--url') + 1]
build_dir = 'clean-hop-test'                   # --no-inline: real file:// sprites
build_args = [str(ROOT / 'tools/test-build.py')]
if '--no-inline' in sys.argv:
    build_args.append('--no-inline')
    build_dir = 'clean-hop-test-file'
# the scenario ends in a bare ( ... ) result expression - return it
i = scenario.rfind('\n(')
if i < 0:
    sys.exit('scenario has no result expression')
expr = ('(async () => {\n' + scenario[:i] +
        '\nreturn ' + scenario[i + 1:] + ';\n})()')

subprocess.run([sys.executable] + build_args, check=True, capture_output=True)
out = pathlib.Path(os.environ.get('CLEAN_HOP_TEST',
                   pathlib.Path(tempfile.gettempdir()) / build_dir))

res = chrome.run([{
    'type': 'eval', 'id': pathlib.Path(sys.argv[1]).stem,
    'url': 'file://' + str(out / 'index.html') + url_extra,
    'w': size[0], 'h': size[1], 'cpu': cpu, 'expr': expr,
    'ready': "document.readyState === 'complete' && !!window.__t",
    'timeout': 120000}])[0]

if res.get('ok'):
    print(json.dumps(res['result'], ensure_ascii=False))
else:
    print('NO RESULT')
    print(res.get('error') or res.get('ex'))
