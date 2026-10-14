# Katrina — A room for ideas

An original Blender bedroom model rendered live in Three.js. Includes a desk, shelf, globe, slim TV, bed, easel and sleeping ginger cat. Main room uses real 3D geometry, not a picture.

## Editable source

- `source/model_room.py`: deterministic Blender modeling and export script.
- `source/katrina-room.blend`: editable Blender master.
- `dist/assets/room.glb`: model used by the website.
- `dist/assets/room-preview.png`: offline render for project detail thumbnails only.
- `dist/room.js`: browser renderer, lighting, raycasting and interaction logic.

To regenerate, run Blender 4.2+: `blender -b --python source/model_room.py`.

## Controls

Drag or use arrow keys to orbit. Home/reset restores the default view. Azimuth stays inside the open quadrant (0.10 to pi/2 - 0.10); polar angle is limited to pi/5 through pi/2.6. Panning is disabled; zoom is bounded on desktop and disabled at widths up to 1024px. These restrictions adapt the approaches in the user's two reference tutorials.

Actual meshes highlight on hover/focus and selection. Clicking furniture opens a detail drawer. Clicking the cat triggers a stretch and a short synthesized meow, then resumes its route. Labels can be hidden. Reduced-motion disables cat animation and animated camera reset.

### Art direction

`dist/art-style.js` applies matte materials (roughness >=0.9, no metalness), subtle deterministic dry-brush texture and per-object hue variation while preserving printed labels. A separate warm-brown OutlinePass alpha-composites resting silhouettes; sparse geometric crease lines add interior detail. Section-color hover outlines remain independent. Mug, slippers, easel and a new loose pencil are turned 2–6 degrees. Two physical sticky notes sit on the desk; slippers move 4.5cm outward to preserve the cat's tested route clearance.

Panels use Patrick Hand, opaque paper and a 1-degree tilt, with no backdrop blur or gradients. The font uses an installed Patrick Hand when available, otherwise the existing Google Fonts loading approach with handwriting fallbacks. Résumé navigation, the side menu and camera constraints are unchanged.

`node checks/browser-qa.mjs --style-only` captures `look-default.png`, `look-left-wall.png`, `look-right-wall.png`, and desktop/mobile paper panels in `checks/browser-results/`. Wall views use allowed azimuths of 1.30 and 0.20 radians; no camera constraints are relaxed. `npm run check` covers material/clutter checks and the cat's full route after prop rotations. The art treatment is runtime Three.js/CSS; Blender assets remain unchanged.

### Education wall

`dist/education.js` adds a framed degree display, a corkboard with three pinned cards, and three labeled textbooks on a small wall shelf. The display occupies the solid left-wall pier beside the window, preserving the existing window opening. Lettering is printed into textures on the solid paper and spine faces, not floating text. All three interaction groups use mint `#A8E6CF` and open Education. The panel now contains the user-supplied degree, minor, and expected December 2027 date; the diploma also says “Expected,” not awarded. These are runtime Three.js props; the Blender master and GLB are unchanged.

Check placement with `node checks/validate-education.mjs`; check every card/spine click, mint tint/outline, and panel content with `node checks/browser-qa.mjs --education-only`.

### Ginger cat animation

`dist/cat.js` reuses all 22 original cat meshes. The GLB has no skeleton or animation clips, so runtime head/body/tail/ear pivots provide breathing, tail sway, random ear flicks and a stylized rigid walk. The existing curled pose is retained at stops; this is not a skeletal sitting/walking animation.

The cat pauses for 15–30 seconds at each stop. Current GLB floor waypoints `(x,z)` are `(0,1.5)`, `(-0.12,1.9)`, `(0.12,2.1)`, then back. These intentionally differ from SPEC's future 4m-room coordinates. A 0.9m swept-radius guard plus 0.025m furniture clearance validates the route; pose grounding keeps the lowest mesh at Y=0.185 above the rug. Clicks pause travel for the stretch, then resume it. Audio starts only after interaction and fails silently if unavailable.

`node checks/validate-cat.mjs` checks 5,400 frames against furniture, including turns and 22 stretches, and verifies mesh reuse, reduced motion and route completion. `node checks/browser-qa.mjs --cat-only` checks pointer/shortcut interaction, audio activation, route completion and unchanged camera constraints; screenshots and results are in `checks/browser-results/`.

The daylight slider changes the directional light's position, color and intensity with real-time shadow maps. The independent bedside lamp toggles light, bulb and shade emission, dims ambient fill when off, and persists its state when localStorage is available. Shadows are not baked into a picture.

## Delivery

Static files in `dist/`, with Three.js 0.180.0 vendored under its MIT license. No build or JavaScript CDN dependency. Existing personal text and résumé sections remain explicitly marked drafts until the user supplies real details.

## References

- https://www.youtube.com/watch?v=tdsQwuyS6DQ
- https://github.com/andrewwoan/sooahs-room-folio
- https://www.youtube.com/watch?v=E-fdPfRxkzQ
- https://github.com/adrianhajdin/3d-portfolio

No tutorial models were copied. Geometry is newly modeled.

## Validation

Model rendered and visually inspected in Blender. JavaScript syntax, glTF load, interaction groups, scene bounds, cat route, prop clearance and window aperture are validated. Headless Chrome/WebGL checks and reviewed screenshots cover the runtime art treatment, Education interactions, paper panels, lamp controls and existing camera limits; reports are in `checks/browser-results/`.
