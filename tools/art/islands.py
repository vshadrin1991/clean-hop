#!/usr/bin/env python3
"""v10 island sprites: warm layered earth under the v9 grass lids.
    python3 tools/art/islands.py
writes clean-hop-v10/assets/sprites/island-{1..5}.svg and island-{1..5}-m.svg.
Each island keeps its v9 silhouette (keel) and grass lid exactly, so the
game's island geometry (drawStone's 0.1294 / 0.8706, islandHalfAt) still
fits. The -m twin is the same island mirrored, but its light still comes
from the upper right where the game's sun is - the game draws the twin
instead of flipping the sprite. Everything under the lid is clipped to
y >= 30, so no soil pixel ever reaches the lid rows 0-27."""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'clean-hop-v10/assets/sprites'
MIRROR = 'matrix(-1 0 0 1 240 0)'

LID_A = ('M8 22 Q4 8 20 7 Q38 2 58 7 Q78 1 100 6 Q122 0 142 6 Q162 1 182 7 Q200 2 218 8 '
         'Q234 10 232 24 L229 32 Q218 26 207 34 Q194 27 181 35 Q168 28 154 36 Q141 29 127 36 '
         'Q113 30 99 36 Q85 30 71 35 Q57 29 43 34 Q29 28 17 34 Q9 30 8 22 Z')
TOP_A = ('M8 21 Q5 10 20 9 Q38 4 58 9 Q78 3 100 8 Q122 2 142 8 Q162 3 182 9 Q200 4 218 10 '
         'Q232 12 231 22 Q188 27 120 27 Q48 27 8 21 Z')
HI_A = 'M34 12 Q76 5 120 6 Q166 5 206 12 Q164 9 120 9 Q74 9 34 12 Z'

