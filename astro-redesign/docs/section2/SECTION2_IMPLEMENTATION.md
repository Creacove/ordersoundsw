# Section 2 — FINAL ASSET DIRECTION

## Locked concept
**All the work around the music. Handled.**

This file overrides any earlier Section 2 asset/branding direction.

## Brand restraint
The loose physical objects are intentionally **unbranded**.

Do not add an OrderSounds logo to:
- releases booklet
- marketing sheet
- business sheet
- opportunities pass
- what's-next note
- any other loose/scattered paper or tag

The only physical Section 2 asset that should visibly carry the OrderSounds logo is:

`/section2/handled-stack.webp`

That is deliberate. The logo appears at the resolution of the story: after the separate work is brought together and handled by Desk.

Do not sprinkle logos across props. That looks amateur and weakens the editorial art direction.

The exact logo source remains:
`/section2/ordersounds-logo-source.png`

If the final handled-stack logo ever needs correction, use that exact source. Never redraw or approximate the mark.

## Production assets
Use:
- `/section2/record-sleeve-vinyl.webp`
- `/section2/releases-booklet.webp`
- `/section2/releases-booklet-alt.webp` (optional alternate; do not show both at once)
- `/section2/marketing-sheet.webp`
- `/section2/business-sheet.webp`
- `/section2/opportunities-pass.webp`
- `/section2/whats-next-note.webp`
- `/section2/handled-stack.webp`
- `/section2/section2-environment.webp`

## Which release asset to use
Default to `releases-booklet.webp`.

`releases-booklet-alt.webp` is provided only as a visual alternate if its perspective fits the final composition better. Pick one. Never show both simultaneously.

## Visual story
1. Continue naturally from the hero's record/sleeve world.
2. The individual, unbranded pieces emerge around the record.
3. Hold the full scattered still life long enough to read the categories.
4. The pieces straighten and gather.
5. Crossfade to the polished final bound stack.
6. The logo appears only here, on the final stack.
7. Rest. No loop.

## Copy
Eyebrow:
`DESK`

Headline:
`All the work around the music. Handled.`

No visible explanatory paragraph.

## Motion
Keep the previously agreed sequence:
- hero handoff
- releases
- marketing
- business
- opportunities
- what's next
- scattered hold
- gather
- final stack crossfade
- rest

Use Astro + DOM image layers + GSAP ScrollTrigger.
Do not build another WebGL scene.

## Quality
The prop typography is baked into the raster art. Preserve it at high quality.

Do not:
- aggressively recompress the WebPs
- upscale beyond useful intrinsic size
- blur/filter text-bearing assets
- recreate these pieces as CSS cards

## Final visual principle
Before Desk handles the work: the pieces should feel like a sophisticated, unbranded editorial still life.

After Desk handles the work: the final stack becomes the branded resolution.

This contrast is intentional and must survive implementation.
