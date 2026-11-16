import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Hard furniture and the room's surfaces, built to real proportions (1 unit is
// about 55 cm) with eased edges, so nothing reads as a bare box.
const lcg = seed => () => (seed = seed * 16807 % 2147483647) / 2147483647;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const solid = (color, name = '') => new THREE.MeshStandardMaterial({ name, color, roughness: .9 });
function part(group, name, geometry, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, material); m.name = name; m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; group.add(m); return m;
}

// Timber: long wandering grain lines over broad soft bands. `grain` is "r,g,b".
// The lines close on themselves across the tile, so it repeats without a seam.
export function wood(base, grain, seed = 3, strength = 1) {
  return canvasTexture(512, 512, (ctx, S) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, S, S);
    const rnd = lcg(seed);
    for (let i = 0; i < 9; i++) {
      const y = rnd() * S, h = 20 + rnd() * 60; ctx.fillStyle = `rgba(${grain},${(.04 + rnd() * .05) * strength})`;
      ctx.fillRect(0, y, S, h); ctx.fillRect(0, y - S, S, h);
    }
    for (let i = 0; i < 110; i++) {
      const y0 = rnd() * S, amp = 1 + rnd() * 5, n = 1 + Math.floor(rnd() * 3), ph = rnd() * 6.28;
      ctx.strokeStyle = `rgba(${grain},${(.06 + rnd() * .14) * strength})`; ctx.lineWidth = .6 + rnd() * 1.6;
      for (const off of [0, -S, S]) { ctx.beginPath(); for (let x = 0; x <= S; x += 8) ctx.lineTo(x, y0 + off + Math.sin(x / S * 6.283 * n + ph) * amp); ctx.stroke(); }
    }
  });
}
const timber = (name, base, grain, seed, strength) => new THREE.MeshStandardMaterial({ name, map: wood(base, grain, seed, strength), roughness: .88 });
const OAK = ['#D6B287', '120,78,42'], WALNUT = ['#7A5340', '40,22,14'], TEAK = ['#9A6A48', '62,34,18'], SAGE = ['#A9B59C', '82,96,76'];

// A box with its edges eased, the way sawn and sanded timber (or moulded
// plastic) actually is. `up` runs the grain vertically on the upright faces.
export function softBox(w, h, d, r = .015, up = false) {
  const b = Math.min(r, w / 2 - .0005, h / 2 - .0005, d / 2 - .0005), x = w / 2 - b, z = d / 2 - b, c = Math.min(b * 1.5, x, z);
  const s = new THREE.Shape();
  s.moveTo(-x + c, -z); s.lineTo(x - c, -z); s.quadraticCurveTo(x, -z, x, -z + c); s.lineTo(x, z - c); s.quadraticCurveTo(x, z, x - c, z);
  s.lineTo(-x + c, z); s.quadraticCurveTo(-x, z, -x, z - c); s.lineTo(-x, -z + c); s.quadraticCurveTo(-x, -z, -x + c, -z);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 3 });
  g.rotateX(-Math.PI / 2); g.translate(0, -(h - 2 * b) / 2, 0);
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const [u, v] = ay >= ax && ay >= az ? [p.getX(i), p.getZ(i)] : ax >= az ? [p.getZ(i), p.getY(i)] : [p.getX(i), p.getY(i)];
    if (up && !(ay >= ax && ay >= az)) uv.setXY(i, v, u); else uv.setXY(i, u, v);
  }
  return g;
}

