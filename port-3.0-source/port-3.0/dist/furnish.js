import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BADGES } from './content.js';
import { addLivedInDetails, bedsideLamp, fillBookshelf } from './props.js';
import { dressBed, hangCurtains } from './fabric.js';
import { snakePlant, pottedPlant, rosette } from './plants.js';
import { HOOK, bedFrame, bookcase, chair, coatRack, coffeeTable, desk, deskSet, finishRoom, mediaConsole, monitor, nightstand, pictureFrame, rug, suitJacket, wallShelf, workBag, deskGlobe } from './furniture.js';

// Furniture follows my room sketch (assets/drawn/sketch.webp): coat rack
// front-left, desk under the window, bookshelf in the back corner, TV with the
// globe above it, easel + slippers back-right, round table on the rug, bed
// front-right. Models are human-made (assets/models/CREDITS.txt); the room's
// walls, window and floor stay from room.glb.
const F = .15;            // floor surface height in room.glb
const K = 3.5;            // Kenney Furniture Kit units -> room units

// Old procedural props replaced by the models below.
const RETIRED = [/^Desk$/, /^Desk_chair$/, /^Bookshelf$/, /^Modern_TV$/, /^Bed$/, /^Rug$/, /^Cat$/, /^Easel$/,
  /^Floor_cushion$/, /^Floor_monstera/, /^Shelf_sprig/, /^Desk_plant/, /^Shelf_fern/, /^Slipper/, /^Notebook$/, /^Globe_(base|continent|earth|stem)/, /^Lamp_/, /^Linen_curtain_fold/, /^Floorboard/, /^Floating_shelf/];

// [file, position, rotationY (deg), scale, interactive key, sits on]
const PLACEMENTS = [
  ['desk', [-2.45, F, .35], 90, 1, 'desk'],
  ['monitor', [-2.7, null, .35], 90, 1, 'desk', 'desk'],
  ['desk-set', [-2.27, null, .3], 90, 1, 'desk', 'desk'],
  ['plant-desk', [-2.72, null, 1.36], 20, 1, null, 'desk'],
  ['chair', [-1.5, F, 1.5], -112, 1, null],
  ['coat-rack', [-2.5, F, 2.62], 0, 1, 'coatrack'],
  ['bookcase', [-2.3, F, -2.385], 0, 1, 'bookshelf'],
  ['plant-floor', [-2.52, F, -1.45], 0, 1, null],
  ['tv-stand', [.05, F, -2.4], 0, 1, 'tv'],
  ['k-televisionModern', [.38, null, -2.45], 0, K * .85, 'tv', 'tv-stand'],
  ['record-player', [-.98, null, -2.38], 12, .00048, 'record', 'tv-stand'],
  ['wall-shelf', [-.03, 2.93, -2.68], 0, 1, 'globe'],
  ['globe', [.42, null, -2.66], 0, 1, 'globe', 'wall-shelf'],
  ['easel', [3.0, F, -1.75], -55, .2, 'easel'],
  ['slippers', [2.15, F, -1.45], 25, .9, 'easel'],
  ['bed', [1.85, F, .95], 0, 1, 'bed'],
  ['nightstand', [3.1, F, 2.4], 180, 1, 'bed'],
  ['lamp-bedside', [3.1, null, 2.4], 0, 1, 'lamp', 'nightstand'],
  ['rug', [-.2, F, 1.25], 3, 1, 'table'],
  ['coffee-table', [-.15, F + .02, 1.25], 0, 1, 'table'],
  ['plant-table', [.3, null, 1.6], 0, 1, 'table', 'coffee-table'],
];

// Exact screen quads, measured from the Kenney models (model units, after
// normalize): centre y, width, height, forward z, lean-back angle.
const SCREENS = {
  tv: { w: .668, h: .368, y: .262, z: .0222, tilt: 0 },
};

// Three finishes run through the room so it reads as one set: walnut (TV stand,
// coat rack, coffee table), oak (desk, bed frame) and paint (sage bookcase, cream nightstand).
const FINISHES = {
  // The TV is a black set, not the kit's grey: by material name.
  'k-televisionModern': { metalDark: '#141216', metal: '#222026' },
};