# per island: keel = silhouette, bottom = its lowest y, lid/top/hi = the v9
# grass lid layers, drips = the v9 moss drips, strata = the v9 strata
# curves, pebbles = (cx, cy, rx, ry) resting in the soil
ISLANDS = {
    1: dict(
        keel='M10 22 L230 22 Q238 70 210 106 Q176 144 120 152 Q64 144 30 106 Q2 70 10 22 Z',
        bottom=152, lid=LID_A, top=TOP_A, hi=HI_A,
        drips='M34 32 q-5 9 -2 17 M40 34 q-3 7 0 12 M112 34 q-4 9 -1 15 M118 35 q-2 6 0 11 '
              'M200 32 q5 8 2 15 M194 34 q3 6 1 11',
        strata='M38 66 Q120 80 202 62 M56 104 Q122 116 186 98',
        pebbles=[(52, 58, 7, 5), (150, 70, 9, 6), (96, 96, 6, 4.5), (186, 92, 7, 5),
                 (124, 124, 5, 4), (70, 80, 4, 3)]),
    2: dict(
        keel='M6 22 L234 22 Q238 50 226 76 Q206 104 120 108 Q34 104 14 76 Q2 50 6 22 Z',
        bottom=108,
        lid='M6 22 Q2 8 18 7 Q36 2 56 7 Q76 1 100 6 Q122 0 144 6 Q164 1 184 7 Q202 2 220 8 '
            'Q236 10 234 24 L231 32 Q220 26 209 34 Q196 27 183 35 Q169 28 155 36 Q141 29 127 36 '
            'Q113 30 99 36 Q85 30 71 35 Q57 29 43 34 Q29 28 17 34 Q9 30 6 22 Z',
        top='M6 21 Q3 10 18 9 Q36 4 56 9 Q76 3 100 8 Q122 2 144 8 Q164 3 184 9 Q202 4 220 10 '
            'Q234 12 233 22 Q190 27 120 27 Q50 27 6 21 Z',
        hi='M30 12 Q74 5 120 6 Q168 5 210 12 Q166 9 120 9 Q72 9 30 12 Z',
        drips='M30 32 q-5 9 -2 17 M36 34 q-3 7 0 12 M116 34 q-4 9 -1 15 M122 35 q-2 6 0 11 '
              'M206 32 q5 8 2 15 M200 34 q3 6 1 11',
        strata='M28 54 Q120 66 212 52 M48 84 Q120 94 192 82',
        pebbles=[(48, 50, 7, 5), (140, 58, 9, 6), (92, 80, 6, 4.5), (190, 72, 6, 4.5),
                 (120, 96, 4, 3)]),
    3: dict(
        keel='M10 22 L230 22 Q224 56 198 82 Q168 112 82 150 Q46 132 28 98 Q4 64 10 22 Z',
        bottom=150, lid=LID_A, top=TOP_A, hi=HI_A,
        drips='M32 32 q-5 9 -2 17 M38 34 q-3 7 0 12 M108 34 q-4 9 -1 15 M114 35 q-2 6 0 11 '
              'M202 32 q5 8 2 15 M196 34 q3 6 1 11',
        strata='M30 60 Q110 74 202 58 M42 100 Q96 116 160 102',
        pebbles=[(50, 56, 7, 5), (150, 54, 8, 6), (84, 96, 6, 4.5), (176, 76, 6, 4),
                 (70, 124, 4.5, 3.5)]),
    4: dict(
        keel='M14 22 L226 22 Q230 58 212 90 Q196 118 168 138 Q150 148 140 126 Q130 104 120 104 '
             'Q110 104 100 126 Q90 148 72 138 Q44 118 28 90 Q10 58 14 22 Z',
        bottom=142,
        lid='M10 22 Q6 8 22 7 Q40 2 60 7 Q80 1 102 6 Q122 0 142 6 Q162 1 182 7 Q198 2 214 8 '
            'Q230 10 230 24 L227 32 Q216 26 205 34 Q192 27 179 35 Q166 28 152 36 Q139 29 125 36 '
            'Q111 30 97 36 Q83 30 69 35 Q55 29 41 34 Q27 28 15 34 Q9 30 10 22 Z',
        top='M10 21 Q7 10 22 9 Q40 4 60 9 Q80 3 102 8 Q122 2 142 8 Q162 3 182 9 Q198 4 214 10 '
            'Q228 12 229 22 Q188 27 120 27 Q50 27 10 21 Z',
        hi=HI_A,
        drips='M32 32 q-5 9 -2 17 M38 34 q-3 7 0 12 M114 34 q-4 9 -1 15 M120 35 q-2 6 0 11 '
              'M204 32 q5 8 2 15 M198 34 q3 6 1 11',
        strata='M34 56 Q80 68 108 62 M132 62 Q168 70 206 58 M52 96 Q84 106 104 100 '
               'M138 100 Q164 108 190 96',
        pebbles=[(52, 56, 7, 5), (164, 58, 8, 6), (96, 84, 6, 4.5), (188, 90, 6, 4.5),
                 (70, 112, 4.5, 3.5), (164, 116, 4.5, 3.5)]),
    5: dict(
        keel='M44 22 L196 22 Q208 62 184 96 Q158 128 120 136 Q82 128 56 96 Q32 62 44 22 Z',
        bottom=136,
        lid='M42 22 Q38 8 54 7 Q72 2 90 7 Q108 1 128 6 Q146 1 164 7 Q178 2 192 8 Q204 10 202 24 '
            'L199 32 Q190 26 180 34 Q168 27 156 35 Q144 28 132 36 Q120 30 108 36 Q96 30 84 35 '
            'Q72 29 60 34 Q50 28 45 33 Q41 29 42 22 Z',
        top='M42 21 Q39 10 54 9 Q72 4 90 9 Q108 3 128 8 Q146 2 164 9 Q178 4 192 10 Q202 12 '
            '201 22 Q166 27 122 27 Q70 27 42 21 Z',
        hi='M62 12 Q92 5 122 6 Q152 5 184 12 Q152 9 122 9 Q92 9 62 12 Z',
        drips='M54 32 q-5 9 -2 17 M60 34 q-3 7 0 12 M186 32 q5 8 2 15 M180 34 q3 6 1 11',
        strata='M60 62 Q118 74 182 60 M74 98 Q122 108 168 96',
        pebbles=[(72, 54, 6, 4.5), (156, 58, 8, 5.5), (110, 88, 6, 4.5), (172, 86, 5, 4),
                 (122, 116, 4, 3)]),
}


