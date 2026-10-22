import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BADGES } from './content.js';

// Furniture follows Katrina's room sketch (assets/drawn/sketch.webp): coat rack
// front-left, desk under the window, bookshelf in the back corner, TV with the
// globe above it, easel + slippers back-right, round table on the rug, bed
// front-right. Models are human-made (assets/models/CREDITS.txt); the room's
// walls, window and floor stay from room.glb.
const F = .15;            // floor surface height in room.glb
const K = 3.5;            // Kenney Furniture Kit units -> room units

// Old procedural props replaced by the models below.
const RETIRED = [/^Desk$/, /^Desk_chair$/, /^Bookshelf$/, /^Modern_TV$/, /^Bed$/, /^Rug$/, /^Cat$/, /^Easel$/,
  /^Floor_cushion$/, /^Floor_monstera/, /^Slipper/, /^Notebook$/, /^Globe_(base|continent|earth|stem)/, /^Lamp_/];

// [file, position, rotationY (deg), scale, interactive key, sits on]
const PLACEMENTS = [
  ['k-desk', [-2.62, F, .35], 90, K, 'desk'],
  ['k-computerScreen', [-2.9, null, .35], 90, K, 'desk', 'k-desk'],
  ['k-computerKeyboard', [-2.42, null, .38], 90, K, 'desk', 'k-desk'],
  ['k-computerMouse', [-2.42, null, -.32], 90, K, 'desk', 'k-desk'],
  ['k-plantSmall2', [-2.95, null, 1.25], 20, K, null, 'k-desk'],
  ['k-chairDesk', [-1.85, F, 1.55], -150, K, null],
  ['k-coatRackStanding', [-2.72, F, 2.62], 15, K, 'coatrack'],
  ['k-bookcaseOpen', [-2.3, F, -2.42], 0, K, 'bookshelf'],
  ['k-pottedPlant', [-2.95, F, -1.35], 0, K, null],
  ['k-books', [-2.62, F + 3.08 * 0.2, -2.45], 0, K, 'bookshelf'],
  ['k-books', [-2.05, F + 3.08 * 0.2, -2.42], 12, K, 'bookshelf'],
  ['k-books', [-2.55, F + 3.08 * 0.48, -2.45], -6, K, 'bookshelf'],
  ['k-books', [-2, F + 3.08 * 0.48, -2.43], 0, K, 'bookshelf'],
  ['k-books', [-2.48, F + 3.08 * 0.78, -2.44], 8, K, 'bookshelf'],
  ['k-cabinetTelevision', [.05, F, -2.45], 0, K, 'tv'],
  ['k-televisionModern', [.05, null, -2.5], 0, K, 'tv', 'k-cabinetTelevision'],
  ['k-speakerSmall', [-1.0, null, -2.5], -8, K * .9, 'tv', 'k-cabinetTelevision'],
  ['globe', [.3, 3.21, -2.63], 200, .075, 'globe'],
  ['easel', [3.0, F, -1.75], -55, .2, 'easel'],
  ['slippers', [2.15, F, -1.45], 25, .9, 'easel'],
  ['k-bedSingle', [2.3, F, .95], 0, 3.2, 'bed'],
  ['k-cabinetBed', [3.32, F, -.45], -90, K, 'bed'],
  ['k-lampRoundTable', [3.32, null, -.45], -90, K, 'lamp', 'k-cabinetBed'],
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

export async function furnish(model) {
  const retired = [];
  model.traverse(o => { if (RETIRED.some(r => r.test(o.name))) retired.push(o); });
  for (const o of retired) o.removeFromParent();

  const loader = new GLTFLoader(), cache = new Map();
  const files = [...new Set(PLACEMENTS.map(p => p[0]))];
  await Promise.all(files.map(async f => cache.set(f, (await loader.loadAsync(`assets/models/${f}.glb`)).scene)));

  const placed = new Map(), groups = new Map();
  const groupFor = key => {
    const id = key || 'decor';
    if (!groups.has(id)) { const g = new THREE.Group(); g.name = `room_${id}`; if (key) g.userData.interactive = key; model.add(g); groups.set(id, g); }
    return groups.get(id);
  };
  for (const [file, pos, deg, scale, key, sitsOn] of PLACEMENTS) {
    const item = normalize(cache.get(file).clone(true), scale);
    item.name = file;
    item.rotation.y = THREE.MathUtils.degToRad(deg);
    item.position.set(pos[0], pos[1] ?? placed.get(sitsOn).top, pos[2]);
    item.updateMatrixWorld(true);
    placed.set(file, { object: item, top: new THREE.Box3().setFromObject(item).max.y });
    groupFor(key).add(item);
  }

  // The painting on the back wall belongs to About, with the globe and easel.
  const painting = groupFor('painting');
  const art = [];
  model.traverse(o => { if (/^(Picture_frame|Picture_paper|Art_)/.test(o.name)) art.push(o); });
  art.forEach(o => painting.attach(o));

  const monitor = addScreen(placed.get('k-computerScreen').object, SCREENS.monitor);
  const tv = addScreen(placed.get('k-televisionModern').object, SCREENS.tv);
  const book = await skillsBook(groupFor('table'), placed.get('k-tableRound').top);
  model.updateMatrixWorld(true);
  return { lampBulb: placed.get('k-lampRoundTable').object, monitor, tv, book, screenObject: placed.get('k-computerScreen').object, tvObject: placed.get('k-televisionModern').object };
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
