import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BADGES } from './content.js';
import { addLivedInDetails, applyBedQuilt, fillBookshelf } from './props.js';

// Furniture follows Katrina's room sketch (assets/drawn/sketch.webp): coat rack
// front-left, desk under the window, bookshelf in the back corner, TV with the
// globe above it, easel + slippers back-right, round table on the rug, bed
// front-right. Models are human-made (assets/models/CREDITS.txt); the room's
// walls, window and floor stay from room.glb.
const F = .15;            // floor surface height in room.glb
const K = 3.5;            // Kenney Furniture Kit units -> room units

// Old procedural props replaced by the models below.
const RETIRED = [/^Desk$/, /^Desk_chair$/, /^Bookshelf$/, /^Modern_TV$/, /^Bed$/, /^Rug$/, /^Cat$/, /^Easel$/,
  /^Floor_cushion$/, /^Floor_monstera/, /^Shelf_sprig/, /^Desk_plant/, /^Shelf_fern/, /^Slipper/, /^Notebook$/, /^Globe_(base|continent|earth|stem)/, /^Lamp_/];

// [file, position, rotationY (deg), scale, interactive key, sits on]
const PLACEMENTS = [
  ['desk', [-2.62, F, .35], 90, 1, 'desk'],
  ['k-computerScreen', [-2.9, null, .35], 90, K, 'desk', 'desk'],
  ['k-computerKeyboard', [-2.42, null, .38], 90, K, 'desk', 'desk'],
  ['k-computerMouse', [-2.42, null, -.32], 90, K, 'desk', 'desk'],
  ['k-plantSmall2', [-2.95, null, 1.25], 20, K, null, 'desk'],
  ['k-chairDesk', [-1.85, F, 1.55], -150, K, null],
  ['k-coatRackStanding', [-2.72, F, 2.62], 15, K, 'coatrack'],
  ['k-bookcaseOpen', [-2.3, F, -2.42], 0, K, 'bookshelf'],
  ['k-pottedPlant', [-2.95, F, -1.35], 0, K, null],
  ['k-cabinetTelevision', [.05, F, -2.45], 0, K, 'tv'],
  ['k-televisionModern', [.38, null, -2.5], 0, K * .85, 'tv', 'k-cabinetTelevision'],
  ['record-player', [-.98, null, -2.42], 12, .00048, 'record', 'k-cabinetTelevision'],
  ['globe', [.3, 3.21, -2.63], 200, .075, 'globe'],
  ['easel', [3.0, F, -1.75], -55, .2, 'easel'],
  ['slippers', [2.15, F, -1.45], 25, .9, 'easel'],
  ['k-bedSingle', [1.85, F, .95], 180, 3.2, 'bed'],
  ['k-cabinetBed', [3.08, F, 2.4], -90, K * .8, 'bed'],
  ['k-lampRoundTable', [3.08, null, 2.4], -90, K * .9, 'lamp', 'k-cabinetBed'],
  ['k-rugRound', [-.15, F, 1.25], 0, K, 'table'],
  ['k-tableRound', [-.15, F + .006, 1.25], 0, [2.3, 1.75, 2.3], 'table'],
  ['k-plantSmall1', [.38, null, 1.62], 0, K * .8, 'table', 'k-tableRound'],
];

// Exact screen quads, measured from the Kenney models (model units, after
// normalize): centre y, width, height, forward z, lean-back angle.
const SCREENS = {
  tv: { w: .668, h: .368, y: .262, z: .0222, tilt: 0 },
  monitor: { w: .379, h: .231, y: .1715, z: .0006, tilt: Math.atan2(.032, .231) },
};

// Collected over time: paint and timber finishes vary by piece, not by model.
const FINISHES = {
  'k-bookcaseOpen': '#A8B29A',
  'k-cabinetTelevision': '#76503F',
  'k-cabinetBed': '#E2D4BD',
  'k-coatRackStanding': '#855C4B',
  'k-tableRound': '#B87D68',
  // The TV is a black set, not the kit's grey: by material name.
  'k-televisionModern': { metalDark: '#141216', metal: '#222026' },
};

export async function furnish(model) {
  const retired = [];
  model.traverse(o => { if (RETIRED.some(r => r.test(o.name))) retired.push(o); });
  for (const o of retired) o.removeFromParent();

  const loader = new GLTFLoader(), cache = new Map();
  const files = [...new Set(PLACEMENTS.map(p => p[0]))].filter(f => !BUILT[f]);
  await Promise.all(files.map(async f => cache.set(f, (await loader.loadAsync(`assets/models/${f}.glb`)).scene)));
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
    if (file === 'k-bedSingle') applyBedQuilt(item);
    item.rotation.y = THREE.MathUtils.degToRad(deg);
    item.position.set(pos[0], pos[1] ?? placed.get(sitsOn).top, pos[2]);
    item.updateMatrixWorld(true);
    placed.set(file, { object: item, top: new THREE.Box3().setFromObject(item).max.y });
    groupFor(key).add(item);
  }

  await fillBookshelf(groupFor('bookshelf'));
  await addLivedInDetails(model, groups);

  // The painting on the back wall belongs to About, with the globe and easel.
  const painting = groupFor('painting');
  const art = [];
  model.traverse(o => { if (/^(Picture_frame|Picture_paper|Art_)/.test(o.name)) art.push(o); });
  art.forEach(o => painting.attach(o));
  await framedPhoto(painting);

  const monitor = addScreen(placed.get('k-computerScreen').object, SCREENS.monitor);
  const tv = addScreen(placed.get('k-televisionModern').object, SCREENS.tv);
  const book = await skillsBook(groupFor('table'), placed.get('k-tableRound').top);
  const record = recordOn(placed.get('record-player').object);
  model.updateMatrixWorld(true);
  return { lampBulb: placed.get('k-lampRoundTable').object, monitor, tv, book, record, screenObject: placed.get('k-computerScreen').object, tvObject: placed.get('k-televisionModern').object };
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
const BUILT = { desk: buildDesk };

