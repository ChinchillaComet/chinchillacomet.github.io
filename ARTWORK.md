# Welcome page

A static GitHub Pages landing page with **Welcome** at the centre and the
smaller **Chinchilla Comet** caption at the bottom. GitHub
Pages serves the repository root. The published page has no runtime package
dependencies, analytics, remote fonts, or image-decoding prerequisite for its
animation.

## Source and release files

Edit the renderer, animation, typography, and styles in `src/`. Edit page markup
in `src/index.template.html`. Run `npm run build` after source changes. The build
creates `index.html`, `assets/release.json`, and content-fingerprinted files in
`assets/releases/`.

The page loads one deferred JavaScript bundle containing its dependencies in
order: pixel grid, typography, small caption, ambient motion, artwork, scene, and lifecycle.
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

Revision 9 uses a small, code-native pixel scene. `src/art.js` contains fixed
cloud bitmaps, authored contours, connected light and shadow shapes, and
foreground sprites. Integer scanlines and `fillRect` draw opaque marks directly
on the native grid. There are no antialiased paths, smooth gradients, blur,
lossy illustration plates, or random surface textures.

The darker blue and plum dusk palette leaves room for the light sources. Four
sky swatches meet through ordered dithering. The cool moon disc has a few
short crater groups and an aura whose native-pixel coverage thins into the
sky. Complete reviewed frames contain 53 opaque colours, including lighting
and motion. The 56-colour test budget leaves a small margin for the distinct
lime-gold firefly ramp and warm fire/paper shades.

The cherry canopy is assembled from small authored blossom sprays at 1:1
resolution. Its finer 1–3 pixel edge steps and connected interior groups avoid
the appearance of enlarged block shapes. A continuous dark backing supports
all the blossoms and partially visible branches. Portrait screens use an
overhanging bough. Four small hanging tips respond to the same wind as the
petals; their anchors remain fixed while their end poses move one pixel.

The slightly wider foreground bank retains explicit depth order: ground,
rear grasses, seated stones, short grass at stone bases, and a low campfire
hearth. Crossed logs support six authored flame poses, with up to two small
embers. A palette-aware lighting pass recolours nearby facing surfaces within
a dithered falloff. It advances each material along deliberate warm colour
ramps, retains opaque pixels and object shadows, and flickers with the flame.
It does not draw a blurred or translucent light image over the scene.

Three mountain layers, a layered conifer grove on the far left shore, and a
far-shore pavilion give the lake depth. The grove uses varied stepped branch
silhouettes in subdued blue and teal. The pavilion has a lit window and a short reflection. Moonlight opens toward the
viewer in asymmetric horizontal pools, broken by dark water and smaller cool
glints. These planes have fixed native heights, including on portrait screens.
Five lily-pad groups include two open lotus flowers, two buds, and a leaf-only
cluster. The smaller distant additions flank the moonlight path. Their positions
are shared by the artwork and firefly habitat through `waterPlants`. Pad bodies
are painted after lantern reflections so reflected light cannot erase a leaf.
Three shore lights sit below the mountains, while three small paper lanterns
hover at staggered heights above the lake. The airborne lanterns use authored
paper forms in two sizes, with clean connected silhouettes. Warm folds, a
narrow lower rim, and a small inner flame describe the glow entirely inside
the lantern; there are no detached grey halo cells.
Their broken reflections follow the light centres across the water, mirrored
about the horizon and gently displaced by the same small ripples.

Fireflies have independent lime-gold light ramps, persistent cores, and compact
connected glows: three by three pixels, briefly extending to five by three at
their brightest. Petals remain rose-coloured. Firefly birth positions reserve
their entire hovering glow footprint around both labels, the hearth, and the
chinchilla. Seven portrait or nine landscape fireflies hover above and beside
the lotus and lily pads. The insects keep a stable count instead of disappearing
at an exclusion edge.

A small chinchilla sits on the enlarged right bank, facing across the lake.
Its rebuilt silhouette has a smaller blunt head, a larger rounded torso and
haunch, forward-facing ear bowls, tucked forepaws, and a thick sweeping brush
tail rooted low behind the rump. Each part uses authored native-cell sprites. The seated body stays fixed while the tail briefly twitches
through anchored poses. The bank supports its feet, and the complete character
remains above the bottom caption on narrow phone screens.