export async function furnish(model, onProgress = () => {}) {
  const retired = [];
  model.traverse(o => { if (RETIRED.some(r => r.test(o.name))) retired.push(o); });
  for (const o of retired) o.removeFromParent();

  const loader = new GLTFLoader(), cache = new Map();
  const files = [...new Set(PLACEMENTS.map(p => p[0]))].filter(f => !BUILT[f]);
  let loaded = 0;
  await Promise.all(files.map(async f => { cache.set(f, (await loader.loadAsync(`assets/models/${f}.glb`)).scene); onProgress(++loaded / files.length); }));
  for (const [f, build] of Object.entries(BUILT)) cache.set(f, build());

  const placed = new Map(), groups = new Map();
  const groupFor = key => {
    const id = key || 'decor';
    if (!groups.has(id)) { const g = new THREE.Group(); g.name = `room_${id}`; if (key) g.userData.interactive = key; model.add(g); groups.set(id, g); }
    return groups.get(id);
  };
  for (const [file, pos, deg, scale, key, sitsOn] of PLACEMENTS) {
    const item = normalize(cache.get(file).clone(true), scale);
    item.name = file;
    applyFinish(item, file);
    item.rotation.y = THREE.MathUtils.degToRad(deg);
    item.position.set(pos[0], pos[1] ?? placed.get(sitsOn).top, pos[2]);
    item.updateMatrixWorld(true);
    placed.set(file, { object: item, top: new THREE.Box3().setFromObject(item).max.y });
    groupFor(key).add(item);
  }

  dressBed(placed.get('bed').object, groupFor('bed'));
  finishRoom(model);
  // The work bag hangs by its handles from the rack's front hook.
  // Each piece hangs from its own hook, facing out along it. Hooks sit every 60°;
  // odd ones are .07 lower. The bag and the blazer take opposite hooks so they hang clear.
  const hookAt = (i, item, drop = 0) => {
    const a = i / 6 * Math.PI * 2;
    item.position.set(-2.5 + HOOK.reach * Math.cos(a), F + HOOK.height - (i % 2 ? .07 : 0) - drop, 2.62 - HOOK.reach * Math.sin(a));
    item.rotation.y = Math.atan2(Math.cos(a), -Math.sin(a)); groupFor('coatrack').add(item);
  };
  const bag = workBag(); bag.name = 'coat_rack_bag'; hookAt(1, bag);
  // My black blazer on its hanger, front turned to the room.
  // Full size (a blazer is about 75 cm long): one room unit is roughly 55 cm. It keeps
  // its natural depth so the back clears the pole.
  const jacket = suitJacket(); jacket.name = 'coat_rack_jacket'; jacket.scale.set(2.05, 2.05, 1.1); hookAt(4, jacket, .026 * 2.05);
  hangCurtains(model);
  await fillBookshelf(groupFor('bookshelf'));
  await addLivedInDetails(model, groups);

  // The painting on the back wall belongs to About, with the globe and easel.
  const painting = groupFor('painting');
  const art = [];
  model.traverse(o => { if (/^(Picture_frame|Picture_paper|Art_)/.test(o.name)) art.push(o); });
  art.forEach(o => painting.attach(o));
  await framedPhoto(painting);

  const screen = placed.get('monitor').object.getObjectByName('screen_surface');
  const tv = addScreen(placed.get('k-televisionModern').object, SCREENS.tv);
  const book = await skillsBook(groupFor('table'), placed.get('coffee-table').top);
  const record = recordOn(placed.get('record-player').object);
  model.updateMatrixWorld(true);
  return { lampBulb: placed.get('lamp-bedside').object, monitor: screen, tv, book, record, screenObject: placed.get('monitor').object, tvObject: placed.get('k-televisionModern').object };
}

function applyFinish(item, file) {
  const finish = FINISHES[file]; if (!finish) return;
  const colorFor = name => typeof finish === 'string' ? (name === 'wood' ? finish : null) : finish[name];
  item.traverse(o => {
    if (!o.isMesh) return;
    const materials = Array.isArray(o.material) ? o.material : [o.material];
    o.material = materials.map(m => { const c = m.clone(), color = colorFor(m.name); if (color) { c.color.set(color); c.map = null; c.roughness = .95; } return c; });
    if (o.material.length === 1) o.material = o.material[0];
  });
}

