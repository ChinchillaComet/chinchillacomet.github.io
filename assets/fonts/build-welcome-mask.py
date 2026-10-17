"""Extract the original font's exact 8-pixel design for the Welcome title.

Development tool only. Requires fontTools; the website has no Python dependency.
No glyph is redrawn. Every cell comes directly from the original TTF contours.
"""

from hashlib import sha256
import json
from pathlib import Path

from fontTools.ttLib import TTFont


FONT_DIR = Path(__file__).resolve().parent
FONT_PATH = FONT_DIR / "PressStart2P-Regular.ttf"
TARGET_PATH = FONT_DIR.parent / "welcome-mask.json"
TEXT = "Welcome"
PIXEL_UNITS = 125
NATIVE_EM = 8


def inside_contours(x, y, contours):
    """Nonzero winding rule at a cell center, as in TrueType outline filling."""
    winding = 0
    for contour in contours:
        for a, b in zip(contour, contour[1:] + contour[:1]):
            cross = (b[0] - a[0]) * (y - a[1]) - (x - a[0]) * (b[1] - a[1])
            if a[1] <= y < b[1] and cross > 0:
                winding += 1
            elif b[1] <= y < a[1] and cross < 0:
                winding -= 1
    return winding != 0


def main():
    font = TTFont(FONT_PATH)
    assert font["head"].unitsPerEm == NATIVE_EM * PIXEL_UNITS
    cmap = font.getBestCmap()
    advance = 0
    cells = set()
    glyphs = []

    for char in TEXT:
        glyph_name = cmap[ord(char)]
        glyph = font["glyf"][glyph_name]
        coordinates, ends, flags = glyph.getCoordinates(font["glyf"])
        assert all(flag & 1 for flag in flags), "The design has curved edges"
        assert all(x % PIXEL_UNITS == 0 and y % PIXEL_UNITS == 0 for x, y in coordinates)
        glyph_advance, _ = font["hmtx"][glyph_name]
        assert glyph_advance % PIXEL_UNITS == 0
        contours = []
        start = 0
        for end in ends:
            contour = list(coordinates[start : end + 1])
            assert all(
                a[0] == b[0] or a[1] == b[1]
                for a, b in zip(contour, contour[1:] + contour[:1])
            ), "The design has a diagonal edge"
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
    output = {
        "text": TEXT,
        "fontFamily": "Press Start 2P",
        "fontAuthor": "Cody Boisclair (CodeMan38)",
        "fontSource": "https://github.com/google/fonts/blob/main/ofl/pressstart2p/PressStart2P-Regular.ttf",
        "fontSha256": sha256(FONT_PATH.read_bytes()).hexdigest(),
        "license": "SIL Open Font License 1.1; see fonts/OFL.txt and fonts/FONTLOG.txt",
        "unitsPerEm": font["head"].unitsPerEm,
        "fontUnitsPerPixel": PIXEL_UNITS,
        "nativeEmPixels": NATIVE_EM,
        "width": width,
        "height": height,
        "advanceWidth": advance,
        "rows": rows,
        "glyphs": glyphs,
    }
    TARGET_PATH.write_text(json.dumps(output, indent=2) + "\n")
    shipped = {key: output[key] for key in ("text", "width", "height", "rows")}
    (FONT_DIR.parent.parent / "typography.js").write_text(
        "/* Exact native glyph outlines from Press Start 2P by Cody Boisclair.\n"
        " * SIL Open Font License 1.1; original font and license: assets/fonts/.\n"
        " * Regenerate with assets/fonts/build-welcome-mask.py. */\n"
        "(() => {\n  \"use strict\";\n  globalThis.PixelTypography = Object.freeze("
        + json.dumps(shipped, indent=2) + ");\n})();\n"
    )
    print(f"Wrote {TARGET_PATH.name}: {width} × {height} native pixels, {len(cells)} filled cells.")


if __name__ == "__main__":
    main()
