# Journey choreography

Implements the supplied October 9 motion brief using the existing GSAP timelines.

- One studio image spans the journey. Section 2 pushes it to 1.045 scale; Section 3 compounds that to 1.085. Separate nested transforms prevent reverse-scroll conflicts.
- Hero text exits through fixed masks; support lifts and CTA drops.
- Section 2 lines arrive alongside the papers. Gathering removes the first two lines; “music. Handled.” holds before clearing.
- Section 3 enters eyebrow, masked lines, then support. The lens lowers the first line to 50%; the decision lowers support to 36%. The final action settles with no continuing animation.
- Daylight, shadow, refraction and vignette respond to story beats. Removed independent eight-second lighting keyframes. Only transform/opacity animate during scroll.
- Reduced motion keeps readable static copy and the studio background. Optional pointer parallax omitted to preserve final stillness.

Verified production build at 1536×864 and 390×844, reduced-motion composition, and full forward/reverse scroll. Reverse restores both camera transforms to identity; no horizontal overflow or autonomous atmosphere animations. Build passes; existing Three.js bundle-size warning remains.
