# Codex handoff — OrderSounds Astro hero

## Start here
Work only on branch `codex/astro-hero-parity`.

**The task is now self-contained in GitHub. Do not ask the user for ChatGPT Library files.**

The binary asset bundle is committed at:
`astro-redesign/hero-assets-repo-ready.zip`

Unzip it before visual work:
```bash
cd astro-redesign
rm -rf .hero-assets
mkdir -p .hero-assets
unzip -o hero-assets-repo-ready.zip -d .hero-assets
```

Inside the archive:
- `.hero-assets/codex_min_assets/SOURCE_OF_TRUTH_FRONT.jpg`
- `.hero-assets/codex_min_assets/SOURCE_OF_TRUTH_BACK.jpg`
- `.hero-assets/codex_min_assets/hero_environment.avif`
- `.hero-assets/codex_min_assets/hero_poster.avif`
- `.hero-assets/codex_min_assets/sleeve_front.webp`
- `.hero-assets/codex_min_assets/sleeve_back.webp`

The two SOURCE_OF_TRUTH images are the visual authority. The smaller copies are intentionally optimized for Codex visual QA; do not redesign from them.

## Goal
Finish the new OrderSounds marketing hero as a standalone Astro project and match the approved reference frames with near-photographic parity. Do not redesign it.

## Visual authority
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

## Important implementation correction
Do **not** block on the previous GLB. The hero geometry is deliberately simple and should be created directly in React Three Fiber:
- sleeve body: thin box with subtle bevel
- front plane: separate textured plane
- back plane: separate textured plane
- vinyl: thin cylinder
- center label: thin cylinder
- center hole: small dark cylinder

Use the supplied front/back sleeve textures from the ZIP. Build the vinyl material procedurally with dark base, radial groove normal/roughness, and restrained iridescence. This is more controllable for parity than the earlier generated GLB.

## Required workflow
1. Unzip the repo asset bundle above.
2. Copy the environment/poster/textures into `public/hero/` or load from a build-safe location.
3. Replace the old GLB dependency with R3F primitive geometry.
4. Get `npm run build` green.
5. Create deterministic Playwright screenshots at 1536×864.
6. Compare directly to the two SOURCE_OF_TRUTH images; tune instead of redesigning.
7. Desktop parity first. Only then make tablet 4:5 and mobile 9:16 compositions.
8. Productionize loading/performance and document results.

## First visual/technical issues to fix
- The sleeve-back operational typography must be physically registered to the rotating sleeve. Prefer CanvasTexture attached to the back material.
- Poster/live scene must occupy the exact same registration.
- Environment exposure and crop must remain bright and warm.
- Do not make the vinyl or purple reflection more dramatic than the reference.

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
