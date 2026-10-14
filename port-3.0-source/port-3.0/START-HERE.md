# Continue in VS Code

This ZIP contains the actual source and Blender assets from the published 3D portfolio, source commit `f35e14bc65ccd0da207fc6ef3412e937ebfd0589`.

## Put the files in your checkout

Extract the ZIP to a temporary folder. Copy the contents of its `port-3.0` folder into:

`C:\Users\kaytr\OneDrive\Documents\port-3.0`

The final layout should have `dist`, `source`, `checks`, `scripts`, `package.json`, and this file directly in that checkout. Avoid nesting another `port-3.0` folder inside it. The archive contains no `.git` folder, so your existing repository remains available. Replace the initial placeholder README with the included project README.

## Run it

Install Node.js if needed. In the VS Code terminal, from the project folder, run:

```powershell
npm start
```

Open `http://localhost:5173`. No dependency installation is required to preview: the browser uses vendored Three.js files. Serve it over HTTP; opening `dist/index.html` directly as a file will not load the model correctly.

For automated model checks:

```powershell
npm install
npm run check
```

For Blender editing, open `source/katrina-room.blend`. The scene can also be regenerated with `source/model_room.py` using Blender 4.2 or newer.

## Paste this into Codex

```text
The full portfolio files are now in this checkout. Read START-HERE.md and README.md, inspect the implementation, and launch it with npm start.

Continue my Blender + Three.js room portfolio. Keep it polished, beautiful, and simple for recruiters. Preserve the top résumé link and small side menu.

The room has constrained rotation, live window lighting/shadows, object highlighting, a ginger cat, a bed, and a modern TV. Main scene: dist/room.js. Portfolio UI: dist/app.js, dist/index.html, dist/styles.css. Editable model: source/katrina-room.blend. Generator: source/model_room.py.

Perform browser visual testing at desktop and mobile sizes. Check model loading, lighting and shadow changes, rotation limits, highlighting, object selection, cat interaction, dialogs, keyboard navigation, and responsive layout. Make targeted polish fixes based on observed problems.

The Blender render, model-load checks, and code checks passed previously. Browser visual testing has not yet been performed. My real project case studies, biography and résumé still need adding; don't invent credentials or career claims.

Reference art/interaction direction:
https://www.youtube.com/watch?v=tdsQwuyS6DQ
https://www.youtube.com/watch?v=E-fdPfRxkzQ

Published draft: https://starfire-room.navybowl5.chatgpt.site
```
