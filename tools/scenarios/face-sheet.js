// v10 focus face contact sheet - a picture to look at, not a pass/fail
// test. Columns: the heroes in ANIMALS order. Rows: calm; focus 0.5 at
// 30 % power; full focus at 60 %; full power; the secret jump armed. Each
// cell: the hero at 3x (W = 120), and at phone size (W = 40) on its right.
// Save it as a PNG:
//   python3 tools/run-scenario.py tools/scenarios/face-sheet.js | python3 -c "import sys,json,base64,os,tempfile; d=json.loads(sys.stdin.read()); p=os.path.join(tempfile.gettempdir(),'face-sheet.png'); open(p,'wb').write(base64.b64decode(d['png'].split(',',1)[1])); print(p)"
const t = __t, kinds = Object.keys(t.ANIMALS);
const rows = [[0, 0, false], [0.5, 0.3, false], [1, 0.6, false], [1, 1, false], [1, 1, true]];
const CW = 330, CH = 240;
const sheet = document.createElement('canvas');
sheet.width = CW * kinds.length;
sheet.height = CH * rows.length;
const g = sheet.getContext('2d');
g.fillStyle = '#9cc9e4';                         // a sky-blue backdrop, like the game
g.fillRect(0, 0, sheet.width, sheet.height);
rows.forEach(([f, ch, armed], r) => kinds.forEach((k, c) => {
  const ff = t.focusFace(f, ch, armed);
  const o = { t: 0, crouch: f, focus: ff.lid, look: ff.look, focusTongue: ff.tongue,
              flush: ff.flush, wow: ff.wow };
  g.drawImage(t.paintAnimal(k, o, 120), c * CW, r * CH);
  g.drawImage(t.paintAnimal(k, o, 40), c * CW + 245, r * CH + 150);
}));
({ png: sheet.toDataURL('image/png'), cols: kinds, rows })
