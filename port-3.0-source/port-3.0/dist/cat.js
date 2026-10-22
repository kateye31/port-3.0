import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// "Cat" by elkiotbear (CC-BY 3.0, Poly Pizza). It sits still on the rug;
// clicking it gets a short meow.
const SPOT = [-1.25, 2.15], FLOOR = .15, SCALE = .26;

export async function createCat(model) {
  const gltf = await new GLTFLoader().loadAsync('assets/models/cat.glb');
  const body = gltf.scene;
  const box = new THREE.Box3().setFromObject(body), c = box.getCenter(new THREE.Vector3());
  body.position.set(-c.x, -box.min.y, -c.z);
  body.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.material = o.material.clone(); o.material.roughness = .9; o.material.metalness = 0; } });
  const cat = new THREE.Group(); cat.name = 'Cat'; cat.userData.interactive = 'cat';
  cat.add(body); cat.scale.setScalar(SCALE);
  cat.position.set(SPOT[0], FLOOR, SPOT[1]);
  cat.rotation.y = Math.atan2(-.8, 1);          // the model faces +x; turn it toward the room
  model.add(cat);

  let ctx = null;
  function meow() {
    try {
      ctx ||= new AudioContext();
      const o = ctx.createOscillator(), g = ctx.createGain(), now = ctx.currentTime;
      o.type = 'triangle'; o.frequency.setValueAtTime(620, now); o.frequency.exponentialRampToValueAtTime(940, now + .12); o.frequency.exponentialRampToValueAtTime(480, now + .42);
      g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(.12, now + .05); g.gain.exponentialRampToValueAtTime(.0001, now + .5);
      o.connect(g).connect(ctx.destination); o.start(now); o.stop(now + .52);
    } catch { /* no audio is fine */ }
  }

  return {
    object: cat,
    update() {},
    interact() { meow(); return true; },
    getAnchor() { return new THREE.Box3().setFromObject(cat).getCenter(new THREE.Vector3()).setY(cat.position.y + .95); },
  };
}
