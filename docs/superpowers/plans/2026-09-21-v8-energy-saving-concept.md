# Clean Hop v8 — Energy-Saving Concept Update: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the game's main goal from *cleaning up pollution* into *saving energy*. The rules, world, text, UI style and app identity should all tell one story: switch off what's wasting energy, and the planet recovers.

**Architecture:** The game stays a single-file canvas game (`clean-hop-v8/index.html`) plus flat SVG sprites (`clean-hop-v8/assets/sprites/`) and a service worker (`clean-hop-v8/sw.js`) for offline play. The progress model changes from "points fill the bar" to "switched-off appliances fill an energy battery". The existing lamp mechanic grows into a small appliance ("gadget") system. The world's existing before/after palette blend (`cleanShown`) is kept but now shows energy saved.

**Tech Stack:** Vanilla ES5 JavaScript in one `<script>`, Canvas 2D, CSS custom properties, SVG sprites, Web Audio synthesis, Service Worker cache, `localStorage`. No build step, no dependencies. Tooling: Python 3 + Node 22 (syntax checks only), headless Google Chrome (icon export).

**Spec:** This document. Sections 1–5 are the spec (concept, mapping, style, copy, constraints). Section 7 onward is the task list.

**Baseline:** the current `clean-hop-v8` folder (21 Sep 2026). It already has: the energy-saving tagline, island lamps that switch off on landing (+1), a «Лампочки» counter on the game-over card, and «Ой-ёй». Line numbers below refer to this version.

---

## 0. Decisions to confirm before Task 1

Each one has a recommendation. The plan is written assuming the recommendation. If you pick otherwise, the listed tasks change.

