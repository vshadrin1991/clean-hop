// v9.5 Easter egg plumbing: the found list, its storage, and the toast.
//   python3 tools/run-scenario.py tools/scenarios/eggs-plumbing.js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = __t;
const fails = [], out = {};
const toast = document.getElementById('eggToast');
const KEY = 'cleanHop.eggs.v1';
const stored = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return 'junk'; } };

/* ---- A: a fresh player has found nothing ------------------------------ */
out.A = { found: t.eggsFound ? Object.keys(t.eggsFound) : null };
if (!t.eggsFound) fails.push('A: no eggsFound');
else if (out.A.found.length) fails.push('A: a fresh player already has ' + out.A.found);

/* ---- B: the first find chimes, shows the toast and is saved ----------- */
const first = t.eggFound('tickle');
await sleep(50);
out.B = { first, text: toast && toast.textContent,
          shown: !!toast && toast.classList.contains('show'), stored: stored() };
if (first !== true) fails.push('B: first find returned ' + first);
if (!out.B.shown) fails.push('B: toast not shown');
if (!/Секрет найден/.test(out.B.text || '')) fails.push('B: toast says "' + out.B.text + '"');
if (!Array.isArray(out.B.stored) || !out.B.stored.includes('tickle')) fails.push('B: not saved');

/* ---- C: finding it again is quiet ------------------------------------- */
await sleep(2000);                               // the toast has gone by now
const again = t.eggFound('tickle');
await sleep(50);
out.C = { again, shown: !!toast && toast.classList.contains('show') };
if (again !== false) fails.push('C: second find returned ' + again);
if (out.C.shown) fails.push('C: toast shown for an egg found before');

/* ---- D: saved eggs load back; junk in storage is ignored -------------- */
localStorage.setItem(KEY, '["sleep","title"]');
t.loadEggs();
out.D = { loaded: t.eggsFound ? Object.keys(t.eggsFound) : null };
if (!t.eggsFound || !t.eggsFound.sleep || !t.eggsFound.title || t.eggsFound.tickle)
  fails.push('D: load gave ' + out.D.loaded);
localStorage.setItem(KEY, '{broken');
try { t.loadEggs(); } catch (e) { fails.push('D: junk threw ' + e); }
if (!t.eggsFound || Object.keys(t.eggsFound).length) fails.push('D: junk left eggs behind');

/* ---- E: a storage that throws never loses a find ---------------------- */
const origSet = Storage.prototype.setItem;
Storage.prototype.setItem = function () { throw new Error('quota'); };
let eOK = false;
try { eOK = t.eggFound('diver') === true && t.eggsFound.diver === true; }
catch (e) { fails.push('E: threw ' + e); }
Storage.prototype.setItem = origSet;
if (!eOK) fails.push('E: find lost when storage throws');

({ ...out, fails, pass: fails.length === 0 })
