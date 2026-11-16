import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// House plants grown leaf by leaf: a snake plant by the window, a leafy pot plant on
// the desk and shelf, an echeveria on the coffee table.
const lcg = seed => () => (seed = seed * 16807 % 2147483647) / 2147483647;
const SHAPES = {
  // half-width along the leaf, 0 at the stem to 1 at the tip
  sword: t => (.42 + .58 * Math.sin(Math.PI * Math.min(1, t * 1.15) ** .7)) * Math.sqrt(Math.max(0, 1 - t ** 3)),
  heart: t => Math.sin(Math.PI * t ** .45) ** .9 * (1 + .25 * (1 - t)),
  spoon: t => Math.sin(Math.PI * t ** 1.6) ** .6,
  oval: t => Math.sin(Math.PI * t ** .75) ** .75,
  stalk: () => 1,
};

// One leaf as a strip three points wide: the midrib leans out from the stem
// and droops, the blade cups around it and can twist as it grows.
function leaf({ len, wid, shape, lean, bend, cup = .2, twist = 0, segs = 8, from, to, rib, turn = 0, at = [0, 0, 0], v0 = 0 }) {
  const pos = [], col = [], uv = [], index = [], c = new THREE.Color(), ribC = new THREE.Color(rib || to);
  let x = 0, y = 0;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, a = lean + bend * t * t;
    if (i) { const m = lean + bend * (t - .5 / segs) ** 2; x += Math.sin(m) * len / segs; y += Math.cos(m) * len / segs; }
    const w = wid * SHAPES[shape](t), tw = twist * t;
    // blade normal (in the leaf's own plane of growth) and the width direction, twisted together
    const nx = -Math.cos(a), ny = Math.sin(a), cs = Math.cos(tw), sn = Math.sin(tw);
    for (const side of [-1, 0, 1]) {
      const lift = Math.abs(side) * cup * w;
      pos.push(x + nx * (side * w * sn + lift * cs), y + ny * (side * w * sn + lift * cs), side * w * cs - lift * sn * side);
      c.set(from).lerp(new THREE.Color(to), t); if (!side) c.lerp(ribC, .55);
      col.push(c.r, c.g, c.b); uv.push((side + 1) / 2, v0 + t * len);
    }
    if (i) { const b = (i - 1) * 3; index.push(b, b + 3, b + 1, b + 1, b + 3, b + 4, b + 1, b + 4, b + 2, b + 2, b + 4, b + 5); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(index);
  g.userData.tip = [x, y];
  g.rotateY(turn); g.translate(...at);
  return g;
}

function foliage(leaves, map) {
  const g = mergeGeometries(leaves); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ name: 'leaf', vertexColors: true, map: map || null, roughness: .9, side: THREE.DoubleSide }));
  m.name = 'plant_leaves'; m.castShadow = m.receiveShadow = true; return m;
}

// A thrown pot: foot, flared wall, rolled rim, and soil a finger below it.
function pot(top, foot, h, color, { rim = .02, saucer = false } = {}) {
  const group = new THREE.Group(), clay = new THREE.MeshStandardMaterial({ name: 'pot', color, roughness: .92 });
  const wall = [[0, 0], [foot, 0], [foot + .006, .012], [top, h - rim * 1.6], [top + rim, h - rim * 1.4], [top + rim * 1.15, h - rim * .5], [top + rim * .7, h], [top - .012, h], [top - .02, h - .04], [0, h - .04]];
  const body = new THREE.Mesh(new THREE.LatheGeometry(wall.map(([r, y]) => new THREE.Vector2(r, y)), 28), clay); body.name = 'plant_pot';
  const soil = new THREE.Mesh(new THREE.CircleGeometry(top - .014, 24), new THREE.MeshStandardMaterial({ name: 'soil', color: '#3A2A22', roughness: 1 }));
  soil.name = 'plant_soil'; soil.rotation.x = -Math.PI / 2; soil.position.y = h - .035;
  group.add(body, soil);
  if (saucer) {
    const dish = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [foot * 1.25, 0], [foot * 1.36, .022], [foot * 1.3, .024], [foot * 1.2, .01], [0, .01]].map(([r, y]) => new THREE.Vector2(r, y)), 28), clay);
    dish.name = 'plant_saucer'; group.add(dish); body.position.y = soil.position.y - (h - .035) + .008; soil.position.y += .008;
  }
  group.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  return group;
}

