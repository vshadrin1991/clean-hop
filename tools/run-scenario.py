#!/usr/bin/env python3
"""Run a tools/scenarios/*.js file against the instrumented test build in
headless Chrome and print its result object:
    python3 tools/run-scenario.py tools/scenarios/energy-model.js
The scenario file stays verbatim - it can also be pasted into the test
build's console by hand (top-level await works there)."""
import os, pathlib, re, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

scenario = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
# the console snippet ends in a bare ( ... ) result expression - capture it
i = scenario.rfind('\n(')
if i < 0:
    sys.exit('scenario has no result expression')
scenario = scenario[:i] + '\n__r = (' + scenario[i + 2:]

subprocess.run([sys.executable, str(ROOT / 'tools/test-build.py')],
               check=True, capture_output=True)
out = pathlib.Path(os.environ.get('CLEAN_HOP_TEST',
                   pathlib.Path(tempfile.gettempdir()) / 'clean-hop-test'))
page = out / '_scenario.html'
src = (out / 'index.html').read_text(encoding='utf-8')
src += ('\n<script>\n(async function () {\nvar __r;\ntry {\n' + scenario +
        '\n} catch (e) { __r = { error: String(e && e.stack || e) }; }\n'
        'var pre = document.createElement("pre");\n'
        'pre.id = "scenario-out";\n'
        'pre.textContent = "SCENARIO " + JSON.stringify(__r);\n'
        'document.body.appendChild(pre);\n'
        '})();\n</script>\n')
page.write_text(src, encoding='utf-8')
try:
    r = subprocess.run([CHROME, '--headless=new', '--disable-gpu',
                        '--mute-audio', '--virtual-time-budget=30000',
                        '--dump-dom', 'file://' + str(page)],
                       capture_output=True, text=True, timeout=180)
    m = re.search(r'SCENARIO (.*?)</pre>', r.stdout, re.S)
    if m:
        print(m.group(1))
    else:
        print('NO RESULT')
        print(r.stdout[-3000:])
        print(r.stderr[-1000:])
finally:
    page.unlink()
