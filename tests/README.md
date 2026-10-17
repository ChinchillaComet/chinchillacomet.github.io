# Verification

```sh
npm ci
npm test
npm run render:art
```

`art.test.cjs` loads the same native renderer as the page. It checks the exact
Welcome glyphs and sole visible word, fallback dimensions, complete responsive
frames, square physical pixels, centred lettering, a limited opaque palette,
cloud sprite integrity, meteor direction, reduced-motion stills, and confined
water animation.

`lifecycle.test.cjs` uses a small mock DOM and controllable frame clock. It checks
synchronous first paint, fallback and recovery after rendering failures,
reduced motion, hidden-page timing, resize coalescing, zero-size recovery,
display-density changes, and the 24 FPS cap. No image decoding is involved.

These checks establish rendering behavior, not artistic quality. Review native
and enlarged desktop, portrait, tablet, and panoramic frames visually. The
render script produces the committed PNG fallbacks and page previews without
lossy image compression or resampling of the native artwork.
