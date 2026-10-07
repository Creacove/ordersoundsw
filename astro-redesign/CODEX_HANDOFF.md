# Codex handoff — OrderSounds Astro hero

## Start here
Work only on branch `codex/astro-hero-parity`.

The actual project/assets/reference files are in the user's ChatGPT Library folder:
`/OrderSounds/MarketingRedesign/`

Use Files/Library tools to materialize these exact files by filename or file_id:

- `SOURCE_OF_TRUTH_FRONT.jpeg`
  - file_id: `file_0000000089c482438cb5c9fa52b32903`
  - library_file_id: `libfile_1091f38d77c48191a0288afbbf56abc9`
- `SOURCE_OF_TRUTH_BACK.jpeg`
  - file_id: `file_00000000d784824394ef4fc3844964b1`
  - library_file_id: `libfile_00fc8ed47b80819186796fd54cc2e2f3`
- `ordersounds-astro-hero-v01.zip`
  - file_id: `file_00000000e08082109415d3c4bb5945a5`
  - library_file_id: `libfile_9aea6fe36f8c8191ab953f438c51a3ae`
- `ordersounds-hero-assets-v2.zip`
  - file_id: `file_000000002e6081f49a1987fb51d0afe3`
  - library_file_id: `libfile_d0f8c743cee881918b8ba99d7082f654`
- `ordersounds-codex-handoff.zip`
  - file_id: `file_00000000ec5081f4a533dd41a61c225c`
  - library_file_id: `libfile_684195424b5c8191822e52ccefe0b135`
- Current implementation proofs:
  - `proof-front.jpg` file_id `file_00000000d57c8243ae830fa30e268575`
  - `proof-turn.jpg` file_id `file_000000002dc88210b46649f41ef8dad9`
  - `proof-back.jpg` file_id `file_00000000da4082108587a3ab7a7d87dc`
  - `proof-final.jpg` file_id `file_0000000018788210ade4d293eec651d5`

**The two SOURCE_OF_TRUTH images are the visual authority.**  
The proof images are only WIP browser outputs and must never override the source-of-truth frames.

Materialize `ordersounds-astro-hero-v01.zip` into `astro-redesign/` and use `ordersounds-hero-assets-v2.zip` when a higher-quality/raw asset is needed.

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

## Required workflow
1. Materialize the exact Library files above.
2. Unzip the Astro project into `astro-redesign/`.
3. Install dependencies and get `npm run build` green.
4. Create deterministic Playwright screenshots at 1536×864.
5. Compare screenshots directly to `SOURCE_OF_TRUTH_FRONT.jpeg` and `SOURCE_OF_TRUTH_BACK.jpeg`; tune instead of redesigning.
6. Desktop parity first. Only then make tablet 4:5 and mobile 9:16 compositions.
7. Productionize loading/performance and document results.

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
