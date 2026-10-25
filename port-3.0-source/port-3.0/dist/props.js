import * as THREE from 'three';

const BOOKS = ['things-fall-apart', 'dune', 'a-dolls-house', '1984', 'pragmatic-programmer',
  'wuthering-heights', 'hunger-games', 'lord-of-the-rings', 'prisoner-of-azkaban',
  'and-then-there-were-none', 'fundamentals-of-character-design'];
const matte = color => new THREE.MeshStandardMaterial({ color, roughness: .96 });
const box = (name, size, material) => { const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material); m.name = name; m.castShadow = m.receiveShadow = true; return m; };
const image = src => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });

// Covers are Katrina's real shelf: a tiny sample supplies each spine colour.
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

export async function fillBookshelf(group) {
  const colours = await Promise.all(BOOKS.map(coverColour));
  let seed = 48271; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  // Shelf tops measured off the placed Kenney bookcase (upward faces at y .605,
  // 1.445, 2.285; boards span z -2.79 to -2.05), so books stand on the wood.
  const SHELF_Z = -2.42;
  const shelves = [
    { y: .605, x: -2.82, books: [0, 1, 2, 3], gap: .16 },
    { y: 1.445, x: -2.78, books: [4, 5, 6], gap: .24 },
    { y: 2.285, x: -2.72, books: [7, 8, 9], gap: .1 },
  ];
  for (const shelf of shelves) {
    let x = shelf.x;
    shelf.books.forEach((id, order) => {
      const w = .09 + rnd() * .055, h = .39 + rnd() * .18, d = .25 + rnd() * .07;
      const pivot = new THREE.Group(); pivot.name = `shelf_book_${BOOKS[id]}`;
      const cover = matte(colours[id]); const book = box(`${BOOKS[id]}_spine`, [w, h, d], cover); book.position.y = h / 2;
      // A paper band suggests a real jacket without inventing title lettering.
      if ((id + order) % 3 === 0) {
        const band = box(`${BOOKS[id]}_band`, [w + .003, .035, d + .004], matte('#E9DFC7')); band.position.y = h * (.08 + rnd() * .18);   // 58–76% up the spine (book is centred) book.add(band);
      }
      const tilt = THREE.MathUtils.degToRad(order === shelf.books.length - 1 ? -7 - rnd() * 5 : (rnd() - .5) * 3);
      // Lift by the corner's dip so a leaning book rests on its edge instead of sinking into the shelf.
      pivot.add(book); pivot.position.set(x, shelf.y + w / 2 * Math.abs(Math.sin(tilt)), SHELF_Z - rnd() * .04);
      pivot.rotation.z = tilt;
      group.add(pivot); x += w + .035 + (order === 1 ? shelf.gap : 0);
    });
  }

  // One short, imperfect stack leaves breathing room on the bottom shelf.
  for (let i = 0; i < 2; i++) {
    // Sits between the leaning 1984 (ends x -2.04) and the right post (inner face ~ -1.75).
    const id = 9 + i, book = box(`flat_${BOOKS[id]}`, [.26 - i * .025, .065, .29], matte(colours[id]));
    book.position.set(-1.885 + i * .008, .605 + .0325 + i * .065, SHELF_Z); book.rotation.y = THREE.MathUtils.degToRad(i ? -4 : 2); group.add(book);
  }
  await shelfPhoto(group);
  shelfPlant(group);
}

async function shelfPhoto(group) {
  const img = await image('assets/photos/trip-madrid.webp'), tex = new THREE.Texture(img);
  tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
  const frame = box('shelf_trip_photo_frame', [.29, .25, .025], matte('#7A5547')); frame.position.set(-1.87, 1.445 + .128, -2.5); frame.rotation.set(-.1, THREE.MathUtils.degToRad(-4), 0);
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(.245, .2), new THREE.MeshStandardMaterial({ map: tex, roughness: .95 }));
  photo.name = 'shelf_trip_photo'; photo.position.z = .014; photo.receiveShadow = true; frame.add(photo); group.add(frame);
}

function shelfPlant(group) {
  const plant = new THREE.Group(); plant.name = 'shelf_little_plant'; plant.position.set(-1.86, 2.285, -2.45);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.09, .07, .13, 10), matte('#C97861')); pot.position.y = .065; pot.castShadow = true; plant.add(pot);
  const leaf = matte('#71856C');
  for (const [x, y, rot] of [[-.035, .2, -.35], [.03, .22, .3], [0, .25, 0]]) {
    const l = new THREE.Mesh(new THREE.ConeGeometry(.045, .19, 5), leaf); l.position.set(x, y, 0); l.rotation.z = rot; l.castShadow = true; plant.add(l);
  }
  group.add(plant);
}

export async function addLivedInDetails(model, groups) {
  addMug(groups.get('desk'));
  addTote(groups.get('coatrack'));
  addBedding(groups.get('bed'));
  await addWallPins(model);
}