| # | Decision | Options | Recommended | Tasks affected |
|---|----------|---------|-------------|----------------|
| D1 | Game name | **A.** «Энергопрыжок» · **B.** «Прыг-Выключатель» · **C.** keep «Чистый Прыжок» + subtitle «Береги энергию» | **A**. It names the new goal and keeps the "Прыжок" family feel. | 3, 9 |
| D2 | What fills the progress bar | **A.** Only switched-off appliances (energy ⚡); landing and bonuses give points for the record · **B.** Everything fills it, as now | **A**. You can't finish without saving energy, so the goal *is* the mechanic. | 1, 3 |
| D3 | Island hazard | **A.** «Энерговампир» (a plug creature: stand-by power) replaces the trash pile · **B.** keep the trash pile | **A** | 6 |
| D4 | Flying bonus | **A.** Leaf becomes a «солнечная искорка» (sun spark, points only) · **B.** keep the leaf | **A** | 5 |
| D5 | Records | **A.** Start fresh records (scoring changed, old numbers aren't comparable) · **B.** keep old keys | **A** | 1 |
| D6 | Main UI accent | **A.** Energy yellow buttons with dark text, green kept for eco details · **B.** keep all-green UI | **A** | 4 |

---

## 1. Concept

**One-line pitch (RU):** «Помоги зверятам сберечь больше энергии — береги Планету!»

**Story.** Someone left the whole town running: lamps burn in broad daylight, TVs play to nobody, chargers sit in sockets, fans spin in empty rooms. The power station works flat out, its chimneys smoke, the sky and water are murky. The animal hero hops from island to island and switches everything off. Every switch-off is energy saved. The more energy is saved, the less the station has to burn: smoke thins, city windows go dark, wind turbines and solar panels appear, the water clears and birds return. At the end the school runs on sun and wind.

**Cause and effect the player should learn:** *switch off → energy saved → the power station smokes less → nature recovers.*

**Core loop (unchanged controls):** hold → release to jump → land on an island → whatever is running there clicks off (+1 ⚡ to the energy battery) → next island.

**Win:** the energy battery reaches the goal (e.g. «выключи 18»), the finish appears, land on it.
**Lose:** fall into the water or land on an energy vampire.

**Two tracks (D2-A):**
- **⚡ Energy** = number of appliances switched off. Fills the battery meter and drives the world's recovery (`clean`). This is the goal.
- **Очки (points)** = skill: +1 per new island, +2 for a bullseye landing, +3 per sun spark, +1 per switch-off. Used for the record.

**What the player learns (tips shown in-game, Task 8):** switch off the light when you leave, unplug chargers, turn the TV off properly (not just stand-by), fans only when you're in the room, keep the fridge door short, hot water is energy too.

---

## 2. Element mapping (old → new)

| Element (baseline) | Where | New meaning | Change | Task |
|---|---|---|---|---|
| «Очищено» bar, `clean = score / CLEAN_TARGET` | HUD, `updateHud` :1902 | Energy battery «Энергия 7/18» | Filled by switch-offs only; shows count, not % | 1, 4 |
| Island lamp (`s.lamp`) | :1723, :2013, :3165 | One of 4 gadgets | Generalised to `s.gadget` with kinds lamp/tv/charger/fan; ~80% of islands | 1, 2 |
| Difficulty "путь 40 очков" | `DIFF_POINTS` :925, dial :2225 | "выключи 18" | Targets become appliance counts | 1, 3 |
| Leaf collectible (+3) | spawn :1736, pickup :2349 | Sun spark (+3 points) | New sprite, popup, colour | 5 |
| Trash pile on island edge | spawn, `land`, `drawStone` :3371 | Energy vampire (stand-by power) | New sprite, fail popup «ЭНЕРГОВАМПИР!» | 6 |
| Crumbling island | `drawStone` crumble branch | Overloaded island (sparking cable) | Sparks + scorch instead of cracks | 6 |
| Factories with smoke | `drawSkyline` :2744, `drawFactory` :2693 | Power station and town | Windows switch off building-by-building; solar panels appear | 5 |
| Shore lamps (glow fades smoothly) | `drawShore` :2824 | Street lights left on | Each lamp clicks off at its own threshold | 5 |
| Wind turbines fade in | `drawTurbine` :2669 | Clean energy arriving | Keep; add solar panels | 5 |
| Power lines (none) | — | Energy flowing to town | New pylons with glowing pulses that slow as energy is saved (P2) | 5 |
| Floating junk | `drawJunk` :2959 | Pollution from the station | Keep, fades as now | — |
| Finish meadow + school | `drawMeadow` :3002 | Sun-powered school | Solar panels on the gym roof, turbine, battery sign | 7 |
| Win title «Ты справился!» | `gameOver` :1970 | «Энергия сбережена!» | Gender-neutral, energy wording | 3 |
| Game-over stats: Камни/Листья/Лампочки/Рекорд | :414–418 | Выключено N из M / Искорки / Рекорд | Drop «Камни» | 3 |
| End-of-run message | `MSG_*` :1860 | Energy messages | Rewritten copy deck | 3 |
| (none) | — | Energy tip «Совет» | New tip line on game-over and pause | 8 |
| Leaf icon, green UI | CSS :23, :88–114, :134, :289 | Energy yellow + eco green | Style refresh | 4 |
| App icon = leaf | `icon-*.png` | Bulb with a leaf | New icons, manifest name | 9 |

---

## 3. Style guide

### 3.1 UI tokens (`:root`, index.html:23–34)

| Token | Value | Use |
|---|---|---|
| `--ink` | `#20303a` (keep) | Text |
| `--ink-soft` | `#5d7a83` (keep) | Labels |
| `--cream` | `#fffaf0` (keep) | Cards, pills |
| `--volt` | `#ffc93c` **new** | Primary accent: buttons, selected hero, battery fill start |
| `--volt-dk` | `#d99a00` **new** | Button shadow, focus rings on cream |
| `--volt-soft` | `#fff3c9` **new** | Selected hero tile background |
| `--leaf` / `--leaf-dk` | `#4fbf5f` / `#2f8f43` (keep) | Eco details: battery fill end, eco messages, tips |
| `--sun`, `--sky`, `--grime` | keep | unchanged |

Contrast check: `--ink` on `--volt` ≈ 9:1 (passes AA for all text sizes).

### 3.2 Motifs
- **Lightning bolt ⚡** = energy (meter icon, card watermark, fly-to-meter token).
- **Bulb** = switch-off count (stats icon, app icon).
- **Leaf** stays only where nature is meant (eco messages colour, bulb-with-leaf icon).
- Shapes stay round and chunky (existing radii: pills 999px, cards 30px, buttons 18px).

### 3.3 Components
- **Primary button** `.btn`: yellow `--volt` background, `--ink` text, `0 5px 0 var(--volt-dk)` shadow.
- **Hero picker** selected tile: `--volt-soft` background, `--volt` border, `--volt-dk` shadow, check badge yellow with ink tick.
- **Energy meter** = a battery: outlined rounded body, small terminal nub on the right, fill gradient `--volt → #7ee06a`, bolt icon before the label, value `7/18`.
- **Card watermark** (`.card::before`): lightning bolt instead of the leaf.
- **Title marker** (`h1 em`): yellow marker stripe instead of green.
- **Big final number**: `--ink` (the yellow is too light for text on cream).

### 3.4 In-world palette
Keep the `palette()` blend (index.html:2477). The "wasteful" end stays murky, but add **warm electric glows** that go out as energy is saved: window bands, street lamps and island gadgets. The "efficient" end stays bright sky and teal water. Gadget glow colour: `rgba(255,226,140,…)`, as the island lamp uses now.

---

## 4. Copy deck (Russian UI text)

Rules: address the player with «ты»; **no gendered past-tense verbs aimed at the player** («Ты справился», «дошёл» → neutral wording); short lines (≤ 60 chars) for phones.

| Where (baseline line) | Old | New |
|---|---|---|
| `<title>` :8, apple title :14, noscript h1 :341, menu h1 :372 | Чистый Прыжок | Энергопрыжок (menu: `Энерго<em>прыжок</em>`) |
| meta description :7 | …сберечь больше энергии: прыгай по островкам… | Энергопрыжок — помоги зверятам сберечь больше энергии: прыгай по островкам, выключай всё, что работает зря, и береги Планету! |
| Tagline :373 | (keep) | Помоги зверятам сберечь больше энергии — береги Планету! |
| How-to line (new, under tagline) | — | Прыгай на островки и выключай всё, что работает зря! |
| HUD meter cap :363 | Очищено | Энергия |
| HUD meter value | 13% | 7/18 |
| Dial readout :382, :2225 | путь 40 очков | выключи 18 |
| Dial aria :2226 | Средний, путь 40 очков | Средний, цель — выключить 18 приборов |
| Level chip :2227 | Средний · путь 40 | Средний · цель 18 |
| Pause text :400 | Отдыхаем — а лишний свет пусть не горит! Полоса очистки сохранится. | Отдыхаем — а лишний свет пусть не горит! Энергия сохранится. |
| Win title :1978 | Ты справился! | Энергия сбережена! |
| Lose title :1979 | Ой-ёй! / Ой-ёй! Зато улов хорош. | Ой-ёй! / Ой-ёй! Зато искорок много. |
| Stats :414–418 | Камни · Листья · Лампочки · Рекорд | Выключено 7 из 18 · Искорки 2 · Рекорд 40 |
| Fall popup :2009 | УПС! (trash) / ОЙ-ЁЙ! | ЭНЕРГОВАМПИР! (vampire) / ОЙ-ЁЙ! |
| Bonus popup :2349 | ЛИСТИК +3 | ИСКОРКА +3 |
| Switch-off popups | СВЕТ ВЫКЛ! +1 | СВЕТ ВЫКЛ! · ТЕЛЕВИЗОР ВЫКЛ! · ЗАРЯДКА ВЫКЛ! · ВЕНТИЛЯТОР ВЫКЛ! |
| Finish cue :1850 | ФИНИШ ВПЕРЕДИ! | (keep) |
| New record :1896 | Новый рекорд отряда чистоты! | Новый рекорд отряда энергосбережения! |
| New record + win :1895 | Новый рекорд — и чистая земля впридачу! | Новый рекорд — и вся энергия сбережена! |

**End-of-run messages** (replace the four arrays at :1860–1892):

```js
var MSG_START = [                                 // fell in the first few hops
  'Первый шаг всегда самый трудный. Пробуй ещё!',
  'Выключишь хоть одну лампочку — уже сбережёшь энергию!',
  'Ничего страшного: зверята готовы к новой попытке.',
  'Не спеши с зарядом — и всё получится.'
];
var MSG_MID = [                                   // a decent run
  'Каждый выключенный прибор — помощь Планете!',
  'Меньше лишнего света — больше энергии для Планеты.',
  'Электростанция уже дымит меньше. Ещё разок?',
  'Маленькие прыжки — большая экономия. Вперёд!',
  'Энерговампиры отступают. Так держать!',
  'Небо светлеет с каждым выключателем. Продолжай!'
];
var MSG_NEAR = [                                  // bar was almost full
  'Батарейка была почти полной! Ещё один заход.',
  'До финиша оставалось чуть-чуть. Не сдавайся!',
  'Ещё чуть-чуть — и вся энергия будет сбережена!',
  'Так близко! Ещё попытка — и школа заработает от солнца.'
];
var MSG_WIN = [                                   // reached the finish
  'Свет выключен, энергия сбережена — Планета говорит спасибо!',
  'Электростанция отдыхает, а небо снова голубое. Ура!',
  'Школа теперь работает от солнца и ветра. Спасибо!',
  'Вот что бывает, когда никто не оставляет свет зря.',
  'Всё лишнее выключено. Бабочки прилетели сказать спасибо!'
];
```

**Energy tips** (Task 8):

```js
var TIPS = {
  lamp:    ['Уходишь из комнаты — выключи свет.',
            'Днём светло и без лампы: просто открой шторы!'],
  tv:      ['Никто не смотрит телевизор? Выключи его совсем, а не только пультом.'],
  charger: ['Телефон зарядился — вынь зарядку из розетки.'],
  fan:     ['Вентилятор нужен, только когда ты рядом.'],
  any:     ['Закрывай дверцу холодильника побыстрее.',
            'Горячая вода — это тоже энергия. Не оставляй кран открытым.',
            'Энерговампиры — это приборы в режиме ожидания. Выключай их кнопкой.']
};
```

---

## 5. Global Constraints

- All game code stays in `clean-hop-v8/index.html`; art is SVG in `clean-hop-v8/assets/sprites/`. No build step, no libraries, no network requests at runtime.
- The game must keep working from `file://` and over http(s). **Never read pixels back from the canvas** (sprites taint it under `file://`, see the comment at index.html:1001).
- Every new sprite → add it to `SPRITES` (index.html:1011) **and** to `FILES` in `sw.js`. Every removed sprite → remove it from both and delete the file.
- Every task that changes `clean-hop-v8/` bumps `VERSION` in `sw.js` (`clean-hop-v8-2`, `-3`, … one per task). Each task names the exact value in its last step. Without the bump, installed copies keep the old game.
- `localStorage` keys `cleanHop.animal.v1`, `cleanHop.diff.v1`, `cleanHop.muted.v1` stay unchanged (the hero, difficulty and mute choices survive). Records move to a new namespace (D5).
- Russian UI copy follows the rules in Section 4 (ты-form, gender-neutral, ≤ 60 chars).
- Layout: no horizontal scroll at 320px width; menu card fits a 360×640 phone without scrolling; touch and keyboard (Space/Enter/Esc/M) both work.
- `prefers-reduced-motion` stays respected (index.html:308); new CSS animations go through the same rule automatically.
- `clean-hop-v7/` and older folders are never modified.
- Code style: match the file: ES5 `var`/`function`, 2-space indent, comment density and tone of surrounding code, no semicolon-free lines.

---

## 6. File map

| File | Responsibility | Tasks |
|---|---|---|
| `tools/check.py` (new) | Static checks: script syntax, sprite ↔ file ↔ cache consistency | 0, all |
| `tools/test-build.py` (new) | Instrumented copy exposing `window.__t` for scripted browser checks | 0, all |
| `tools/icon/icon.svg` (new) | Master app icon | 9 |
| `tools/icon/export.sh` (new) | Exports PNG icons with headless Chrome | 9 |
| `clean-hop-v8/index.html` | Game: CSS, markup, logic, rendering | 1–9 |
| `clean-hop-v8/sw.js` | Offline cache list + VERSION | 1–9 |
| `clean-hop-v8/manifest.webmanifest` | App name/colours | 9 |
| `clean-hop-v8/assets/sprites/gadget-tv.svg`, `gadget-charger.svg`, `gadget-fan.svg` (new) | Appliances | 2 |
| `clean-hop-v8/assets/sprites/sun-spark.svg`, `solar-panel.svg`, `pylon.svg` (new) | Bonus + world | 5 |
| `clean-hop-v8/assets/sprites/energy-vampire.svg` (new) | Hazard | 6 |
| `clean-hop-v8/assets/sprites/leaf.svg`, `trash-pile.svg` (delete) | Replaced | 5, 6 |
| `clean-hop-v8/icon-180.png`, `icon-192.png`, `icon-512.png` | App icons | 9 |

---

## 7. Tasks

Priority: **P1** = needed for the concept to read clearly; **P2** = polish, can ship later. Effort: S ≈ <1h, M ≈ 1–3h, L ≈ 3–6h.

### Task 0: Verification tooling (P1, S)

There is no test framework. These two scripts replace it: a static checker every task runs, and a test build for scripted in-browser checks.

**Files:**
- Create: `tools/check.py`
- Create: `tools/test-build.py`

**Interfaces:**
- Produces: `python3 tools/check.py` → prints `OK`, exit 0, or a list of problems, exit 1.
- Produces: `python3 tools/test-build.py` → writes `$TMPDIR/clean-hop-test/index.html` (+ `assets` symlink) exposing `window.__t` with: `stones`, `items`, `hop`, `land(s, top)`, `stoneTop(s)`, `gameOver()`, and getters `score`, `clean`, `mode`, `phase`, `won`, `LVL`, `energy`, `offByKind` (the last two return `undefined` until Task 1 creates them).

- [ ] **Step 1: Create `tools/check.py`**

```python
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
```

- [ ] **Step 2: Run it on the baseline**

Run: `python3 tools/check.py`
Expected: `OK`.

- [ ] **Step 3: Create `tools/test-build.py`**

```python
#!/usr/bin/env python3
"""Build an instrumented copy of the game for scripted browser checks:
    python3 tools/test-build.py      -> $TMPDIR/clean-hop-test/
Exposes window.__t and skips the service worker, so a test run never
touches the real offline cache."""
import os, pathlib, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
GAME = ROOT / 'clean-hop-v8'
OUT = pathlib.Path(os.environ.get('CLEAN_HOP_TEST',
                   pathlib.Path(tempfile.gettempdir()) / 'clean-hop-test'))
OUT.mkdir(parents=True, exist_ok=True)
if not (OUT / 'assets').exists():
    (OUT / 'assets').symlink_to(GAME / 'assets')

HOOK = '''
function __get(f) { try { return f(); } catch (e) { return undefined; } }
window.__t = {
  stones: stones, items: items, hop: hop, land: land, stoneTop: stoneTop, gameOver: gameOver,
  get score() { return score; }, get clean() { return clean; }, get mode() { return mode; },
  get phase() { return phase; }, get won() { return won; }, get LVL() { return LVL; },
  get energy() { return __get(function () { return energy; }); },
  get offByKind() { return __get(function () { return offByKind; }); }
};
})();'''
src = (GAME / 'index.html').read_text(encoding='utf-8')
i = src.rindex('\n})();')
src = src[:i + 1] + HOOK + src[i + 6:]
src = src.replace("navigator.serviceWorker.register('sw.js')", 'Promise.reject()')
(OUT / 'index.html').write_text(src, encoding='utf-8')
print(OUT)
```

- [ ] **Step 4: Serve and smoke-test it.** Run `python3 tools/test-build.py`, then serve that folder: `python3 -m http.server 8766 --directory "$(python3 tools/test-build.py)"`. In Claude's browser pane that's a local `.claude/launch.json` entry; keep it out of the game folder. Open `http://localhost:8766` and run in the page console:

```js
document.getElementById('playBtn').click();
await new Promise(r => setTimeout(r, 300));
({ mode: __t.mode, stones: __t.stones.length, score: __t.score })
```
Expected: `{ mode: 'play', stones: 7, score: 0 }`.
**Gotcha:** the game loop runs on `requestAnimationFrame`, which stops in a background tab. Bring the tab to the front before any check that waits for time to pass.

---

### Task 1: Energy progress model (P1, S) — `v8.1`

Switch-offs, not points, fill the bar. Gadgets become common enough that runs keep their length. Records start fresh.

**Files:**
- Modify: `clean-hop-v8/index.html` — `DIFF_POINTS` :925–930 and its comment :917–924; `diffCfg` :944; `bestKey` :966; state vars :1481 and :1492; spawn chance :1725; `updateHud` :1902–1911; `reset` :1916; `gameOver` :1987–1988; `switchOff` :2013–2026; `land` :2066–2070; `setDifficulty` :2219 and :2230; leaf pickup :2346–2352
- Modify: `clean-hop-v8/sw.js` — `VERSION = 'clean-hop-v8-2'`

**Interfaces:**
- Produces: globals `energy` (int, appliances switched off this run), `offByKind` (object kind → count), `ENERGY_GOAL` (replaces `CLEAN_TARGET`, = `LVL.target`), `GADGET_CHANCE = 0.8`. `clean` stays the 0..1 world-recovery value, now `= clamp(energy / ENERGY_GOAL, 0, 1)`.

- [ ] **Step 1: Write the failing scenario** (save as `tools/scenarios/energy-model.js` for reuse):

```js
// Paste into the test build's console with the tab in front.
document.getElementById('playBtn').click();
await new Promise(r => setTimeout(r, 300));
const t = __t, s = t.stones.find(s => (s.gadget || s.lamp) && s.type !== 'start');
t.hop.x = s.x; t.land(s, t.stoneTop(s));
const landed = { score: t.score, energy: t.energy, clean: t.clean };
await new Promise(r => setTimeout(r, 450));
const after = { score: t.score, energy: t.energy, clean: t.clean, goal: t.LVL.target };
({ landed, after,
   pass: landed.energy === 0 && landed.clean === 0 && after.energy === 1 &&
         Math.abs(after.clean - 1 / after.goal) < 1e-9 && after.score === landed.score + 1 })
```

- [ ] **Step 2: Run it on the baseline:** `pass: false` (energy is `undefined`; `clean` moves on landing).

- [ ] **Step 3: Implement.**

`DIFF_POINTS` becomes appliance goals. Update the comment's `target` line to `target - appliances to switch off: the length of the road`:

```js
var DIFF_POINTS = [
  { at: 0,   name: 'Суперпростой', target: 5,  ramp: 60, swing: 1.35 },
  { at: 33,  name: 'Простой',      target: 10, ramp: 40, swing: 0.85 },
  { at: 67,  name: 'Средний',      target: 18, ramp: 34, swing: 0.85 },
  { at: 100, name: 'Сложный',      target: 30, ramp: 26, swing: 0.85 }
];
```

In `diffCfg` (:944), goals are small, so round to whole numbers instead of fives:

```js
    target: Math.round(lerp(a.target, b.target, t)),
```

Records in a new namespace (D5):

```js
function bestKey() { return LS_BEST + '.energy' + LVL.target; }
```

State (:1481, :1492). Also rename every `CLEAN_TARGET` to `ENERGY_GOAL`; there are 6 uses, find them with `grep -n CLEAN_TARGET`:

```js
var score = 0, stonesCleared = 0, leaves = 0;
var energy = 0;                 // things switched off this run - the goal
var offByKind = {};             // kind -> how many, for the end-of-run tip
var GADGET_CHANCE = 0.8;        // most islands have something left running
```
```js
var ENERGY_GOAL = LVL.target;
```

`reset()` :1916: `score = 0; stonesCleared = 0; leaves = 0; energy = 0; offByKind = {};`

Spawn (:1725): `Math.random() < 0.5` → `Math.random() < GADGET_CHANCE`.

`switchOff` (:2013). Energy drives `clean`; the kind is counted (lamps only until Task 2):

```js
  L.on = false;
  energy++;
  offByKind.lamp = (offByKind.lamp || 0) + 1;
  score += 1;
  clean = clamp(energy / ENERGY_GOAL, 0, 1);
```

`land` (:2066–2069): delete `clean = clamp(score / ENERGY_GOAL, 0, 1);` and `checkFinishCue();` from the first-visit branch. Keep `updateHud();`.
Leaf pickup (:2348, :2352): delete the `clean = …` line and `checkFinishCue();`.
`setDifficulty` (:2230): `clean = clamp(energy / ENERGY_GOAL, 0, 1);`

`updateHud` shows the count:

```js
  var pct = Math.round(clean * 100);
  if (pct !== cleanPctShown) {
    cleanPctShown = pct;
    elCleanFill.style.width = pct + '%';
  }
  elCleanPct.textContent = energy + '/' + ENERGY_GOAL;
```

`gameOver` (:1988): `elFinalLamps.textContent = energy;` (the label text changes in Task 3).

- [ ] **Step 4: Verify.** `python3 tools/check.py` → `OK`. Rebuild the test build, rerun the scenario → `pass: true`. Also play one Суперпростой run by hand: the finish appears after 5 switch-offs.

- [ ] **Step 5: Bump the offline cache** — `sw.js` → `var VERSION = 'clean-hop-v8-2';`

---

### Task 2: Gadget system — lamp, TV, charger, fan (P1, L) — `v8.2`

**Files:**
- Create: `clean-hop-v8/assets/sprites/gadget-tv.svg`, `gadget-charger.svg`, `gadget-fan.svg`
- Modify: `clean-hop-v8/index.html` — `SPRITES` :1011; sounds after `sndSwitch` (~:580); `makeStone` (`lamp: null`); spawn :1723–1730; `switchOff` :2013; `land` (`s.lamp.wait`); update loop :2297–2304; `drawLamp` :3158–3227; `drawStone` :3328
- Modify: `clean-hop-v8/sw.js` — add 3 files, `VERSION = 'clean-hop-v8-3'`

**Interfaces:**
- Consumes: `energy`, `offByKind`, `GADGET_CHANCE`, `ENERGY_GOAL` (Task 1).
- Produces: `GADGETS` table, `GADGET_KINDS`, `gadgetH(kind)`, `drawGadget(s, px, top)`, stone field `s.gadget = { kind, dx, on, glow, wait, ph, speed, spin }` (replaces `s.lamp`). Tasks 6 and 8 rely on `s.gadget` and `offByKind`.

**Sprite specs** (same pole palette as `island-lamp.svg`: `#6b8270 / #4e6350 / #37473c`, highlight `#7e9484`; bottom of the viewBox = ground line):

| Sprite | viewBox | Content | Anchors the code uses (fractions of w/h) |
|---|---|---|---|
| `gadget-tv.svg` | 60×60 | Retro TV: body `x6 y8 w48 h36 rx6`, dark screen `x12 y13 w36 h26 rx3 #2b3336`, two antennas from (30,8) to (20,0) and (41,1), two legs to y=60 | screen: x 0.20, y 0.217, w 0.60, h 0.433 |
| `gadget-charger.svg` | 40×70 | Garden socket post: post `x14 y20 w12 h50`, socket box `x8 y6 w24 h22 rx4 #eef2ea` stroke `#5d7364`, holes at (16,17) and (24,17) r2.2 | socket centre (0.5, 0.243); LED (0.5, 0.143) |
| `gadget-fan.svg` | 50×80 | Round base ellipse at y 74–80, pole `x23 y30 w4 h46`, back guard ring circle (25,24) r20 stroke 2, opacity .6 | hub (0.5, 0.30); blade radius 0.34·w |

- [ ] **Step 1: Failing scenario** `tools/scenarios/gadgets.js`:

```js
document.getElementById('playBtn').click();
await new Promise(r => setTimeout(r, 300));
const t = __t, kinds = new Set();
for (let i = 0; i < 40; i++) {                          // walk 40 islands
  const s = t.stones.find(s => !s.visited && s.type !== 'finish');
  if (!s) break;
  t.hop.x = s.x; t.land(s, t.stoneTop(s));
  if (s.gadget) kinds.add(s.gadget.kind);
  await new Promise(r => setTimeout(r, 260));
}
({ kinds: [...kinds], energy: t.energy, byKind: t.offByKind,
   pass: kinds.size === 4 && Object.values(t.offByKind).reduce((a, b) => a + b, 0) === t.energy })
```
Run on the Task 1 build → `pass: false` (only `lamp`; `s.gadget` undefined).
Stones spawn as the camera advances. If fewer than 40 get visited, raise the wait to 400 ms. Walking may trigger the finish; that's fine.

- [ ] **Step 2: Draw the three SVGs** from the specs. Preview each at `http://localhost:8765/assets/sprites/<name>.svg`.

- [ ] **Step 3: Register sprites.** Add `'gadget-tv': {}, 'gadget-charger': {}, 'gadget-fan': {}` to `SPRITES`, and the three paths to `sw.js` `FILES`.

- [ ] **Step 4: Gadget table and per-kind sounds** (place after `sndSwitch`):

```js
/* Per-kind wind-down after the click. */
function sndTvOff()      { noiseBurst(0.20, 0.07, 3200, 500, 0.04); }
function sndFanOff()     { tone('sawtooth', 190, 55, 0.45, 0.035, 0.04); }
function sndChargerOff() { tone('sine', 1250, 1250, 0.05, 0.06, 0.05); }

/* Things left running on the islands. Landing on the island switches it off. */
var GADGETS = {
  lamp:    { sprite: 'island-lamp',    h: 1.15, label: 'СВЕТ ВЫКЛ!',       snd: null },
  tv:      { sprite: 'gadget-tv',      h: 0.85, label: 'ТЕЛЕВИЗОР ВЫКЛ!',  snd: sndTvOff },
  charger: { sprite: 'gadget-charger', h: 0.80, label: 'ЗАРЯДКА ВЫКЛ!',    snd: sndChargerOff },
  fan:     { sprite: 'gadget-fan',     h: 1.00, label: 'ВЕНТИЛЯТОР ВЫКЛ!', snd: sndFanOff }
};
var GADGET_KINDS = ['lamp', 'lamp', 'tv', 'charger', 'fan'];   // lamps a bit more often
function gadgetH(kind) { return clamp(KW * GADGETS[kind].h, 26, 60); }
```

- [ ] **Step 5: Rename `s.lamp` → `s.gadget` everywhere** (`grep -n "\.lamp\b\|lamp:" clean-hop-v8/index.html`) and spawn with a kind:

```js
  // Something left running in broad daylight: landing here switches it off.
  // Kept off crumblers (they sink away) and clear of any trash pile.
  if (type !== 'crumble' && Math.random() < GADGET_CHANCE) {
    var side = s.trash ? 1 : (Math.random() < 0.5 ? -1 : 1);
    s.gadget = { kind: pick(GADGET_KINDS), dx: side * rand(0.24, 0.30), on: true,
                 glow: 1, wait: 0, ph: rand(0, TAU), speed: 1, spin: 0 };
  }
```

`switchOff` uses the table:

```js
function switchOff(s) {
  var G = s.gadget, K = GADGETS[G.kind], top = stoneTop(s);
  var gx = s.x + G.dx * s.w, gy = top - gadgetH(G.kind) * 0.8;
  G.on = false;
  energy++;
  offByKind[G.kind] = (offByKind[G.kind] || 0) + 1;
  score += 1;
  clean = clamp(energy / ENERGY_GOAL, 0, 1);
  popup(gx, top - KW * 2.9, K.label, '#a8f07a');
  flyScore(gx - camX, gy, '+1', '#a8f07a');
  sparkle(gx, gy, '#a8f07a');
  sndSwitch();
  if (K.snd) K.snd();
  updateHud();
  checkFinishCue();
}
```

Update loop (:2297). The fan keeps coasting after the click:

```js
    if (s.gadget) {
      var G = s.gadget;
      if (G.on && G.wait > 0 && mode === 'play') {
        G.wait -= dt;
        if (G.wait <= 0) switchOff(s);
      } else if (!G.on && G.glow > 0) {
        G.glow = Math.max(0, G.glow - dt * 3);        // the glow dies out
      }
      G.speed = G.on ? 1 : Math.max(0, G.speed - dt * 0.9);
      G.spin += dt * 16 * G.speed;
    }
```

- [ ] **Step 6: Drawing.** `drawStone` :3328 becomes `if (s.gadget) drawGadget(s, px, top);`. Split the current `drawLamp` (:3165). Its first lines (the `L`/`lh`/`lx`/`base` set-up and the two `g *=` flicker lines) move into the dispatcher below. The rest becomes `drawLamp(G, x, base, h, g)`, unchanged in look. Inside it, rename `L` → `G`, `lx` → `x`, `lh` → `h`, and keep `var lw = h * 0.4, bx = x, by = base - h * 0.83, br = lw * 0.275;`. Delete `lampH()`: `gadgetH('lamp')` gives the same height (KW·1.15; KW is never below 30, so the old 30 px floor never applied).

```js
/** Common set-up for anything left running, then the kind's own drawing. */
function drawGadget(s, px, top) {
  var G = s.gadget, h = gadgetH(G.kind);
  var x = px + G.dx * s.w, base = top + 2;
  var g = G.glow;                                          // 1 running, 0 off
  if (!G.on) g *= 0.5 + 0.5 * Math.abs(Math.sin(T * 40));  // it stutters out
  else g *= 0.9 + 0.1 * Math.sin(T * 3.2 + G.ph);
  if (G.kind === 'lamp') drawLamp(G, x, base, h, g);
  else if (G.kind === 'tv') drawTV(G, x, base, h, g);
  else if (G.kind === 'charger') drawCharger(G, x, base, h, g);
  else drawFan(G, x, base, h, g);
}

/** A TV playing to nobody: a flickering colour screen; off, it collapses to a line. */
function drawTV(G, x, base, h, g) {
  var w = h;                                               // sprite is square
  if (g > 0.01) {                                          // screen light spilling out
    var hg = ctx.createRadialGradient(x, base - h * 0.55, h * 0.1, x, base - h * 0.55, h * 0.9);
    hg.addColorStop(0, 'rgba(160,220,255,' + 0.45 * g + ')');
    hg.addColorStop(1, 'rgba(160,220,255,0)');
    ctx.fillStyle = hg;
    ellF(ctx, x, base - h * 0.55, h * 0.9, h * 0.9);
  }
  sprB('gadget-tv', x, base, w);
  var sx = x - w / 2 + w * 0.20, sy = base - h + h * 0.217, sw = w * 0.60, sh = h * 0.433;
  if (G.on) {
    ctx.fillStyle = ['#7ad3e8', '#8fe07a', '#ffd44a', '#ff9fc4'][((T * 1.6 + G.ph) | 0) % 4];
    ctx.globalAlpha = 0.75 + 0.25 * g;
    fillRR(ctx, sx, sy, sw, sh, 2);
    ctx.globalAlpha = 1;
  } else if (G.glow > 0) {                                 // the old CRT "blip"
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = G.glow;
    ctx.fillRect(x - sw * 0.5 * G.glow, sy + sh / 2 - 1, sw * G.glow, 2);
    ctx.globalAlpha = 1;
  }
}

/** A charger left in a socket: blinking LED; off, the plug sits pulled out. */
function drawCharger(G, x, base, h, g) {
  var w = h * 40 / 70;
  sprB('gadget-charger', x, base, w);
  var cx = x, cy = base - h + h * 0.243, out = (1 - G.glow) * w * 0.55;
  ctx.fillStyle = '#f4f6f2';                               // the plug
  fillRR(ctx, cx - w * 0.16 + out, cy - w * 0.14, w * 0.32, w * 0.28, 3);
  ctx.strokeStyle = '#4e6350';                             // its cable to the grass
  ctx.lineWidth = Math.max(1.2, w * 0.05);
  ctx.beginPath();
  ctx.moveTo(cx + out + w * 0.16, cy);
  ctx.quadraticCurveTo(cx + out + w * 0.6, cy + h * 0.3, cx + w * 0.4, base - 1);
  ctx.stroke();
  var blink = G.on && Math.sin(T * 5 + G.ph) > 0;
  ctx.fillStyle = blink ? '#6fe06a' : '#8a938d';           // the LED
  ellF(ctx, cx, base - h + h * 0.143, w * 0.07, w * 0.07);
}

/** A fan spinning in an empty room: blades coast to a stop after the click. */
function drawFan(G, x, base, h, g) {
  var w = h * 50 / 80;
  sprB('gadget-fan', x, base, w);
  var cx = x, cy = base - h + h * 0.30, r = w * 0.34;
  ctx.fillStyle = 'rgba(200,232,240,0.9)';
  for (var b = 0; b < 3; b++) {
    var a = G.spin + b * TAU / 3;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ellF(ctx, r * 0.5, 0, r * 0.5, r * 0.22);
    ctx.restore();
  }
  ctx.fillStyle = '#37473c';                               // the hub
  ellF(ctx, cx, cy, r * 0.22, r * 0.22);
  if (G.speed > 0.2) {                                     // breeze lines
    ctx.strokeStyle = 'rgba(255,255,255,' + 0.5 * G.speed + ')';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var l = 0; l < 3; l++) {
      var ly = cy - r * 0.6 + l * r * 0.6, lx = cx + r * 1.3 + ((T * 60 + l * 17) % (r * 1.5));
      ctx.moveTo(lx, ly); ctx.lineTo(lx + r * 0.5, ly);
    }
    ctx.stroke();
  }
}
```

- [ ] **Step 7: Verify.** `python3 tools/check.py` → `OK`. Scenario → `pass: true`. Visual check in the real build at 466×750 and 1280×800: each kind reads as "on" (colour or motion) and clearly "off" after landing. Nothing overlaps the hero badly on the narrowest island (48px wide).

- [ ] **Step 8: Bump the offline cache** — `sw.js` → `var VERSION = 'clean-hop-v8-3';`

---

### Task 3: Copy, name and game-over card (P1, S) — `v8.3`

**Files:**
- Modify: `clean-hop-v8/index.html` — head :7, :8, :14; noscript :341; menu :372–392; pause :400; game-over markup :411–421; `MSG_*` :1860–1892; `encouragement` :1894–1900; `gameOver` :1970–1990; `fallIn` :2009; `setDifficulty` :2225–2227; leaf popup :2349
- Modify: `clean-hop-v8/sw.js` — header comment name, `VERSION = 'clean-hop-v8-4'`

**Interfaces:**
- Consumes: `energy`, `ENERGY_GOAL` (Task 1).
- Produces: element ids `howto` (menu line), `finalEnergy`; removes `finalStones` and `finalLamps`. Task 8 adds `tipMsg` next to `ecoMsg`.

- [ ] **Step 1:** Apply every row of the Section 4 copy table and the four `MSG_*` arrays exactly as written.
- [ ] **Step 2: Menu how-to line.** Insert under the tagline (:373): `<p class="howto" id="howto">Прыгай на островки и выключай всё, что работает зря!</p>`, with CSS next to `.tagline`:

```css
.howto{margin:8px auto 0;max-width:32ch;font-size:12.5px;line-height:1.4;font-weight:800;color:var(--leaf-dk)}
```

- [ ] **Step 3: Stats row** (:414–418) becomes:

```html
        <span><i class="ic ic-bulb"></i>Выключено <span id="finalEnergy">0</span></span>
        <span><i class="ic ic-leaf"></i>Искорки <span id="finalLeaves">0</span></span>
        <span><i class="ic ic-star"></i>Рекорд <span id="finalBest">0</span></span>
```
In JS, delete the `elFinalStones` and `elFinalLamps` declarations (:488, :490) and their two lines in `gameOver` (:1986, :1988). Add `var elFinalEnergy = document.getElementById('finalEnergy');`, and in `gameOver`: `elFinalEnergy.textContent = energy + ' из ' + ENERGY_GOAL;`. `stonesCleared` stays, since spawning still uses it. The `ic-leaf` icon is swapped for a sun in Task 5.

- [ ] **Step 4: Titles** in `gameOver`:

```js
  elOverTitle.textContent = won ? 'Энергия сбережена!'
    : (leaves > 0 ? 'Ой-ёй! Зато искорок много.' : 'Ой-ёй!');
```

- [ ] **Step 5: Dial text** (:2225–2227):

```js
  elDiffPath.textContent = 'выключи ' + LVL.target;
  elDiffRange.setAttribute('aria-valuetext', LVL.name + ', цель — выключить ' + LVL.target + ' приборов');
  elLvlChip.textContent = LVL.name + ' · цель ' + LVL.target;
```
Also change the static markup :382 to `выключи 18`.

- [ ] **Step 6: Verify.** `grep -n "Чистый\|очищ\|Очищ\|путь \|Листья\|Камни\|справился\|дошёл\|расчистил" clean-hop-v8/index.html` → no matches, except code comments and `LS_*` keys. Check the menu card at 360×640 (no scroll) and 320 px wide (no horizontal scroll). `python3 tools/check.py` → `OK`.
- [ ] **Step 7: Bump the offline cache** — `sw.js` → `var VERSION = 'clean-hop-v8-4';`

---

### Task 4: UI style refresh (P1, M) — `v8.4`

**Files:**
- Modify: `clean-hop-v8/index.html` CSS — `:root` :23–34, `.meter-wrap`…`.meter-pct` :88–114, `.card::before` :134–138, `h1 em` :143–145, picker :171–181, `.final .num` :229–230, `.btn` :290–297; HUD markup :362–366
- Modify: `clean-hop-v8/sw.js` — `VERSION = 'clean-hop-v8-5'`

**Interfaces:**
- Produces: CSS tokens `--volt`, `--volt-dk`, `--volt-soft` (Tasks 5, 7 and 8 use them); class `.bolt` (inline bolt icon).

- [ ] **Step 1: Tokens** — add to `:root`:

```css
  --volt:#ffc93c;         /* energy: the game's main accent */
  --volt-dk:#d99a00;
  --volt-soft:#fff3c9;
```

- [ ] **Step 2: Buttons and picker**

```css
.btn{ /* keep the other properties */ background:var(--volt);color:var(--ink);box-shadow:0 5px 0 var(--volt-dk)}
.btn:active{transform:translateY(3px);box-shadow:0 2px 0 var(--volt-dk)}
.btn:focus-visible{outline:3px solid var(--leaf);outline-offset:3px}
.pick[aria-checked="true"]{background:var(--volt-soft);border-color:var(--volt);box-shadow:0 4px 0 var(--volt-dk)}
.pick[aria-checked="true"]::after{background:var(--volt);color:var(--ink)}
.pick[aria-checked="true"] .nm{color:var(--ink)}
```

- [ ] **Step 3: Battery meter.** Markup :362–366:

```html
    <div class="meter-wrap">
      <span class="cap"><i class="bolt" aria-hidden="true"></i>Энергия</span>
      <div class="meter"><div class="meter-fill" id="cleanFill"></div></div>
      <span class="meter-pct" id="cleanPct">0/18</span>
    </div>
```
CSS. Replace the leaf rider `.meter-fill::after` with the terminal nub on `.meter::after`:

```css
.bolt{display:inline-block;width:12px;height:12px;margin-right:4px;vertical-align:-1px;
  background:url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M13 2 4 14h6l-1 8 9-12h-6l1-8Z' fill='%23ffc93c' stroke='%23d99a00' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E") center/contain no-repeat}
.meter{position:relative;width:clamp(70px,26vw,150px);height:14px;
  border:2px solid rgba(32,48,58,.32);border-radius:5px;background:rgba(32,48,58,.06)}
.meter::after{content:"";position:absolute;right:-6px;top:50%;width:4px;height:7px;
  transform:translateY(-50%);border-radius:0 2px 2px 0;background:rgba(32,48,58,.32)}
.meter-fill{position:absolute;inset:1px auto 1px 1px;width:0%;border-radius:3px;
  background:linear-gradient(90deg,var(--volt),#7ee06a);transition:width .35s ease}
.meter-pct{font-size:12px;font-weight:800;color:var(--ink);
  font-variant-numeric:tabular-nums;min-width:38px;text-align:right}
```
Delete the old `.meter-fill::after` rule. The fill sits inside a 1 px inset, so in `updateHud` set `elCleanFill.style.width = 'max(0px, calc(' + pct + '% - 2px))';`. The `max()` matters: a bare `calc(0% - 2px)` is negative, so the browser ignores it and the bar stays full after a restart.

- [ ] **Step 4: Card watermark and title marker**

```css
.card::before{ /* keep geometry */ background:url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M13 2 4 14h6l-1 8 9-12h-6l1-8Z' fill='%23d99a00'/%3E%3C/svg%3E") center/contain no-repeat;opacity:.08}
h1 em{font-style:normal;color:var(--leaf-dk);
  background:linear-gradient(0deg,rgba(255,201,60,.45),rgba(255,201,60,.45)) left bottom/100% .24em no-repeat;padding:0 .04em}
.final .num{color:var(--ink)}
```

- [ ] **Step 5: Verify** — screenshot menu, HUD in play, pause, lose card and win card at 360×640, 466×750 and 1280×800. Check: every text on yellow is `--ink`; the battery nub isn't clipped; focus rings are visible when tabbing with the keyboard. `python3 tools/check.py` → `OK`.
- [ ] **Step 6: Bump the offline cache** — `sw.js` → `var VERSION = 'clean-hop-v8-5';`

---

### Task 5: The world reacts to saved energy (P1, M; pylons P2) — `v8.5`

**Files:**
- Create: `clean-hop-v8/assets/sprites/sun-spark.svg` (60×60: sun disc `#ffd44a` r16 at centre, 8 rounded rays `#ffb52e`, a small cream bolt `#fff6c8` in the middle), `solar-panel.svg` (60×34: frame `#c9d1cc`, 4×2 cells `#2f4f86` with `#7fa7e0` grid lines, two short legs, ground at y=34), `pylon.svg` (40×120: lattice tower `#6b7a70`, crossarms at y18 and y34; wire tips at (4,18), (36,18), (6,34), (34,34))
- Delete: `clean-hop-v8/assets/sprites/leaf.svg`
- Modify: `clean-hop-v8/index.html` — `SPRITES`; factories init :1567–1580; shore init :1592–1600; update loop; `drawFactory` :2699–2741; `drawShore` lamp branch :2828–2860; spawn leaf :1736–1746 → spark; pickup :2340–2356; `drawItems` :3385; `.ic-leaf` → `.ic-sun` CSS + stats markup
- Modify: `clean-hop-v8/sw.js` — add 3, remove `leaf.svg`, `VERSION = 'clean-hop-v8-6'`

**Interfaces:**
- Consumes: `clean`/`cleanShown` (now energy-driven, Task 1), `--volt` (Task 4).
- Produces: factory fields `f.offAt`, `f.lightOn`; shore fields `o.offAt`, `o.lightOn`; `drawSolar(x, base, u, amount)`; item `kind: 'spark'`.

- [ ] **Step 1: Town windows switch off building by building.** In `buildFactories()` (index.html:1569–1582), replace the unused `lit: [...]` array (nothing reads it) with a per-building threshold spread over the run. The loop variables there are `i` and `n = 9`:

```js
      offAt: 0.12 + 0.76 * (i / (n - 1)) + rand(-0.04, 0.04),  // when its lights go out
      lightOn: 1                                               // 1 lit .. 0 dark, eased
```
Ease `lightOn` in `update()` right after the clouds loop:

```js
  for (var fi = 0; fi < factories.length; fi++) {            // lights out, one by one
    var fa = factories[fi], want = clean >= fa.offAt ? 0 : 1;
    fa.lightOn += (want - fa.lightOn) * Math.min(1, dt * 6);
  }
```
In `drawFactory` the window alpha becomes `clamp(f.lightOn * flick, 0, 0.7)` instead of `(1 - cleanShown) * flick`. `layout()` rebuilds the factories on resize (index.html:1528). They restart lit and ease to the right state within half a second, which is acceptable.

- [ ] **Step 2: Street lamps click off the same way.** In `buildShore()` (index.html:1593–1601; loop variables `i`, `n = 14`) add `offAt: 0.08 + 0.84 * (i / n), lightOn: 1` to every entry (only lamps read them). In `drawShore` use `o.lightOn` in place of `(1 - cleanShown)` in `lampGlow` and in the bulb alpha. Ease `o.lightOn` in `update()` exactly like step 1, looping over `shore`.

- [ ] **Step 3: Solar panels arrive with the turbines.**

```js
/** A pair of solar panels that fade in as energy is saved. */
function drawSolar(x, base, u, amount) {
  if (amount < 0.2) return;
  var a = clamp((amount - 0.2) * 1.6, 0, 1);
  sprB('solar-panel', x, base, u * 1.3, { a: a });
  sprB('solar-panel', x + u * 1.25, base, u * 1.3, { a: a });
}
```
Call it in `drawFactory` right after `drawTurbine(...)`: `drawSolar(x + u * 2.2, base, u, cleanShown);`.

- [ ] **Step 4: Sun sparks replace leaves.** In the spawn block keep the geometry; set `kind: 'spark'`. In the pickup: popup `'ИСКОРКА +3'`, colour `'#ffc93c'` for popup, flyer and sparkle. In `drawItems`: glow fill `'#ffe79a'`, sprite `sprC('sun-spark', x, y, o.r * 2.2, { rot: T * 0.8 + o.ph })`. Swap `'leaf': {}` → `'sun-spark': {}` in `SPRITES`. CSS: rename `.ic-leaf` to `.ic-sun` with a sun data-URI (disc `%23ffc93c` r6 at 12,12 plus 8 short rays) and update the stats markup class.

- [ ] **Step 5 (P2): Power lines with flowing pulses.** In `drawSkyline`, before the factories loop, draw a `pylon` every `VW * 0.55` px at parallax `par`. Connect crossarm tips of neighbours with sagging `quadraticCurveTo` wires (`#56625a`, 1.2 px). Add 3 glowing dots per span, moving along the wire at speed `0.25 + 0.75 * (1 - cleanShown)`: energy rushing to the town, slowing as less is used. Skip if the frame budget suffers on a mid-range phone (see QA).

- [ ] **Step 6: Verify.** Scenario `tools/scenarios/world.js`: switch off gadgets one at a time with `__t.land(...)`, waiting 600 ms after each. Check that the number of factories with `lightOn > 0.5` never increases, and that at `clean === 1` it is 0. The factories array isn't exposed, so for this task add `factories: factories, shore: shore` to the test-build hook. Visual: at 0%, 50% and 100% energy, take screenshots side by side. Lights should visibly go out in steps, not fade all together. `python3 tools/check.py` → `OK` (it also catches `leaf.svg` left on disk).
- [ ] **Step 7: Bump the offline cache** — `sw.js` → `var VERSION = 'clean-hop-v8-6';`

---

### Task 6: Energy vampire and overloaded islands (vampire P1, crumble P2, M) — `v8.6`

**Files:**
- Create: `clean-hop-v8/assets/sprites/energy-vampire.svg` (70×60: round violet blob `#7a5bd0 → #5b3fa8`, two plug prongs `#c9d1cc` as horns, big white eyes with dark pupils, two small fangs, a cord tail curling right; ground at y=60)
- Delete: `clean-hop-v8/assets/sprites/trash-pile.svg`
- Modify: `clean-hop-v8/index.html` — `makeStone` (`trash`, `trashX` → `vamp`, `vampX`); spawn :1714–1720; `land` trash check and offset clamp; `fallIn` popup; `drawStone` trash block :3371–3381 and crumble branch; `SPRITES`
- Modify: `clean-hop-v8/sw.js` — add vampire, remove trash-pile, `VERSION = 'clean-hop-v8-7'`

**Interfaces:**
- Consumes: `s.gadget` (Task 2). The gadget spawn's `s.trash ? 1 : …` becomes `s.vamp ? 1 : …`.
- Produces: stone fields `vamp` (half-width), `vampX` (offset); `fallIn('vampire')`.

- [ ] **Step 1: Rename fields** (`grep -n "trash" clean-hop-v8/index.html`; keep `drawJunk` untouched): `trash` → `vamp`, `trashX` → `vampX`, `fallIn('trash')` → `fallIn('vampire')`, popup `reason === 'vampire' ? 'ЭНЕРГОВАМПИР!' : 'ОЙ-ЁЙ!'`.
- [ ] **Step 2: Draw the vampire** in place of the pile. It bobs, blinks, and loses heart once its island's gadget is off:

```js
  /* --- energy vampire: stand-by power, the part you must not land on --- */
  if (s.vamp) {
    var vx = px + s.vampX, vr = s.vamp;
    var weak = s.gadget && !s.gadget.on ? 1 : 0;           // nothing left to drain
    var bob = Math.sin(T * 3 + s.id) * 2 * (1 - weak * 0.7);
    ctx.fillStyle = 'rgba(46,36,22,0.35)';
    ellF(ctx, vx, top + 2, vr * 1.1, vr * 0.28);
    sprB('energy-vampire', vx, top + 3 + weak * 3, vr * 2.4 * (1 - weak * 0.15),
         { a: 1 - weak * 0.35, rot: bob * 0.02, px: 0.5, py: 1 });
  }
```
Keep the existing "someone sailing over it" shake (:3374–3377) on `vx`.

- [ ] **Step 3 (P2): Overloaded island.** In the crumble branch, replace the two crack strokes with a zig-zag cable (`#3a3a3a`, 2 px) across the top. While `s.trig`, emit a yellow spark every 0.12 s from a point on the cable: `parts.push({ x, y, vx: rand(-60, 60), vy: rand(-140, -60), g: 500, r: rand(1.4, 2.6), life: 0.3, max: 0.3, c: '#ffd44a' })`. Throttle with a per-stone timer `s.sparkT`. Keep the fuse ring.
- [ ] **Step 4: Verify.** Test build: find a stone with `vamp`, set `__t.hop.x = s.x + s.vampX`, call `land` → `mode` becomes `'over'` shortly and the popup reads «ЭНЕРГОВАМПИР!». Land on the safe half → no fall, gadget switches off, vampire dims. `python3 tools/check.py` → `OK`.
- [ ] **Step 5: Bump the offline cache** — `sw.js` → `var VERSION = 'clean-hop-v8-7';`

---

### Task 7: Sun-powered finish and victory (P1, M) — `v8.7`

**Files:**
- Modify: `clean-hop-v8/index.html` — `drawMeadow` :3002–3118; win overlay CSS :256–268
- Modify: `clean-hop-v8/sw.js` — `VERSION = 'clean-hop-v8-8'`

**Interfaces:**
- Consumes: `solar-panel` sprite and `drawTurbine` (Task 5), `--volt` (Task 4).

- [ ] **Step 1: Solar panels on the school's gym roof.** In `school.svg` (480×240) the gym roof runs x 90–174 at y 46. After `sprB('school', px + w * 0.02, top + h * 0.10, w * 0.8)`, convert and draw three panels:

```js
  var sw8 = w * 0.8, sh8 = sw8 / 2;                         // school sprite is 480x240
  var sL = px + w * 0.02 - sw8 / 2, sT = top + h * 0.10 - sh8;
  for (var sp = 0; sp < 3; sp++) {
    sprB('solar-panel', sL + sw8 * (100 + sp * 25) / 480, sT + sh8 * 47 / 240, sw8 * 24 / 480);
  }
  if (won) {                                                // a glint sweeps the panels
    var gl8 = (T * 0.6) % 1;
    ctx.fillStyle = 'rgba(255,255,255,' + 0.5 * Math.sin(gl8 * Math.PI) + ')';
    ctx.fillRect(sL + sw8 * (96 + gl8 * 80) / 480, sT + sh8 * 38 / 240, sw8 * 6 / 480, sh8 * 9 / 240);
  }
```

- [ ] **Step 2: A turbine beside the meadow.** `drawTurbine(px + w * 0.46, top + 3, w * 0.07, 1);`. It spins at its normal speed. For the win, multiply its rotation by `1 + 2 * sunBoost`: add an optional `speed` parameter to `drawTurbine(x, base, u, amount, speed)` and use `rot: T * 1.1 * (speed || 1)`.
- [ ] **Step 3: Battery badge on the finish sign.** Above the «ФИНИШ» signpost text, draw a small battery: an outlined 26×12 rounded rect, nub, full fill in `#7ee06a`, and a bolt glyph drawn with `ctx.fillText('⚡', …)` in 10 px. Size it with `w * 0.05`.
- [ ] **Step 4: Win card** uses the energy accent. In `.overlay.win .final .num`, `color:var(--volt-dk)`; `.overlay.win .card` border `0 0 0 3px var(--volt) inset`.
- [ ] **Step 5: Verify.** In the test build, set a Суперпростой run, walk islands until `__t.won === true`, and screenshot the finish during `cheer` and the win card. Panels sit on the gym roof at 466 px and 1280 px widths, and the glint moves. `python3 tools/check.py` → `OK`.
- [ ] **Step 6: Bump the offline cache** — `sw.js` → `var VERSION = 'clean-hop-v8-8';`

---

### Task 8: Energy tips (P1, S) — `v8.8`

**Files:**
- Modify: `clean-hop-v8/index.html` — game-over markup (after `ecoMsg`), pause card markup, CSS (after `.ecomsg`), JS near `MSG_*`, `gameOver`, `setPaused`
- Modify: `clean-hop-v8/sw.js` — `VERSION = 'clean-hop-v8-9'`

**Interfaces:**
- Consumes: `offByKind` (Task 1/2), `TIPS` (Section 4).
- Produces: `pickTip()` → string; element ids `tipMsg`, `pauseTip`.

- [ ] **Step 1: Scenario** `tools/scenarios/tips.js`. Switch off at least 2 TVs with `__t.land`, call `__t.gameOver()`, and read `document.getElementById('tipMsg').textContent`. It must be the `tv` tip. With 0 switch-offs it must be one of `TIPS.any`. It fails before implementation (no element).
- [ ] **Step 2: Markup**

```html
      <p class="tip" id="tipMsg"></p>
```
(after `#ecoMsg`), and in the pause card after its tagline: `<p class="tip" id="pauseTip"></p>`.

```css
.tip{margin:10px auto 0;max-width:30ch;padding:8px 12px;border-radius:14px;
  background:var(--volt-soft);font-size:12.5px;line-height:1.4;font-weight:700;color:var(--ink);text-wrap:balance}
.tip::before{content:"Совет: ";font-weight:800;color:var(--volt-dk)}
```

- [ ] **Step 3: Logic**

```js
/** The tip that fits this run: the thing switched off most, else a general one. */
function pickTip() {
  var best = null, n = 0;
  for (var k in offByKind) if (offByKind[k] > n) { n = offByKind[k]; best = k; }
  return pick(best && TIPS[best] ? TIPS[best] : TIPS.any);
}
```
In `gameOver`: `elTipMsg.textContent = pickTip();`. In `setPaused(true)`: `elPauseTip.textContent = pick(TIPS.any);`.

- [ ] **Step 4: Verify.** Scenario passes. The lose card at 360×640 fits without scrolling. If it doesn't, the `.stats` row wrapping is the first thing to tighten (`gap:4px 12px`). `python3 tools/check.py` → `OK`.
- [ ] **Step 5: Bump the offline cache** — `sw.js` → `var VERSION = 'clean-hop-v8-9';`

---

### Task 9: App identity, offline update and release QA (P1, M) — `v8.9`

**Files:**
- Create: `tools/icon/icon.svg`, `tools/icon/export.sh`
- Modify: `clean-hop-v8/icon-180.png`, `icon-192.png`, `icon-512.png`, `clean-hop-v8/manifest.webmanifest`, `clean-hop-v8/index.html` (theme-color meta), `clean-hop-v8/sw.js` (`VERSION = 'clean-hop-v8-10'`)

- [ ] **Step 1: Master icon** `tools/icon/icon.svg` (512×512). Rounded-square background with a 135° gradient `#7ee06a → #ffd44a`. A big cream bulb (`#fffaf0`, outline `#20303a` 14 px) with a green leaf (`#2f8f43`) inside the glass. Grey base `#8a8f7a` with two thread lines. A small yellow bolt top-right. No text. Keep the art inside the central 80% (maskable safe zone).
- [ ] **Step 2: Export script** `tools/icon/export.sh`:

```bash
#!/bin/sh
# Rasterise the master icon to the three PNG sizes the game ships.
set -e
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for s in 180 192 512; do
  printf '<html><body style="margin:0"><img src="icon.svg" width="%s" height="%s"></body></html>' "$s" "$s" > _icon.html
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=$s,$s \
    --screenshot="../../clean-hop-v8/icon-$s.png" "file://$PWD/_icon.html"
done
rm _icon.html
```
Run `sh tools/icon/export.sh`, then check with `sips -g pixelWidth -g pixelHeight clean-hop-v8/icon-*.png` that the sizes are 180/192/512.

- [ ] **Step 3: Manifest**: `"name": "Энергопрыжок"`, `"short_name": "Энергопрыжок"`, `"theme_color": "#ffc93c"`; keep `background_color`. In `index.html`, set `<meta name="theme-color" content="#ffc93c">`.
- [ ] **Step 4: Bump the offline cache** — `sw.js` → `var VERSION = 'clean-hop-v8-10';`. Do this before QA, because the QA checks the offline update.
- [ ] **Step 5: Release QA** (fill in the table):

| Check | 360×640 Android Chrome | 375×812 iPhone Safari | 812×375 landscape | 1280×800 desktop |
|---|---|---|---|---|
| Menu fits, name/tagline/how-to visible, no scroll | | | | |
| All 4 gadgets switch off with popup + sound | | | | |
| Battery meter shows `n/goal`, fills, nub visible | | | | |
| Town/street lights go out in steps | | | | |
| Vampire landing → «ЭНЕРГОВАМПИР!» + lose card | | | | |
| Win on Суперпростой → sun school, win card, tip | | | | |
| Pause card shows a tip; Esc/Space/M work | | | | |
| Records separate per goal (5/10/18/30) | | | | |
| Offline: load once, go offline, reload → plays | | | | |
| Installed PWA picks up the new version after one online visit | | | | |
| Reduced motion (OS setting) → no card bounce | | | | |
| Smooth play (no visible stutter) on a mid-range phone | | | | |

Note: iOS keeps the home-screen name it had at install time; a reinstall shows «Энергопрыжок».

- [ ] **Step 6: Final checks** — `python3 tools/check.py` → `OK`. Older versions untouched: `find clean-hop-v5 clean-hop-v6 clean-hop-v7 clean-hop-v1.html clean-hop-v2.html clean-hop-v3.html clean-hop-v4.html stone-hopper.html -type f -newer docs/superpowers/plans/2026-09-21-v8-energy-saving-concept.md` prints nothing.

---

## 8. Out of scope

- New heroes, levels/map, power-ups, shop, accounts, leaderboards, analytics.
- English (or any other) localisation.
- Real-world energy numbers (kWh). Game units only, so no facts the game can't back up.
- Changes to `clean-hop-v7/` and older versions.

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Runs get too long or short after the switch to appliance goals | Goals 5/10/18/30 were sized so path length stays about the same as the old 10/20/40/70 points at ~80% gadget density. Tune `GADGET_CHANCE` (0.7–0.9) in Task 1 before touching goals. |
| Two numbers (Очки vs Энергия) confuse young players | The HUD shows Энергия as a battery with `n/goal`; the big number on the card stays Очки. If playtests show confusion, hide Очки on Суперпростой. |
| Busy islands (gadget + vampire + hero) on narrow phones | The gadget always sits on the far side from the vampire; the vampire only spawns on islands wider than `VW * 0.10` (existing rule). |
| Performance on older phones (more glows, pulses) | Pylon pulses are P2 and optional. All glows are cheap gradients drawn only on-screen, same as the existing shore lamps. |
| Stale offline copy after release | Every task ends with an explicit `VERSION` bump step. Task 9 QA checks that an installed copy picks up the new version. |
