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

  // A real meow (assets/sounds/CREDITS.txt), fetched the first time the cat is clicked.
  let mew = null;
  function meow() {
    try {
      mew ||= Object.assign(new Audio('assets/sounds/meow.mp3'), { volume: .7 });
      mew.currentTime = 0; mew.play().catch(() => {});
    } catch { /* no audio is fine */ }
  }

  return {
    object: cat,
    update() {},
    interact() { meow(); return true; },
    getAnchor() { return new THREE.Box3().setFromObject(cat).getCenter(new THREE.Vector3()).setY(cat.position.y + .95); },
  };
}
