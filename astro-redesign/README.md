# OrderSounds Astro marketing redesign

Standalone Astro + React Three Fiber hero for the new OrderSounds marketing site.

## Start
Read `../WORK_START_HERE.md` and `CODEX_HANDOFF.md`.

The branch is self-contained. Required binary/reference assets are in:
`hero-assets-repo-ready.zip`

The two source-of-truth reference images inside that archive are authoritative.

Target stack:
- Astro
- React island
- React Three Fiber / Three.js
- GSAP
- Playwright visual QA

The existing OrderSounds site outside `astro-redesign/` must remain untouched while this standalone build is being proven.

## Current implementation

Run `npm install --legacy-peer-deps`, then `npm run dev` or `npm run build`. The local PostCSS config isolates Astro from the parent site's Tailwind config.

The user clarified the visual implementation after the original handoff. The full-page poster was removed. The empty studio environment asset supplies the background lighting and floor, while Astro provides real HTML copy, navigation and links. Three.js provides the separate paper sleeve, vinyl, center label, material relief and shadows. The front mark and operational copy on the back are HTML attached to the turning sleeve via Drei Html. The mark uses the actual OrderSounds asset from the existing site's `Logo` component.

The sleeve and vinyl share a rotating assembly. As the assembly turns once through 180 degrees, the disc moves behind the sleeve and finishes exposed on its left. Its back has a separate diffraction shader, with the spectral highlight moving during the turn. “Desk handles the other side.” starts as the front subtitle and becomes the back headline in the same DOM element. “Make the music.” leaves through line masks; “The work that keeps your career moving.” follows the turn. Front copy has a restrained page-entry animation. The back sleeve has five live HTML rows: releases, marketing, business, opportunities, and next move. After a two-second hold, only the last row changes once to a concrete next move. Rendering idles at the final frame. The reduced-motion mode starts on the front and permits a manual state change.

For deterministic local visual QA, use development-only `?heroTime=0`, `?heroTime=3.15`, and `?heroTime=8`, or call `window.__deskHero.seek(seconds)`. Set `PUBLIC_DESK_URL` for the deployed Desk entry route; the default is `/login`.

Current visual limitations: the procedural vinyl reflection and simple 3D sleeve edge still differ from the approved photographic reference. Do not claim a measured 99% or 100% match. The WebGL client bundle is about 275 kB gzip and the two sleeve textures total about 200 kB.
