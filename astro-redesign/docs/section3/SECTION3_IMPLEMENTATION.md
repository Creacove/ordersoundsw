# OrderSounds Homepage — Section 3 production contract

## Status
This is the locked production handoff for Section 3.

Do not generate a new storyboard. Do not invent more objects. Do not replace the supplied assets with approximations.

The job is to implement the section in the existing Astro redesign using the individual production assets in `/public/section3/`.

## Narrative
Sections 1–3 are one physical story:

1. Section 1: the record turns and reveals the other side of the music.
2. Section 2: the work around the music emerges and is gathered into one Desk-bound stack.
3. Section 3: that exact handled work is opened just enough to expose the few signals that matter; Desk focuses them into one judgment and one exact human move.

The Section 3 message is:

**The whole picture. One clear move.**

The operating-manager behavior being demonstrated is:

`handled work → relevant context → focus → judgment → exact human work`

This is not an app screenshot and not a feature grid.

## Locked visible copy

Eyebrow:
`YOUR MANAGER`

Headline:
`The whole picture. One clear move.`

Support:
`Desk looks across your career and decides what deserves your attention now.`

Signal 1:
- value: `Personal stories are leading`
- label: `CONTENT RESPONSE`

Signal 2:
- value: `4 weeks`
- label: `NEXT RELEASE`

Signal 3:
- value: `₦250k`
- label: `WORKING BUDGET`

Decision:
- label: `WHAT MATTERS NOW`
- value: `Lead with the story.`
- support: `Before spending on reach.`

Exact work:
- label: `YOUR MOVE`
- value: `Record the story behind the hook.`
- support: `20–30 sec · vertical · one take`

Do not add more marketing copy inside this section.

## Production assets

Reuse from Section 2:
- `/section2/handled-stack.webp` — exact final Section 2 object; this is the first visible object in Section 3.
- `/section2/ordersounds-logo-source.png` — only approved logo source.

Section 3:
- `/section3/stack-unbound.webp` — the same editorial paper world without the band; alpha background.
- `/section3/band-blank.webp` — separate matte-black physical band, no logo.
- `/section3/signal-content.webp` — blank physical content-response slip.
- `/section3/signal-timing.webp` — blank physical timing/release slip.
- `/section3/signal-budget.webp` — blank physical budget slip.
- `/section3/optical-lens.webp` — translucent iridescent focus material.
- `/section3/action-slip.webp` — blank physical action slip.

All important words and values must be HTML/CSS, never baked into the raster assets.

## Logo rule
Do not use any generated or approximated logo.

At the Section 2 → Section 3 handoff, the visible logo comes from the existing approved `handled-stack.webp`. If the band must become independently animatable, crossfade into:
- `stack-unbound.webp`
- `band-blank.webp`
- the exact `/section2/ordersounds-logo-source.png` positioned on the band.

The exact logo moves off with the band. No logo appears on the signal slips, optical lens, decision strip, or action slip.

## Creative system
Preserve the existing OrderSounds site art direction:

- warm near-white / ivory environment
- soft daylight
- organic shadows
- tactile editorial paper
- near-black typography
- restrained violet
- purple/orange/faint-blue optical refraction
- music-world physical objects
- generous negative space

Semantic materials:
- ivory paper = work/context
- black = Desk responsibility/judgment
- optical translucent material = focus/interpretation
- logo = brand authority, used sparingly

Never introduce:
- dark section reset
- dashboard or full app screenshot
- browser/laptop mockup
- glassmorphism UI
- AI orb
- nodes/networks
- floating SaaS cards
- excessive branding
- new visual material families

## Transition from Section 2
The Section 2 final state must visibly become Section 3.

Do not hard-cut.

Recommended production approach:

1. Section 3 begins while the final Section 2 handled stack is still visible in exactly its current transform.
2. Section 2 copy leaves.
3. Section 3 copy enters quietly on the same left rail.
4. At a pixel-matched registration point, crossfade the one-piece handled stack into a layered reconstruction:
   - `stack-unbound.webp`
   - `band-blank.webp`
   - exact logo source over the band
5. The layered reconstruction must match position, scale, rotation, perspective and lighting before the crossfade. The user should not perceive the swap.
6. Once layered, the band and exact logo can move together while the stack stays behind.

If perfect registration cannot be achieved, keep the Section 2 handled stack longer and hide the swap during the first signal reveal. Do not accept a visual pop.

## Desktop layout
Primary QA viewport: 1536×864.

Keep the existing site nav untouched.

Left:
- same rail as Sections 1–2
- approx 7–8vw from left
- headline width approx 30–34vw
- headline should be editorial and substantial, but not larger than Section 2

Right:
- physical stage approx 58–64vw
- inherit Section 2 stack placement/camera angle instead of resetting it

No CTA in Section 3.