// Pieces built in code rather than loaded, in room units (scale 1).
const BUILT = { bed: bedFrame, nightstand, 'tv-stand': mediaConsole, 'wall-shelf': wallShelf, globe: deskGlobe, 'coffee-table': coffeeTable, desk, monitor, 'desk-set': deskSet, chair, 'coat-rack': coatRack, bookcase, rug, 'lamp-bedside': bedsideLamp, 'plant-floor': snakePlant, 'plant-desk': () => pottedPlant({ size: 1.15 }), 'plant-table': rosette };

// Center on x/z, rest on y=0, then scale (uniform or [x,y,z]).
function normalize(object, scale) {
  const wrap = new THREE.Group();
  const box = new THREE.Box3().setFromObject(object), c = box.getCenter(new THREE.Vector3());
  object.position.sub(new THREE.Vector3(c.x, box.min.y, c.z));
  wrap.add(object);
  if (Array.isArray(scale)) wrap.scale.set(...scale); else wrap.scale.setScalar(scale);
  object.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = o.receiveShadow = true;
    // Kenney materials ship slightly glossy; the room is matte paper.
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    o.material = mats.map(m => { const c = m.clone(); if ('roughness' in c) { c.roughness = Math.max(.85, c.roughness); c.metalness = 0; } return c; });
    if (o.material.length === 1) o.material = o.material[0];
  });
  return wrap;
}

// My photo on the back wall, in a proper frame with a mount, hung where the old
// placeholder picture was and flat against the plaster (the wall face is z -2.93).
async function framedPhoto(group) {
  const old = group.children.filter(o => /^(Picture_frame|Picture_paper|Art_)/.test(o.name));
  const paper = old.find(o => /^Picture_paper/.test(o.name)); if (!paper) return;
  group.updateMatrixWorld(true);
  const centre = new THREE.Box3().setFromObject(paper).getCenter(new THREE.Vector3());
  old.forEach(o => o.removeFromParent());
  const w = .8, h = .98, { frame, photo } = pictureFrame(w, h);
  const img = await new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = 'assets/photos/monkey.jpg'; });
  const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
  // Cover-crop the portrait photo to the opening, favouring the upper part (faces).
  const a = img.width / img.height, f = w / h;
  tex.repeat.set(a > f ? f / a : 1, a > f ? 1 : a / f); tex.offset.set((1 - tex.repeat.x) / 2, (1 - tex.repeat.y) * .72);
  photo.material.map = tex;
  frame.name = 'wall_frame'; frame.position.set(centre.x, centre.y, -2.93);
  group.add(frame);
}

// A record on the turntable's platter: black vinyl with the album cover as
// its label. room.js spins it and swaps the label.
function recordOn(player) {
  let platter = null; player.traverse(o => { if (o.isMesh && o.name === 'Cylinder022') platter = o; });
  player.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(platter || player), c = box.getCenter(new THREE.Vector3()), r = (box.max.x - box.min.x) / 2 * .96;
  const disk = new THREE.Group(); disk.name = 'vinyl';
  const vinyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .008, 64), new THREE.MeshStandardMaterial({ color: '#141218', roughness: .45 }));
  const groove = new THREE.Mesh(new THREE.RingGeometry(r * .45, r * .93, 64), new THREE.MeshStandardMaterial({ map: grooveTexture(), roughness: .35 }));
  groove.rotation.x = -Math.PI / 2; groove.position.y = .0045;
  const labelMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .8 });
  const label = new THREE.Mesh(new THREE.CircleGeometry(r * .4, 48), labelMat);
  label.rotation.x = -Math.PI / 2; label.position.y = .005;
  disk.add(vinyl, groove, label); disk.position.set(c.x, box.max.y + .005, c.z);
  vinyl.castShadow = true; player.parent.add(disk);
  return { disk, label };   // the mesh: room.js reads label.material, which applyArtStyle replaces
}