// ---------------- floor and walls ----------------
// Wide oak boards running the length of the room. Kept deliberately quiet:
// one even tone, faint grain, hairline joints, so the floor grounds the room
// and the furniture does the talking.
function parquet() {
  const S = 1024, ROW = 64;
  return canvasTexture(S, S, ctx => {
    ctx.fillStyle = '#9A7450'; ctx.fillRect(0, 0, S, S);
    const rnd = lcg(73);
    for (let row = 0; row < S / ROW; row++) {
      const y = row * ROW; let x = -rnd() * 400;
      while (x < S) {
        const len = 380 + rnd() * 260, light = 46 + rnd() * 3.5, hue = 27 + rnd() * 2;
        for (const off of [0, S]) {          // boards that run off the right edge come back in on the left
          ctx.fillStyle = `hsl(${hue} 32% ${light}%)`; ctx.fillRect(x - off, y, len, ROW);
          for (let i = 0; i < 5; i++) {
            const gy = y + 6 + rnd() * (ROW - 12); ctx.strokeStyle = `rgba(70,44,24,${.035 + rnd() * .05})`; ctx.lineWidth = .8 + rnd();
            ctx.beginPath(); ctx.moveTo(x - off, gy); ctx.bezierCurveTo(x - off + len * .3, gy + rnd() * 4 - 2, x - off + len * .7, gy + rnd() * 4 - 2, x - off + len, gy); ctx.stroke();
          }
          ctx.fillStyle = 'rgba(52,32,18,.22)'; ctx.fillRect(x - off + len - 1, y, 1.5, ROW);      // end joint
        }
        x += len;
      }
      ctx.fillStyle = 'rgba(52,32,18,.2)'; ctx.fillRect(0, y, S, 1.5);                              // joint between rows
    }
  });
}
// Limewashed plaster: soft clouds, trowel sweeps and a fine speckle. It
// multiplies the wall's own colour, so the wall keeps its tone.
function plaster() {
  const S = 512;
  return canvasTexture(S, S, ctx => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, S, S);
    const rnd = lcg(41), wrapped = draw => { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { ctx.save(); ctx.translate(dx, dy); draw(); ctx.restore(); } };
    for (let i = 0; i < 70; i++) {
      const x = rnd() * S, y = rnd() * S, r = 40 + rnd() * 120, a = .035 + rnd() * .05, dark = rnd() > .35;
      wrapped(() => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, dark ? `rgba(126,104,82,${a})` : `rgba(255,255,255,${a * 1.6})`); g.addColorStop(1, 'rgba(126,104,82,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); });
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      const x = rnd() * S, y = rnd() * S, r = 90 + rnd() * 160, a0 = rnd() * 6.28, len = .2 + rnd() * .4;
      ctx.strokeStyle = `rgba(110,90,70,${.008 + rnd() * .014})`; ctx.lineWidth = 14 + rnd() * 26;
      wrapped(() => { ctx.beginPath(); ctx.arc(x, y, r, a0, a0 + len); ctx.stroke(); });
    }
    for (let i = 0; i < 5000; i++) { ctx.fillStyle = `rgba(90,72,56,${.03 + rnd() * .05})`; ctx.fillRect(rnd() * S, rnd() * S, 1, 1); }
  });
}
export function finishRoom(model) {
  const shell = model.getObjectByName('Architecture') || model;
  model.updateMatrixWorld(true);
  // Floor: one slab whose top is the level everything stands on (y .15).
  const g = new THREE.BoxGeometry(6.8, .12, 5.98), p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) if (n.getY(i) > .5) uv.setXY(i, p.getX(i) / 3.6, p.getZ(i) / 3.6);
  const edge = solid('#86633F', 'floor_edge'), top = new THREE.MeshStandardMaterial({ name: 'floor_parquet', map: parquet(), roughness: .82 });
  const floor = new THREE.Mesh(g, [edge, edge, top, edge, edge, edge]); floor.name = 'Floorboard_parquet'; floor.receiveShadow = true;
  shell.add(floor); shell.worldToLocal(floor.position.set(0, .09, 0));
  // Walls: plaster laid on in world units so it runs unbroken across the wall's separate pieces.
  const lime = plaster();
  shell.traverse(o => {
    if (!o.isMesh || !/^(Back_wall|Left_(lower|upper|far_pier|near_pier))$/.test(o.name)) return;
    const geo = o.geometry = o.geometry.clone(), pos = geo.attributes.position, nor = geo.attributes.normal, uvs = new Float32Array(pos.count * 2), v = new THREE.Vector3(), nm = new THREE.Vector3(), rot = new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); nm.fromBufferAttribute(nor, i).applyMatrix3(rot);
      const along = Math.abs(nm.x) > Math.abs(nm.z) ? v.z : v.x; uvs[i * 2] = along / 2.4; uvs[i * 2 + 1] = Math.abs(nm.y) > .7 ? (Math.abs(nm.x) > 0 ? v.x : v.z) / 2.4 : v.y / 2.4;
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    o.material = new THREE.MeshStandardMaterial({ name: 'plaster', color: o.material.color, map: lime, roughness: .97 });
  });
}

// ---------------- desk ----------------
// Oak top on a three-drawer pedestal with painted fronts, and one bent steel
// sled leg at the open end. 2.57 long, 1.0 deep (it stands in front of the
// window sill, not under it), 1.345 tall. Front faces +z.
export function desk() {
  const W = 2.57, D = 1.0, H = 1.345, T = .06, g = new THREE.Group();
  const oak = timber('desk_oak', ...OAK, 11), cream = solid('#EFE6D6', 'desk_cream'), steel = solid('#E9E3D6', 'desk_leg'), pull = solid('#8C8377', 'desk_pull');
  part(g, 'Desk_top', softBox(W, T, D, .014), oak, 0, H - T / 2, 0);
  const pw = .66, ph = H - T - .05, pd = D - .08, px = W / 2 - pw / 2 - .05, front = -.03 + pd / 2;
  part(g, 'Desk_pedestal', softBox(pw, ph, pd, .012, true), oak, px, .05 + ph / 2, -.03);
  part(g, 'Desk_plinth', softBox(pw - .06, .05, pd - .08, .004), solid('#5C4433', 'desk_plinth'), px, .025, -.03);
  const fh = (ph - .05) / 3;
  for (let i = 0; i < 3; i++) {
    const y = .075 + fh * (i + .5);
    part(g, `Desk_drawer_${i + 1}`, softBox(pw - .06, fh - .022, .024, .008), cream, px, y, front + .012);
    const bar = new THREE.CylinderGeometry(.009, .009, .2, 10); bar.rotateZ(Math.PI / 2); bar.translate(0, 0, .03);
    const posts = [-.085, .085].map(x => { const c = new THREE.CylinderGeometry(.006, .006, .03, 8); c.rotateX(Math.PI / 2); c.translate(x, 0, .015); return c; });
    part(g, `Desk_drawer_pull_${i + 1}`, mergeGeometries([bar, ...posts]), pull, px, y + fh * .22, front + .024);
  }
  // Sled leg: one steel tube bent into a rounded loop (runner, two posts, top rail).
  const tr = .022, x = -W / 2 + .13, zf = D / 2 - .09, zb = -D / 2 + .09, yb = tr, yt = H - T - tr, r = .12;
  const pts = [[zf, yt], [zf, yb], [zb, yb], [zb, yt]].map(([z, y]) => new THREE.Vector3(x, y, z));
  const ends = pts.map((c, i) => [pts[(i + 3) % 4], pts[(i + 1) % 4]].map(o => c.clone().add(o.clone().sub(c).setLength(r))));
  const loop = new THREE.CurvePath();
  pts.forEach((c, i) => { loop.add(new THREE.QuadraticBezierCurve3(ends[i][0], c, ends[i][1])); loop.add(new THREE.LineCurve3(ends[i][1], ends[(i + 1) % 4][0])); });
  part(g, 'Desk_sled_leg', new THREE.TubeGeometry(loop, 200, tr, 12, true), steel);
  return g;
}