## Scroll choreography
Use DOM/CSS + GSAP ScrollTrigger.
Do not create a new WebGL scene.

Suggested section height: 140–155vh.
Sticky stage: 100svh.
Scrub: approximately 0.55–0.8.

### 0.00–0.15 — inherit
- final Section 2 object remains still
- Section 2 copy clears
- Section 3 eyebrow/headline/support enter with opacity + roughly 10px vertical movement
- no immediate object trick

### 0.15–0.28 — unlock
- crossfade into layered unbound-stack + blank-band + exact-logo reconstruction
- black band and exact logo move downward / away together
- restrained distance; roughly 45–80px is enough
- top papers loosen only slightly

### 0.25–0.46 — relevant signals
The three supplied signal slips reveal from within the stack, not from off-screen.

Suggested order:
1. timing
2. content response
3. budget

Use small physical translations and tiny rotations, max roughly ±6°.

Place live HTML over the blank slips:
- `4 weeks / NEXT RELEASE`
- `Personal stories are leading / CONTENT RESPONSE`
- `₦250k / WORKING BUDGET`

They should look like three pieces Desk pulled from the work already on the table.

### 0.46–0.67 — focus
The optical lens enters and crosses the signal area.

It is physical translucent material, not a scanner.

As the lens overlaps:
- relevant HTML increases from roughly 45–55% contrast to 100%
- irrelevant background paper falls slightly in contrast
- no glow pulse
- no progress bar
- no “analyzing” label

By ~0.62 all three values are readable together.

Hold briefly.

### 0.67–0.82 — judgment
Render the decision strip as HTML/CSS, not another image:
- matte near-black surface
- small live label `WHAT MATTERS NOW`

Then reveal:
`Lead with the story.`
`Before spending on reach.`

The decision should feel like it physically emerges from the same stack.

Do not expose chain-of-thought or “AI reasoning.”

### 0.82–0.94 — exact work
Use `action-slip.webp` as the physical substrate.

Move it forward 25–50px so it becomes the closest object.

Live HTML:
`YOUR MOVE`
`Record the story behind the hook.`
`20–30 sec · vertical · one take`

This is the visual payoff.

### 0.94–1.00 — rest
Stop.

No loop.
No alternate recommendation.
No carousel.
No pulse.

Let the user read before normal scrolling continues.

## Z order
Back → front:

1. existing warm environment
2. unbound stack
3. timing signal
4. content signal
5. budget signal
6. optical lens
7. decision strip
8. action slip
9. HTML text overlays

The physical overlap must look intentional.

## Typography
Use the typography already established by the existing marketing site.
Do not introduce another family.

All important copy remains semantic HTML.

The physical assets are skins/materials only.

## Responsive behavior

### Tablet
Do not simply scale desktop.
- copy higher
- physical stage lower
- tighter overlap
- lens remains visibly translucent
- decision/action may occupy more width

### Mobile
Same narrative, vertical composition:
- copy first
- stack below
- signals emerge upward
- only the focal signals need to be fully visible at once
- lens moves through the vertical grouping
- decision/action become near-full-width
- no horizontal scroll
- preserve large readable live text

## Reduced motion
For `prefers-reduced-motion: reduce`:
- no long sticky scrub
- show resolved composition: stack + faint signals + decision + action
- all semantic copy remains visible
- no essential meaning depends on motion

## Performance
- use the supplied lossless-alpha WebPs directly; do not re-encode them to lower quality
- provide width/height or aspect-ratio
- preload/decode only near entry
- ensure optical lens and action slip are decoded before their phases
- transform/opacity only during scroll
- avoid layout-property animation
- stop unnecessary ScrollTrigger work when well outside the section
- keep image display sizes below intrinsic 1448×1086 dimensions where possible

## Development / QA
Implement deterministic dev states without visible production UI:

- `?s3=handoff`
- `?s3=signals`
- `?s3=focus`
- `?s3=decision`
- `?s3=final`

Use Playwright at 1536×864 to capture each state.

QA against the actual existing Sections 1–2, not against an invented standalone mockup.

Check:
- no background reset
- Section 2 object continuity
- no scale/location pop during layered swap
- exact logo only
- signals look tucked into the stack
- optical material reads as physical refraction
- live HTML remains crisp
- no fake dashboard
- decision is obvious
- action is strongest final object
- final frame is calm

## Acceptance
Do not call Section 3 complete until:

- Sections 1–2 are unchanged except the necessary handoff hook
- the final Section 2 object visibly becomes Section 3
- production assets from `/public/section3/` are used
- no storyboard image is used as a website asset
- no fake or regenerated logo is visible
- no full app screenshot exists
- all important text is HTML
- desktop, tablet and mobile are intentionally composed
- reduced motion works
- build passes
- Playwright deterministic screenshots exist
- Section 4 has not been started
