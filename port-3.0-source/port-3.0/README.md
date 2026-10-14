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

Actual meshes highlight on hover/focus and selection. Clicking furniture opens a detail drawer. Clicking the cat gives a head scratch. Labels can be hidden. Reduced-motion disables cat animation and animated camera reset.

The daylight slider changes the directional light's position, color and intensity with real-time shadow maps; a bedside point light comes on toward evening. Shadows are not baked into a picture.

## Delivery

Static files in `dist/`, with Three.js 0.180.0 vendored under its MIT license. No build or JavaScript CDN dependency. Existing personal text and résumé sections remain explicitly marked drafts until the user supplies real details.

## References

- https://www.youtube.com/watch?v=tdsQwuyS6DQ
- https://github.com/andrewwoan/sooahs-room-folio
- https://www.youtube.com/watch?v=E-fdPfRxkzQ
- https://github.com/adrianhajdin/3d-portfolio

No tutorial models were copied. Geometry is newly modeled.

## Validation

Model rendered and visually inspected in Blender. JavaScript syntax, glTF load, interaction groups, scene bounds, bed/cat raycasting, window aperture and asset paths validated. Browser/WebGL visual QA is unavailable in this environment.
