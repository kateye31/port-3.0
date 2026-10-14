# Browser review — October 14, 2026

Tested the existing room, not the proposed SPEC/sketch rebuild. Site and Blender source files were not modified.

## Results

- `npm.cmd run check`: passed (449 meshes, 168,220 triangles; all seven interaction groups; bed/cat raycasts and window opening).
- `node checks/browser-qa.mjs`: 28 functional assertions passed in installed headless Chrome using software WebGL.
- Screenshots reviewed at desktop 1440 px, phone 390 px, and tablet 768 px. The runner also captures 360 px.
- Resume placeholder, side menu, menu-to-detail transitions, Escape/focus restoration, object shortcuts/selection outlines, cat action, labels, daylight changes, camera keyboard limits/reset, modal sizing/focus, reduced motion and forced WebGL failure navigation passed.
- No uncaught browser exceptions or failed requests were recorded in the completed run. WebGL failure is deliberately injected only for the final fallback checks.

## Visual issues still open

1. **Phone headline is clipped.** `h1` inherits `white-space: nowrap`; the mobile rule hides its `<br>`, concatenating `spacefor` and cutting off the rest. See `viewport-390.png` and `viewport-360.png`. Restore the line break or introduce whitespace and allow wrapping.
2. **Phone greeting loses a space.** Hiding the welcome paragraph's `<br>` produces `Katrina.Welcome`. Preserve its break or add explicit whitespace.
3. **Tablet heading overlaps the room.** At 768 px, the 32% text column cannot contain the unwrappable 47 px heading. See `viewport-768.png`. Stack the layout earlier or allow the heading to wrap within its column.

The automated no-horizontal-overflow assertion passes because the hero clips its contents; that assertion does not mean all text is readable. Visual review is therefore not a clean pass.

## Scope and limitations

The earlier requirement to review a model preview before moving to website code remains outstanding. Only QA artifacts and the dependency lockfile were added; no layout fixes or model rebuild were made.

The test uses an isolated local HTTP server, avoiding an unrelated service already running on port 5173. It temporarily instruments the JavaScript response to inspect camera/light/selection state without editing `dist/room.js`. The generated report's `scene.triangles` value is the final postprocessing pass, not model geometry; the model count above comes from the existing model validator.

This covers Chromium software rendering, viewport emulation and keyboard interactions. It does not establish GPU performance, Safari/Firefox compatibility, physical touch behavior, or comprehensive pointer raycasting/hover behavior. Section buttons are activated programmatically; native key events exercise Escape, Tab and camera controls.

## Reproduce

From the project root, run `npm.cmd install`, `npm.cmd run check`, then `node checks/browser-qa.mjs`. The browser runner expects Chrome at its standard Windows installation path, saves PNGs and `report.json` here, and closes its isolated server and browser afterward.