function addMug(group) {
  const mug = new THREE.Group(); mug.name = 'desk_mug'; mug.position.set(-2.32, 1.505, 1.06); mug.rotation.y = -.12;
  const ceramic = matte('#718C87'), cup = new THREE.Mesh(new THREE.CylinderGeometry(.075, .065, .14, 12, 1, true), ceramic);
  cup.position.y = .07; cup.castShadow = true; mug.add(cup);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(.067, 12), matte('#4A3026')); coffee.rotation.x = -Math.PI / 2; coffee.position.y = .142; mug.add(coffee);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.052, .012, 6, 12, Math.PI * 1.6), ceramic); handle.position.set(.07, .078, 0); handle.rotation.y = Math.PI / 2; mug.add(handle);
  group.add(mug);
}

// Hangs from the coat rack's front hook (tip measured at x -2.31, y 2.24, z 2.51):
// both straps loop over the arm, the bag hangs flat across it.
function addTote(group) {
  const tote = new THREE.Group(); tote.name = 'coat_rack_tote'; tote.position.set(-2.33, .08, 2.51); tote.rotation.y = Math.PI / 2 - .12;
  const cloth = matte('#D59A68'), bag = box('tote_bag', [.36, .46, .055], cloth); bag.position.y = 1.92; bag.rotation.z = .03; tote.add(bag);
  for (const z of [-.018, .018]) {
    const strap = new THREE.Mesh(new THREE.TorusGeometry(.1, .014, 5, 12, Math.PI), cloth); strap.position.set(0, 2.15, z); strap.castShadow = true; tote.add(strap);
  }
  group.add(tote);
}

function quiltTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#B96B73'; ctx.fillRect(0, 0, 256, 256);
  let seed = 91; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  ctx.lineCap = 'round';
  for (let i = -2; i < 12; i++) {
    ctx.strokeStyle = i % 2 ? '#EACDC1' : '#785879'; ctx.lineWidth = i % 2 ? 14 : 8; ctx.beginPath();
    for (let y = -10; y <= 266; y += 12) { const x = i * 28 + Math.sin(y * .055 + i) * 4 + (rnd() - .5) * 2; y < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
  }
  for (let i = 0; i < 10; i++) {
    ctx.strokeStyle = 'rgba(255,239,220,.52)'; ctx.lineWidth = 5 + i % 2 * 3; ctx.beginPath();
    for (let x = -8; x <= 264; x += 12) { const y = i * 29 + Math.sin(x * .045 + i) * 3; x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1.2, 2); return tex;
}

export function applyBedQuilt(bed) {
  const tex = quiltTexture();
  bed.traverse(o => { if (o.isMesh && o.name === 'Mesh_cover') o.material = new THREE.MeshStandardMaterial({ name: 'wobbly_quilt', map: tex, roughness: .98 }); });
}

// Measured on the Kenney single bed as placed: the cover's top is y .982 over
// x .94–2.76, z -.82–1.78; its pillow spans z 1.79–2.44 under the headboard.
// (The bed's bounding box tops out at the headboard, 1.35, so it can't be used.)
const COVER_TOP = .982;
function addBedding(group) {
  // A throw folded across the foot, its ends dropping over both side rails.
  const wool = matte('#D8A84E'), z = -.5;
  const fold = box('folded_foot_throw', [1.84, .045, .5], wool); fold.position.set(1.85, COVER_TOP - .009, z); fold.rotation.y = .025; group.add(fold);
  for (const [x, tilt] of [[.915, .06], [2.785, -.05]]) {
    const drop = box('folded_foot_throw_drop', [.04, .24, .5], wool); drop.position.set(x, COVER_TOP - .13, z); drop.rotation.z = tilt; group.add(drop);
  }
  // A second pillow tossed on top of the first (its top is y 1.067), a little crooked.
  const pillow = box('propped_second_pillow', [.82, .12, .5], matte('#E7D8C6'));
  pillow.position.set(1.95, 1.067 + .05, 2.16); pillow.rotation.set(-.08, -.16, .03); group.add(pillow);
}

// Pinned on the bare back wall between the bookcase and the TV, above the
// record player; the window wall's corkboard already belongs to Education.
async function addWallPins(model) {
  const pins = new THREE.Group(); pins.name = 'back_wall_polaroids'; model.add(pins);
  let paper = null; model.traverse(o => { if (!paper && /^Picture_paper/.test(o.name)) paper = o; });
  const wallZ = paper ? new THREE.Box3().setFromObject(paper).min.z : -2.74;
  const photos = await Promise.all(['trip-dc', 'trip-hawaii', 'trip-nyc'].map(n => image(`assets/photos/${n}.webp`)));
  photos.forEach((img, i) => {
    const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
    const card = box(`wall_photo_card_${i + 1}`, [.3, .37, .012], matte('#F1E8D8'));
    card.scale.setScalar(1.3);
    card.position.set([-1.52, -1.1, -.7][i], [2.5, 2.74, 2.44][i], wallZ + .012 + i * .002); card.rotation.z = THREE.MathUtils.degToRad([4, -3, 6][i]);
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(.245, .245), new THREE.MeshStandardMaterial({ map: tex, roughness: .96 }));
    photo.name = `real_trip_photo_${i + 1}`; photo.position.set(0, .035, .007); card.add(photo);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(.026, 7, 5), matte(['#F05F5F', '#826AED', '#E9A938'][i])); pin.position.set(0, .155, .02); card.add(pin); pins.add(card);
  });
}
