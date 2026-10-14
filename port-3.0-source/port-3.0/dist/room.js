import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SECTIONS } from './sections.js';
import { addSketchbook } from './sketchbook.js';
import { createCatController } from './cat.js';
import { addEducationWall } from './education.js';
import { applyArtStyle, createInkPass } from './art-style.js';
const host=document.querySelector('#room'),canvas=document.querySelector('#room-canvas'),status=document.querySelector('#room-status'),hint=document.querySelector('#object-hint');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const labels=[...document.querySelectorAll('.object-label')];
const names={work:'The desk · Education',about:'The globe · About me',notes:'The shelf · Miscellaneous',play:'The TV · Projects',sketch:'The easel · About me',bed:'The bed · Experience',cat:'The cat · A little head scratch?',lamp:'The lamp · Toggle light'};
const sectionPanels={education:'education',about:'about',misc:'notes',projects:'work',experience:'experience'};
names.sketchbook='The sketchbook · About me';
names.cat='The ginger cat · Stretch + meow';
Object.assign(names,{diploma:'The diploma · Education',education_board:'The corkboard · Education',education_books:'The textbooks · Education'});
let catController,inkPass;
const highlightStates=new Map();
let focusOrigin=null,focusTween=null,focused=null;
const anchors={work:[-2.38,2.4,.28],about:[.30,3.95,-2.63],notes:[-2.3,3.5,-2.6],play:[-.2,2.52,-2.65],sketch:[2.63,2.05,2.32],bed:[2,1.4,-.5],cat:[-.30,.95,1.25]};
let renderer,camera,controls,composer,outline,scene,sun,hemi,lamp,hovered=null,selected=null,press=null,resetTween=null,labelVisible=true,homeDistance=16;
const objects=new Map(),meshes=[],raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),clock=new THREE.Clock();
const target=new THREE.Vector3(0,1.45,0),homeDirection=new THREE.Vector3(10,9.3,14).normalize();
const lampStorageKey='katrina-room:lamp-on',lampColor=new THREE.Color('#FFD9A0');
let lampOn=true;
try{const saved=localStorage.getItem(lampStorageKey);if(saved==='true'||saved==='false')lampOn=saved==='true';}catch{/* Storage may be unavailable in private or restricted contexts. */}
function applyLampState(){
 lamp.intensity=lampOn?6:0;
 hemi.intensity=lampOn?.5:.15;
 objects.get('lamp')?.traverse(o=>{
  if(!o.isMesh||!o.userData.lampEmission)return;
  o.material.emissive.copy(lampOn?lampColor:new THREE.Color(0));
  o.material.emissiveIntensity=lampOn?o.userData.lampEmission:0;
 });
 const button=document.querySelector('#lamp-toggle');
 button.setAttribute('aria-pressed',String(lampOn));
 button.textContent=lampOn?'Lamp on':'Lamp off';
 updateHighlights(performance.now());
}
function toggleLamp(){
 lampOn=!lampOn;
 try{localStorage.setItem(lampStorageKey,String(lampOn));}catch{/* The switch still works when persistence is blocked. */}
 applyLampState();
 status.textContent=lampOn?'Lamp on.':'Lamp off.';
 hint.textContent=lampOn?'The lamp is on.':'The lamp is off.';
}
function highlight(){
 const now=performance.now(),key=selected||hovered||focused,group=objects.get(key);
 updateHighlights(now);
 for(const [id,state]of highlightStates){const to=id===key?1:0;if(state.to!==to){state.from=state.amount;state.to=to;state.at=now;}}
 if(group){
  const {color}=SECTIONS[group.name];
  outline.selectedObjects=[group];
  outline.visibleEdgeColor.set(color);outline.hiddenEdgeColor.set(color);
 }
 updateHighlights(now);
 host.classList.toggle('over-object',Boolean(hovered));hint.textContent=(hovered||focused)?names[hovered||focused]:'Drag to look around · Click an object to explore';
}
function updateHighlights(now){
 for(const [id,state]of highlightStates){
  const p=reduced?1:Math.min(1,(now-state.at)/150),ease=p*p*(3-2*p);
  state.amount=state.from+(state.to-state.from)*ease;
  objects.get(id).traverse(o=>{
   if(!o.isMesh)return;
   for(const material of Array.isArray(o.material)?o.material:[o.material]){
   if(!material.emissive)continue;
   const bulbOrShade=Boolean(o.userData.lampEmission);
   // Off means zero emission even while the lamp is hovered or keyboard-focused.
   if(bulbOrShade&&!lampOn){material.emissive.set(0);material.emissiveIntensity=0;continue;}
   material.emissive.copy(bulbOrShade?lampColor:material.userData.baseEmission);
   material.emissiveIntensity=bulbOrShade?o.userData.lampEmission:material.userData.baseIntensity;
   material.emissive.lerp(state.color,state.amount*(bulbOrShade?1:.18));
   }
  });
 }
 if(outline){
  const group=outline.selectedObjects[0],state=group&&highlightStates.get(group.userData.interactive);
  outline.edgeStrength=state?3*state.amount:0;
  if(state&&state.amount===0&&state.to===0)outline.selectedObjects=[];
 }
}
function focusObject(group){
 if(!focusOrigin)focusOrigin={position:camera.position.clone(),target:controls.target.clone()};
 const center=new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3());
 const nextTarget=focusOrigin.target.clone().lerp(center,.12);
 const offset=focusOrigin.position.clone().sub(focusOrigin.target);
 offset.setLength(THREE.MathUtils.clamp(offset.length()*.94,controls.minDistance,controls.maxDistance));
 moveCamera(nextTarget.clone().add(offset),nextTarget);
}
function moveCamera(position,nextTarget){
 resetTween=null;
 focusTween={from:camera.position.clone(),fromTarget:controls.target.clone(),position,target:nextTarget,at:performance.now()};
 if(reduced){camera.position.copy(position);controls.target.copy(nextTarget);controls.update();focusTween=null;}
}
function closeSelection(){
 selected=null;highlight();
 if(focusOrigin){moveCamera(focusOrigin.position,focusOrigin.target);focusOrigin=null;}
}
function pick(event){
 const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
 // Complete-scene raycasting respects foreground objects and walls.
 let o=raycaster.intersectObjects(meshes,false)[0]?.object;while(o){if(o.userData.interactive)return o.userData.interactive;o=o.parent;}return null;
}
function activate(key,trigger){
 if(key==='lamp'){selected=null;hovered=key;highlight();toggleLamp();return;}
 selected=key;highlight();
 if(key==='cat'){if(catController.interact()){hint.textContent='Mrrrow. Time for a stretch.';status.textContent='The cat stretches and meows, then resumes its stroll.';setTimeout(()=>{if(selected==='cat'){selected=null;highlight();}},2400);}return;}
 focusObject(objects.get(key));
 window.openRoomPanel(sectionPanels[SECTIONS[objects.get(key).name].section],trigger);
}
function resize(){
 const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();homeDistance=w/h<.8?20:w/h<1.1?18:16;controls.minDistance=homeDistance*.78;controls.maxDistance=homeDistance*1.22;controls.enableZoom=!matchMedia('(max-width: 1024px)').matches;
 if(!host.dataset.moved&&!focusOrigin&&!focusTween)camera.position.copy(target).addScaledVector(homeDirection,homeDistance);controls.update();
}
function daylight(value){
 const t=Number(value)/100;sun.position.set(-9,3.8+t*2.7,2+t*4);sun.color.set(t>.6?'#fff0ce':t>.3?'#ffd39f':'#ffb883');sun.intensity=.85+t*2.3;renderer.toneMappingExposure=.96+t*.10;document.querySelector('#light-state').textContent=t>.66?'4:00 PM':t>.33?'5:00 PM':'6:00 PM';
}
function resetView(){
 focusOrigin=null;focusTween=null;
 host.dataset.moved='';controls.target.copy(target);resetTween={start:camera.position.clone(),end:target.clone().addScaledVector(homeDirection,homeDistance),at:clock.elapsedTime};if(reduced){camera.position.copy(resetTween.end);resetTween=null;controls.update();}
}
async function init(){
 try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.outputColorSpace=THREE.SRGBColorSpace;
  scene=new THREE.Scene();scene.background=new THREE.Color('#000000');camera=new THREE.PerspectiveCamera(35,1,.1,80);camera.position.copy(target).addScaledVector(homeDirection,homeDistance);
  controls=new OrbitControls(camera,canvas);controls.target.copy(target);controls.enableDamping=true;controls.dampingFactor=.07;controls.rotateSpeed=.48;controls.enablePan=false;controls.minAzimuthAngle=.10;controls.maxAzimuthAngle=Math.PI/2-.10;controls.minPolarAngle=Math.PI/5;controls.maxPolarAngle=Math.PI/2.6;controls.addEventListener('start',()=>{resetTween=null;host.dataset.moved='true';});
  controls.addEventListener('start',()=>{focusTween=null;focusOrigin=null;});
  hemi=new THREE.HemisphereLight('#CFE4FF','#6B5540',.5);scene.add(hemi);
  sun=new THREE.DirectionalLight('#fff0ce',3.15);sun.position.set(-9,6.5,6);sun.target.position.set(0,0,0);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-6,right:6,top:7,bottom:-6,near:.5,far:32});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;sun.shadow.radius=3;scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight('#e2eaff',.75);fill.position.set(4,6,8);scene.add(fill);lamp=new THREE.PointLight('#FFD9A0',0,4,2);lamp.castShadow=true;lamp.shadow.mapSize.set(1024,1024);lamp.shadow.camera.near=.05;lamp.shadow.normalBias=.01;lamp.shadow.bias=-.0001;scene.add(lamp);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.10}));ground.rotation.x=-Math.PI/2;ground.position.y=-.31;ground.receiveShadow=true;scene.add(ground);
  composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));inkPass=createInkPass(scene,camera);composer.addPass(inkPass);outline=new OutlinePass(new THREE.Vector2(800,650),scene,camera);outline.edgeStrength=0;outline.edgeGlow=0;outline.edgeThickness=1.4;outline.visibleEdgeColor.set(0);outline.hiddenEdgeColor.set(0);outline.pulsePeriod=0;composer.addPass(outline);composer.addPass(new OutputPass());resize();
  const gltf=await new GLTFLoader().loadAsync('assets/room.glb',p=>{if(p.total)status.textContent=`Opening the room · ${Math.round(p.loaded/p.total*100)}%`;});scene.add(gltf.scene);gltf.scene.updateMatrixWorld(true);
  // The current GLB nests its bedside lamp inside Bed. Separate its interaction
  // without changing any world transforms or editing the Blender asset.
  const lampGroup=new THREE.Group();lampGroup.name='Lamp';lampGroup.userData.interactive='lamp';gltf.scene.add(lampGroup);
  for(const name of ['Lamp_foot','Lamp_stem','Lamp_shade','Lamp_bulb']){
   const part=gltf.scene.getObjectByName(name);
   if(!part)throw new Error(`Missing lamp mesh: ${name}`);
   lampGroup.attach(part);
   if(name==='Lamp_bulb'||name==='Lamp_shade')part.userData.lampEmission=name==='Lamp_bulb'?2:.35;
  }
  const bulb=gltf.scene.getObjectByName('Lamp_bulb');bulb.getWorldPosition(lamp.position);
  // Emit below the closed shade/bulb geometry so it cannot self-occlude the point light.
  lamp.position.y=new THREE.Box3().setFromObject(bulb).min.y-.02;
  addSketchbook(gltf.scene);
  addEducationWall(gltf.scene);
  inkPass.selectedObjects=applyArtStyle(gltf.scene);
  catController=createCatController(gltf.scene,{reduced});
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(o=>{if(o.userData.interactive)objects.set(o.userData.interactive,o);if(o.isMesh){o.castShadow=true;o.receiveShadow=true;meshes.push(o);}});
  for(const object of objects.values())object.traverse(o=>{if(o.isMesh){
   const clone=material=>{const copy=material.clone();copy.userData.baseEmission=copy.emissive?.clone();copy.userData.baseIntensity=copy.emissiveIntensity;return copy;};
   o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);
   o.userData.baseEmission=o.material.emissive?.clone();o.userData.baseIntensity=o.material.emissiveIntensity;
  }});
  for(const [id,object]of objects){
   const config=SECTIONS[object.name];
   if(!config||!sectionPanels[config.section])throw new Error(`Missing SECTIONS entry: ${object.name}`);
   highlightStates.set(id,{color:new THREE.Color(config.color),amount:0,from:0,to:0,at:performance.now()});
  }
  for(const button of document.querySelectorAll('[data-object]')){
   if(!objects.has(button.dataset.object))throw new Error(`Unknown clickable object: ${button.dataset.object}`);
  }
  applyLampState();document.querySelector('#lamp-toggle').disabled=false;
  document.querySelector('#room-loading').hidden=true;host.classList.add('is-ready');status.textContent='3D room ready. Drag to rotate or choose an object below.';daylight(document.querySelector('#daylight').value);new ResizeObserver(resize).observe(host);
  canvas.addEventListener('pointermove',e=>{if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>6){press.dragged=true;return;}const key=pick(e);if(key!==hovered){hovered=key;highlight();}});
  canvas.addEventListener('pointerleave',()=>{hovered=null;highlight();});canvas.addEventListener('pointerdown',e=>{press={x:e.clientX,y:e.clientY,dragged:false};});
  canvas.addEventListener('pointerup',e=>{if(press&&!press.dragged&&Math.hypot(e.clientX-press.x,e.clientY-press.y)<7){const key=pick(e);if(key)activate(key,canvas);}press=null;});canvas.addEventListener('pointercancel',()=>{press=null;});
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home'){resetView();return;}const s=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));s.theta+=e.key==='ArrowLeft'?.10:e.key==='ArrowRight'?-.10:0;s.phi+=e.key==='ArrowUp'?-.06:e.key==='ArrowDown'?.06:0;s.theta=THREE.MathUtils.clamp(s.theta,controls.minAzimuthAngle,controls.maxAzimuthAngle);s.phi=THREE.MathUtils.clamp(s.phi,controls.minPolarAngle,controls.maxPolarAngle);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));host.dataset.moved='true';controls.update();});
  document.querySelector('#reset-view').addEventListener('click',resetView);document.querySelector('#daylight').addEventListener('input',e=>daylight(e.target.value));
  document.querySelector('#labels-toggle').addEventListener('click',e=>{labelVisible=!labelVisible;host.classList.toggle('labels-hidden',!labelVisible);e.currentTarget.textContent=labelVisible?'Hide labels':'Show labels';e.currentTarget.setAttribute('aria-pressed',String(labelVisible));});
  document.querySelectorAll('[data-object]').forEach(b=>{
   b.addEventListener('click',()=>activate(b.dataset.object,b));
   b.addEventListener('focus',()=>{focused=b.dataset.object;highlight();});
   b.addEventListener('blur',()=>{focused=null;highlight();});
   b.addEventListener('pointerenter',()=>{hovered=b.dataset.object;highlight();});
   b.addEventListener('pointerleave',()=>{hovered=null;highlight();});
  });
  document.querySelector('#detail').addEventListener('close',closeSelection);
  let lastFrame=performance.now();
  renderer.setAnimationLoop(()=>{
   if(document.hidden){lastFrame=performance.now();return;}
   const now=performance.now();updateHighlights(now);
   catController.update((now-lastFrame)/1000);lastFrame=now;
   if(focusTween){const p=Math.min(1,(now-focusTween.at)/450),ease=p*p*(3-2*p);camera.position.lerpVectors(focusTween.from,focusTween.position,ease);controls.target.lerpVectors(focusTween.fromTarget,focusTween.target,ease);if(p===1)focusTween=null;}
   const t=clock.getElapsedTime();if(resetTween){const p=Math.min(1,(t-resetTween.at)/.6);camera.position.lerpVectors(resetTween.start,resetTween.end,p*p*(3-2*p));if(p===1)resetTween=null;}controls.update();for(const l of labels){const p=(l.dataset.object==='cat'?catController.getAnchor():new THREE.Vector3(...anchors[l.dataset.object])).project(camera);l.style.left=((p.x*.5+.5)*100)+'%';l.style.top=((-p.y*.5+.5)*100)+'%';l.hidden=p.z>1;}composer.render();});
 }catch(error){console.error('3D room could not load',error);document.querySelector('#room-loading').hidden=false;document.querySelector('#room-loading').innerHTML='<span class="loading-flower">✳</span><p>The 3D room couldn’t open.</p><small>Try a browser with WebGL enabled. Every portfolio section is still available below.</small><button class="text-link" onclick="location.reload()">Try again ↗</button>';status.textContent='3D rendering unavailable. Portfolio navigation is still available.';
  const fallbackPanels={work:'education',about:'about',notes:'notes',play:'work',sketch:'about',sketchbook:'about',bed:'experience',cat:'about'};
  document.querySelectorAll('[data-object]').forEach(b=>b.addEventListener('click',()=>{const panel=fallbackPanels[b.dataset.object];if(panel)window.openRoomPanel(panel,b);}));
 }
}
init();
