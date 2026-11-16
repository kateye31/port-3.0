import * as THREE from 'three';
import { pottedPlant } from './plants.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BOOKS as SHELF } from './content.js';

const BOOKS = ['things-fall-apart', 'dune', 'a-dolls-house', '1984', 'pragmatic-programmer',
  'wuthering-heights', 'hunger-games', 'lord-of-the-rings', 'prisoner-of-azkaban',
  'and-then-there-were-none', 'fundamentals-of-character-design'];
const matte = color => new THREE.MeshStandardMaterial({ color, roughness: .96 });
const box = (name, size, material) => { const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material); m.name = name; m.castShadow = m.receiveShadow = true; return m; };
const image = src => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });

// Covers are my real shelf: a tiny sample supplies each spine colour.
async function coverColour(slug) {
  const img = await image(`assets/books/${slug}.webp`);
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 24;
  const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0, 24, 24);
  const data = ctx.getImageData(0, 0, 24, 24).data; let r = 0, g = 0, b = 0, weight = 0;
  for (let i = 0; i < data.length; i += 4) {
    const hi = Math.max(data[i], data[i + 1], data[i + 2]), lo = Math.min(data[i], data[i + 1], data[i + 2]);
    if (hi > 242 && lo > 224) continue;
    const w = .35 + (hi - lo) / 255; r += data[i] * w; g += data[i + 1] * w; b += data[i + 2] * w; weight += w;
  }
  const c = new THREE.Color(r / weight / 255, g / weight / 255, b / weight / 255), hsl = {};
  c.getHSL(hsl); c.setHSL(hsl.h, Math.max(.34, hsl.s), THREE.MathUtils.clamp(hsl.l, .3, .58)); return c;
}

// The spine of a real book from my shelf: its title and author set along the
// spine in the cover's own colour, with a rule at head and tail.
function spineTexture(slug, colour) {
  const { title, author } = SHELF.find(x => x.image === slug), c = document.createElement('canvas'); c.width = 96; c.height = 384;
  const ctx = c.getContext('2d'), hsl = {}; colour.getHSL(hsl);
  const ink = hsl.l > .5 ? '#2A2018' : '#F3E9D2';
  ctx.fillStyle = `#${colour.getHexString()}`; ctx.fillRect(0, 0, 96, 384);
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(0, 0, 7, 384); ctx.fillRect(89, 0, 7, 384);      // the spine rounds away at the hinges
  ctx.fillStyle = ink; ctx.globalAlpha = .75; for (const y of [20, 27, 354, 361]) ctx.fillRect(14, y, 68, 2); ctx.globalAlpha = 1;
  ctx.translate(48, 192); ctx.rotate(Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let size = 30; do { ctx.font = `bold ${size}px Georgia, 'Times New Roman', serif`; size--; } while (ctx.measureText(title).width > 296 && size > 11);
  ctx.fillText(title, 0, -10);
  ctx.font = "italic 15px Georgia, 'Times New Roman', serif"; ctx.globalAlpha = .85; ctx.fillText(author, 0, 20, 290);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
// The cut edge of a block of pages.
let leaves = null;
function pageEdges() {
  if (leaves) return leaves;
  const c = document.createElement('canvas'); c.width = c.height = 64; const ctx = c.getContext('2d');
  ctx.fillStyle = '#EFE8D6'; ctx.fillRect(0, 0, 64, 64);
  for (let x = 0; x < 64; x += 2) { ctx.fillStyle = `rgba(120,104,80,${x % 8 ? .1 : .22})`; ctx.fillRect(x, 0, 1, 64); }
  leaves = new THREE.CanvasTexture(c); leaves.colorSpace = THREE.SRGBColorSpace; return leaves;
}
// A book: two boards and a spine wrapped round a block of pages that sits a
// little inside them. Origin at the bottom-left corner of the spine side, so a
// leaning book can pivot on the edge it actually rests on. w thick, h tall, d deep.
function makeBook(slug, colour, cover, w, h, d) {
  const book = new THREE.Group(); book.name = `shelf_book_${slug}`;
  const t = .008, cloth = matte(colour), parts = [[t, h, d, -(w / 2 - t / 2), 0], [t, h, d, w / 2 - t / 2, 0], [w, h, t, 0, d / 2 - t / 2]].map(([bw, bh, bd, x, z]) => { const g = new THREE.BoxGeometry(bw, bh, bd); g.translate(x, 0, z); return g; });
  const body = new THREE.Group(); body.position.set(w / 2, h / 2, 0); book.add(body);
  const boards = new THREE.Mesh(mergeGeometries(parts), cloth); boards.name = `${slug}_boards`;
  const pages = new THREE.Mesh(new THREE.BoxGeometry(w - 2 * t, h - .018, d - t - .012), new THREE.MeshStandardMaterial({ map: pageEdges(), roughness: 1 })); pages.name = `${slug}_pages`; pages.position.z = -.002;
  const spine = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: spineTexture(slug, colour), roughness: .92 })); spine.name = `${slug}_spine`; spine.position.z = d / 2 + .0012;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(d, h), new THREE.MeshStandardMaterial({ map: cover, roughness: .92 })); front.name = `${slug}_cover`; front.rotation.y = Math.PI / 2; front.position.x = w / 2 + .0012;
  for (const m of [boards, pages, spine, front]) { m.castShadow = m.receiveShadow = true; body.add(m); }
  return book;
}

