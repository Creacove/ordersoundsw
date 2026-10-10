# Section 3 implementation / QA

Implemented the locked copy and supplied individual materials in `SectionThree.astro` and `section-three.ts`.

- Extends the existing sticky journey by 150 viewport heights; Section 2 keeps its original 185vh timing.
- Keeps the original handled-stack DOM object at the handoff. Its replacement is masked by the first signal reveal because the supplied bound/unbound artworks are not identical.
- Timing, content and budget emerge from the stack; the optical material crosses them, then yields to the decision and action.
- All meaningful new text is HTML. The band uses the approved source logo.
- Image decoding starts one viewport before entry. No additional WebGL scene.
- Development states: `?s3=handoff|signals|focus|decision|final`.

Verified: 1536x864 desktop states, 768x1024 tablet, 390x844 mobile, reduced motion, production-build forward/reverse scrolling, no horizontal overflow. Build passes. Existing hero bundle-size warning remains; preview favicon returns 404.

Screenshots are saved in the local task output directory `outputs/hero-review/section3`.