// ---------------- computer ----------------
// A 27-inch monitor: glossy black bezel, a rounded back housing (screens are
// never flat slabs from behind), and one curved ribbon of aluminium that
// sweeps back from the housing and down onto a flat base plate. The lit panel
// is a plane named screen_surface that room.js paints the current project onto.
export function monitor() {
  const g = new THREE.Group(), W = 1.32, H = .76, cy = .22 + (H + .06) / 2;
  const gloss = new THREE.MeshStandardMaterial({ name: 'monitor_bezel', color: '#121215', roughness: .32 });
  const shell = new THREE.MeshStandardMaterial({ name: 'monitor_back', color: '#1D1E22', roughness: .55 });
  const alu = new THREE.MeshStandardMaterial({ name: 'monitor_stand', color: '#2A2B30', roughness: .4, metalness: .35 });
  const head = softBox(W + .05, .04, H + .06, .016); head.rotateX(Math.PI / 2);
  part(g, 'Monitor_head', head, gloss, 0, cy, 0);
  // back housing: a shallow dome behind the panel, thickest where the electronics sit
  const back = new THREE.SphereGeometry(1, 48, 24, Math.PI, Math.PI); back.scale(W * .43, H * .42, .085);
  part(g, 'Monitor_housing', back, shell, 0, cy - .03, -.018);
  // stand: a flattened tube following the sweep, then a base plate under the front
  const sweep = new THREE.CatmullRomCurve3([[0, cy - .08, -.08], [0, cy - .2, -.135], [0, .3, -.165], [0, .13, -.15], [0, .04, -.08], [0, .018, .0]].map(p => new THREE.Vector3(...p)));
  const ribbon = new THREE.TubeGeometry(sweep, 60, .016, 16); ribbon.scale(5.5, 1, 1);
  part(g, 'Monitor_stand', ribbon, alu);
  part(g, 'Monitor_base', softBox(.44, .016, .3, .008), alu, 0, .008, -.06);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ color: '#1C2340', toneMapped: false }));
  screen.name = 'screen_surface'; screen.position.set(0, cy, .0205); screen.userData.aspect = W / H; g.add(screen);
  return g;
}
// Desk mat with a low-profile keyboard and a mouse on it.
export function deskSet() {
  const g = new THREE.Group(), keys = [], pitch = .058;
  part(g, 'Desk_mat', softBox(1.5, .008, .56, .004), solid('#55595F', 'desk_mat'), 0, .004, 0);
  part(g, 'Keyboard_base', softBox(.92, .02, .3, .009), solid('#C4C7CC', 'keyboard_base'), -.14, .018, .02);
  for (let row = 0; row < 5; row++) for (let col = 0; col < 15; col++) {
    const space = row === 4 && col >= 4 && col <= 9; if (space && col > 4) continue;
    const k = new THREE.BoxGeometry(space ? pitch * 6 - .008 : .05, .012, .046);
    k.translate(-.14 + (col - 7) * pitch + (space ? pitch * 2.5 : 0), .033, .02 + (row - 2) * .055); keys.push(k);
  }
  part(g, 'Keyboard_keys', mergeGeometries(keys), solid('#F1F0EB', 'keyboard_keys'));
  const body = new THREE.SphereGeometry(1, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2); body.scale(.062, .05, .105);
  const mouse = solid('#EEEDE8', 'mouse');
  part(g, 'Mouse', body, mouse, .56, .008, .03);
  part(g, 'Mouse_wheel', softBox(.012, .012, .034, .004), solid('#5E6268', 'mouse_wheel'), .56, .05, -.022);
  return g;
}

// ---------------- chair ----------------
// A task chair: five-star base on castors, gas lift, stuffed seat and a
// curved, slightly reclined back.
function weave(base, thread) {
  return canvasTexture(128, 128, (ctx, S) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, S, S);
    for (let y = 0; y < S; y += 4) for (let x = (y / 4) % 2 * 4; x < S; x += 8) { ctx.fillStyle = `rgba(${thread},.16)`; ctx.fillRect(x, y, 4, 2); ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(x + 4, y + 2, 4, 2); }
  });
}
function pad(w, h, d, wrap = 0) {
  const g = new THREE.BoxGeometry(w, h, d, 14, 4, 14), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / (w / 2), v = p.getZ(i) / (d / 2), s = p.getY(i) / (h / 2);
    const full = Math.pow(Math.max(0, (1 - u ** 4) * (1 - v ** 4)), .22);
    p.setY(i, s * h / 2 * full + wrap * u * u);
  }
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 5, uv.getY(i) * 5);
  g.computeVertexNormals(); return g;
}
export function chair() {
  const g = new THREE.Group(), frame = solid('#2C2C31', 'chair_frame'), cloth = new THREE.MeshStandardMaterial({ name: 'chair_cloth', map: weave('#C8767B', '110,40,48'), roughness: .96 });
  const base = [];
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + .3, spoke = softBox(.4, .034, .052, .01); spoke.translate(.22, .1, 0); spoke.rotateY(a);
    const wheel = new THREE.SphereGeometry(.04, 10, 8); wheel.scale(1, 1, .6); wheel.translate(.4, .04, 0); wheel.rotateY(a);
    base.push(spoke, wheel.toNonIndexed());
  }
  const hub = new THREE.CylinderGeometry(.055, .065, .09, 14).toNonIndexed(); hub.translate(0, .11, 0);
  const lift = new THREE.CylinderGeometry(.027, .034, .68, 12).toNonIndexed(); lift.translate(0, .47, 0);
  const plate = softBox(.34, .04, .52, .01); plate.translate(0, .82, -.13);
  const spine = softBox(.09, .66, .03, .01); spine.rotateX(-.14); spine.translate(0, 1.12, -.415);
  for (const q of [...base, hub, lift, plate, spine]) for (const name of Object.keys(q.attributes)) if (!['position', 'normal', 'uv'].includes(name)) q.deleteAttribute(name);
  part(g, 'Chair_frame', mergeGeometries([...base, hub, lift, plate, spine]), frame);
  // Upholstered cushions: foam blocks with well-rounded edges, the back
  // standing just clear of the seat on the steel spine.
  cloth.map.repeat.set(4, 4);
  part(g, 'Chair_seat', softBox(.8, .15, .76, .055), cloth, 0, .915, .02);
  const back = part(g, 'Chair_back', softBox(.72, .6, .13, .05), cloth, 0, 1.4, -.405); back.rotation.x = -.12;
  return g;
}

