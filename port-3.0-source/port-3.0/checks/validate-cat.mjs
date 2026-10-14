import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { addSketchbook } from '../dist/sketchbook.js';
import { createCatController, CAT_WAYPOINTS } from '../dist/cat.js';
import { applyArtStyle } from '../dist/art-style.js';
import { addEducationWall } from '../dist/education.js';
globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};

const bytes=fs.readFileSync('dist/assets/room.glb');
async function load(){const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');addSketchbook(gltf.scene);addEducationWall(gltf.scene);applyArtStyle(gltf.scene);return gltf;}
const gltf=await load();
assert.equal(gltf.animations.length,0);
const original=[];gltf.scene.getObjectByName('Cat').traverse(o=>{if(o.isMesh){assert(!o.isSkinnedMesh);original.push(o);}});
const controller=createCatController(gltf.scene,{random:()=>.5}), {cat}=controller;
const parts=[];cat.traverse(o=>{if(o.isMesh)parts.push(o);});
assert.equal(parts.length,22);assert.deepEqual(new Set(parts),new Set(original));
assert.equal(cat.userData.interactive,'cat');
const seen=new Set(), modes=new Set(), box=new THREE.Box3(), corner=new THREE.Vector3();
let maxRadius=0,minY=Infinity,stretches=0;
function checkPose(){
  for(const part of parts){
    box.setFromObject(part);
    for(const obstacle of controller.obstacles)assert(!box.intersectsBox(obstacle.box),`${part.name} intersects ${obstacle.name}`);
    minY=Math.min(minY,box.min.y);
    // Validate actual vertices against the rotation-independent swept-circle guard.
    const vertices=part.geometry.attributes.position;
    for(let j=0;j<vertices.count;j++){
      corner.fromBufferAttribute(vertices,j).applyMatrix4(part.matrixWorld);
      maxRadius=Math.max(maxRadius,Math.hypot(corner.x-cat.position.x,corner.z-cat.position.z));
    }
  }
}
for(let i=0;i<30*180;i++){
  if(i%251===0){const before=cat.position.clone();assert(controller.interact());assert(!controller.interact(),'Repeated click must not stack audio');controller.update(1/30);assert(cat.position.x===before.x&&cat.position.z===before.z,'Stretch pauses travel');stretches++;}
  controller.update(1/30);seen.add(controller.state.index);modes.add(controller.state.mode);
  if(controller.state.mode==='rest')assert(controller.state.wait<=30);
  checkPose();
}
assert.equal(seen.size,3);assert.deepEqual(modes,new Set(['stretch','rest','walk']));
assert.equal(controller.state.blocked,0);assert(maxRadius<.9,`Pose exceeds safe radius: ${maxRadius}`);
assert(minY>=.18,`Cat clips rug: ${minY}`);
assert(cat.getObjectByName('cat_head_rig').children.includes(cat.getObjectByName('cat_ear_rig')));
const staticScene=(await load()).scene,quiet=createCatController(staticScene,{reduced:true});
const before=quiet.cat.matrixWorld.clone();quiet.interact();for(let i=0;i<100;i++)quiet.update(.1);
assert(quiet.cat.matrixWorld.equals(before));assert.equal(quiet.state.mode,'rest');assert(quiet.interact());
console.log(JSON.stringify({result:'passed',frames:5400,stretches,waypoints:CAT_WAYPOINTS,maxRadius,minY,meshes:parts.length,checks:'rigid hierarchy, clearance against all low furniture, full route loop, pause/resume, click debounce, reduced motion'},null,2));
