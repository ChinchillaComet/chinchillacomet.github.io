# Welcome page

A static GitHub Pages landing page with one visible word: **Welcome**. The repository
root is served directly. There is no build step, remote font service, analytics,
or runtime package dependency.

## Artwork workflow

The third revision replaces the earlier procedural tree, clouds, mountains and
water with three detailed anime-inspired pixel-art illustrations. The images
were generated with the built-in ImageGen tool, visually reviewed, and composed
separately for ordinary landscape, portrait and panoramic displays. The prompts
and source dimensions are recorded in `assets/artwork/README.md`.

The illustrations are delivered as compact WebP assets on deliberate base grids:
768 × 512 for landscape, 444 × 888 for portrait and 956 × 412 for panorama.
They are rasterized with nearest-neighbour sampling and encoded at WebP quality
95; the full-size working renders are not sent to visitors. Each viewport loads
only its selected composition. The `<picture>` element uses the same breakpoints as
the canvas renderer, so a complete illustration is also available before
JavaScript starts and when JavaScript is unavailable.

Visual review is the quality gate. Review the actual composed page at desktop,
phone, tablet and wide-screen sizes, with particular attention to coherent tree
branches, cloud contours, moon visibility, shoreline detail and the centred
heading. Automated checks establish rendering behavior; they cannot establish
whether an illustration is beautiful or hand-crafted.

## Display grid and type

`pixel.js` chooses a logical raster grid for the viewport and display density.
The finished frame is enlarged by a whole number of physical display pixels,
with image smoothing disabled. The canvas origin is also aligned to physical
pixels. This makes the visible pixel grid consistent across the artwork,
lettering and effects. The source illustration is sampled into that grid once
per resize; it is not redrawn procedurally or subjected to palette reduction.

At 1440 × 900 and a device pixel ratio of 1, the page uses a 720 × 450 logical
frame, enlarged exactly 2×. A 390 × 844 phone uses 390 × 844 logical pixels at
integer device densities. Fractional-density phones preserve at least that much
detail. Do not restore the old coarse 195-column phone rendering grid.

`typography.js` contains the exact native bitmap geometry of Press Start 2P by
Cody Boisclair. The original unmodified font and its SIL Open Font License are
in `assets/fonts/`. The real document `<h1>` remains available to assistive
technology and uses the font directly when the canvas is unavailable. The
visible canvas glyphs use the same outlines, with a cream fill and a dark pixel
outline. No lettering is baked into the generated landscape images.

To regenerate the font mask and `typography.js`, install Python's `fontTools`
package and run `python assets/fonts/build-welcome-mask.py`.

## Animation

`scene.js` caches the fitted illustration and heading. `ambient.js` provides
restrained motion on the same logical grid:

- The lake samples narrow strips of its actual painted reflections with a
  horizontal offset of at most one logical pixel. The source canvas is immutable,
  so distortion cannot accumulate. Reviewed boundaries stay within open water;
  banks, lanterns and foreground rocks remain stationary.
- Petals drift from the canopy regions. A few fireflies and stars pulse gently.
  The heading has an exclusion area to keep particles clear of its letters.
- The shooting star moves diagonally down-left. Every tail point is an earlier
  position of the same head, keeping the tapered tail up-right behind it. The
  first pass begins after 7.5 seconds and subsequent passes are 29 seconds apart.

Animation renders at no more than 24 frames per second, pauses in hidden tabs,
and becomes a still when reduced motion is requested. `main.js` caches decoded
images, ignores obsolete orientation loads, and keeps the static picture and
heading visible until a complete frame is ready. Loading or rendering failures
leave that fallback in place.

## Development and verification

```sh
npm ci
npm test
npm run render:art
```

The pinned `@napi-rs/canvas` development dependency renders the actual scene for
regression checks and produces `assets/preview.webp` and
`assets/preview-mobile.webp`. It is not loaded by the website.

The tests cover exact font glyphs, responsive frame coverage, integer display
scaling, heading centring, the meteor's direction and trailing geometry, water
confinement, image loading failures and races, hidden/reduced-motion behavior,
resize coalescing and display-density changes. Native canvas previews were
visually reviewed; an interactive browser session was not available in the
current editing environment, so browser interaction QA is not claimed.

When publishing a revision, update the asset version consistently in
`index.html` and `scene.js`, regenerate the page previews, and verify the deployed
HTML and artwork. Keep the font attribution and source image documentation.