// ---------------- coat rack ----------------
// A turned walnut stand: weighted round foot, tapered pole, ball finial and a
// ring of six bentwood hooks. HOOK is where a strap rests on the hook that
// points along +x, measured from the stand's foot.
export const HOOK = { reach: .12, height: 2.42 };
export function coatRack() {
  const g = new THREE.Group(), wal = timber('rack_walnut', ...WALNUT, 21);
  const turn = profile => new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 28);
  part(g, 'Rack_foot', turn([[0, 0], [.3, 0], [.315, .018], [.3, .04], [.12, .075], [.06, .12], [.045, .2], [0, .2]]), wal);
  part(g, 'Rack_pole', turn([[0, .18], [.036, .18], [.03, 1.3], [.027, 2.56], [.04, 2.58], [.042, 2.6], [.024, 2.63], [.05, 2.68], [.055, 2.72], [.04, 2.77], [0, 2.78]]), wal);
  const hooks = [];
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2, y = HOOK.height + (i % 2 ? -.07 : 0);
    const arm = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[.02, y + .02], [.07, y - .015], [HOOK.reach, y - .026], [.19, y + .005], [.225, y + .085]].map(([r, h]) => new THREE.Vector3(r, h, 0))), 18, .014, 8);
    const knob = new THREE.SphereGeometry(.024, 10, 8); knob.translate(.228, y + .1, 0);
    for (const q of [arm, knob]) { q.rotateY(a); hooks.push(q.toNonIndexed()); }
  }
  part(g, 'Rack_hooks', mergeGeometries(hooks), wal);
  return g;
}

// ---------------- bookcase ----------------
// Painted pine: closed drawer base, three open shelves, panelled back, and a
// top that oversails the sides. Shelf tops sit at .455, 1.295 and 2.135 above
// the floor (the books in props.js stand on those).
export function bookcase() {
  const W = 1.4, D = .84, H = 3.08, g = new THREE.Group();
  const paint = timber('bookcase_paint', ...SAGE, 31, .55), brass = solid('#B08D57', 'bookcase_knob');
  const back = canvasTexture(256, 64, (ctx, w, h) => { ctx.fillStyle = '#97A48B'; ctx.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { ctx.fillStyle = 'rgba(52,64,48,.4)'; ctx.fillRect(x, 0, 2, h); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x + 2, 0, 2, h); } });
  back.repeat.set(1.5, 1);
  for (const side of [-1, 1]) part(g, 'Bookcase_side', softBox(.05, H - .05, D, .012, true), paint, side * (W / 2 - .025), (H - .05) / 2, 0);
  part(g, 'Bookcase_top', softBox(W + .07, .06, D + .04, .018), paint, 0, H - .03, .015);
  part(g, 'Bookcase_back', new THREE.BoxGeometry(W - .08, H - .1, .02), new THREE.MeshStandardMaterial({ name: 'bookcase_back', map: back, roughness: .92 }), 0, H / 2, -D / 2 + .02);
  part(g, 'Bookcase_plinth', softBox(W - .14, .07, D - .1, .006), solid('#7C8A72', 'bookcase_plinth'), 0, .035, 0);
  part(g, 'Bookcase_base', softBox(W - .1, .385, D - .03, .012), paint, 0, .07 + .1925, .005);
  part(g, 'Bookcase_drawer', softBox(W - .22, .27, .022, .01), paint, 0, .265, D / 2 - .004);
  for (const x of [-.3, .3]) part(g, 'Bookcase_knob', new THREE.SphereGeometry(.024, 12, 10), brass, x, .265, D / 2 + .028);
  for (const y of [1.295, 2.135]) part(g, 'Bookcase_shelf', softBox(W - .1, .045, D - .05, .01), paint, 0, y - .0225, .012);
  return g;
}

// ---------------- rug ----------------
// A cream wool rug with a hand-drawn charcoal diamond lattice and knotted
// fringe on the short ends.
export function rug() {
  const W = 3.0, D = 2.0, g = new THREE.Group();
  const pile = canvasTexture(768, 512, (ctx, w, h) => {
    ctx.fillStyle = '#EDE4D3'; ctx.fillRect(0, 0, w, h);
    const rnd = lcg(88);
    for (let i = 0; i < 9000; i++) { ctx.fillStyle = rnd() > .5 ? 'rgba(255,255,255,.1)' : 'rgba(120,100,78,.08)'; ctx.fillRect(rnd() * w, rnd() * h, 2, 2); }
    ctx.strokeStyle = 'rgba(74,62,58,.72)'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const step = 128, wob = () => (rnd() - .5) * 9;
    for (const dir of [1, -1]) for (let k = -6; k <= 12; k++) {      // two families of slightly unsteady diagonals
      ctx.lineWidth = 3.5 + rnd() * 2; ctx.beginPath();
      for (let t = -1; t <= 5; t++) { const y = t * step; ctx.lineTo(k * step + dir * y + wob(), y + wob()); }
      ctx.stroke();
    }
    ctx.lineWidth = 5; ctx.strokeRect(22, 22, w - 44, h - 44);
  });
  pile.wrapS = pile.wrapT = THREE.ClampToEdgeWrapping;
  const wool = solid('#E6DCCA', 'rug_edge');
  part(g, 'Rug_pile', new THREE.BoxGeometry(W, .02, D), [wool, wool, new THREE.MeshStandardMaterial({ name: 'rug_pile', map: pile, roughness: 1 }), wool, wool, wool], 0, .01, 0);
  const fringe = [], rnd = lcg(5);
  for (const end of [-1, 1]) for (let i = 0; i < 56; i++) {
    const f = new THREE.BoxGeometry(.1 + rnd() * .03, .006, .014); f.rotateY((rnd() - .5) * .3); f.translate(end * (W / 2 + .05), .004, -D / 2 + .03 + i * (D - .06) / 55); fringe.push(f);
  }
  part(g, 'Rug_fringe', mergeGeometries(fringe), wool);
  return g;
}