export async function fillBookshelf(group) {
  const colours = await Promise.all(BOOKS.map(coverColour));
  const covers = await Promise.all(BOOKS.map(async slug => { const t = new THREE.Texture(await image(`assets/books/${slug}.webp`)); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t; }));
  let seed = 48271; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  // Shelf tops in the bookcase (furniture.js): y .605, 1.445, 2.285. Books stand
  // spine-out, a finger back from the front edge.
  const FRONT = -2.2;
  const shelves = [
    { y: .605, x: -2.9, books: [0, 1, 2, 3] },
    { y: 1.445, x: -2.9, books: [4, 5, 6] },
    { y: 2.285, x: -2.9, books: [7, 8] },
  ];
  for (const shelf of shelves) {
    let x = shelf.x, prev = 0;
    shelf.books.forEach((id, order) => {
      const w = .09 + rnd() * .05, h = .42 + rnd() * .15, d = .27 + rnd() * .06, last = order === shelf.books.length - 1;
      const book = makeBook(BOOKS[id], colours[id], covers[id], w, h, d);
      if (last) {
        // The end book leans back on the row: it rests on its lower edge with
        // its face against the top corner of the book before it.
        const lean = .3 + rnd() * .08;
        x += Math.min(h * Math.sin(lean), prev * Math.tan(lean));
        book.rotation.z = lean;
      }
      book.position.set(x, shelf.y, FRONT - d / 2 - rnd() * .02);
      group.add(book); x += w + .004; prev = h;
    });
  }
  // Two more lying flat on the bottom shelf, covers up.
  let top = .605;
  for (let i = 0; i < 2; i++) {
    const id = 9 + i, w = .07 - i * .012, h = .46 - i * .04, d = .3 - i * .02, book = makeBook(BOOKS[id], colours[id], covers[id], w, h, d);
    book.rotation.z = Math.PI / 2; book.rotation.y = 0;
    book.position.set(-1.72 - i * .02, top + .0005, FRONT - d / 2 - i * .01); group.add(book); top += w;
  }
  await shelfPhoto(group);
  shelfPlant(group);
}

async function shelfPhoto(group) {
  const img = await image('assets/photos/trip-madrid.webp'), tex = new THREE.Texture(img);
  tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
  const frame = box('shelf_trip_photo_frame', [.29, .25, .025], matte('#7A5547')); frame.position.set(-1.92, 1.445 + .128, -2.52); frame.rotation.set(-.1, THREE.MathUtils.degToRad(-4), 0);
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(.245, .2), new THREE.MeshStandardMaterial({ map: tex, roughness: .95 }));
  photo.name = 'shelf_trip_photo'; photo.position.z = .014; photo.receiveShadow = true; frame.add(photo); group.add(frame);
}

