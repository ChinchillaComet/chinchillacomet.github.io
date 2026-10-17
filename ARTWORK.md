# Welcome page artwork

The page is plain HTML, CSS and JavaScript. GitHub Pages serves the repository
root directly; no server, build, remote font provider or runtime package is needed.
The only visible text is the real document heading **Welcome**.

## Art and grid

`pixel.js` owns the shared palette, raster primitives and physical-pixel layout.
All scene coordinates are integer pixels. The final low-resolution frame,
including the lettering, is enlarged by an integer number of physical display
pixels. The canvas origin is also aligned in physical pixels, including on
fractional-density displays. No smoothing, blur or translucent paint is used.

`garden.js` contains authored canopy shapes, branch openings, rocks, plants,
petal clusters and the lantern. Objects use fixed local geometry and are
repositioned for different compositions; they are not stretched independently
to match the viewport width and height. The shallow layout has a compact tree.

`scene.js` composes the sky, complete padded cloud masks, distinct mountain
ridges, water reflections, garden, particles and title. Sky transitions use
ordered dithering between explicit adjacent palette colours. The scene uses
solid connected clusters elsewhere, reserving isolated pixels for stars,
petals and fireflies. Keep highlight directions, quiet areas and the shared
colour ramps consistent when making changes.

Cloud artwork must leave its outer sprite perimeter transparent. The regression
suite checks that border so an edit cannot recreate the original clipping bug.

## Typography

The lettering is the exact native bitmap geometry of Press Start 2P by Cody
Boisclair, not a custom approximation. The original unmodified font, its SIL
Open Font License and attribution are in `assets/fonts/`. The document heading
uses the actual font as a no-JavaScript fallback. The canvas draws the same glyphs
on the shared scene grid from `typography.js`.

To regenerate both the mask and `typography.js` after editing the text in the
development script, install Python's `fontTools` package and run:

```sh
python assets/fonts/build-welcome-mask.py
```

## Verify and regenerate assets

The regression suite has no dependencies:

```sh
node --test tests/*.test.cjs
```

After changing artwork, regenerate both static fallbacks and the social preview:

```sh
npm ci
npm run render:art
```

The canvas dependency is used only by this development command. Commit the
updated PNGs with the source. Review desktop, portrait and shallow compositions
at native resolution and integer enlargement. Bump the asset query version in
`index.html` when publishing source changes, so returning visitors receive a
consistent set of files.

The ambient animation is capped at 12 frames per second. It pauses when the
document is hidden and becomes a still when reduced motion is requested.
