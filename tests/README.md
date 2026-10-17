# Regression checks

Run from the repository root with Node.js 18 or newer:

```sh
node --test tests/*.test.cjs
```

The suite uses Node's built-in test runner, an opaque software raster and a small
DOM/frame scheduler. It needs no browser, package install or network connection.

The checks cover the actual cloud clipping regression; the committed lettering
mask and font-file integrity; palette-only rendering; finite integer drawing
coordinates; square integer enlargement at several viewport sizes and device
densities; title placement and glyph survival during compositing; coalesced
resize handling; density changes; reduced motion; and pausing hidden tabs.

These are renderer and lifecycle regression checks. Browser screenshots and a
visual review are still needed to judge the artwork, native font fallback and
the browser's final presentation.
