Deployed on Vercel.

## Universe edition: what's where

| Feature | File |
| --- | --- |
| All text content (experience, stats, highlights, projects, services, links, orbit keywords) | `src/app/data/career.ts` |
| Company logos on the career cards (optional) | add the image to `public/logos/` and set `logo: "/logos/<file>"` on the chapter in `career.ts` |
| Starry sky + shooting stars | `src/app/components/CosmosBackground.tsx` |
| 3D moon with orbiting keywords | `src/app/components/OrbitSystem.tsx` |
| Career mode: globe, landmarks, the cyclist travelling between cities | `src/app/components/CareerGlobe.tsx` |
| The cyclist + landmark drawings (shared by the globe and the game) | `src/app/components/draw.ts` |
| Game mode: "Ikrame's Ride" | `src/app/components/GameMode.tsx` |
| Smooth scrolling, reveal-on-scroll, progress bar | `src/app/components/SmoothScroll.tsx` |
| Art gallery (titles, mediums) | `ART` in `src/app/data/career.ts`, images in `public/art/` |
| Photos (portrait, Paris by night, Microsoft selfie) | `public/me/` |
| Book (title, blurb, cover, link) | `BOOK` in `src/app/data/career.ts`, cover in `public/book/` |
| Flower drawings + dreamy scene (used by the bike avatar) | `src/app/components/illustration.ts` |
| Avatar face & hair (shared) | `src/app/components/avatar.ts` |
| Colours, fonts, layout | `src/app/globals.css` |

No new npm dependencies. Map dots in `src/app/data/landDots.ts` come from the public-domain
[johan/world.geo.json](https://github.com/johan/world.geo.json). Everything respects `prefers-reduced-motion`.
