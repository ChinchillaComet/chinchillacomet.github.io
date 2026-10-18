"""Extract the two page labels from the bundled Press Start 2P font.

Development tool only; requires fontTools. Glyph cells come directly from the
font's original orthogonal contours. The published v4 font/mask files stay frozen.
"""

from hashlib import sha256
import json
from pathlib import Path

from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parent.parent
FONT_PATH = ROOT / "assets/fonts/PressStart2P-Regular.ttf"
PIXEL_UNITS = 125
NATIVE_EM = 8


def inside_contours(x, y, contours):
    winding = 0
    for contour in contours:
        for a, b in zip(contour, contour[1:] + contour[:1]):
            cross = (b[0] - a[0]) * (y - a[1]) - (x - a[0]) * (b[1] - a[1])
            if a[1] <= y < b[1] and cross > 0:
                winding += 1
            elif b[1] <= y < a[1] and cross < 0:
                winding -= 1
    return winding != 0


def extract(font, text):
    assert font["head"].unitsPerEm == NATIVE_EM * PIXEL_UNITS
    cmap = font.getBestCmap()
    advance, cells, glyphs = 0, set(), []
    for char in text:
        glyph_name = cmap[ord(char)]
        glyph = font["glyf"][glyph_name]
        coordinates, ends, flags = glyph.getCoordinates(font["glyf"])
        assert all(flag & 1 for flag in flags), "Unexpected curved edge"
        assert all(x % PIXEL_UNITS == 0 and y % PIXEL_UNITS == 0 for x, y in coordinates)
        glyph_advance, _ = font["hmtx"][glyph_name]
        assert glyph_advance % PIXEL_UNITS == 0
        contours, start = [], 0
        for end in ends:
            contour = list(coordinates[start:end + 1])
            assert all(a[0] == b[0] or a[1] == b[1]
                       for a, b in zip(contour, contour[1:] + contour[:1]))
            contours.append(contour)
            start = end + 1
        for row in range(NATIVE_EM):
            y = font["head"].unitsPerEm - (row + 0.5) * PIXEL_UNITS
            for col in range(glyph_advance // PIXEL_UNITS):
                x = (col + 0.5) * PIXEL_UNITS
                if inside_contours(x, y, contours):
                    cells.add((advance + col, row))
        glyphs.append({"character": char, "x": advance, "advance": glyph_advance // PIXEL_UNITS})
        advance += glyph_advance // PIXEL_UNITS
    width = max(x for x, _ in cells) + 1
    height = max(y for _, y in cells) + 1
    rows = ["".join("1" if (x, y) in cells else "0" for x in range(width)) for y in range(height)]
    return {"text": text, "width": width, "height": height, "rows": rows,
            "advanceWidth": advance, "glyphs": glyphs}


def main():
    font = TTFont(FONT_PATH)
    welcome = extract(font, "Welcome")
    original = json.loads((ROOT / "assets/welcome-mask.json").read_text())
    for key in ("text", "width", "height", "rows", "advanceWidth", "glyphs"):
        assert welcome[key] == original[key], "The original Welcome mask must remain exact"
    brand = extract(font, "Chinchilla Comet")
    brand_mask = {**brand, "fontFamily": "Press Start 2P", "fontAuthor": "Cody Boisclair (CodeMan38)",
                  "fontSha256": sha256(FONT_PATH.read_bytes()).hexdigest(),
                  "license": "SIL Open Font License 1.1; see fonts/OFL.txt and fonts/FONTLOG.txt",
                  "unitsPerEm": font["head"].unitsPerEm, "fontUnitsPerPixel": PIXEL_UNITS,
                  "nativeEmPixels": NATIVE_EM}
    (ROOT / "assets/brand-mask.json").write_text(json.dumps(brand_mask, indent=2) + "\n")
    fields = ("text", "width", "height", "rows")
    welcome_cells = {key: welcome[key] for key in fields}
    brand_cells = {key: brand[key] for key in fields}
    code = ("/* Exact native glyph outlines from Press Start 2P by Cody Boisclair.\n"
            " * SIL Open Font License 1.1; original font and license: assets/fonts/.\n"
            " * Regenerate both labels with scripts/build-type-masks.py. */\n"
            "(() => {\n  'use strict';\n"
            "  const welcome = " + json.dumps(welcome_cells, indent=2) + ";\n"
            "  const brand = Object.freeze(" + json.dumps(brand_cells, indent=2) + ");\n"
            "  globalThis.PixelTypography = Object.freeze({ ...welcome, brand });\n})();\n")
    (ROOT / "src/typography.js").write_text(code)
    print(f"Welcome: {welcome['width']} × {welcome['height']}; Chinchilla Comet: {brand['width']} × {brand['height']} native cells")


if __name__ == "__main__":
    main()
