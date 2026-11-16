VIEW
- Isometric cutaway: two walls meeting at the back corner, floor, no ceiling.
- Default camera: classic iso angle (~35° yaw toward the corner, ~30° pitch).
- Orbit constrained: yaw ±30° around default, pitch 15°–45°, dolly limited. Never see behind the walls.
- Background outside the room: pure black.
- Nav bar top-left: "katrinaadewale.dev" in a handwritten font. Right side: "Resume" link + a 3-line ☰ menu for misc (contact, socials, fun).

ROOM COORDS (meters, origin = floor corner where the two walls meet; X runs along LEFT wall, Z runs along RIGHT wall)
Room: 4.0 (X) × 4.0 (Z), walls 2.8 high, slightly warm off-white walls, wood floor.

LEFT WALL  — section: EDUCATION — color: mint #A8E6CF
- Two framed items on wall, side by side, at x 0.6–1.6, height 1.9 (UCF degree + minor cert).
- Small round wall hook/clock at x 2.0, height 1.7.
- Desk against wall, x 0.2–2.4, depth 0.7, height 0.75.
- On desk: open laptop (center), mug (left), headphones on a stand (right end), a few pens.
- Articulated desk lamp clamped at the far right end of the desk near the corner — THIS is the on/off lamp.
- Desk chair in front, pulled out slightly, hoodie draped over the back.
→ Clicking frames / laptop opens Education. (Laptop could instead open Projects — your call.)

CORNER
- Tall bookshelf flush in the corner, 0.9 wide, 2.2 high, 5 shelves. Top shelf: books with spines. Lower shelves: mix of books, a plant, a small figure. Not clickable by default (or → Misc).

RIGHT WALL — section: ABOUT ME — color: coral #FF7F6E
- Floating shelf at z 0.4–1.2, height 2.0, with a globe on it.
- Modern flat TV on a low media stand at z 0.3–1.6, height 0.5 (stand) — NOT retro, no antenna, thin bezel, dark screen with a subtle reflection. Clicking → Projects (lavender #C9B6FF) or keep it decorative.
- Easel at z 2.4–3.0, angled ~20° toward the room, with a canvas showing a small painting (heart/figure like the sketch). Brushes in a cup at its foot. A pair of slippers on the floor beside it.
- Sketchbook leaning against the easel leg (or on the media stand) — the About Me click target.
- Round woven basket/bin in the far corner at z 3.5.

FLOOR
- Round rug centered at (2.0, 2.0), radius 0.9.
- Bed (NOT a sofa) along the front-right edge: x 1.6–3.6, z 3.0–4.0, low platform, one pillow at the right end, rumpled duvet. Section: EXPERIENCE — butter #FFE29A (click the laptop/phone resting on the bed).
- Ginger cat on the floor at (1.2, 3.2) near the chair. Animated (see CAT).

WINDOW (not in sketch — recommended placement)
- Right wall, high and wide, z 1.0–2.2, sill height 1.6, top 2.5 — between the globe shelf and the easel, above the TV.
- Why: sunlight then streams diagonally across the rug and bed toward the desk, which reads "cozy room" from the default camera, and lights the easel (artist by the window).
- Alternative if the right wall feels crowded: left wall above the desk, replacing the clock.

LIGHTING (real, not painted)
- Sun: DirectionalLight through the window, warm #FFF1D6, intensity 2.5, castShadow, shadow map 2048, bias tuned so the window frame casts soft bars on the floor.
- Fill: HemisphereLight sky #CFE4FF / ground #6B5540, intensity 0.5.
- Desk lamp: PointLight #FFD9A0, intensity 6, distance 4, castShadow — toggled by clicking the lamp. Lamp off = bulb emissive off, shade emissive off.
- Optional: a day/night toggle in the ☰ menu that lowers the sun and makes the lamp the main light.
- Bake AO in Blender; keep real-time shadows for the sun + lamp only.

HIGHLIGHT
- Hover → emissive tint + outline in that section's color (mint / coral / lavender / butter), 150ms ease. One color per section, never a shared glow.
- Click → camera eases slightly toward the object, a paper-card panel slides in from the right with that section's content. Esc / click-off closes.

CAT (ginger)
- Idle: tail sway, breathing, random ear flick.
- Every 15–30s walks on a spline between: beside chair (1.2,3.2) → rug center (2.0,2.0) → foot of bed (2.0,3.1) → back. Sits at each stop.
- Click → stretch + short meow, then resumes.

NOT-AI LOOK
- Hand-drawn line pass (OutlinePass, 1–2px, dark warm brown not black).
- Matte materials (roughness 0.85+), flat hand-painted textures, slight hue variation per object.
- Props rotated 2–6° off-axis; clutter (mug, pens, sticky notes, slippers).
- UI: handwritten font (Caveat / Patrick Hand), paper cards with a 1° tilt, no gradients, no glassmorphism.

SECTIONS SUMMARY
Education → wall frames + laptop (mint)
About Me → easel + sketchbook (coral)
Projects → TV (lavender)
Experience → thing on the bed (butter)
Resume → nav bar link (PDF)
Misc → ☰ menu (contact, socials, art gallery, fun)