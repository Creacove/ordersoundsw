# Codex task — implement Homepage Section 3

Branch: `codex/astro-hero-parity`

## Start here
1. Pull latest branch.
2. Read `astro-redesign/docs/section3/SECTION3_IMPLEMENTATION.md` completely.
3. Read `astro-redesign/docs/section3/asset-manifest.json`.
4. Inspect each file in `astro-redesign/public/section3/` individually.
5. Inspect the existing Section 2 implementation and its final state in the browser.
6. Do not redesign Sections 1–2.

## Build
Implement Section 3 only.

The locked story is:

`Section 2 handled stack → band unlocks → 3 relevant signals emerge from the same work → optical material focuses them → Desk makes one judgment → one exact human action comes forward`.

Visible headline:
`The whole picture. One clear move.`

Do not build a dashboard, app screenshot, browser mockup, new paper family, or new visual universe.

Do not use a storyboard/composite image in the page.

All important text must be live HTML/CSS.

Use the exact user logo only from:
`/section2/ordersounds-logo-source.png`

Never regenerate or approximate the logo.

## Implementation requirements
- Astro/HTML/CSS + GSAP ScrollTrigger.
- No new WebGL scene for Section 3.
- Reuse the exact Section 2 final stack for the initial handoff.
- Crossfade into `stack-unbound.webp + band-blank.webp + exact logo` only after pixel matching.
- Use the individual assets in `/public/section3/`.
- Decision strip can be CSS/HTML black material; do not add another raster just for a black rectangle.
- Add deterministic dev states: `handoff`, `signals`, `focus`, `decision`, `final`.
- Capture 1536×864 Playwright screenshots for those states.
- Tune composition by comparing with the actual current Sections 1–2 in the same browser session.
- Implement tablet/mobile intentionally.
- Implement prefers-reduced-motion.
- Keep image quality crisp and preserve alpha.
- Run `npm run build`.
- Do not start Section 4.

Do not stop after wiring the files together. Render, inspect, tune, rerender until Section 3 looks like the same creative team built Sections 1–3.
