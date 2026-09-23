#!/usr/bin/env python3
"""Shared headless-Chrome launcher for the clean-hop tools.
launch() starts Chrome with a free remote-debugging port and a throwaway
profile; run(jobs) streams a job list through tools/cdp.mjs (Node 22) and
returns one result dict per job."""
import json, pathlib, shutil, socket, subprocess, tempfile, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
CDP = ROOT / 'tools/cdp.mjs'


def launch():
    s = socket.socket()
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    prof = tempfile.mkdtemp(prefix='clean-hop-chrome-')
    proc = subprocess.Popen(
        [CHROME, '--headless=new', '--mute-audio',
         '--remote-debugging-port=%d' % port,
         '--user-data-dir=' + prof, 'about:blank'],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    url = 'http://127.0.0.1:%d/json/version' % port
    for _ in range(120):
        try:
            urllib.request.urlopen(url, timeout=0.25)
            return proc, port, prof
        except Exception:
            time.sleep(0.1)
            if proc.poll() is not None:
                break
    proc.terminate()
    raise RuntimeError('headless Chrome did not open its debugging port')


def run(jobs, timeout=300):
    proc, port, prof = launch()
    spec = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False)
    try:
        json.dump({'port': port, 'jobs': jobs}, spec)
        spec.close()
        r = subprocess.run(['node', str(CDP), spec.name],
                           capture_output=True, text=True, timeout=timeout)
        out = []
        for line in r.stdout.splitlines():
            line = line.strip()
            if line.startswith('{'):
                out.append(json.loads(line))
        if not out and r.returncode:
            raise RuntimeError('cdp.mjs failed: ' + r.stderr[-800:])
        return out
    finally:
        proc.terminate()
        shutil.rmtree(prof, ignore_errors=True)