// ---------------- picture frame ----------------
// A moulded walnut frame with a cream mount, hung flat against the wall.
// Returns the frame and the mesh that takes the photograph.
export function pictureFrame(w, h) {
  const g = new THREE.Group(), mount = .085, mould = .07, ow = w + 2 * (mount + mould), oh = h + 2 * (mount + mould), iw = w + 2 * mount, ih = h + 2 * mount;
  const s = new THREE.Shape(); s.moveTo(-ow / 2, -oh / 2); s.lineTo(ow / 2, -oh / 2); s.lineTo(ow / 2, oh / 2); s.lineTo(-ow / 2, oh / 2); s.closePath();
  const hole = new THREE.Path(); hole.moveTo(-iw / 2, -ih / 2); hole.lineTo(-iw / 2, ih / 2); hole.lineTo(iw / 2, ih / 2); hole.lineTo(iw / 2, -ih / 2); hole.closePath(); s.holes.push(hole);
  const moulding = new THREE.ExtrudeGeometry(s, { depth: .028, bevelEnabled: true, bevelThickness: .014, bevelSize: .014, bevelSegments: 3 }); moulding.translate(0, 0, .014);
  part(g, 'Frame_moulding', moulding, timber('frame_walnut', ...WALNUT, 51));
  part(g, 'Frame_mount', new THREE.BoxGeometry(iw + .02, ih + .02, .008), solid('#F3ECDD', 'frame_mount'), 0, 0, .012);
  const photo = part(g, 'framed_photo', new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ roughness: .8 }), 0, 0, .0175); photo.castShadow = false;
  return { frame: g, photo, size: [ow, oh] };
}

// ---------------- work bag ----------------
// A black leather briefcase tote: one colour, structured, two rolled handles
// on brass rings. Built hanging: the origin is where the handles sit on the hook.
export function workBag() {
  const W = .46, H = .33, D = .12, DROP = .2, g = new THREE.Group();
  const hide = canvasTexture(256, 256, (ctx, S) => {
    ctx.fillStyle = '#242125'; ctx.fillRect(0, 0, S, S);
    const rnd = lcg(14);
    for (let i = 0; i < 2600; i++) { ctx.fillStyle = rnd() > .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.arc(rnd() * S, rnd() * S, .6 + rnd() * 1.6, 0, 7); ctx.fill(); }
    ctx.strokeStyle = 'rgba(150,140,134,.55)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
    ctx.strokeRect(9, 9, S - 18, S - 18);                                   // edge stitching
    ctx.strokeRect(S * .2, S * .42, S * .6, S * .46);                        // front pocket
    ctx.setLineDash([]); ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(S * .2, S * .42); ctx.lineTo(S * .8, S * .42); ctx.stroke();
  });
  const leather = new THREE.MeshStandardMaterial({ name: 'bag_leather', map: hide, roughness: .9 }), plain = solid('#242125', 'bag_leather_plain'), brass = solid('#B08D57', 'bag_ring');
  const body = new THREE.BoxGeometry(W, H, D, 12, 8, 4), p = body.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / (W / 2), t = Math.min(1, Math.max(0, p.getY(i) / H + .5));
    const round = t < .12 ? 1 - .1 * (1 - t / .12) ** 2 : 1;                 // bottom corners eased
    p.setXYZ(i, p.getX(i) * round * (1 - .03 * t), p.getY(i) - .01 * (1 - u * u) * (1 - t) ** 2, p.getZ(i) * (.72 + .28 * (1 - t) ** .8 + .12 * Math.sin(Math.PI * t) * (1 - u ** 4)));
  }
  body.computeVertexNormals();
  part(g, 'Bag_body', body, [plain, plain, plain, plain, leather, leather], 0, -DROP - H / 2, 0);
  for (const z of [-.014, .014]) {
    const reach = W * .24, face = Math.sign(z) * D * .36;
    const path = new THREE.CatmullRomCurve3([[-reach, -DROP + .01, face], [-reach * .86, -DROP * .5, z * 2], [-.03, 0, z], [.03, 0, z], [reach * .86, -DROP * .5, z * 2], [reach, -DROP + .01, face]].map(v => new THREE.Vector3(...v)));
    part(g, 'Bag_handle', new THREE.TubeGeometry(path, 30, .012, 8), plain);
    for (const x of [-reach, reach]) { const ring = part(g, 'Bag_ring', new THREE.TorusGeometry(.017, .005, 6, 14), brass, x, -DROP + .012, face); ring.rotation.y = Math.PI / 2; }
  }
  return g;
}

