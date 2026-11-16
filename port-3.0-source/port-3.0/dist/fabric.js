import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Soft things: the bedding and the tote on the coat rack. Cloth is modelled as
// a sheet laid over a rounded slab that rolls over the edge and hangs in folds.
const lcg = seed => () => (seed = seed * 16807 % 2147483647) / 2147483647;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// Points around a rounded rectangle, evenly spaced, each with its outward
// normal and its distance along the edge.
function outline(halfW, halfL, r, n) {
  const a = halfW - r, b = halfL - r, q = Math.PI / 2;
  const parts = [
    { len: 2 * b, at: t => [halfW, -b + 2 * b * t, 1, 0] },
    { len: q * r, at: t => [a + r * Math.cos(q * t), b + r * Math.sin(q * t), Math.cos(q * t), Math.sin(q * t)] },
    { len: 2 * a, at: t => [a - 2 * a * t, halfL, 0, 1] },
    { len: q * r, at: t => [-a + r * Math.cos(q + q * t), b + r * Math.sin(q + q * t), Math.cos(q + q * t), Math.sin(q + q * t)] },
    { len: 2 * b, at: t => [-halfW, b - 2 * b * t, -1, 0] },
    { len: q * r, at: t => [-a + r * Math.cos(2 * q + q * t), -b + r * Math.sin(2 * q + q * t), Math.cos(2 * q + q * t), Math.sin(2 * q + q * t)] },
    { len: 2 * a, at: t => [-a + 2 * a * t, -halfL, 0, -1] },
    { len: q * r, at: t => [a + r * Math.cos(3 * q + q * t), -b + r * Math.sin(3 * q + q * t), Math.cos(3 * q + q * t), Math.sin(3 * q + q * t)] },
  ];
  const total = parts.reduce((s, p) => s + p.len, 0), points = [];
  for (let i = 0; i < n; i++) {
    let s = i / n * total, k = 0;
    while (s > parts[k].len) s -= parts[k++].len;
    const [x, z, nx, nz] = parts[k].at(s / parts[k].len);
    points.push({ x, z, nx, nz, s: i / n * total });
  }
  return points;
}

// A cloth lying on a flat top (y = 0) of halfW x halfL. `loft` is how thick it
// sits, `round` the radius it rolls over the edge with, `drops` how far it
// hangs on each side (px, nx, pz, nz), `fold` how deep the hanging folds get.
// uv(x, z) receives cloth coordinates, so a print runs unbroken over the edge.
function drape({ halfW, halfL, corner = .12, loft = .06, round = .05, drops = {}, fold = .03, wrinkle = .008, seed = 1, n = 112, uv = (x, z) => [x, z] }) {
  const rnd = lcg(seed), ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  const edge = outline(halfW, halfL, corner, n), TOP = 9, ARC = 3, HANG = 7;
  const pos = [], uvs = [], hem = [];
  const put = (x, y, z, cx, cz) => { pos.push(x, y, z); uvs.push(...uv(cx, cz)); };
  const bump = (x, z) => wrinkle * (Math.sin(x * 5.3 + ph[0]) * Math.sin(z * 4.1 + ph[1]) + .5 * Math.sin(x * 9.7 - z * 6.3 + ph[2]));
  const dropAt = e => (e.nx > 0 ? drops.px || 0 : drops.nx || 0) * e.nx * e.nx + (e.nz > 0 ? drops.pz || 0 : drops.nz || 0) * e.nz * e.nz;

  for (let j = 0; j <= TOP; j++) {
    const r = Math.pow(j / TOP, .75);
    for (const e of edge) { const x = e.x * r, z = e.z * r; put(x, loft + bump(x, z) * (1 - r ** 6), z, x, z); }
  }
  for (let k = 1; k <= ARC; k++) {
    const a = k / ARC * Math.PI / 2, out = round * Math.sin(a);
    for (const e of edge) put(e.x + e.nx * out, loft - round * (1 - Math.cos(a)), e.z + e.nz * out, e.x + e.nx * round * a, e.z + e.nz * round * a);
  }
  for (let h = 1; h <= HANG + 1; h++) {
    for (const e of edge) {
      const D = dropAt(e), t = Math.min(1, h / HANG), d = D * t, hangs = D > .02;
      // Spare cloth gathers at the corners, so the folds run deeper there.
      const gather = 1 + 1.6 * Math.abs(e.nx * e.nz) * 2;
      const wave = .5 + .5 * (.65 * Math.sin(e.s * 9.5 + ph[0]) + .35 * Math.sin(e.s * 23 + ph[1]));
      let out = round + (hangs ? .018 * t + fold * gather * t ** 1.4 * wave : 0);
      let y = loft - round - d + (hangs ? .014 * t * t * wave : 0);
      if (h > HANG && hangs) { out -= .024; y -= .004; }   // hem turns under: the cloth has some body
      put(e.x + e.nx * out, y, e.z + e.nz * out, e.x + e.nx * (round * 1.57 + d), e.z + e.nz * (round * 1.57 + d));
      if (h === HANG && hangs) hem.push({ x: e.x + e.nx * out, y, z: e.z + e.nz * out, drop: D });
    }
  }
  const rows = TOP + 1 + ARC + HANG + 1, index = [];
  for (let a = 0; a < rows - 1; a++) for (let i = 0; i < n; i++) {
    const i2 = (i + 1) % n, A = a * n + i, B = a * n + i2, C = (a + 1) * n + i, D = (a + 1) * n + i2;
    index.push(A, B, C, B, D, C);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(index); g.computeVertexNormals(); g.userData.hem = hem;
  return g;
}

// A stuffed cushion: full in the middle, pinched to a seam at the edge, with
// the four corners left a little proud like a real pillowcase.
function cushion(w, h, d, dent = 0) {
  const g = new THREE.BoxGeometry(w, h, d, 14, 4, 14), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / (w / 2), v = p.getZ(i) / (d / 2), s = p.getY(i) / (h / 2);
    const full = Math.pow(Math.max(0, (1 - u * u) * (1 - v * v)), .3);
    let y = s * h / 2 * full;
    if (s > 0) y -= dent * h * Math.exp(-(u * u + v * v) * 3.5);
    p.setXYZ(i, p.getX(i) * (1 - .05 * (1 - v * v)), y, p.getZ(i) * (1 - .05 * (1 - u * u)));
  }
  g.computeVertexNormals(); return g;
}

