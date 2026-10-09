# OrderSounds Homepage Section 3 — The whole picture. One clear move.

## Purpose
Section 3 is the first place the homepage proves how Desk turns context into management judgment. It must not become an app screenshot, dashboard demo, feature grid, or new metaphor.

Sections 1–3 form one continuous physical story:

1. **Section 1 — The Other Side**: the record turns and reveals the work around the music.
2. **Section 2 — The Work**: releases, marketing, business, opportunities and next-move material emerge and are gathered into one bound Desk stack.
3. **Section 3 — The Edit**: that same bound stack remains on screen; a few relevant signals become visible, an optical layer brings those signals into focus, Desk makes one decision, and one exact human move comes forward.

The creative law is: **nothing new enters the story unless something already on screen can become it.**

---

## Locked visible copy

Eyebrow:
`YOUR MANAGER`

H2:
`The whole picture. One clear move.`

Support:
`Desk looks across your career and decides what deserves your attention now.`

Do not add more visible marketing copy to this section.

### Signal copy — real HTML, never baked into raster assets

Signal A — Marketing:
- value: `Personal stories are leading`
- label: `CONTENT RESPONSE`

Signal B — Releases:
- value: `4 weeks`
- label: `NEXT RELEASE`

Signal C — Business:
- value: `₦250k`
- label: `WORKING BUDGET`

### Decision
- label: `WHAT MATTERS NOW`
- value: `Lead with the story.`
- support: `Before spending on reach.`

### Exact human work
- label: `YOUR MOVE`
- value: `Record the story behind the hook.`
- support: `20–30 sec · vertical · one take`

Do not invent extra metrics, charts, avatars, recommendation explanations, or fictional app UI.

---

## Visual language
Continue the exact visual world already established by Sections 1–2:

- warm off-white / ivory photographic environment
- soft daylight and organic shadows
- tactile paper
- near-black typography
- one restrained violet accent
- iridescent purple / warm orange / faint blue optical refraction
- no dark scene reset
- no laptop/browser/device mockup
- no generic AI visual language
- no floating cards in space
- no new logos on individual pieces

Materials have semantic meaning:

- ivory paper = work / context
- black = Desk responsibility / final judgment
- iridescent transparent material = Desk focus / interpretation
- vinyl/music objects = artist and music

---

## Production assets
All Section 3 production assets live in `/public/section3/`.

### Reuse from Section 2
`/section2/handled-stack.webp`

This is the official Section 2 final state and the opening visual anchor of Section 3. Do not generate another stack.

### New Section 3 assets

`/section3/signal-content.webp`
- blank ivory paper signal slip
- transparent background
- HTML text overlays it at runtime

`/section3/signal-timing.webp`
- tall ivory signal slip
- transparent background

`/section3/signal-budget.webp`
- wider ivory signal slip
- transparent background

`/section3/optical-lens.png`
- translucent iridescent sheet
- alpha transparency
- no text
- no logo

`/section3/decision-strip.webp`
- blank matte-black strip
- transparent background
- HTML renders `WHAT MATTERS NOW`

`/section3/action-slip.webp`
- blank horizontal ivory action slip
- transparent background
- all important text is HTML

### Brand lock
The exact logo source remains:
`/section2/ordersounds-logo-source.png`

No new Section 3 asset should contain a logo. The only logo visible in the sequence is the one already present on the Section 2 bound stack.

Never regenerate, approximate or redraw the OrderSounds mark.

---

## Storyboard authority
Use these frames in `/docs/section3/`:

- `01-section2-handoff.jpg`
- `02-signals-revealed.jpg`
- `03-context-focused.jpg`
- `04-decision-action.jpg`
- `SECTION3_STORYBOARD.jpg`

These are composition / continuity references. The final browser implementation should be cleaner and more physically integrated than the storyboard composite, while preserving the exact story and object continuity.

Important: the storyboard is not permission to introduce a rectangular tinted backing panel behind the scene. Keep the real Section 1–2 environment continuous.

---

