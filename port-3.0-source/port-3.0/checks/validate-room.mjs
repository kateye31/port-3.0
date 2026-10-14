import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const bytes=fs.readFileSync('dist/assets/room.glb');
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const model=gltf.scene;model.updateMatrixWorld(true);const groups=new Map(),meshes=[];let triangles=0;
model.traverse(o=>{if(o.userData.interactive)groups.set(o.userData.interactive,o);if(o.isMesh){meshes.push(o);triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;assert(o.geometry.attributes.position.count>0);}});
for(const key of ['work','about','notes','play','sketch','bed','cat'])assert(groups.has(key),`Missing ${key}`);
const size=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());assert(size.x>6&&size.x<9);assert(size.y>3&&size.y<6);assert(size.z>5&&size.z<8);
for(const key of ['bed','cat']){const center=new THREE.Box3().setFromObject(groups.get(key)).getCenter(new THREE.Vector3()),origin=new THREE.Vector3(10,10,14),ray=new THREE.Raycaster(origin,center.clone().sub(origin).normalize());let hit=ray.intersectObjects(meshes,false)[0]?.object;while(hit&&!hit.userData.interactive)hit=hit.parent;assert.equal(hit?.userData.interactive,key,`${key} cannot be selected from the front`);}
const aperture=new THREE.Raycaster(new THREE.Vector3(-5,2.9,1),new THREE.Vector3(1,0,0));const first=aperture.intersectObjects(meshes,false)[0];assert(!first||first.point.x>-3,'Window aperture must be empty geometry');
const src=fs.readFileSync('dist/room.js','utf8');assert(src.includes('controls.enablePan=false'));assert(src.includes('controls.maxPolarAngle=Math.PI/2.6'));assert(src.includes('sun.castShadow=true'));
console.log(JSON.stringify({result:'passed',bytes:bytes.length,meshes:meshes.length,triangles,groups:[...groups.keys()],bounds:size.toArray(),raycast:'bed and cat selectable; window opening unobstructed'},null,2));