// ---------------- bed ----------------
// Oak platform bed: the mattress sits on top of the frame, which stands on
// short tapered legs, with a channel-tufted linen headboard. Headboard at +z.
// 1.8 wide, 3.6 long; mattress top .832 above the floor.
function turned(profile, segments = 16) { return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments); }
function ticking() {
  return canvasTexture(256, 256, (ctx, S) => {
    ctx.fillStyle = '#F2EDE3'; ctx.fillRect(0, 0, S, S);
    for (let x = 0; x < S; x += 16) { ctx.fillStyle = 'rgba(150,160,170,.18)'; ctx.fillRect(x, 0, 3, S); }
    ctx.strokeStyle = 'rgba(140,130,118,.35)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
    for (let y = 32; y < S; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke(); }
  });
}
export function bedFrame() {
  const g = new THREE.Group(), oak = timber('bed_oak', ...OAK, 61), legWood = timber('bed_leg', ...OAK, 62);
  const linen = new THREE.MeshStandardMaterial({ name: 'headboard_linen', map: weave('#B9B39F', '80,76,60'), roughness: .97 });
  const W = 1.8, L = 3.6, z0 = -L / 2;
  // frame: two side rails and a foot rail, with a slatted deck inside
  part(g, 'Bed_rail', softBox(.06, .21, 3.4, .012), oak, -W / 2 + .03, .385, -.1);
  part(g, 'Bed_rail', softBox(.06, .21, 3.4, .012), oak, W / 2 - .03, .385, -.1);
  part(g, 'Bed_rail_foot', softBox(W, .21, .06, .012), oak, 0, .385, z0 + .03);
  part(g, 'Bed_slat_deck', new THREE.BoxGeometry(W - .12, .02, 3.3), solid('#C9A97D', 'bed_slats'), 0, .48, -.1);
  for (const x of [-W / 2 + .1, W / 2 - .1]) for (const z of [z0 + .1, 1.5]) {
    const leg = part(g, 'Bed_leg', turned([[0, 0], [.03, 0], [.045, .28], [0, .28]], 14), legWood, x, 0, z);
    leg.rotation.set(z < 0 ? .06 : -.06, 0, x < 0 ? -.06 : .06);
  }
  part(g, 'Mattress', softBox(1.78, .34, 3.34, .07), new THREE.MeshStandardMaterial({ name: 'mattress', map: ticking(), roughness: .96 }), 0, .66, -.11);
  // headboard: oak back panel between two posts, five padded channels facing the mattress
  part(g, 'Headboard_back', softBox(W, 1.0, .06, .02, true), oak, 0, .78, L / 2 - .03);
  for (const x of [-W / 2 + .04, W / 2 - .04]) part(g, 'Headboard_post', softBox(.08, 1.05, .1, .02, true), oak, x, .755, L / 2 - .05);
  for (let i = 0; i < 5; i++) {
    const ch = pad(.32, .1, .78); ch.rotateX(-Math.PI / 2);
    part(g, 'Headboard_channel', ch, linen, -.66 + i * .33, .83, L / 2 - .1);
  }
  return g;
}

// ---------------- nightstand ----------------
// Cream painted cabinet with one drawer and an open cubby, on splayed oak legs.
// Front at +z. Top .65 above the floor.
export function nightstand() {
  const g = new THREE.Group(), paint = timber('nightstand_paint', '#ECE3D0', '150,130,100', 71, .45), oak = timber('nightstand_leg', ...OAK, 72);
  part(g, 'Nightstand_top', softBox(.6, .04, .62, .012), paint, 0, .63, 0);
  part(g, 'Nightstand_case', softBox(.56, .38, .58, .01, true), paint, 0, .42, -.005);
  part(g, 'Nightstand_cubby', new THREE.BoxGeometry(.48, .15, .02), solid('#C9BDA6', 'nightstand_inside'), 0, .33, .2);
  part(g, 'Nightstand_drawer', softBox(.5, .15, .02, .008), paint, 0, .51, .29);
  part(g, 'Nightstand_knob', new THREE.SphereGeometry(.02, 12, 10), solid('#B08D57', 'nightstand_knob'), 0, .51, .31);
  for (const x of [-.24, .24]) for (const z of [-.24, .24]) {
    const leg = part(g, 'Nightstand_leg', turned([[0, 0], [.014, 0], [.022, .24], [0, .24]], 10), oak, x, 0, z);
    leg.rotation.set(z > 0 ? .1 : -.1, 0, x > 0 ? -.1 : .1);
  }
  return g;
}

// ---------------- media console ----------------
// A teak sideboard of the kind found in any second-hand shop: a long top that
// oversails the case, two plain doors with slim brass pulls, an open bay for
// records, and four tapered legs set in from the corners. Front at +z, 2.8
// wide, top 1.09 high.
export function mediaConsole() {
  const g = new THREE.Group(), W = 2.8, D = .86, teak = timber('console_teak', ...TEAK, 81), inner = timber('console_inside', '#7A5238', '40,22,12', 83), brass = solid('#B08D57', 'console_pull');
  part(g, 'Console_top', softBox(W, .045, D, .016), teak, 0, 1.0675, 0);
  // carcass: floor, back, two ends and two uprights either side of the open bay
  part(g, 'Console_floor', softBox(W - .06, .04, D - .06, .01), teak, 0, .365, -.012);
  part(g, 'Console_back', new THREE.BoxGeometry(W - .1, .66, .02), inner, 0, .715, -D / 2 + .04);
  for (const x of [-W / 2 + .05, -.45, .45, W / 2 - .05]) part(g, 'Console_upright', softBox(.04, .66, D - .08, .008, true), teak, x, .715, -.012);
  for (const side of [-1, 1]) {
    part(g, 'Console_door', softBox(.9, .64, .022, .008), teak, side * .9, .715, D / 2 - .041);
    part(g, 'Console_pull', softBox(.014, .2, .022, .006), brass, side * .51, .715, D / 2 - .022);
  }
  for (const x of [-W / 2 + .22, W / 2 - .22]) for (const z of [-D / 2 + .14, D / 2 - .14]) {
    const leg = part(g, 'Console_leg', turned([[0, 0], [.016, 0], [.018, .03], [.034, .34], [0, .34]], 14), teak, x, 0, z);
    leg.rotation.set(z > 0 ? .07 : -.07, 0, x > 0 ? -.07 : .07);
  }
  // Records the way people keep them: upright, spines out, the last few leaning on the row.
  const spines = ['#E8E0D0', '#2B2A2E', '#B4643C', '#E8E0D0', '#4E6A78', '#D9A545', '#2B2A2E', '#8C1B2B', '#E8E0D0', '#5C7350', '#C9B79A'], rnd = lcg(12);
  let x = -.41;
  spines.forEach((c, i) => {
    const t = .014 + rnd() * .012, lean = i > 8 ? .1 : 0;
    const sleeve = new THREE.Group(); sleeve.position.set(x + (lean ? .05 : 0), .385, .02); sleeve.rotation.z = lean; g.add(sleeve);
    part(sleeve, 'Record_sleeve', new THREE.BoxGeometry(t, .54, .56), solid(c, 'record_spine'), t / 2, .27, 0);
    x += t + .003 + (lean ? .05 : 0);
  });
  return g;
}