// The work desk, after Katrina's reference: an oak top and drawer pedestal with
// three cream drawers, and a single bent cream sled leg at the open end. Same
// footprint as the Kenney desk it replaces (2.57 wide, 1.3 deep, 1.345 tall),
// front facing +z before the 90° turn.
function buildDesk() {
  const W = 2.57, D = 1.3, H = 1.345, T = .07;
  const oak = new THREE.MeshStandardMaterial({ name: 'desk_oak', map: oakGrain(), roughness: .85 });
  const cream = new THREE.MeshStandardMaterial({ name: 'desk_cream', color: '#EFE6D6', roughness: .85 });
  const pewter = new THREE.MeshStandardMaterial({ name: 'desk_pull', color: '#A39A8C', roughness: .7 });
  const desk = new THREE.Group();
  const box = (name, [w, h, d], [x, y, z], mat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.name = name; m.position.set(x, y, z); desk.add(m);
  };
  box('Desk_top', [W, T, D], [0, H - T / 2, 0], oak);

  // Pedestal under the far end, set back a little from the top's front edge.
  const pw = .66, ph = H - T, pd = D - .08, px = W / 2 - pw / 2 - .05, front = -.04 + pd / 2;
  box('Desk_pedestal', [pw, ph, pd], [px, ph / 2, -.04], oak);
  const fh = (ph - .08) / 3;
  for (let i = 0; i < 3; i++) {
    const y = .05 + fh * (i + .5);
    box(`Desk_drawer_${i + 1}`, [pw - .07, fh - .035, .025], [px, y, front + .0125], cream);
    box(`Desk_drawer_pull_${i + 1}`, [.2, .02, .025], [px, y + fh * .24, front + .037], pewter);
  }

  // Sled leg: one tube bent into a rounded loop (floor runner, two posts, top rail).
  const tr = .035, x = -W / 2 + .14, zf = D / 2 - .1, zb = -D / 2 + .1, yb = tr, yt = H - T - tr, r = .15;
  const pts = [[zf, yt], [zf, yb], [zb, yb], [zb, yt]].map(([z, y]) => new THREE.Vector3(x, y, z));
  const ends = pts.map((c, i) => [pts[(i + 3) % 4], pts[(i + 1) % 4]].map(o => c.clone().add(o.clone().sub(c).setLength(r))));
  const loop = new THREE.CurvePath();
  pts.forEach((c, i) => {
    loop.add(new THREE.QuadraticBezierCurve3(ends[i][0], c, ends[i][1]));
    loop.add(new THREE.LineCurve3(ends[i][1], ends[(i + 1) % 4][0]));
  });
  // 12 radial segments keeps the ink pass from tracing lines along the tube.
  const leg = new THREE.Mesh(new THREE.TubeGeometry(loop, 240, tr, 12, true), cream);
  leg.name = 'Desk_sled_leg'; desk.add(leg);
  return desk;
}

// Quiet oak grain: long, slightly wandering strokes a shade darker than the
// wood, plus a few broad soft bands. Reads as timber up close and as flat
// colour from across the room.
function oakGrain() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#D9B285'; ctx.fillRect(0, 0, 512, 256);
  let seed = 11; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const stroke = (alpha, width) => {
    const y0 = rnd() * 256, amp = 1 + rnd() * 4, freq = .004 + rnd() * .01, ph = rnd() * 6;
    ctx.strokeStyle = `rgba(126,82,44,${alpha})`; ctx.lineWidth = width; ctx.beginPath();
    for (let x = 0; x <= 512; x += 8) ctx.lineTo(x, y0 + Math.sin(x * freq + ph) * amp);
    ctx.stroke();
  };
  for (let i = 0; i < 6; i++) stroke(.03 + rnd() * .03, 8 + rnd() * 14);
  for (let i = 0; i < 70; i++) stroke(.05 + rnd() * .1, .6 + rnd() * 1.4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

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

// Katrina's own photo in the wall frame, replacing the placeholder artwork.
async function framedPhoto(group) {
  const paper = group.children.find(o => /^Picture_paper/.test(o.name));
  group.children.filter(o => /^Art_/.test(o.name)).forEach(o => { o.visible = false; });
  if (!paper) return;
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(paper), size = box.getSize(new THREE.Vector3());
  const w = size.x * .9, h = size.y * .9;
  const img = await new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = 'assets/photos/monkey.jpg'; });
  const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
  // Cover-crop the portrait photo to the frame, favouring the upper part (faces).
  const a = img.width / img.height, f = w / h;
  tex.repeat.set(a > f ? f / a : 1, a > f ? 1 : a / f); tex.offset.set((1 - tex.repeat.x) / 2, (1 - tex.repeat.y) * .72);
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: .8 }));
  photo.name = 'framed_photo'; photo.receiveShadow = true;
  photo.position.set((box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, box.max.z + .004);
  group.add(photo);
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

// Katrina's skills book: her open-book drawing with the tech-stack blocks from
// her GitHub README laid out on the pages, and her "my skills" cover beside it.
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