function shelfPlant(group) {
  const plant = pottedPlant({ size: .85, count: 9, seed: 23 }); plant.name = 'shelf_little_plant'; plant.position.set(-1.95, 2.285, -2.42);
  group.add(plant);
}

// Bedside lamp: glazed base, brass neck and a pleated paper shade. room.js
// lights whatever material is named lamp_*.
function pleats() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 8; const ctx = c.getContext('2d');
  for (let x = 0; x < 256; x += 8) { const g = ctx.createLinearGradient(x, 0, x + 8, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(.55, '#E4DAC6'); g.addColorStop(1, '#ffffff'); ctx.fillStyle = g; ctx.fillRect(x, 0, 8, 8); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(2, 1); return t;
}
export function bedsideLamp() {
  const lamp = new THREE.Group();
  const turn = (name, profile, material) => { const m = new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 32), material); m.name = name; m.castShadow = m.receiveShadow = true; lamp.add(m); };
  turn('Bedside_lamp_base', [[0, 0], [.13, 0], [.14, .02], [.11, .06], [.17, .2], [.15, .34], [.07, .43], [.05, .46], [0, .46]], new THREE.MeshStandardMaterial({ name: 'glaze', color: '#8FA79B', roughness: .9 }));
  turn('Bedside_lamp_neck', [[0, .46], [.022, .46], [.022, .6], [0, .6]], new THREE.MeshStandardMaterial({ name: 'brass', color: '#B08D57', roughness: .8 }));
  turn('Bedside_lamp_shade', [[.27, .54], [.18, .94]], new THREE.MeshStandardMaterial({ name: 'lamp_shade', color: '#F6EEDD', map: pleats(), roughness: .95, side: THREE.DoubleSide }));
  return lamp;
}

export async function addLivedInDetails(model, groups) {
  addMug(groups.get('desk'));
  await addWallPins(model);
}

function addMug(group) {
  const mug = new THREE.Group(); mug.name = 'desk_mug'; mug.position.set(-2.24, 1.495, 1.2); mug.rotation.y = -.12;
  const ceramic = matte('#718C87'), cup = new THREE.Mesh(new THREE.CylinderGeometry(.075, .065, .14, 24, 1, true), ceramic);
  cup.position.y = .07; cup.castShadow = true; mug.add(cup);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(.067, 24), matte('#4A3026')); coffee.rotation.x = -Math.PI / 2; coffee.position.y = .142; mug.add(coffee);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.052, .012, 8, 18, Math.PI * 1.6), ceramic); handle.position.set(.07, .078, 0); handle.rotation.y = Math.PI / 2; mug.add(handle);
  group.add(mug);
}

// Pinned on the bare back wall between the bookcase and the TV, above the
// record player; the window wall's corkboard already belongs to Education.
async function addWallPins(model) {
  const pins = new THREE.Group(); pins.name = 'back_wall_polaroids'; model.add(pins);
  const wallZ = -2.93;      // the plaster face of the back wall
  const photos = await Promise.all(['trip-dc', 'trip-hawaii', 'trip-nyc'].map(n => image(`assets/photos/${n}.webp`)));
  photos.forEach((img, i) => {
    const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
    const card = box(`wall_photo_card_${i + 1}`, [.3, .37, .012], matte('#F1E8D8'));
    card.scale.setScalar(1.3);
    card.position.set([-1.42, -1.02, -.64][i], [2.5, 2.74, 2.44][i], wallZ + .009 + i * .002); card.rotation.z = THREE.MathUtils.degToRad([4, -3, 6][i]);
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(.245, .245), new THREE.MeshStandardMaterial({ map: tex, roughness: .96 }));
    photo.name = `real_trip_photo_${i + 1}`; photo.position.set(0, .035, .007); card.add(photo);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(.026, 7, 5), matte(['#F05F5F', '#826AED', '#E9A938'][i])); pin.position.set(0, .155, .02); card.add(pin); pins.add(card);
  });
}
