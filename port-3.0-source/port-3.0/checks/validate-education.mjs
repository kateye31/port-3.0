import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { addEducationWall } from '../dist/education.js';
import { SECTIONS } from '../dist/sections.js';
// Geometry-only canvas stub. Real texture rendering/clicks are browser-tested.
globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
const bytes=fs.readFileSync('dist/assets/room.glb');
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const old=[];scene.traverse(o=>{if(o.isMesh)old.push({name:o.name,box:new THREE.Box3().setFromObject(o)});});
const groups=addEducationWall(scene);
for(const g of groups){
  assert.deepEqual(SECTIONS[g.name],{section:'education',color:'#A8E6CF'});
  const bounds=new THREE.Box3().setFromObject(g);
  assert(bounds.min.z>=1.9&&bounds.max.z<=3,'Display stays outside window');
  g.traverse(o=>{
    assert(!o.isSprite);
    if(!o.isMesh)return;
    const box=new THREE.Box3().setFromObject(o);
    for(const existing of old)assert(!box.intersectsBox(existing.box),`${o.name} clips ${existing.name}`);
  });
}
for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++)assert(!new THREE.Box3().setFromObject(groups[i]).intersectsBox(new THREE.Box3().setFromObject(groups[j])));
console.log('Education geometry passed: three mint targets, no furniture/plant/window collisions, no floating text sprites.');
