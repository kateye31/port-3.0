# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Recruiters, hiring managers, hackathon/research contacts and peers who land on Katrina Adewale's personal site (katrinaadewale.dev), usually from a résumé, LinkedIn or a QR code, often on a phone. Their job: learn in under a minute who Katrina is, what she has built and where she has worked, then open the résumé or get in touch.

## Product Purpose
A personal portfolio staged as Katrina's own 3D bedroom. Each object in the room is a door into one part of her story; clicking it flies the camera there and opens that section. Success: a visitor remembers the room, and still reaches projects, experience and the résumé without friction.

## Positioning
The room is modeled from Katrina's own graph-paper sketch, and the interface is drawn by her hand (cursor states, torn watercolor sheets, arrows, lettering). A neighbor's portfolio could copy the 3D-room idea; it cannot copy her drawings or her story.

## Operating Context
Visitors arrive cold, on desktop or mobile. Many skim. The résumé link must stay one click away at all times.

## Capabilities and Constraints
- Static site in `dist/` (vanilla JS modules, Three.js 0.180 vendored, no build step). Served by `scripts/serve.mjs`.
- 3D room: `dist/assets/room.glb` (Blender master `source/katrina-room.blend`). Ginger cat with walk/stretch/meow, lamp toggle, daylight.
- Sections: About, Skills, Projects, Experience, Education, Off the clock (favorites), Contact.
- Must work on phones (touch, no hover) and with reduced motion.

## Brand Commitments
- Interaction reference (user-pinned): shahbaj-sheikh.vercel.app — custom white cursor dot that grows into an icon over interactive things, camera flies to a section on click, torn paper/watercolor sheets per section.
- User palette (pinned): #826AED, #C879FF, #F05F5F, #F32B6E, #FFB7FF, #3BF4FB, #CAFF8A, plus orange tones. Hover outlines in "baby" tints of these.
- Fonts must come from freefonts.io; photos from Unsplash. Hand-drawn assets live in `dist/assets/drawn/` (from the user's attachments.zip).
- Must not look AI-generated.

## Evidence on Hand
- Real bio, experience, projects, education, skills, organizations and links from katrinaadewale.dev (mirrored in `dist/content.js`).
- Résumé: `dist/assets/katrina-adewale-resume.pdf`. Photos: `dist/assets/photos/profile.jpg`, `monkey.jpg`.
- Project screenshots/videos do not exist yet; project covers are labeled Unsplash photos (`dist/assets/photos/CREDITS.txt`). Never invent metrics, roles or dates.

## Product Principles
1. The room is the navigation; every section is also reachable without the 3D scene.
2. Her hand, not a template: drawn assets over generic chrome.
3. Recruiter-first legibility inside the playfulness: real facts, readable body text, résumé always visible.
4. Motion explains where you are going; it never blocks reading.

## Accessibility & Inclusion
Keyboard reachable sections, visible focus, reduced-motion support, real text (not text in images) for all content, body contrast ≥ 4.5:1.
