# Homepage Section 2 — All the work around the music. Handled.

## Purpose
This is the production handoff for the homepage section immediately after the record-sleeve hero.

The hero says:
- Make the music.
- Desk handles the other side.

Section 2 shows what “the other side” physically contains, without turning the page into a SaaS feature grid.

Visible copy:
- eyebrow: `DESK`
- headline: `All the work around the music. Handled.`

Do not add explanatory body copy unless explicitly approved later.

## Visual idea
Continue the same warm, photographic, editorial world as the hero.

The record remains the scene anchor. Individual physical management objects emerge around it:
- release planning
- marketing/content
- business/rights
- opportunities
- what comes next

The scene becomes beautifully busy, then the pieces organize themselves into one final Desk-bound stack.

Meaning: scattered career work becomes handled.

## Source-of-truth assets
Use the files in `/public/section2/`.

- `record-sleeve-vinyl.webp`
- `releases-booklet.webp`
- `marketing-sheet.webp`
- `business-sheet.webp`
- `opportunities-pass.webp`
- `whats-next-note.webp`
- `handled-stack.webp`
- `section2-environment.webp`
- `ordersounds-logo-source.png`

Reference frames:
- `/docs/section2/reference-scattered.webp`
- `/docs/section2/reference-final.webp`

## Logo lock
`/public/section2/ordersounds-logo-source.png` is the exact user-supplied OrderSounds logo source.

Never redraw, approximate, stylize, regenerate or substitute it.

If any generated prop contains an imperfect embedded logo at production size, mask/cover that embedded mark and overlay the exact source logo from this file. If exact placement cannot be achieved cleanly, omit the small prop logo rather than invent another mark.

This rule applies to all future OrderSounds site artwork.

## Typography / image clarity
The small typography printed on the physical props is intentionally baked into the images. It is decorative art direction, not semantic website copy.

The main section headline and navigation stay HTML/CSS.

Do not rebuild the printed pieces as CSS cards. Do not aggressively recompress these assets. Their current WebP exports are deliberately high quality so the printed words and paper edges stay crisp.

## Implementation
Use Astro + DOM image layers + GSAP ScrollTrigger. Do not create another heavy WebGL scene for this section.

Suggested structure:

```html
<section class="section-two">
  <div class="section-two__sticky">
    <img class="section-two__environment" ... />
    <div class="section-two__copy">
      <span>DESK</span>
      <h2>All the work around the music. Handled.</h2>
    </div>
    <div class="section-two__stage">
      <img data-s2="record" />
      <img data-s2="releases" />
      <img data-s2="marketing" />
      <img data-s2="business" />
      <img data-s2="opportunities" />
      <img data-s2="next" />
      <img data-s2="handled" />
    </div>
  </div>
</section>
```

All physical props should be absolutely positioned transparent layers with transforms, opacity and shadow/depth changes.

## Motion
Recommended desktop section height: about 160–180vh with a 100svh sticky stage.

### 0–18%
Continue from hero. Keep the warm environment and record object. Hero copy clears. Section copy enters quietly.

### 18–55%
Reveal individual management objects in this order:
1. releases
2. marketing
3. business
4. opportunities
5. what’s next

Use small translations, restrained rotations and believable shadow changes. No bouncing, orbiting or “AI processing” motion.

### 55–72%
Hold the complete scattered still life long enough for the category words to register. This is the intentional “there is a lot around the music” moment.

### 72–90%
The pieces straighten and converge toward the final bundle position.

### 88–94%
Crossfade the converging loose pieces into `handled-stack.webp` over roughly 120–180ms. Pixel-match the bundle position before the swap so the transition is invisible.

### 94–100%
Rest. No loop. Let the stack sit.

## Desktop composition
At ~1536×864:
- copy block around 7–8% from left, upper/mid vertical region;
- visual stage occupies center-right and right edge;
- record remains the center-right anchor;
- releases: upper-left of record;
- marketing: high/right;
- business: far-right;
- opportunities: lower/front-left;
- what’s-next: lower/front-right.

Use the reference frames as art direction, not as production assets.

## Mobile
Do not shrink the desktop composition.

- headline first
- record central
- show only 3–4 physical pieces simultaneously
- allow natural cropping
- finish on handled stack
- preserve large readable category labels

Same narrative: scattered → organized.

## Reduced motion
Show a static late-stage frame: headline + record + handled stack.

## Performance
- use current WebPs directly;
- preserve intrinsic dimensions/aspect ratio to avoid CLS;
- preload only record + first emerging object if needed;
- defer the rest until shortly before Section 2;
- stop animation work after the sticky sequence finishes;
- keep the main copy semantic HTML.

## Do not
- turn the objects into generic rounded SaaS cards;
- add checkmarks, loading states, AI orbs or glowing network diagrams;
- add paragraphs of feature copy;
- rebuild the prop typography as live UI;
- generate a new logo;
- keep Section 2 animating forever.

## Acceptance
The section is ready when:
- it feels like the same photographic world as the hero;
- props look physical rather than like UI;
- releases/marketing/business/opportunities/next are understood visually;
- scattered state feels premium rather than cluttered;
- final stack looks physically credible;
- exact OrderSounds logo source is preserved;
- it does not resemble a generic AI/SaaS feature section.