## Desktop layout — 1536×864 QA viewport

### Left copy
Use the same page rail as Sections 1–2.

Approximate:
- left: 7–8vw
- width: 31–35vw
- vertically centered around 38–46% of viewport depending on transition

The H2 should feel slightly smaller than Section 2, but still editorial and substantial.

Do not introduce a CTA inside Section 3.

### Physical stage
- center-right / right ~58–64% of viewport
- reuse final Section 2 stack position as the initial transform source
- do not reset stack to a new camera angle
- only the focal objects move

The stack should stay large enough that individual papers feel tactile but should not dominate the headline.

---

## Layer model / z-order
From back to front:

1. existing environment
2. Section 2 handled stack
3. timing signal slip
4. content signal slip
5. budget signal slip
6. optical lens
7. decision strip
8. action slip
9. HTML typography overlays

The signal slips should look physically tucked inside the same stack, not dropped onto it from off-screen.

---

## Motion choreography
Use GSAP ScrollTrigger. No new WebGL scene.

Recommended section height: `135–150vh`.
Sticky stage: `100svh`.
Scrub smoothing around `0.55–0.8`.

No looping. No bounce. No spring. No continuous floating.

### 0.00–0.15 — Inherit Section 2
- Section 2 final stack remains visually continuous.
- Section 2 headline clears.
- Section 3 eyebrow/headline/support enter quietly.
- Copy motion: ~10–14px upward + opacity only.
- Do not move the physical stack immediately. Let the visitor recognize continuity.

### 0.15–0.38 — Signals reveal
Three signal slips emerge from within / behind the top layers of the existing bound stack.

They do **not** fly in from elsewhere.

Suggested order:
1. timing / release slip
2. content-response slip
3. budget slip

Movement ranges should be small: roughly 35–85px depending on scale.
Rotations remain within ±6°.

The band remains an anchor. Do not attempt a theatrical belt-removal animation if the existing final stack asset makes it visually fragile. The story is that Desk opens the handled work enough to expose what matters.

At the end of this phase the HTML signal values fade in on the slips.

### 0.38–0.62 — Focus
The optical lens moves slowly across the signal slips.

This is not a scanner, beam or AI animation.
It behaves like translucent physical vellum / optical acrylic.

As the lens overlaps a signal:
- that signal text goes from ~45–55% contrast to 100%
- non-focal supporting paper detail can reduce slightly
- no glow pulse
- no progress indicator

By ~0.58, all three relevant signals are clearly readable together:
- Personal stories are leading
- 4 weeks
- ₦250k

Hold briefly.

### 0.62–0.80 — Judgment
- optical lens settles
- surrounding nonessential material reduces slightly in contrast / depth
- blank black decision strip rises or slides only 20–40px into its final location
- HTML `WHAT MATTERS NOW` appears on strip
- ivory decision content comes into focus: `Lead with the story.` / `Before spending on reach.`

The black object signifies that Desk has made a call.

Do not show reasoning chains, loading states or “AI analysis.”

### 0.80–0.93 — Exact work
The action slip moves forward 24–48px and becomes the closest physical object.

Reveal:
- `YOUR MOVE`
- `Record the story behind the hook.`
- `20–30 sec · vertical · one take`

The decision remains visible behind it, but the action slip wins hierarchy.

### 0.93–1.00 — Rest
Stop.
No new state.
No carousel.
No loop.

Give the user time to understand the move before normal page scrolling resumes.

---

## Implementation principles

### 1. All important text is HTML
Do not bake the signals, decision or action copy into PNG/WebP.

Use absolute-positioned semantic HTML inside each physical-object wrapper so typography remains crisp at every DPR.

### 2. The assets are physical skins, not UI cards
Never add generic SaaS borders, shadows, badges or card chrome around them.

### 3. Preserve the Section 1–2 environment
Do not add a new colored panel behind Section 3.
Do not darken the background.
Do not introduce a new material family.

### 4. Do not show “the app”
No dashboard screenshot.
No navigation sidebar.
No fake product window.
No browser chrome.

