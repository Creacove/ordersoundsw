# Live Astro and Three.js hero

The user clarified the implementation on 2026-10-08. This supersedes the earlier poster and CanvasTexture instructions in the handoff.

The references guide composition only. No screenshot, poster, video, or photographed environment is rendered as a website layer. Navigation, headlines, support copy, CTAs, sleeve branding and operational rows are real HTML. The two supplied sleeve images are decorative paper/optical print textures and contain no lettering.

Three.js owns sleeve geometry, thickness, the turning vinyl, label, paper relief, lighting and diffraction. The sleeve and vinyl share a pivot. The disc moves behind the sleeve during the turn and finishes exposed on the left. Drei Html applies the sleeve's world transform to the back text; each row can animate independently and remains selectable. CSS builds the studio wall, floor, window wash, soft shadows and responsive page layout.

Implementation sequence: rebuild materials and semantic layers; calibrate front/back desktop frames; verify the 180-degree timeline and row transitions; compose tablet/mobile; verify reduced motion, links, build and resource loading. Use deterministic development-only timeline seeking for screenshots. Render only when the scene changes.