// Tonal damask for the duvet: an ogee trellis with a palmette in every cell,
// woven a shade darker than the ground the way jacquard shows its pattern.
function damask() {
  return canvasTexture(512, 512, (ctx, S) => {
    const dark = '#6C101F', vein = 'rgba(178,58,74,.7)';
    ctx.fillStyle = '#8C1B2B'; ctx.fillRect(0, 0, S, S);
    ctx.lineCap = ctx.lineJoin = 'round';
    for (const [width, style] of [[11, dark], [2.5, vein]]) {
      ctx.strokeStyle = style; ctx.lineWidth = width;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        for (let y = 0; y <= S; y += 4) ctx.lineTo(S / 2 + side * S / 4 * (1 - Math.cos(2 * Math.PI * y / S)), y);
        ctx.stroke();
      }
    }
    for (const [x, y] of [[S / 2, S / 2], [0, 0], [S, 0], [0, S], [S, S]]) palmette(ctx, x, y, S * .34, dark, vein);
    // the weave
    const rnd = lcg(7);
    for (let i = 0; i < 6000; i++) {
      ctx.fillStyle = rnd() > .5 ? 'rgba(255,196,196,.05)' : 'rgba(40,0,10,.07)';
      ctx.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 6, 1);
    }
  });
}
function palmette(ctx, cx, cy, s, fill, vein) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  for (const m of [1, -1]) {
    ctx.save(); ctx.scale(m, 1); ctx.fillStyle = fill;
    ctx.beginPath(); ctx.moveTo(0, .1); ctx.bezierCurveTo(.34, .12, .62, -.18, .36, -.5); ctx.bezierCurveTo(.36, -.3, .18, -.2, 0, -.2); ctx.fill();   // scroll leaf
    ctx.beginPath(); ctx.arc(.3, -.5, .075, 0, 7); ctx.fill();                                                                                         // its curl
    ctx.beginPath(); ctx.moveTo(0, .16); ctx.bezierCurveTo(.34, .14, .56, .38, .3, .66); ctx.bezierCurveTo(.28, .5, .14, .42, 0, .4); ctx.fill();       // lower leaf
    ctx.beginPath(); ctx.ellipse(.62, .06, .05, .09, .3, 0, 7); ctx.fill();                                                                            // side bud
    ctx.strokeStyle = vein; ctx.lineWidth = .02;
    ctx.beginPath(); ctx.moveTo(.05, .01); ctx.quadraticCurveTo(.32, -.06, .36, -.32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(.05, .25); ctx.quadraticCurveTo(.28, .3, .3, .5); ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.moveTo(0, -.78); ctx.bezierCurveTo(.16, -.5, .13, -.22, 0, -.14); ctx.bezierCurveTo(-.13, -.22, -.16, -.5, 0, -.78); ctx.fill();   // bud
  ctx.beginPath(); ctx.moveTo(0, .88); ctx.bezierCurveTo(.1, .72, .08, .6, 0, .52); ctx.bezierCurveTo(-.08, .6, -.1, .72, 0, .88); ctx.fill();          // pendant
  ctx.beginPath(); ctx.ellipse(0, .1, .11, .13, 0, 0, 7); ctx.fill();
  ctx.fillStyle = vein; ctx.beginPath(); ctx.ellipse(0, .1, .045, .055, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = vein; ctx.lineWidth = .02; ctx.beginPath(); ctx.moveTo(0, -.64); ctx.lineTo(0, -.26); ctx.stroke();
  ctx.restore();
}

// Chunky knit for the throw: rows of V stitches in undyed oatmeal wool.
function knit() {
  return canvasTexture(512, 64, (ctx, W, H) => {
    ctx.fillStyle = '#DDCDB0'; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1.6;
    for (let x = 0; x < W; x += 8) for (let y = 0; y < H; y += 8) {
      ctx.strokeStyle = 'rgba(92,58,28,.3)'; ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.lineTo(x + 4, y + 7); ctx.lineTo(x + 8, y + 1); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,251,238,.3)'; ctx.beginPath(); ctx.moveTo(x, y - 1); ctx.lineTo(x + 4, y + 5); ctx.lineTo(x + 8, y - 1); ctx.stroke();
    }
  });
}

const cloth = (name, geometry, material) => { const m = new THREE.Mesh(geometry, material); m.name = name; m.castShadow = m.receiveShadow = true; return m; };
const fabric = (color, map) => new THREE.MeshStandardMaterial({ color: map ? '#ffffff' : color, map: map || null, roughness: .96, side: THREE.DoubleSide });

// The bed. Measured on the frame as placed: mattress top y .982 over
// x .94–2.76, z -.82–1.78, then the pillow end up to the headboard at z 2.44.
const BED = { x: 1.85, top: .982 };
export function dressBed(bed, group) {
  const gone = [];
  bed.traverse(o => {
    if (!o.isMesh) return;
    if (o.name === 'pillow') gone.push(o);
    if (o.name === 'Mesh_cover') o.material = new THREE.MeshStandardMaterial({ name: 'bed_sheet', color: '#EFE6D8', roughness: .96 });
  });
  gone.forEach(o => o.removeFromParent());

  // Duvet: over both sides and the foot, turned down before the pillows.
  const duvet = cloth('duvet', drape({ halfW: .93, halfL: 1.19, loft: .075, round: .055, drops: { px: .36, nx: .36, nz: .34 }, fold: .055, wrinkle: .011, seed: 12, n: 128, uv: (x, z) => [x / .5, z / .5] }), fabric(null, damask()));
  duvet.position.set(BED.x, BED.top, .33);
  // The turn-down: the duvet folded back on itself, showing its plain lining.
  const cuff = cloth('duvet_turn_down', drape({ halfW: .938, halfL: .2, corner: .1, loft: .112, round: .058, drops: { px: .31, nx: .31 }, fold: .04, wrinkle: .006, seed: 31 }), fabric('#F3EADB'));
  cuff.position.set(BED.x, BED.top, 1.5);

  // The fitted sheet shows at the pillow end, running up to the headboard.
  const sheet = cloth('fitted_sheet', drape({ halfW: .9, halfL: .6, corner: .1, loft: .03, round: .03, drops: { px: .3, nx: .3 }, fold: .004, wrinkle: .007, seed: 5 }), fabric('#EFE6D8'));
  sheet.position.set(BED.x, BED.top, 1.84);

  // A knitted throw across the foot, hanging longer on the side facing the room.
  const span = [-1.26, 1.62];
  const throwGeo = drape({ halfW: .945, halfL: .27, corner: .08, loft: .1, round: .115, drops: { px: .5, nx: .17 }, fold: .034, wrinkle: .012, seed: 77, uv: (x, z) => [(x - span[0]) / (span[1] - span[0]), z / .36] });
  const yarn = fabric(null, knit());
  const throwBlanket = cloth('foot_throw', throwGeo, yarn);
  throwBlanket.position.set(BED.x, BED.top, -.37); throwBlanket.rotation.y = .03;
  const tassels = throwGeo.userData.hem.filter((p, i) => i % 2 === 0 && p.drop > .12).map(p => {
    const t = new THREE.CylinderGeometry(.004, .011, .075, 5); t.translate(p.x, p.y - .034, p.z); return t;
  });
  const fringe = cloth('foot_throw_fringe', mergeGeometries(tassels), fabric('#E2D2B4'));
  throwBlanket.add(fringe);

  // Pillows: one slept on, one cushion propped against it.
  const pillow = cloth('pillow', cushion(1.14, .3, .62, .14), fabric('#F6EFE3'));
  pillow.position.set(BED.x + .03, BED.top + .15, 2.1); pillow.rotation.y = .05;
  const accent = cloth('pillow_cushion', cushion(.52, .17, .5), fabric('#D9A545'));
  accent.position.set(BED.x - .3, BED.top + .27, 2.24); accent.rotation.set(-1.02, .2, .05);
  group.add(duvet, cuff, sheet, throwBlanket, pillow, accent);
}

// Curtains either side of the window: unlined white linen, pinch-pleated at
// the pole, the pleats relaxing toward the hem. The cloth has a vertical slub.
function curtainCloth() {
  return canvasTexture(64, 256, (ctx, W, H) => {
    ctx.fillStyle = '#F4EEE3'; ctx.fillRect(0, 0, W, H);
    const rnd = lcg(9);
    for (let x = 0; x < W; x++) { ctx.fillStyle = `rgba(150,130,104,${rnd() * .1})`; ctx.fillRect(x, 0, 1, H); }
    for (let i = 0; i < 90; i++) { ctx.fillStyle = 'rgba(150,130,104,.12)'; ctx.fillRect(rnd() * W, rnd() * H, 1, 6 + rnd() * 20); }
    ctx.fillStyle = 'rgba(150,130,104,.16)'; ctx.fillRect(0, H - 10, W, 1);      // hem stitch
  });
}
export function hangCurtains(model) {
  const linen = fabric(null, curtainCloth()), brass = new THREE.MeshStandardMaterial({ name: 'curtain_ring', color: '#AD8B50', roughness: .8 });
  const TOP = 3.69, HEM = 1.69, X = -3.07, PLEATS = 5;
  [[1.48, 1.96, 3], [-1.26, -.78, 8]].forEach(([z0, z1, seed], n) => {
    const cols = 60, rows = 14, pos = [], uv = [], index = [], ph = lcg(seed)() * 6;
    for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
      const u = c / cols, v = r / rows, pleat = Math.sin(u * Math.PI * 2 * PLEATS + ph);
      const z = (z0 + z1) / 2 + (u - .5) * (z1 - z0) * (1 + .1 * v);
      const x = X + pleat * (.026 + .03 * v) + .012 * Math.sin(v * 4 + u * 7 + ph) * v;
      pos.push(x, TOP - v * (TOP - HEM) + (r === rows ? .014 * pleat : 0), z); uv.push(u * 3, 1 - v);
      if (r && c) { const a = (r - 1) * (cols + 1) + c - 1, b = a + 1, d = a + cols + 1, e = d + 1; index.push(a, d, b, b, d, e); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(index); g.computeVertexNormals();
    const panel = cloth(`curtain_panel_${n + 1}`, g, linen); model.add(panel);
    const rings = [];
    for (let i = 0; i < PLEATS; i++) { const ring = new THREE.TorusGeometry(.05, .007, 5, 14); ring.rotateY(Math.PI / 2); ring.translate(-3.1, 3.71, z0 + (i + .5) / PLEATS * (z1 - z0)); rings.push(ring); }
    model.add(cloth(`curtain_rings_${n + 1}`, mergeGeometries(rings), brass));
  });
}
