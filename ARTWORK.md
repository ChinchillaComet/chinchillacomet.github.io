# Welcome page

A static GitHub Pages landing page with one visible word: **Welcome**. The
repository root is served directly. There is no build step, analytics, remote
font service, or runtime package dependency.

## Native artwork

Revision 4 replaces the generated illustration plates with a small scene drawn
directly on its native pixel grid. `art.js` contains fixed cloud bitmap rows,
authored mountain and canopy contours, connected light/shadow shapes, and a few
foreground sprites. Shapes are filled with integer scanlines or `fillRect`;
the renderer does not use antialiased paths, gradients, blur, dithering, random
surface texture, palette-reduced illustrations, or large source images.

The palette is deliberately limited. Static reviewed frames contain 26 opaque
colours, with one additional colour available to the firefly animation. The sky
is a single lavender swatch. The cherry canopy has broad connected blossom
masses and a continuous shadow underside; the phone uses an overhanging bough
rather than stretching the desktop trunk. Clouds have transparent padding on
all four sprite edges and retain their complete contours during motion.

Mountains use three flat depth layers. Water marks form compact groups near the
shore and become broader, more widely spaced strokes toward the viewer. The
moon reflection widens in broken groups. The foreground remains quiet, with a
small lantern, a few flowers, and three shoreline stones.

Visual review is a separate quality gate from the tests. Review the actual
compositions at native resolution and integer enlargement, including desktop,
phone, tablet, and wide screens. Prefer coherent silhouettes and a few well
placed colour clusters over adding surface marks.

## Display grid and type

`pixel.js` selects a small logical grid and an integer number of physical display
pixels for each scene pixel. `main.js` enlarges the complete frame with smoothing
disabled and aligns its origin to physical pixels. The same grid contains the
scenery, text, clouds, and animation. Viewport changes recompose the scene;
they do not stretch or resample the native sprites.

At a device pixel ratio of 1:

| Display | Native frame | Integer enlargement |
| --- | --- | --- |
| 1440 × 900 | 360 × 225 | 4× |
| 390 × 844 | 195 × 422 | 2× |
| 2560 × 1080 | 512 × 216 | 5× |

`typography.js` retains the exact bitmap geometry of Press Start 2P by Cody
Boisclair. The original font and its SIL Open Font License are in `assets/fonts/`.
The real document `<h1>` remains available to assistive technology and provides
the heading when JavaScript or canvas is unavailable. The visible canvas glyphs
use the same letter shapes, a cream fill, and a dark pixel outline. Text is never
baked into the scenery fallback assets.

To regenerate the font mask, install Python's `fontTools` package and run
`python assets/fonts/build-welcome-mask.py`.

## Motion and fallback

`scene.js` caches the sky, cloud sprites, mountains, garden, and title. Cloud
positions move slowly in whole-pixel steps. Water reflection groups move by at
most one native pixel. A few petals, stars, and fireflies provide sparse motion;
particles avoid the heading. Every frame starts with the complete background,
so animation cannot leave trails or accumulate holes in the artwork.

The shooting star travels down-left. Its tail consists of earlier positions of
the same head and stays up-right behind it. Its first pass begins after 7.5
seconds; later passes are 29 seconds apart.

`main.js` constructs the native scene synchronously without image loading or
decoding. It displays the canvas only after a successful complete first frame.
Animation is capped at 24 FPS, pauses when the page is hidden, and becomes a
fixed still when reduced motion is requested. A rendering failure restores the
static picture and real heading.

The three tiny lossless PNG fallbacks in `assets/` are rendered by this same
code. They support initial display, unavailable JavaScript, and renderer errors.
Only the appropriate composition is selected by the `<picture>` element. The
former generated WebP illustrations are no longer part of the site.

## Development and verification

```sh
npm ci
npm test
npm run render:art
```

The pinned `@napi-rs/canvas` development dependency renders the scene for checks
and generates the lossless fallback PNGs and desktop/phone previews. It is not
loaded by visitors.

The tests check exact font glyphs, frame coverage, integer display scaling,
centred lettering, opaque limited-palette output, cloud sprite integrity,
meteor direction, deterministic water motion, reduced motion, rendering
failures, page visibility, resize coalescing, and display-density changes.
Native canvas renders were visually reviewed; an interactive browser session
was unavailable in the editing environment, so interactive browser QA is not
claimed.

For a new revision, update version queries in `index.html` and `scene.js`,
regenerate assets, review the actual rendered frames, and verify the published
files. Preserve font attribution and licensing.
