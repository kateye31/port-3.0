# Portfolio 3.0 · 3D

**My portfolio, third version. This time it's my bedroom, and you can walk around it.**

Every object in the room opens part of my story. Click the computer for my projects, the coat rack for my experience, the bookshelf for what I'm reading, the TV and the records for what I do off the clock. The camera flies over, a torn sheet of paper slides in, and the section reads like a note I left on the desk.

**🌐 Website: [katrinaadewale.dev](https://katrinaadewale.dev/)**

<p>
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js">
  <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="JavaScript">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS-663399?style=for-the-badge&logo=css&logoColor=white" alt="CSS">
  <img src="https://img.shields.io/badge/WebGL-990000?style=for-the-badge&logo=webgl&logoColor=white" alt="WebGL">
  <br>
  <img src="https://img.shields.io/badge/Blender-F5792A?style=for-the-badge&logo=blender&logoColor=white" alt="Blender">
  <img src="https://img.shields.io/badge/Procreate-000000?style=for-the-badge&logo=procreate&logoColor=white" alt="Procreate">
  <img src="https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=githubpages&logoColor=white" alt="GitHub Pages">
</p>

![The room on the home page: my name in my own lettering on the left, and the 3D bedroom on the right with the desk, bookshelf, TV, bed and the cat](docs/img/room.png)

## Why a room

For the third version I wanted something a recruiter would actually remember, not another page of cards. The room started as a sketch on graph paper, and the interface is drawn by hand: the name lettering, the cursor, the arrows, the star cat and the torn paper are all my own drawings.

It still has to work for someone skimming in under a minute, so the résumé is always one click away in the top bar, and every section can also be reached from the menu without touching the 3D scene.

## What's in the room

| Click | Opens |
|---|---|
| The painting & the easel | About me |
| The computer | Projects (the demo plays on the monitor) |
| The book on the coffee table | Skills |
| The coat rack | Experience |
| The wall by the window | Education |
| The bookshelf | My books |
| The TV, the records, the globe & the bed | Off the clock |
| The cat | Say hello (click it again for a meow) |

<p>
  <img src="docs/img/projects.png" width="49%" alt="Projects: the camera on the desk, Fireline playing on the monitor, and the project card with its awards and photos">
  <img src="docs/img/experience.png" width="49%" alt="Experience: the coat rack highlighted, with my roles at Lockheed Martin, UCF iSTEM and UCF Transfer Connect">
</p>
<p>
  <img src="docs/img/offclock.png" width="49%" alt="Off the clock: the TV playing one of my favourite shows, with the shows and albums I love">
  <img src="docs/img/about.png" width="49%" alt="About me: the painting on the wall and my photo">
</p>

On a phone, the room sits above a sheet you can pull down to see more of it.

<p>
  <img src="docs/img/phone.png" width="32%" alt="The home page on a phone">
  <img src="docs/img/phone-projects.png" width="32%" alt="Projects on a phone">
</p>

## How it's built

- **No framework, no build step.** Plain ES modules and Three.js (r180, vendored), served as static files from `port-3.0-source/port-3.0/dist`.
- **The room shell** (walls, window, floor) was modelled in Blender (`source/katrina-room.blend`). Most of the furniture is built in code: the bed and bedding, desk, chair, monitor, bookcase and books, sideboard, coat rack, blazer, rug, plants and globe. That way each piece shares the same proportions, materials and edge softening.
- **The books are my real shelf.** Each spine takes its colour from the actual cover and carries the real title and author.
- **Motion and lighting** follow Orlando time: the sun through the window changes through the day, and the bedside lamp switches on after dark.
- **Tested at desktop and phone sizes,** with a script that catches furniture clipping into walls or floating above the floor.
- **Locked down for a static site:** a Content Security Policy, no third-party scripts, and nothing secret in the client.

## Run it

```
cd port-3.0-source/port-3.0
npm install
npm start
```

Then open http://localhost:5173. Pushing to `main` publishes the site to katrinaadewale.dev through GitHub Actions.

## Credits

- Furniture kit pieces: [Kenney Furniture Kit](https://kenney.nl), CC0
- Cat, easel and slippers models: via [Poly Pizza](https://poly.pizza) (see `dist/assets/models/CREDITS.txt`)
- Globe borders: [BlankMap-World-Equirectangular](https://commons.wikimedia.org/wiki/File:BlankMap-World-Equirectangular.svg), public domain
- Meow: yomecerlm3 on [Pixabay](https://pixabay.com)
- Placeholder project photos: [Unsplash](https://unsplash.com) (see `dist/assets/photos/CREDITS.txt`)
- Everything hand-drawn, plus the photos of me: mine
