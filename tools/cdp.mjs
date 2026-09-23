#!/usr/bin/env node
/* Minimal CDP driver for the clean-hop tools - no dependencies, Node 22+.
   Usage: node tools/cdp.mjs <jobs.json>
   jobs.json: { "port": 9222, "jobs": [ ... ] }

   Each job:
     { "type": "shot", "url": "...#shot=0,7", "w": 390, "h": 844, "dsf": 1,
       "out": "/tmp/x.png", "ready": "<js expr polling true>" }
     { "type": "eval", "url": "file://.../_scenario.html", "w": 1280,
       "h": 720, "expr": "(async () => { ... })()", "id": "world" }

   Emulation.setDeviceMetricsOverride gives a true CSS viewport (no window
   minimums), Page.captureScreenshot returns real pixels, and Runtime.evaluate
   with awaitPromise runs a scenario to its actual result.
   One JSON line per job is printed to stdout. */
import fs from 'node:fs';

const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const ver = await (await fetch(`http://127.0.0.1:${spec.port}/json/version`)).json();
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let seq = 0;
const pending = new Map();
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const mid = ++seq;
  pending.set(mid, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result));
  ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const report = o => console.log(JSON.stringify(o));

for (const job of spec.jobs) {
  let targetId;
  try {
    ({ targetId } = await send('Target.createTarget', { url: 'about:blank' }));
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    await send('Page.enable', {}, sessionId);
    await send('Runtime.enable', {}, sessionId);
    if (job.w) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: job.w, height: job.h,
        deviceScaleFactor: job.dsf || 1, mobile: !!job.mobile
      }, sessionId);
    }
    if (job.cpu) await send('Emulation.setCPUThrottlingRate', { rate: job.cpu }, sessionId);
    await send('Page.navigate', { url: job.url }, sessionId);

    const deadline = Date.now() + (job.timeout || 45000);
    for (;;) {
      const { result } = await send('Runtime.evaluate', {
        expression: job.ready ||
          "document.readyState === 'complete' && document.body && " +
          "document.body.getAttribute('data-ready') === '1'",
        returnByValue: true
      }, sessionId);
      if (result && result.value === true) break;
      if (Date.now() > deadline) throw new Error('ready timeout');
      await sleep(120);
    }

    if (job.type === 'shot') {
      if (job.pre)                                // stage a live scene first
        await send('Runtime.evaluate', { expression: job.pre,
          awaitPromise: true, returnByValue: true }, sessionId);
      const { data } = await send('Page.captureScreenshot',
        { format: 'png' }, sessionId);
      fs.writeFileSync(job.out, Buffer.from(data, 'base64'));
      report({ ok: true, out: job.out });
    } else {
      const r = await send('Runtime.evaluate', {
        expression: job.expr, awaitPromise: true, returnByValue: true
      }, sessionId);
      const v = r.result && r.result.value;
      report({ ok: !r.exceptionDetails, id: job.id, result: v,
               ex: r.exceptionDetails && (r.exceptionDetails.text +
                 ' ' + JSON.stringify(r.exceptionDetails.exception || {})) });
    }
    await send('Target.closeTarget', { targetId });
  } catch (e) {
    report({ ok: false, id: job.id, out: job.out, error: String(e) });
    if (targetId) try { await send('Target.closeTarget', { targetId }); } catch {}
  }
}
ws.close();
process.exit(0);
