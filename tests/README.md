# Verification

Install development dependencies and run the suite:

```sh
npm ci
npm test
```

`art.test.cjs` uses the same renderer and optimized artwork assets as the page. It
checks the exact Welcome glyphs, image dimensions and variant selection, complete
responsive frame coverage, integer display scaling, centred lettering, meteor
head/tail direction and confinement of moving pixels to the reviewed lake region.

`lifecycle.test.cjs` uses a small mock DOM and controllable image decodes. It checks
first paint, cached loads, stale orientation loads, failures, current viewport and
DPR after loading, reduced motion, page visibility, resize coalescing, zero-size
recovery and the 24 FPS cap.

These checks do not judge artistic quality or substitute for browser QA. Review
rendered desktop, portrait, tablet and panoramic compositions visually. Run
`npm run render:art` to regenerate the committed desktop and phone previews.