// ---------------- wall shelf ----------------
// A teak board on two brass brackets, screwed to the wall. Built so the board's
// top is the top of the piece; the back edge sits against the plaster.
export function wallShelf() {
  const g = new THREE.Group(), W = 2.14, D = .5, teak = timber('shelf_teak', ...TEAK, 95), brass = solid('#B08D57', 'shelf_bracket');
  part(g, 'Shelf_board', softBox(W, .055, D, .016), teak, 0, .2525, 0);
  for (const x of [-.72, .72]) {
    part(g, 'Shelf_bracket_wall', softBox(.034, .225, .012, .004), brass, x, .1125, -D / 2 + .006);
    part(g, 'Shelf_bracket_arm', softBox(.034, .012, D - .1, .004), brass, x, .219, -.05);
    const brace = part(g, 'Shelf_bracket_brace', softBox(.02, .012, .27, .004), brass, x, .125, -D / 2 + .1); brace.rotation.x = -.76;
  }
  return g;
}

// ---------------- coffee table ----------------
// Round walnut table on three splayed, tapered legs. Top .65 above the floor.
export function coffeeTable() {
  const g = new THREE.Group(), wal = timber('table_walnut', ...WALNUT, 91), R = .84;
  part(g, 'Table_top', turned([[0, .6], [R - .02, .6], [R, .612], [R, .638], [R - .02, .65], [0, .65]], 48), wal);
  part(g, 'Table_apron', turned([[.3, .56], [.32, .56], [.32, .6], [.3, .6]], 32), wal);
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2 + .5, leg = turned([[0, 0], [.02, 0], [.034, .6], [0, .6]], 12);
    leg.rotateZ(-.16); leg.translate(.2, 0, 0); leg.rotateY(a);
    part(g, 'Table_leg', leg, wal);
  }
  return g;
}

// ---------------- suit jacket ----------------
// A black double-breasted blazer on a black hanger: structured shoulders, a
// nipped waist, peak lapels and two columns of buttons. Built around the hook
// it hangs from: the origin is the centre of the coat stand's arm, the jacket
// front faces +z and its width runs along x.
function suiting() {
  // Fine wool twill: diagonal ribs with a soft heather, the way worsted
  // suiting catches light up close.
  return canvasTexture(256, 256, (ctx, S) => {
    ctx.fillStyle = '#3A3A42'; ctx.fillRect(0, 0, S, S);
    for (let k = -S; k < S * 2; k += 4) {
      ctx.strokeStyle = k % 8 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.28)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k + S, S); ctx.stroke();
    }
    const rnd = lcg(29);
    for (let i = 0; i < 4000; i++) { ctx.fillStyle = rnd() > .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.06)'; ctx.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 3, 1); }
  });
}
export function suitJacket() {
  const g = new THREE.Group(), cloth = suiting();
  const wool = new THREE.MeshStandardMaterial({ name: 'jacket_wool', map: cloth, roughness: .82, vertexColors: true, side: THREE.DoubleSide });
  const plain = new THREE.MeshStandardMaterial({ name: 'jacket_wool_plain', map: cloth, roughness: .82 });   // sleeves and flaps carry no shading colours
  const facing = new THREE.MeshStandardMaterial({ name: 'jacket_lapel', map: cloth, color: '#bfc0c8', roughness: .62 });   // lapels are pressed and catch more light
  const plastic = new THREE.MeshStandardMaterial({ name: 'hanger', color: '#151517', roughness: .5 });
  const horn = new THREE.MeshStandardMaterial({ name: 'jacket_button', color: '#2B2724', roughness: .45 });

  // Body: rows from collar to hem as (half width, height, half depth), with how far
  // the shoulder slopes away from the neck at each row.
  const shape = new THREE.CatmullRomCurve3([[.07, -.1, .045], [.15, -.118, .05], [.225, -.15, .06], [.228, -.21, .068], [.205, -.34, .072], [.168, -.5, .058], [.19, -.64, .052], [.198, -.76, .048]].map(p => new THREE.Vector3(...p)));
  const slope = [0, .02, .05, .03, 0, 0, 0, 0];
  const ROWS = 64, SEG = 96, pos = [], uv = [], col = [], index = [];
  const opening = y => y > -.42 ? .072 * (y + .42) / .32 : Math.max(0, .03 * (-.62 - y) / .14 + .0);   // the V closes at the top button; the fronts part again below the last
  for (let r = 0; r <= ROWS; r++) {
    const t = r / ROWS, p = shape.getPoint(t), drop = THREE.MathUtils.lerp(slope[Math.floor(t * 7)], slope[Math.min(7, Math.floor(t * 7) + 1)], t * 7 % 1);
    for (let s = 0; s <= SEG; s++) {
      const th = s / SEG * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
      let x = p.x * Math.sign(c) * Math.abs(c) ** .55, z = p.z * Math.sign(sn) * Math.abs(sn) ** .75;
      let y = p.y - drop * (Math.abs(x) / p.x) ** 2;
      // soft drape: a few long folds settle into the lower back and sides
      z += .005 * Math.sin(x * 38) * t * (sn < 0 ? 1 : .3);
      // the open front: the cloth turns in, showing the dark inside of the back
      const open = opening(y); let dark = 0;
      if (sn > 0 && open > 0) { const f = THREE.MathUtils.smoothstep(open - Math.abs(x), -.004, .014); z = THREE.MathUtils.lerp(z, -p.z * .55, f); dark = f; }
      pos.push(x, y, z); uv.push(th / (Math.PI * 2) * 3.2, -y * 5); const v = 1 - .7 * dark; col.push(v, v, v);
      if (r && s) { const a = (r - 1) * (SEG + 1) + s - 1, b = a + 1, d = a + SEG + 1, e = d + 1; index.push(a, d, b, b, d, e); }
    }
  }
  const body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); body.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  body.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); body.setIndex(index); body.computeVertexNormals();
  part(g, 'Jacket_body', body, wool);
  // where the front surface sits at a given x and height, so things laid on it follow the curve
  const frontZ = (x, y) => { let best = .05; for (let r = 0; r <= 40; r++) { const p = shape.getPoint(r / 40); if (Math.abs(p.y - y) < .012) { const c = Math.min(1, Math.abs(x) / p.x) ** (1 / .55); best = p.z * Math.sqrt(Math.max(0, 1 - c * c)) ** .75; break; } } return best; };
  const onFront = (geo, lift) => { const q = geo.attributes.position; for (let i = 0; i < q.count; i++) q.setZ(i, q.getZ(i) + frontZ(q.getX(i), q.getY(i)) + lift); geo.computeVertexNormals(); return geo; };

  // Peak lapels, rolling from the collar down to the top button.
  for (const side of [-1, 1]) {
    const s = new THREE.Shape([[.07, -.1], [.095, -.115], [.14, -.17], [.165, -.205], [.128, -.215], [.11, -.235], [.1, -.3], [.06, -.38], [0, -.42], [.04, -.33], [.068, -.2], [.072, -.12]].map(([x, y]) => new THREE.Vector2(x * side, y)));
    const lapel = new THREE.ExtrudeGeometry(s, { depth: .006, bevelEnabled: true, bevelThickness: .002, bevelSize: .002, bevelSegments: 1, curveSegments: 4 });
    part(g, 'Jacket_lapel', onFront(lapel, .0), facing);
  }
  // Two columns of three buttons, and jetted hip pockets with flaps.
  for (const x of [-.06, .06]) for (const y of [-.42, -.5, -.58]) {
    const b = new THREE.CylinderGeometry(.011, .011, .006, 18); b.rotateX(Math.PI / 2); b.translate(x, y, 0);
    part(g, 'Jacket_button', onFront(b, .004), horn);
  }
  for (const side of [-1, 1]) part(g, 'Jacket_pocket_flap', onFront(softBox(.12, .036, .006, .002).translate(side * .115, -.6, 0), .002), plain);
  part(g, 'Jacket_breast_welt', onFront(softBox(.085, .014, .005, .002).translate(-.12, -.29, 0), .002), plain);

  // Sleeves fall from the shoulder seams, slightly forward, narrowing to the cuff.
  for (const side of [-1, 1]) {
    const sleeve = turned([[0, 0], [.058, 0], [.06, -.06], [.054, -.3], [.046, -.54], [.044, -.56], [0, -.56]], 28);
    sleeve.scale(1, 1, .82);
    const m = part(g, 'Jacket_sleeve', sleeve, plain, side * .222, -.17, .004);
    m.rotation.set(-.04, 0, side * .05);
  }
  // Hanger: a shoulder bar hidden inside, and a hook rising through the collar over the arm.
  const bar = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-.2, -.17, 0], [-.1, -.125, 0], [0, -.112, 0], [.1, -.125, 0], [.2, -.17, 0]].map(p => new THREE.Vector3(...p))), 24, .012, 8);
  const hook = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, -.112, 0], [0, -.07, 0], [.022, -.03, 0], [.025, .0, 0], [.012, .022, 0], [-.012, .022, 0], [-.025, .002, 0], [-.02, -.012, 0]].map(p => new THREE.Vector3(...p))), 40, .0045, 8);
  part(g, 'Jacket_hanger', mergeGeometries([bar, hook]), plastic);
  return g;
}