Section 3 proves a single operating-manager behavior, not the application shell.

### 5. Use the existing app’s typography DNA
The app’s product system uses Manrope, warm canvas, near-black text, restrained violet, soft borders and controlled motion. Keep the marketing section compatible with that DNA while remaining cinematic.

---

## Suggested DOM shape

```html
<section class="section-three" data-section-three>
  <div class="section-three__sticky">
    <div class="section-three__copy">
      <span class="eyebrow">YOUR MANAGER</span>
      <h2>The whole picture. One clear move.</h2>
      <p>Desk looks across your career and decides what deserves your attention now.</p>
    </div>

    <div class="section-three__stage">
      <img data-s3="stack" ... />

      <div data-s3="signal-timing" class="signal-slip">...</div>
      <div data-s3="signal-content" class="signal-slip">...</div>
      <div data-s3="signal-budget" class="signal-slip">...</div>

      <img data-s3="lens" ... />

      <div data-s3="decision">...</div>
      <div data-s3="action">...</div>
    </div>
  </div>
</section>
```

Each signal wrapper uses the raster paper asset as an `<img>` underneath and live HTML over it.

---

## Responsive behavior

### Tablet
Do not scale the desktop scene uniformly.

- copy moves higher
- stack moves lower/right
- signal slips overlap more
- lens stays large enough to read as a material
- decision/action can occupy more of scene width

### Mobile
Use the same story in a vertical composition.

- copy first
- stack centered below
- slips reveal upward from stack
- optical lens passes vertically/downward
- decision strip and action slip become near-full-width physical pieces
- do not show all three signals as tiny desktop cards
- maintain readable values

Recommended mobile section height: `150–165vh`, but tune by feel.

No horizontal scrolling.

---

## Reduced motion
For `prefers-reduced-motion: reduce`:

- no sticky scrub sequence
- show one resolved composition
- stack + faint visible signals + decision + action slip
- headline/support fully visible
- no important meaning depends on animation

---

## Performance
- Section 3 uses DOM/CSS/GSAP only.
- Reuse already-loaded Section 2 stack asset.
- Preload / decode signal assets shortly before Section 3 enters viewport.
- Decode optical lens / action slip before their frames.
- Provide intrinsic dimensions / aspect-ratio to prevent CLS.
- Use transforms and opacity rather than layout properties during scroll.
- Cap raster display size below intrinsic pixel dimensions.
- Do not re-encode the supplied production WebPs at lower quality.
- Stop ScrollTrigger work when section is far outside viewport if appropriate.

---

## Development QA controls
Add a dev-only deterministic state mechanism, e.g.:

- `?s3=handoff`
- `?s3=signals`
- `?s3=focus`
- `?s3=decision`

This should freeze the section at the corresponding state without visible production debug UI.

Use it for Playwright screenshot QA.

---

## Visual QA
Primary desktop viewport: `1536×864`.

Capture the four deterministic states and compare against the storyboard frames.

Inspect:
- continuity with Section 2 final object
- same background exposure and crop
- stack scale and position
- believable signal-slip overlap
- lens physicality and transparency
- text staying crisp
- no fake logo
- decision/action hierarchy
- no tinted panel or “new scene” feeling
- final frame calmness

Do not call the section complete after first wiring pass. Screenshot, compare, tune, repeat.

---

## Acceptance criteria
Section 3 is done only when:

- it unmistakably feels like the next chapter of Sections 1–2
- the exact Section 2 stack is reused
- no full app/dashboard screenshot appears
- no new visual universe is introduced
- signal slips appear to originate inside the handled stack
- optical lens reads as physical refracted material, not AI glow
- all important text is live HTML
- the decision is understandable without explanatory paragraphs
- exact work becomes the strongest final object
- no new logo appears on Section 3 assets
- desktop / tablet / mobile are intentionally composed
- reduced motion works
- build passes
- four deterministic screenshot states exist
- Section 4 has not been implemented in this task