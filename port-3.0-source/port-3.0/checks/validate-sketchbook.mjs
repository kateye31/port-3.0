import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { addSketchbook } from '../dist/sketchbook.js';
import { SECTIONS } from '../dist/sections.js';

const bytes = fs.readFileSync('dist/assets/room.glb');
const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
const original = scene.getObjectByName('Notebook');
const book = addSketchbook(scene);
scene.updateMatrixWorld(true);
assert.equal(book.getObjectByName('sketchbook_cover'), original, 'Reuse the existing notebook');
assert.equal(scene.getObjectByName('Notebook'), undefined, 'Do not leave a duplicate on the floor');
assert.deepEqual(SECTIONS[book.name], { section: 'about', color: '#FF7F6E' });
assert.equal(book.userData.interactive, 'sketchbook');
assert.equal(book.rotation.y, THREE.MathUtils.degToRad(4));
const bounds = new THREE.Box3().setFromObject(book);
const desk = new THREE.Box3().setFromObject(scene.getObjectByName('Desk_surface'));
assert(bounds.min.y >= desk.max.y, 'Book must sit above the tabletop');
for (const axis of ['x', 'z']) assert(bounds.min[axis] > desk.min[axis] && bounds.max[axis] < desk.max[axis], 'Book must fit on the desk');
for (const name of ['Pencil_cup', 'Mouse', 'Modern_monitor', 'Keyboard']) {
  assert(!bounds.intersectsBox(new THREE.Box3().setFromObject(scene.getObjectByName(name))), `Book intersects ${name}`);
}
const meshes = [];
scene.traverse(o => { if (o.isMesh) meshes.push(o); });
const center = bounds.getCenter(new THREE.Vector3());
const origin = new THREE.Vector3(0, 1.45, 0).addScaledVector(new THREE.Vector3(10, 9.3, 14).normalize(), 16);
let hit = new THREE.Raycaster(origin, center.clone().sub(origin).normalize()).intersectObjects(meshes, false)[0]?.object;
while (hit && !hit.userData.interactive) hit = hit.parent;
assert.equal(hit, book, 'Sketchbook must be directly clickable from the default camera');
const fallback = addSketchbook(new THREE.Group());
assert(fallback.getObjectByName('sketchbook_cover').isMesh, 'Box fallback must work without the GLB notebook');
console.log('Sketchbook passed: cover reuse, box fallback, placement, no prop collisions, default-camera raycast, coral About mapping.');