// ---------------- desk globe ----------------
// A 30 cm political desk globe (map: assets/EARTH-CREDITS.txt) on a
// varnished sphere, held on a brass half-meridian tipped to Earth's 23.4° axis,
// over a turned walnut stand. Origin at the bottom of the stand.
export function deskGlobe() {
  const g = new THREE.Group(), R = .26, tilt = THREE.MathUtils.degToRad(23.4), centre = .43;
  const map = new THREE.TextureLoader().load('assets/earth.webp'); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const brass = new THREE.MeshStandardMaterial({ name: 'globe_brass', color: '#B9955A', roughness: .35, metalness: .6 });
  const wal = timber('globe_walnut', ...WALNUT, 97);
  part(g, 'Globe_base', turned([[0, 0], [.17, 0], [.18, .012], [.175, .03], [.12, .045], [.05, .06], [.035, .1], [.03, .14], [0, .14]], 40), wal);
  part(g, 'Globe_stem', turned([[0, .14], [.022, .14], [.016, centre - R - .05], [.024, centre - R - .03], [0, centre - R - .03]], 24), brass);
  const axis = new THREE.Group(); axis.position.y = centre; axis.rotation.z = tilt; g.add(axis);
  const earth = part(axis, 'Globe_earth', new THREE.SphereGeometry(R, 96, 64), new THREE.MeshPhysicalMaterial({ name: 'globe_varnish', map, roughness: .62, clearcoat: .25, clearcoatRoughness: .5 }));
  earth.rotation.y = -1.9;      // turn the Atlantic and Africa toward the room
  // half meridian, a hair proud of the surface, with the axle caps at both poles
  const meridian = part(axis, 'Globe_meridian', new THREE.TorusGeometry(R + .018, .008, 10, 64, Math.PI), brass);
  meridian.rotation.z = -Math.PI / 2;
  for (const y of [R + .018, -(R + .018)]) part(axis, 'Globe_axle', new THREE.SphereGeometry(.011, 12, 10), brass, 0, y, 0);
  // the meridian sits in a short brass cradle on top of the stem
  part(g, 'Globe_cradle', softBox(.05, .03, .03, .008), brass, 0, centre - R - .03, 0);
  return g;
}
