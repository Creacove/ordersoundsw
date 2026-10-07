# Codex handoff — OrderSounds Astro hero

## Goal
Finish the new OrderSounds marketing hero as a standalone Astro project and match the approved reference frames with near-photographic parity. Do not redesign it.

## Visual authority
The complete binary project/assets are stored in the user's ChatGPT Library:
- `/OrderSounds/MarketingRedesign/ordersounds-codex-handoff.zip`
- `/OrderSounds/MarketingRedesign/ordersounds-hero-assets-v2.zip`

The handoff ZIP contains the golden reference frames in `docs/reference/` and the current Astro implementation.

The source-of-truth hero is warm ivory, bright, photographic and restrained. Never turn it into a dark/neon/AI-SaaS aesthetic.

## Product truth
Desk is the artist's operating manager, not release-planning software.

`Desk understands → Desk decides → Desk does what it can → Desk gives exact human work → Desk follows up → Desk reviews reality → Desk adapts.`

Hero metaphor:
- front: **Make the music.**
- back: **Desk handles the other side.**

## Exact copy
Front:
- DESK
- Make the music.
- Your operating manager for everything around it.
- Enter Desk →

Back:
- DESK
- Desk handles the other side.
- The work that keeps your career moving.
- Enter Desk →

Sleeve backside initial:
1. YOUR MOVE / Record the next Odaeshi story
2. DESK IS HANDLING / Research · planning · follow-through
3. DESK IS WATCHING / Audience response · Lagos
4. NEEDS YOU / Approve split confirmations

Resolved state:
1. YOUR MOVE / Repeat the personal story
2. unchanged
3. RESULT / Personal story is leading
4. unchanged

## Choreography
One turn only:
- 0–2.5s front hold
- ~2.45s front HTML copy starts leaving
- 2.55–3.73s sleeve rotates exactly 180° around Y
- ~3.55s back headline appears
- ~3.65s backside operational typography becomes readable
- ~6.55s watching state resolves
- ~6.72s rows 01 and 03 update
- ~8s final settled state; do not loop

Vinyl stays largely stationary behind the sleeve.

## Required workflow
1. Materialize/unzip the two Library bundles above into `astro-redesign/`.
2. Install dependencies and get `npm run build` green.
3. Create deterministic Playwright screenshots at 1536×864.
4. Compare screenshots directly to the golden frames; tune instead of redesigning.
5. Desktop parity first. Only then make tablet 4:5 and mobile 9:16 compositions.
6. Productionize loading/performance and document results.

## First technical issue to fix
The current sleeve-back text is a flat DOM overlay. It must be physically registered to the back of the sleeve. Prefer a CanvasTexture/dynamic texture attached to the `Sleeve_Back` material. Do not leave text floating over the 3D object.

## Visual QA
Tune until the following match:
- environment crop/exposure
- camera position/FOV
- object scale and right-side placement
- sleeve thickness
- front/back purple optical arc placement
- vinyl offset, label size, grooves, iridescence
- contact shadow
- H1/H2 size, weight, leading, wrapping
- nav spacing and CTA dimensions

## Performance
- semantic HTML for nav/H1/support/CTA
- poster first for LCP
- invisible poster→WebGL handoff
- lazy-load WebGL
- KTX2/Basis for GPU textures after parity is locked
- do not use lossy WebP for normal/roughness maps
- honor prefers-reduced-motion
- stop continuous rendering after the final state if possible
- zero CLS

## Acceptance criteria
Do not call it done because it “looks close.”
- build passes
- desktop screenshots are meaningfully indistinguishable from approved frames
- one 180° turn, no 360° loop
- back copy stays registered to sleeve
- bright warm art direction preserved
- explicit responsive compositions
- no poster/WebGL jump
- reduced-motion fallback works
- final README includes setup, architecture and perf notes
