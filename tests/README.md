# Verification

```sh
npm ci
npm run build
npm test
```

`art.test.cjs` loads the editable native renderer from `src/`. It checks exact
Welcome glyphs and the sole visible word, fallback dimensions, complete
responsive frames, square physical pixels, centred lettering, an opaque palette
of at most 48 colours, cloud sprite integrity, meteor direction, deterministic
water motion, and visible fireflies in animated and reduced-motion scenes.

`lifecycle.test.cjs` uses a small mock DOM and controllable frame clock. It covers
synchronous first paint, fallback and bounded recovery after rendering errors,
reduced motion, hidden-page timing, resize coalescing, zero-size recovery,
display-density changes, and the 24 FPS cap. It also exercises delayed DOM or
dependency availability, load/pageshow recovery, stale callback bookkeeping
after page restoration, prerender activation, and freeze/resume. No image
decoding is involved.

`release.test.cjs` checks the published document's resource references and the
content hashes in `assets/release.json`. It verifies that the single deferred
bundle contains the source modules in dependency order and that the frozen
revision 4 scripts retain their original Git blob hashes and all v5 release
resources retain their exact published bytes. Keep those legacy
files and previously published fingerprinted assets for cached older documents.

These checks establish rendering and packaging behavior, not artistic quality
or a browser-specific diagnosis. Review native and enlarged desktop, portrait,
tablet, and panoramic frames visually. The build produces the committed PNG
fallbacks and page previews without lossy compression or resampling of native
artwork. After deployment, verify the actual document and resources served by
GitHub Pages, including normal unmodified URLs.
