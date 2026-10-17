# Press Start 2P

The unmodified `PressStart2P-Regular.ttf` is **Press Start 2P** by Cody Boisclair
(CodeMan38), distributed under the SIL Open Font License 1.1. Its copyright,
license, and required font information are included as `OFL.txt` and `FONTLOG.txt`.

Downloaded from the official Google Fonts repository:

- https://github.com/google/fonts/tree/main/ofl/pressstart2p
- https://raw.githubusercontent.com/google/fonts/main/ofl/pressstart2p/PressStart2P-Regular.ttf

## Exact pixel lettering

The font's original design has an 8-pixel em. Its TrueType units per em are 1000,
and every edge of the glyphs used in `Welcome` falls on a 125-unit grid. These
glyphs contain only horizontal and vertical straight edges. The original
`FONTLOG.txt` recommends 8 px, 16 px, and other multiples of 8.

`../welcome-mask.json` is a direct extraction of these original font outlines,
using the TrueType nonzero winding rule at each native cell center. It is not a
hand-drawn approximation or a thresholded, anti-aliased text screenshot. Rows run
from top to bottom; `1` means a filled cell and `0` a transparent one. The visible
word is 55 × 7 native pixels, with a 56-pixel typographic advance and 8-pixel em.

Render each cell as a square at whole-number coordinates on the scene canvas.
Use an integer title scale, for example 2 scene pixels per font pixel, so the
complete title remains aligned with the same grid as the scenery. Keep real
`Welcome` text in the document heading for assistive technology.

To regenerate the mask and the shipped `typography.js` with fontTools installed:

```sh
python assets/fonts/build-welcome-mask.py
```

For HTML text fallback, self-host the original font with `@font-face`, use a
font-size that is a multiple of 8 CSS pixels, normal weight, zero extra letter
spacing, and no synthetic bold or italic. Canvas mask rendering gives precise
control over both the font grid and the scenery grid.
