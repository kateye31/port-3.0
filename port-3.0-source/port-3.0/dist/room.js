import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SECTIONS, HOME, LAMP, sectionById, sectionForObject } from './sections.js';
import { furnish } from './furnish.js';
import { createCat } from './cat.js';
import { addEducationWall } from './education.js';
import { SHOWS, ALBUMS } from './content.js';
import { applyArtStyle, createInkPass } from './art-style.js';

// The room is the site map. This module owns the scene and camera; ui.js owns
// the page. They talk through the returned API and DOM CustomEvents:
//   room:hover  {key, section}   pointer is over an interactive object (or null)
//   room:pick   {key, section}   an object was clicked/tapped
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HOME_TARGET = new THREE.Vector3(0, 1.45, 0), HOME_DIR = new THREE.Vector3(10, 9.3, 14).normalize();
const lampColor = new THREE.Color('#FFD9A0');
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);

export async function createRoom({ canvas, onProgress = () => {} }) {
  const host = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.04;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  // Background follows the page's colour field so the room sits on it, not in a box.
  const ground = { from: new THREE.Color(HOME.ground), to: new THREE.Color(HOME.ground), at: 0 };
  scene.background = new THREE.Color(HOME.ground);
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 90);
  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: .07, rotateSpeed: .45, enablePan: false,
    minAzimuthAngle: .1, maxAzimuthAngle: Math.PI / 2 - .1, minPolarAngle: Math.PI / 5, maxPolarAngle: Math.PI / 2.6 });
  controls.target.copy(HOME_TARGET);

  const hemi = new THREE.HemisphereLight('#E7EEFF', '#7A5A44', .62); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#FFF0CE', 3.0);
  sun.position.set(-9, 6.5, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 7, bottom: -6, near: .5, far: 32 });
  sun.shadow.camera.updateProjectionMatrix(); sun.shadow.normalBias = .025; sun.shadow.bias = -.00015; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#FFE6F4', .85); fill.position.set(6, 5, 9); scene.add(fill);
  const lamp = new THREE.PointLight('#FFD9A0', 0, 4, 2); lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024);
  lamp.shadow.camera.near = .05; lamp.shadow.normalBias = .01; scene.add(lamp);
  const floorShadow = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .14 }));
  floorShadow.rotation.x = -Math.PI / 2; floorShadow.position.y = -.31; floorShadow.receiveShadow = true; scene.add(floorShadow);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const inkPass = createInkPass(scene, camera); composer.addPass(inkPass);
  const outline = new OutlinePass(new THREE.Vector2(800, 600), scene, camera);
  Object.assign(outline, { edgeStrength: 0, edgeGlow: 0, edgeThickness: 1, pulsePeriod: 0 });
  solidOutline(outline);
  composer.addPass(outline); composer.addPass(new OutputPass());

  const gltf = await new GLTFLoader().loadAsync('assets/room.glb', e => { if (e.total) onProgress(e.loaded / e.total); });
  const model = gltf.scene; scene.add(model); model.updateMatrixWorld(true);

  const furniture = await furnish(model);
  addEducationWall(model);
  inkPass.selectedObjects = applyArtStyle(model);
  const cat = await createCat(model, { reduced });
  inkPass.selectedObjects.push(...meshesOf(cat.object));
  // The bedside lamp: its shade glows, and a point light sits just above it.
  furniture.lampBulb.traverse(o => { if (o.isMesh && /lamp/i.test(o.material.name)) o.userData.lampEmission = 1.4; });
  const lampBox = new THREE.Box3().setFromObject(furniture.lampBulb);
  lamp.position.set((lampBox.min.x + lampBox.max.x) / 2, lampBox.max.y + .08, (lampBox.min.z + lampBox.max.z) / 2);
  model.updateMatrixWorld(true);

  const objects = new Map(), meshes = [];
  model.traverse(o => {
    // Keys left on kept architecture (e.g. the old globe's shelf) open nothing now.
    if (o.userData.interactive && o.userData.interactive !== LAMP.key && !sectionForObject(o.userData.interactive)) delete o.userData.interactive;
    if (o.userData.interactive) objects.set(o.userData.interactive, o);
    if (o.isMesh) { o.castShadow = o.receiveShadow = true; meshes.push(o); }
  });
  for (const section of SECTIONS) for (const key of section.objects)
    if (!objects.has(key)) throw new Error(`Section ${section.id} names a missing object: ${key}`);

  // Per-object highlight state, eased so hover never snaps.
  const glow = new Map();
  for (const [key, group] of objects) {
    group.traverse(o => {
      if (!o.isMesh) return;
      const clone = m => { const c = m.clone(); c.userData.baseEmission = c.emissive?.clone(); c.userData.baseIntensity = c.emissiveIntensity; return c; };
      o.material = Array.isArray(o.material) ? o.material.map(clone) : clone(o.material);
    });
    const color = key === LAMP.key ? LAMP.outline : sectionForObject(key).outline;
    glow.set(key, { color: new THREE.Color(color), amount: 0, from: 0, to: 0, at: 0 });
  }

  // Screens: the desk monitor shows the current project; the TV flips through
  // Katrina's favourite shows.
  const textureLoader = new THREE.TextureLoader(), textures = new Map();
  const texture = url => {
    if (!textures.has(url)) { const t = textureLoader.load(url); t.colorSpace = THREE.SRGBColorSpace; textures.set(url, t); }
    return textures.get(url);
  };
  // Crop media to the screen's shape (like object-fit: cover), never stretch.
  function cover(tex, mediaAspect, screenAspect) {
    tex.center.set(.5, .5);
    if (mediaAspect > screenAspect) tex.repeat.set(screenAspect / mediaAspect, 1); else tex.repeat.set(1, mediaAspect / screenAspect);
  }
  function showOn(screen, tex) {
    const m = screen.material, fit = () => {
      const src = tex.image; const w = src?.videoWidth || src?.naturalWidth || src?.width, h = src?.videoHeight || src?.naturalHeight || src?.height;
      if (w && h) cover(tex, w / h, screen.userData.aspect);
    };
    fit(); if (tex.image?.addEventListener) { tex.image.addEventListener('load', fit, { once: true }); tex.image.addEventListener('loadedmetadata', fit, { once: true }); }
    m.map = tex; m.color.set('#ffffff'); m.needsUpdate = true;
  }
  const tv = { index: 0, next: 0, pinned: null };
  function showOnTv(i) {
    tv.index = (i + SHOWS.length) % SHOWS.length;
    showOn(furniture.tv, texture(`assets/shows/${SHOWS[tv.index].image}.webp`));
  }
  SHOWS.forEach(s => texture(`assets/shows/${s.image}.webp`));   // warm the cache: no black flashes
  showOnTv(0);
  // The record player spins one of Katrina's favourite albums.
  const vinyl = { index: 0, next: 0, pinned: null };
  function playAlbum(i) {
    vinyl.index = (i + ALBUMS.length) % ALBUMS.length;
    furniture.record.label.map = texture(`assets/albums/${ALBUMS[vinyl.index].image}.webp`); furniture.record.label.needsUpdate = true;
  }
  playAlbum(0);
  // The desk monitor plays the current project's demo (or shows its still).
  let video = null, videoTex = null;
  function useVideo(el) {
    if (el === video) return;
    videoTex?.dispose(); video = el;
    videoTex = new THREE.VideoTexture(el); videoTex.colorSpace = THREE.SRGBColorSpace;
  }

  // Soft light through the window: a glowing prism from the window opening
  // along the sun's direction, fading as it reaches into the room.
  const shafts = makeShafts();
  // The window-light beams washed over the screens, so they stay out of the scene.
  shafts.visible = false;
  let lampAuto = true, light = null;

  let lampOn = true;
  try { const saved = localStorage.getItem('katrina-room:lamp-on'); if (saved) { lampOn = saved === 'true'; lampAuto = false; } } catch { /* storage blocked */ }
  function applyLamp() {
    lamp.intensity = lampOn ? (light?.night ? 9 : 6) : 0;
    objects.get(LAMP.key).traverse(o => {
      if (!o.isMesh || !o.userData.lampEmission) return;
      o.material.emissive.copy(lampOn ? lampColor : new THREE.Color(0));
      o.material.emissiveIntensity = lampOn ? o.userData.lampEmission : 0;
    });
  }
  applyLamp();

  // Orlando time of day: sun colour/height through the window, ambient, the
  // window glow, and the lamp switching itself on after dark.
  const homeGround = new THREE.Color(HOME.ground);
  function setClock(l) {
    light = l;
    const height = 2.2 + l.height * 5.5;
    sun.position.set(-9, height, 3.5 - l.height * 2); sun.color.set(l.sunColor); sun.intensity = l.sun;
    hemi.intensity = l.ambient; hemi.color.set(l.night ? '#9AA8E8' : '#E7EEFF');
    fill.intensity = l.night ? .25 : .85; fill.color.set(l.night ? '#9FA8FF' : '#FFE6F4');
    renderer.toneMappingExposure = l.night ? .95 : 1.04;
    shafts.material.uniforms.tint.value.set(l.sunColor);
    shafts.material.uniforms.strength.value = l.shafts;
    orientShafts(shafts, sun);
    homeGround.set(l.ground);
    if (mode === 'home') setGround(l.ground);
    if (lampAuto && lampOn !== l.night) { lampOn = l.night; }
    applyLamp();
  }

  // ---------- camera ----------
  let width = 1, height = 1, homeDistance = 16;
  const shift = { x: 0, y: 0, tx: 0, ty: 0 };      // view offset, fraction of viewport
  let flight = null, mode = 'home', activeSection = null, userMoved = false;
  const parallax = { x: 0, y: 0, tx: 0, ty: 0 };

  function homePose() {
    return { position: HOME_TARGET.clone().addScaledVector(HOME_DIR, homeDistance), target: HOME_TARGET.clone() };
  }
  function sectionPose(section) {
    // Frame the section's objects: fit their bounding sphere into the part of
    // the screen the page leaves free, seen from the section's direction.
    const s = section.shot, box = new THREE.Box3();
    for (const key of s.frame || section.objects) box.expandByObject(objects.get(key) || model.getObjectByName(key));
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, s.minRadius || 0);
    const phone = width < 760, vFov = THREE.MathUtils.degToRad(camera.fov);
    // Usable viewport: ~58% of the width beside the panel, or ~44% of the height above it.
    const usableW = phone ? .9 : .46, usableH = phone ? .36 : .78;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect * usableW);
    const fov = Math.min(hFov, 2 * Math.atan(Math.tan(vFov / 2) * usableH));
    const distance = radius * (s.fit || 1.15) / Math.sin(fov / 2);
    const target = sphere.center.clone(); if (s.lift) target.y += s.lift;
    return { position: target.clone().addScaledVector(new THREE.Vector3(...s.dir).normalize(), distance), target };
  }
  function fly(pose, duration) {
    controls.enabled = false;
    if (reduced || !duration) { camera.position.copy(pose.position); controls.target.copy(pose.target); flight = null; return; }
    const from = { position: camera.position.clone(), target: controls.target.clone() };
    const lift = Math.min(1.6, from.position.distanceTo(pose.position) * .12);
    flight = { from, to: pose, at: performance.now(), duration, lift };
  }
  function framing() {
    // Leave room for the page: name on the left at home, content on the
    // right (desktop) or bottom (phone) inside a section.
    const phone = width < 760;
    if (mode === 'home') { shift.tx = phone ? 0 : -.235; shift.ty = phone ? -.2 : 0; }
    else {
      // Centre the object in the space left of the panel (panel = min(500px, 38vw) + gutter).
      const free = width - Math.min(500, width * .38) - Math.min(72, Math.max(16, width * .045));
      shift.tx = phone ? 0 : .5 - free / 2 / width; shift.ty = phone ? .22 : -.05;
    }
  }
  function resize() {
    width = host.clientWidth; height = host.clientHeight; if (!width || !height) return;
    renderer.setSize(width, height, false); composer.setSize(width, height);
    camera.aspect = width / height;
    const aspect = width / height;
    homeDistance = aspect < .62 ? 25 : aspect < .8 ? 22 : aspect < 1.1 ? 19.5 : 17.5;
    controls.minDistance = homeDistance * .8; controls.maxDistance = homeDistance * 1.2;
    framing();
    if (!flight) {
      if (mode === 'home' && !userMoved) { const p = homePose(); camera.position.copy(p.position); controls.target.copy(p.target); }
      if (mode === 'section') { const p = sectionPose(activeSection); camera.position.copy(p.position); controls.target.copy(p.target); }
    }
    applyViewOffset();
  }
  function applyViewOffset() {
    camera.setViewOffset(width, height, shift.x * width, shift.y * height, width, height);
    camera.updateProjectionMatrix();
  }
  controls.addEventListener('start', () => { userMoved = true; });

  // ---------- picking ----------
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ndc.set((clientX - r.left) / r.width * 2 - 1, -(clientY - r.top) / r.height * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    let o = raycaster.intersectObjects(meshes, false)[0]?.object;
    while (o) { if (o.userData.interactive) return o.userData.interactive; o = o.parent; }
    return null;
  }
  let hovered = null, forced = null, press = null, pendingMove = null;
  function setHover(key) {
    if (key === hovered) return;
    hovered = key; refreshGlow();
    host.dispatchEvent(new CustomEvent('room:hover', { bubbles: true, detail: { key, section: key && sectionForObject(key) } }));
  }
  function refreshGlow() {
    const now = performance.now(), key = forced || hovered;
    // Outline every object of the hovered object's section, in that section's tint.
    const section = key && key !== LAMP.key ? sectionForObject(key) : null;
    const lit = new Set(section ? section.objects : key ? [key] : []);
    for (const [k, g] of glow) { const to = lit.has(k) ? 1 : 0; if (g.to !== to) { g.from = g.amount; g.to = to; g.at = now; } }
    if (lit.size) {
      outline.selectedObjects = [...lit].map(k => objects.get(k));
      outline.visibleEdgeColor.copy(glow.get([...lit][0]).color);
      outline.overlayMaterial.uniforms.lineColor.value.copy(outline.visibleEdgeColor);
    }
  }
  function stepGlow(now) {
    let peak = 0;
    for (const [key, g] of glow) {
      const p = reduced ? 1 : Math.min(1, (now - g.at) / 180);
      g.amount = g.from + (g.to - g.from) * easeOut(p);
      peak = Math.max(peak, g.amount);
      if (g.amount === 0 && g.to === 0 && !g.dirty) continue;
      g.dirty = g.amount > 0;
      objects.get(key).traverse(o => {
        if (!o.isMesh) return;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          if (!m.emissive) continue;
          const isLamp = Boolean(o.userData.lampEmission);
          if (isLamp && !lampOn) { m.emissive.set(0); m.emissiveIntensity = 0; continue; }
          m.emissive.copy(isLamp ? lampColor : m.userData.baseEmission);
          m.emissiveIntensity = isLamp ? o.userData.lampEmission : m.userData.baseIntensity || 1;
          m.emissive.lerp(g.color, g.amount * (isLamp ? 1 : .22));
        }
      });
    }
    outline.edgeStrength = 6 * peak;
    if (peak === 0) outline.selectedObjects = [];
  }

  canvas.addEventListener('pointermove', e => { pendingMove = e; if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 6) press.dragged = true; });
  canvas.addEventListener('pointerleave', () => { pendingMove = null; setHover(null); });
  canvas.addEventListener('pointerdown', e => { press = { x: e.clientX, y: e.clientY, dragged: false, type: e.pointerType }; });
  canvas.addEventListener('pointercancel', () => { press = null; });
  canvas.addEventListener('pointerup', e => {
    if (press && !press.dragged) {
      const key = pick(e.clientX, e.clientY);
      if (key) {
        if (press.type !== 'mouse') { forced = key; refreshGlow(); setTimeout(() => { forced = null; refreshGlow(); }, 650); }
        host.dispatchEvent(new CustomEvent('room:pick', { bubbles: true, detail: { key, section: key === LAMP.key ? null : sectionForObject(key) } }));
      }
    }
    press = null;
  });

  // ---------- frame loop ----------
  const anchor = new THREE.Vector3();
  let last = performance.now(), anchorsCb = null;
  new ResizeObserver(resize).observe(host); resize();
  renderer.setAnimationLoop(() => {
    if (document.hidden) { last = performance.now(); return; }
    const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
    if (pendingMove && !press?.dragged && !flight) { setHover(pick(pendingMove.clientX, pendingMove.clientY)); pendingMove = null; }
    cat.update(dt);
    if (tv.pinned === null && now > tv.next) { if (tv.next) showOnTv(tv.index + 1); tv.next = now + 3800; }
    if (!reduced) furniture.record.disk.rotation.y -= dt * 3.5;    // 33⅓ rpm
    if (vinyl.pinned === null && now > vinyl.next) { if (vinyl.next) playAlbum(vinyl.index + 1); vinyl.next = now + 6000; }
    stepGlow(now);

    const gp = Math.min(1, (now - ground.at) / 700);
    scene.background.copy(ground.from).lerp(ground.to, easeOut(gp));

    if (flight) {
      const p = Math.min(1, (now - flight.at) / flight.duration), e = easeInOut(p);
      controls.target.lerpVectors(flight.from.target, flight.to.target, e);
      camera.position.lerpVectors(flight.from.position, flight.to.position, e);
      camera.position.y += Math.sin(Math.PI * e) * flight.lift;
      if (p === 1) { flight = null; controls.enabled = mode === 'home'; }
    } else if (mode === 'section' && activeSection.id === 'contact') {
      // Keep the wandering cat in frame.
      const p = sectionPose(activeSection);
      controls.target.lerp(p.target, .04); camera.position.lerp(p.position, .04);
    }
    // Gentle pointer parallax inside a section; the room "breathes" with you.
    parallax.x += (parallax.tx - parallax.x) * .05; parallax.y += (parallax.ty - parallax.y) * .05;
    const k = reduced ? 0 : .012;
    shift.x += (shift.tx + parallax.x * k - shift.x) * (reduced ? 1 : .08);
    shift.y += (shift.ty + parallax.y * k - shift.y) * (reduced ? 1 : .08);
    applyViewOffset();
    if (controls.enabled) controls.update(); else camera.lookAt(controls.target);

    if (anchorsCb) {
      const points = {};
      for (const s of SECTIONS) {
        if (s.anchor) anchor.set(...s.anchor); else anchor.copy(cat.getAnchor());
        anchor.project(camera);
        points[s.id] = { x: (anchor.x * .5 + .5) * width, y: (-anchor.y * .5 + .5) * height, visible: anchor.z < 1 };
      }
      furniture.record.disk.getWorldPosition(anchor); anchor.project(camera);
      points.vinyl = { x: (anchor.x * .5 + .5) * width, y: (-anchor.y * .5 + .5) * height, visible: anchor.z < 1 };
      // Left/right edges of the monitor, for the arrows that float beside it.
      const scr = furniture.monitor, w = scr.geometry.parameters.width / 2;
      for (const [id, x] of [['monitorL', -w], ['monitorR', w]]) {
        anchor.set(x, 0, 0); scr.localToWorld(anchor); anchor.project(camera);
        points[id] = { x: (anchor.x * .5 + .5) * width, y: (-anchor.y * .5 + .5) * height, visible: anchor.z < 1 };
      }
      anchorsCb(points);
    }
    composer.render();
  });

  return {
    sections: SECTIONS,
    goTo(id) {
      const section = sectionById(id); if (!section) return;
      mode = 'section'; activeSection = section; framing();
      setGround(section.ground);
      fly(sectionPose(section), activeSection === section && flight ? 1100 : 1500);

    },
    home() {
      mode = 'home'; activeSection = null; framing(); userMoved = false;
      setGround(homeGround.getStyle());
      fly(homePose(), 1300);
    },
    showProject(project) { setScreen(project); },
    setClock,
    toggleLamp() { lampOn = !lampOn; lampAuto = false; try { localStorage.setItem('katrina-room:lamp-on', String(lampOn)); } catch { /* fine */ } applyLamp(); return lampOn; },
    get lampOn() { return lampOn; },
    pet() { return cat.interact(); },
    playAlbum(i) { vinyl.pinned = i; if (i !== null) playAlbum(i); else vinyl.next = 0; },
    showShow(i) { tv.pinned = i; if (i !== null) showOnTv(i); else tv.next = 0; },
    highlightSection(id) { const s = sectionById(id); forced = s ? s.objects[0] : null; refreshGlow(); },
    onAnchors(cb) { anchorsCb = cb; },
    setParallax(x, y) { parallax.tx = x; parallax.ty = y; },
    setGround,
  };

  function setGround(color) { ground.from.copy(scene.background); ground.to.set(color); ground.at = performance.now(); }
  function setScreen(project) {
    const media = project.media;
    // With a playing video element (the one on the card), mirror it; otherwise its still.
    if (project.videoEl) { useVideo(project.videoEl); showOn(furniture.monitor, videoTex); }
    else showOn(furniture.monitor, texture(media.poster || media.image));
  }
}

