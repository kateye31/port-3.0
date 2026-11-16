# Katrina Adewale — the room

Katrina's portfolio as her own 3D bedroom, laid out from her sketch (`dist/assets/drawn/sketch.webp`). Each object opens a section; the camera flies there and her torn-paper corner sweeps in with the title.

| Object | Section |
| --- | --- |
| Easel, globe | About me |
| Coffee table + book | Skills |
| Desk computer (shows the current project) | Projects |
| Coat rack | Experience |
| Bookshelf, diploma, corkboard | Education |
| TV (cycles her favourite shows), bed | Off the clock |
| Cat (jumps + meows) | Say hello |
| Bedside lamp | toggles the light |

## Run

```
npm install
npm start          # http://localhost:5173 (PORT=5174 npm start for another port)
npm run check      # syntax check
npm run qa         # Playwright: desktop, phone, keyboard, wheel, menu, reduced motion
npm run shots      # quick screenshots into checks/shots/
```

`npx playwright install chromium` once before `qa`/`shots`.

## Where things live

- `dist/index.html`, `dist/styles.css`, `dist/ui.js` — page, cursor, routing (`#projects` etc.), tour, menu.
- `dist/content.js` — all text. Facts come from katrinaadewale.dev and the résumé; edit here.
- `dist/sections.js` — which objects open which section, colours, camera direction.
- `dist/room.js` — scene, lights, hover outlines, camera flights, screens.
- `dist/furnish.js` — furniture placement (follows the sketch); `dist/cat.js` — the cat.
- `dist/assets/room.glb` — walls/window/floor from the Blender master `source/katrina-room.blend`.

## Credits

- Hand-drawn UI (cursor states, arrows, torn corner, lettering, sketch, blue card): Katrina.
- Furniture: Kenney Furniture Kit (CC0). Cat by elkiotbear, globe by jeremy (CC-BY 3.0); easel by reyshapes, slippers by Isa Lousberg (CC0) — `dist/assets/models/CREDITS.txt`.
- Project/travel photos: Unsplash — `dist/assets/photos/CREDITS.txt`. Show stills from Katrina's previous site.
- Fonts: Katrina Hand (built from Katrina's own handwriting, `dist/assets/fonts/KatrinaHand.otf`), Little Marker and Chewy Pro from freefonts.io as fallbacks for numbers/symbols, Rubik (OFL) for paragraphs.
- Three.js 0.180 vendored (MIT).
