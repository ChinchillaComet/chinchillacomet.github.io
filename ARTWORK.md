# Welcome page

A static GitHub Pages landing page with one visible word: **Welcome**. GitHub
Pages serves the repository root. The published page has no runtime package
dependencies, analytics, remote fonts, or image-decoding prerequisite for its
animation.

## Source and release files

Edit the renderer, animation, typography, and styles in `src/`. Edit page markup
in `src/index.template.html`. Run `npm run build` after source changes. The build
creates `index.html`, `assets/release.json`, and content-fingerprinted files in
`assets/releases/`.

The page loads one deferred JavaScript bundle containing its dependencies in
order: pixel grid, typography, ambient motion, artwork, scene, and lifecycle.
CSS, fallback pictures, and previews also have content hashes in their names.
A resource URL therefore identifies one complete set of bytes. The manifest
records each resource's SHA-256 digest; it is used for verification and is not
fetched by the page.

**Keep previously published release assets.** An older cached document must
still be able to fetch the exact resources it references. The root-level
`pixel.js`, `typography.js`, `ambient.js`, `art.js`, `scene.js`, `main.js`, and
`style.css`, together with the old unversioned fallback pictures, are frozen
revision 4 compatibility files. Do not edit or delete them. They are not the
current editable source. New revisions use the generated bundle.

This packaging prevents independently cached scripts from mixing revisions.
It does not change GitHub Pages' HTTP caching policy or forcibly replace HTML
already held in a browser cache. There is no service worker, forced reload, or
periodic cache-busting request.

## Native artwork

Revision 5 retains a small, code-native pixel scene. `src/art.js` contains fixed
cloud bitmaps, authored contours, connected light and shadow shapes, and
foreground sprites. Integer scanlines and `fillRect` draw opaque marks directly
on the native grid. There are no antialiased paths, smooth gradients, blur,
lossy illustration plates, or random surface textures.

The dusk sky uses four flat swatches with ordered dithering across shallow,
curved boundaries. The moon has two stepped aura bands. The reviewed desktop
frame contains 45 opaque colours; tests cap complete frames at 48, allowing
the deliberate light, foliage, and animation swatches.

The cherry tree has a curved, tapered trunk, connected supporting branches,
interlocking blossom masses, and smaller flower accents. Portrait screens use
an overhanging bough. Ground, warm light facets, rear grasses, seated stones,
short grass at stone bases, and the lantern are painted in explicit depth
order. Warm-facing facets connect the lantern's light to nearby surfaces.

Three mountain layers and a far-shore pavilion give the lake depth. The
pavilion has a lit window and a short reflection. Broken moonlight marks widen
toward the viewer. Three groups of lily pads, an open lotus, and a smaller bud
sit in open water with restrained ripples. Fireflies remain visible in their
dim phase and use small stepped highlights rather than blurred glows.

## Display grid and type

`src/pixel.js` chooses a small logical frame and an integer number of physical
display pixels for each scene pixel. `src/main.js` enlarges that complete frame
with smoothing disabled and aligns its origin to physical pixels. Scenery,
letters, sprites, and animation share the same grid. Resizing recomposes the
scene rather than stretching native sprites.

At a device pixel ratio of 1:

| Display | Native frame | Integer enlargement |
| --- | --- | --- |
| 1440 × 900 | 360 × 225 | 4× |
| 390 × 844 | 195 × 422 | 2× |
| 2560 × 1080 | 512 × 216 | 5× |

`src/typography.js` retains the exact bitmap geometry of Press Start 2P by Cody
Boisclair. The font, attribution, and SIL Open Font License remain in
`assets/fonts/`. A real document `<h1>` is available to assistive technology
and supplies the heading when JavaScript or canvas is unavailable. Scenery
fallback pictures contain no lettering. To regenerate the font mask, install
Python's `fontTools` and run `python assets/fonts/build-welcome-mask.py`.

## Motion, recovery, and fallback

`src/scene.js` caches static layers. Clouds move slowly in whole-pixel steps;
water marks and lily ripples move by at most one native pixel. Petals, stars,
and fireflies provide sparse motion. Each frame begins with the complete
background, so animation does not accumulate trails or holes. The shooting
star travels down-left with its previous positions forming the tail up-right.
The first pass begins after 7.5 seconds; subsequent passes are 29 seconds apart.

The renderer paints synchronously and reveals the canvas only after a complete
successful frame. It caps animation at 24 FPS, pauses hidden or frozen pages,
and respects reduced motion. Fireflies remain present in the reduced-motion
still. A rendering failure restores the static picture and real heading.

Startup and recovery listen for DOM readiness, load, page restoration,
visibility, prerender activation, and freeze/resume events. Recovery clears
stale animation callback bookkeeping and reconsiders the current layout and
display density. A transient drawing failure gets one next-frame retry;
persistent failure waits for a real lifecycle or resize event rather than
polling indefinitely. No reload is required by the recovery code.

## Development and verification

```sh
npm ci
npm run build
npm test
```

The pinned `@napi-rs/canvas` development dependency renders native artwork,
lossless fallback PNGs, and desktop/phone previews. Visitors do not load it.
`npm run render:art` is an alias for the complete build, keeping generated
pictures, release links, and renderer code synchronized.

Tests cover glyphs, frame coverage, physical pixel alignment, palette limits,
cloud contours, meteor direction, water motion, firefly visibility, reduced
motion, lifecycle recovery, and release integrity. See `tests/README.md`.

Visual review is a separate gate: inspect native and enlarged desktop, phone,
tablet, and panoramic compositions, including animation frames. For this
revision, native renders and mock lifecycle checks were reviewed. An interactive
browser session was unavailable, so those checks do not establish the exact
cause of a particular visitor's browser incident.