// Grooves, plus a few brighter arcs where the needle has worn the track: the
// arcs turn with the disk, so you can actually see the record spinning.
function grooveTexture() {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#211E27'; ctx.fillRect(0, 0, S, S);
  const inner = S / 2 * .45 / .93;
  for (let rad = inner; rad < S / 2; rad += 2.2) {
    ctx.strokeStyle = `rgba(${rad % 6.6 < 2.2 ? '70,64,82' : '14,12,18'},.9)`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(S / 2, S / 2, rad, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.lineCap = 'round';
  for (const [rad, from, len, a] of [[.62, .2, 1.1, .5], [.78, 2.4, .8, .42], [.9, 4.1, 1.3, .36], [.7, 5.2, .5, .3]]) {
    ctx.strokeStyle = `rgba(190,182,206,${a})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(S / 2, S / 2, rad * S / 2, from, from + len); ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function addScreen(wrap, s) {
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.h), new THREE.MeshBasicMaterial({ color: '#1C2340', toneMapped: false }));
  plane.name = 'screen_surface';
  plane.position.set(0, s.y, s.z);
  plane.rotation.x = -s.tilt;
  plane.userData.aspect = s.w / s.h;
  wrap.add(plane);
  return plane;
}

// my skills book: my open-book drawing with the tech-stack blocks from
// my GitHub README laid out on the pages, and the "my skills" cover beside it.
async function skillsBook(group, tableTop) {
  const img = src => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });
  const pages = await img('assets/drawn/skills-pages.webp');
  const badges = await Promise.all(BADGES.map(b => img(`assets/badges/${b.file}.svg`).catch(() => null)));
  const W = pages.width * 2, H = pages.height * 2;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d'); ctx.drawImage(pages, 0, 0, W, H);
  // Lay the blocks out page by page, wrapping rows, a little hand-placed tilt.
  const half = Math.ceil(badges.length / 2), pad = W * .05, gap = 14, bh = 52;
  [[badges.slice(0, half), pad * 1.1, W / 2 - pad * .5], [badges.slice(half), W / 2 + pad * .5, W - pad * 1.1]].forEach(([list, x0, x1], page) => {
    let x = x0, y = H * .17, seed = page * 7 + 3;
    for (const b of list) {
      if (!b) continue;
      const bw = b.width / b.height * bh;
      if (x + bw > x1) { x = x0; y += bh + gap * 1.6; }
      seed = (seed * 9301 + 49297) % 233280;
      ctx.save(); ctx.translate(x + bw / 2, y + bh / 2); ctx.rotate(((seed / 233280) - .5) * .06);
      ctx.drawImage(b, -bw / 2, -bh / 2, bw, bh); ctx.restore();
      x += bw + gap;
    }
  });
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;

  const book = new THREE.Group(); book.name = 'skills-book';
  const w = 1.05, d = w * H / W;
  // Two halves meeting at the spine, each tilted up a few degrees.
  for (const side of [-1, 1]) {
    const geo = new THREE.PlaneGeometry(w / 2, d);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, side < 0 ? uv.getX(i) * .5 : .5 + uv.getX(i) * .5);
    const half = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: .95 }));
    half.rotation.x = -Math.PI / 2;
    const hinge = new THREE.Group(); hinge.rotation.z = side * THREE.MathUtils.degToRad(5);
    half.position.x = side * w / 4; hinge.add(half); book.add(hinge);
    half.receiveShadow = true;
  }
  book.position.set(-.32, tableTop + .012, 1.15);
  book.rotation.y = THREE.MathUtils.degToRad(32);
  group.add(book);

  const coverImg = await img('assets/drawn/skills-cover.webp');
  const coverTex = new THREE.Texture(coverImg); coverTex.colorSpace = THREE.SRGBColorSpace; coverTex.needsUpdate = true;
  const purple = new THREE.MeshStandardMaterial({ color: '#5F28D6', roughness: .9 });
  const cw = .42, cd = cw * coverImg.height / coverImg.width;
  const closed = new THREE.Mesh(new THREE.BoxGeometry(cw, .055, cd), [purple, purple, new THREE.MeshStandardMaterial({ map: coverTex, roughness: .9, transparent: true }), purple, purple, purple]);
  closed.name = 'skills-cover'; closed.castShadow = closed.receiveShadow = true;
  closed.position.set(.42, tableTop + .028, .82); closed.rotation.y = THREE.MathUtils.degToRad(-18);
  group.add(closed);
  return book;
}