def pebbles(ps):
    out = []
    for x, y, rx, ry in ps:
        out.append('<ellipse cx="%g" cy="%g" rx="%g" ry="%g" fill="#a39d93" '
                   'stroke="#6e5238" stroke-width="1.2"/>' % (x, y, rx, ry))
        out.append('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="#e0dbd2" '
                   'opacity=".8"/>' % (x + rx * 0.25, y - ry * 0.3, rx * 0.45, ry * 0.35))
    return '\n      '.join(out)


def svg(isl, mirrored):
    geo = ' transform="%s"' % MIRROR if mirrored else ''
    off = (30 - 22) / (isl['bottom'] - 22)       # soil is lid-green down to y=30
    return '''<svg xmlns="http://www.w3.org/2000/svg" width="240" height="170" viewBox="0 0 240 170">
  <defs>
    <linearGradient id="soil" gradientUnits="userSpaceOnUse" x1="0" y1="22" x2="0" y2="{bottom}">
      <stop offset="0" stop-color="#4fb574"/>
      <stop offset="{g0:.3f}" stop-color="#4fb574"/>
      <stop offset="{g1:.3f}" stop-color="#c29462"/>
      <stop offset="0.55" stop-color="#946a44"/>
      <stop offset="1" stop-color="#6a4b31" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="lip" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a2818" stop-opacity=".45"/>
      <stop offset="1" stop-color="#3a2818" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="body"><path d="{keel}"{geo}/></clipPath>
    <clipPath id="below"><rect x="0" y="30" width="240" height="140"/></clipPath>
    <clipPath id="sun"><rect x="150" y="30" width="90" height="140"/></clipPath>
  </defs>
  <path d="{keel}" fill="url(#soil)"{geo}/>
  <g clip-path="url(#below)"><g clip-path="url(#body)">
    <g{geo}>
      <path d="{strata}" stroke="#6e4f33" stroke-width="6" opacity=".45" fill="none" stroke-linecap="round"/>
      <path d="{strata}" transform="translate(0 -5)" stroke="#d9ad78" stroke-width="2.5" opacity=".55" fill="none" stroke-linecap="round"/>
      {pebbles}
    </g>
    <rect x="0" y="28" width="240" height="16" fill="url(#lip)"/>
    <path d="M0 30 L108 30 Q92 96 112 170 L0 170 Z" fill="#3a2818" opacity=".28"/>
    <path d="M150 30 L240 30 L240 170 L168 170 Q186 96 150 30 Z" fill="#ffd79a" opacity=".22"/>
    <g clip-path="url(#sun)"><path d="{keel}"{geo} fill="none" stroke="#ffe1a0" stroke-width="7" opacity=".6"/></g>
  </g></g>
  <g{geo}>
    <path d="{lid}" fill="#4fb574"/>
    <path d="{top}" fill="#5fd35a"/>
    <path d="{hi}" fill="#9cf27d" opacity="0.85"/>
    <path d="{drips}" stroke="#4fb574" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>
</svg>
'''.format(geo=geo, g0=off, g1=off + 0.02,
              **dict(isl, pebbles=pebbles(isl['pebbles'])))


if __name__ == '__main__':
    for n, isl in ISLANDS.items():
        for mirrored in (False, True):
            name = 'island-%d%s.svg' % (n, '-m' if mirrored else '')
            (OUT / name).write_text(svg(isl, mirrored), encoding='utf-8')
            print(OUT / name)
