import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { addSketchbook } from '../dist/sketchbook.js';
import { addEducationWall } from '../dist/education.js';
import { applyArtStyle } from '../dist/art-style.js';
globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
const bytes=fs.readFileSync('dist/assets/room.glb');
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
addSketchbook(scene);addEducationWall(scene);
const original=[];scene.traverse(o=>{if(o.isMesh)original.push(o);});
const outlined=applyArtStyle(scene);
assert(outlined.length>100);
for(const o of original){assert(scene.getObjectById(o.id),'Preserve all original meshes');for(const m of Array.isArray(o.material)?o.material:[o.material]){assert(m.roughness>=.85);assert.equal(m.metalness,0);assert(m.map);}}
for(const name of ['casual_mug','casual_slippers','casual_slippers001','casual_easel','loose_desk_pencil']){
  const angle=Math.abs(THREE.MathUtils.radToDeg(scene.getObjectByName(name).rotation.y));assert(angle>=2&&angle<=6);
}
for(const name of ['desk_sticky_note_1','desk_sticky_note_2','loose_desk_pencil']){
  const prop=scene.getObjectByName(name),box=new THREE.Box3().setFromObject(prop);
  assert.equal(prop.parent.name,'Desk','Clutter inherits Education picking');
  for(const o of original)assert(!box.intersectsBox(new THREE.Box3().setFromObject(o)),`${name} clips ${o.name}`);
}
assert(scene.getObjectByName('diploma_print').material[4].map.isCanvasTexture,'Retain printed diploma texture');
console.log('Art style passed: original meshes retained, matte materials, texture preservation, 2–6 degree rotations, clutter clearance and Education ownership.');