// Snake plant markings: dark blades, pale broken cross-bands, yellow margins.
function bands() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256;
  const ctx = c.getContext('2d'), rnd = lcg(19);
  ctx.fillStyle = '#3F6A47'; ctx.fillRect(0, 0, 64, 256);
  for (let y = 4; y < 256; y += 9 + rnd() * 14) {
    ctx.strokeStyle = `rgba(132,172,120,${.45 + rnd() * .35})`; ctx.lineWidth = 2 + rnd() * 4; ctx.beginPath();
    for (let x = 0; x <= 64; x += 8) ctx.lineTo(x, y + (rnd() - .5) * 7);
    ctx.stroke();
  }
  ctx.fillStyle = '#C7C56B'; ctx.fillRect(0, 0, 6, 256); ctx.fillRect(58, 0, 6, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

export function snakePlant() {
  const plant = pot(.27, .2, .6, '#E7DDCB', { rim: .022 }), rnd = lcg(404), leaves = [], soil = .565;
  for (let i = 0; i < 13; i++) {
    const inner = i < 5, turn = i * 2.4 + rnd() * .5, r = inner ? rnd() * .05 : .07 + rnd() * .1;
    const shade = .82 + rnd() * .22, tone = new THREE.Color(shade, shade, shade);
    leaves.push(leaf({
      len: inner ? 1.25 + rnd() * .4 : .7 + rnd() * .55, wid: .075 + rnd() * .03, shape: 'sword', segs: 10,
      lean: inner ? rnd() * .08 : .1 + rnd() * .14, bend: rnd() * .14, cup: .22, twist: (rnd() - .5) * 1.5,
      from: tone, to: tone, turn, at: [Math.cos(turn) * r, soil, -Math.sin(turn) * r], v0: rnd(),
    }));
  }
  plant.add(foliage(leaves, bands()));
  return plant;
}

// A leafy house plant the way one actually grows: every leaf on its own stalk
// from the crown, young ones upright in the middle, older ones arching outward
// under their own weight. Nothing reaches below the rim of the pot.
export function pottedPlant({ size = 1, count = 11, color = '#C2714F', seed = 5 } = {}) {
  const R = .1 * size, H = .15 * size, plant = pot(R, R * .74, H, color, { rim: .013 * size, saucer: true }), rnd = lcg(seed), parts = [];
  for (let i = 0; i < count; i++) {
    const age = (i + .5) / count, turn = i * 2.39996 + rnd() * .6;
    const lean = .12 + age * .75 + rnd() * .15, stalk = (.1 + age * .07 + rnd() * .04) * size, len = (.13 + rnd() * .04 + age * .03) * size;
    const at = [Math.cos(turn) * age * R * .35, H - .03 * size, -Math.sin(turn) * age * R * .35];
    const stem = leaf({ shape: 'stalk', len: stalk, wid: .006 * size, cup: 0, twist: 2.4, segs: 5, lean, bend: .2, turn, at, from: '#5E8A44', to: '#7FA75A' });
    const [tx, ty] = stem.userData.tip, tip = [at[0] + Math.cos(turn) * tx, at[1] + ty, at[2] - Math.sin(turn) * tx];
    parts.push(stem, leaf({
      shape: 'oval', len, wid: len * .4, cup: .18, segs: 8, twist: (rnd() - .5) * .5, turn: turn + (rnd() - .5) * .3, at: tip,
      lean: lean + .25, bend: .45 + age * .55 + rnd() * .2,      // the blade tips over where the stalk ends
      from: '#3F7D43', to: i % 3 ? '#74AE58' : '#93C56A', rib: '#CFE08C',
    }));
  }
  plant.add(foliage(parts));
  return plant;
}

// Echeveria: three whorls of fat, cupped leaves, blushing pink at the tips.
export function rosette() {
  const plant = pot(.1, .085, .11, '#7C9B93', { rim: .012 }), leaves = [], rnd = lcg(63);
  for (const [n, len, lean, lift] of [[9, .115, 1.2, 0], [7, .09, .8, .012], [5, .06, .4, .022], [3, .035, .15, .028]]) {
    for (let i = 0; i < n; i++) {
      const turn = i / n * Math.PI * 2 + lean * 2 + rnd() * .15;
      leaves.push(leaf({ len, wid: len * .42, shape: 'spoon', lean: lean + rnd() * .1, bend: -.25, cup: .38, segs: 6, from: '#6F9E8B', to: '#D9AFA8', rib: '#A3C7B0', turn, at: [0, .078 + lift, 0] }));
    }
  }
  plant.add(foliage(leaves));
  return plant;
}