## Display grid and type

`src/pixel.js` chooses a small logical frame and an integer number of physical
display pixels for each scene pixel. `src/main.js` enlarges that complete frame
with smoothing disabled and aligns its origin to physical pixels. Scenery, the central heading, sprites, and animation share the same grid.
The small signature has its own finer integer display grid. Resizing recomposes
the scene rather than stretching native sprites.

At a device pixel ratio of 1:

| Display | Native frame | Integer enlargement |
| --- | --- | --- |
| 1440 × 900 | 360 × 225 | 4× |
| 390 × 844 | 195 × 422 | 2× |
| 2560 × 1080 | 512 × 216 | 5× |

`src/typography.js` retains the exact bitmap geometry of Press Start 2P by Cody
Boisclair for both labels. Welcome uses a two-cell enlargement. `src/caption.js`
draws the bottom caption after scene enlargement, at half the scenery's physical
cell size rounded down to a minimum of one display pixel. This halves its size
without downsampling away any original letter cells. Its centring, outline, and
shadow remain aligned to whole physical pixels, including at fractional DPR.
The scene reserves the caption's actual footprint for particles. The font, attribution,
and SIL Open Font License remain in
`assets/fonts/`. A real document `<h1>` is available to assistive technology
and supplies the heading when JavaScript or canvas is unavailable. The bottom
caption has its own real document paragraph. Scenery fallback pictures contain
no lettering. To regenerate both masks, install Python's `fontTools` and run
`npm run build:type`. This extracts glyphs from the bundled font and writes only
the editable typography and new brand mask; the legacy Welcome files stay frozen.

## Motion, recovery, and fallback

`src/scene.js` caches static layers. Four padded, connected cloud sprites travel
right to left in three ordered depth planes. The two nearer clouds have
different gentle speed phases, with a reserved gap of at least 20 native cells
that accounts for their full wind displacement. A slower, muted rear cloud may
pass behind either of them on a lower track, with at least 13.5 cells of vertical
separation between visible sprite centres. The reserved foreground gap prevents
a three-cloud pile-up. Each plane holds one cloud, so a new neighbour cannot
spawn beside it in the same row.
Seeded variation selects each new shape only while it is fully offscreen.
Positions remain deterministic even when animation time is sampled out of order.

A deterministic shared wind phase drives the small hanging canopy tips and
falling petals. The scene uses 24 desktop and 20 portrait petals, distributed
across six sources beneath the inner branches and outer tips. Birth positions
follow the canopy's native coordinates, with only eight cells of horizontal
spread, so a wider viewport cannot move the sources beyond the tree. Each petal
turns through eight native poses of one to three pixels, with individual flutter
and the same rightward breeze. Protected rectangles keep the particle shapes
away from both labels.

Water marks and lily ripples move by at most one native pixel. Each frame begins
with the complete background, so motion does not accumulate trails or holes.
The shooting star has a compact leading wedge, a short two-cell shoulder, and
a one-cell taper. It travels down-left; earlier head positions form its tail
up-right. The first pass begins after 7.5 seconds, then repeats every 29 seconds.
A brief three-cell sparkle with two tiny, staggered satellites appears at the
endpoint just after the head leaves. The afterglint lasts 0.82 seconds and
uses the same native grid as the trail. Lanterns slowly bob up and down through
their own phases, with their full movement envelope reserved around the heading.
Their base flames, the campfire, and firefly glows flicker gently.

The renderer paints synchronously and reveals the canvas only after a complete
successful scene and caption copy. It caps animation at 24 FPS, pauses hidden or frozen pages,
and respects reduced motion. Fireflies, the campfire and lanterns remain
present as a stable reduced-motion still, with the chinchilla's tail at rest.
A rendering failure restores the
static picture and real heading.

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
cloud contours and offscreen wraps, meteor direction and afterglint, water
motion, separate particle palettes, full-glow exclusion, reduced motion,
lifecycle recovery, and release integrity. See `tests/README.md`.

Visual review is a separate gate: inspect native and enlarged desktop, phone,
tablet, and panoramic compositions, including animation frames. For this
revision, native renders and mock lifecycle checks were reviewed. An interactive
browser session was unavailable, so those checks do not establish the exact
cause of a particular visitor's browser incident.