// Four soft prisms of light, one per window pane (the mullion and crossbar
// leave dark gaps between them), stretching along the sun's direction.
const PANES = [[-1.3, .2, 1.62, 2.53], [.36, 1.85, 1.62, 2.53], [-1.3, .2, 2.67, 3.55], [.36, 1.85, 2.67, 3.55]];
function makeShafts() {
  const verts = PANES.length * 16, pos = new Float32Array(verts * 3), uv = new Float32Array(verts * 2), index = [];
  for (let p = 0; p < PANES.length; p++) for (let f = 0; f < 4; f++) {
    const base = p * 16 + f * 4;
    // u runs across a face, v along the beam (0 at the window).
    [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([u, v], i) => uv.set([u, v], (base + i) * 2));
    index.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(index);
  const mat = new THREE.ShaderMaterial({
    uniforms: { tint: { value: new THREE.Color('#FFF0D6') }, strength: { value: .6 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 tint; uniform float strength; varying vec2 vUv; void main(){ float edge = smoothstep(0.0, 0.45, vUv.x) * smoothstep(1.0, 0.55, vUv.x); float fade = pow(1.0 - vUv.y, 1.6) * smoothstep(0.0, 0.06, vUv.y); gl_FragColor = vec4(tint, strength * 0.11 * edge * fade); }',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'window_light'; mesh.frustumCulled = false; mesh.renderOrder = 2;
  mesh.raycast = () => {};
  return mesh;
}
function orientShafts(mesh, sun) {
  const dir = sun.target.position.clone().sub(sun.position).normalize(), L = 6.5, X = -3.3;
  const pos = mesh.geometry.attributes.position;
  PANES.forEach(([z0, z1, y0, y1], p) => {
    const near = [[z0, y0], [z1, y0], [z1, y1], [z0, y1]].map(([z, y]) => new THREE.Vector3(X, y, z));
    const far = near.map(v => v.clone().addScaledVector(dir, L));
    for (let f = 0; f < 4; f++) {
      const a = f, b = (f + 1) % 4, base = p * 16 + f * 4;
      [near[a], near[b], far[b], far[a]].forEach((v, i) => pos.setXYZ(base + i, v.x, v.y, v.z));
    }
  });
  pos.needsUpdate = true;
}

function meshesOf(object) { const list = []; object.traverse(o => { if (o.isMesh) list.push(o); }); return list; }

// OutlinePass adds light; on pale grounds a pastel edge vanishes. Composite it
// as solid coverage of one colour instead, like a felt-tip line.
function solidOutline(pass) {
  const overlay = pass.overlayMaterial;
  overlay.blending = THREE.NormalBlending;
  overlay.uniforms.lineColor = { value: new THREE.Color('#ffffff') };
  overlay.fragmentShader = 'uniform vec3 lineColor;\n' + overlay.fragmentShader.replace('gl_FragColor = finalColor;',
    'float coverage = clamp(max(max(finalColor.r, finalColor.g), finalColor.b) / max(max(lineColor.r, lineColor.g), max(lineColor.b, 0.001)), 0.0, 1.0);\n gl_FragColor = vec4(lineColor, coverage);');
}
