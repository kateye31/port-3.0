import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
const host=document.querySelector('#room'),canvas=document.querySelector('#room-canvas'),status=document.querySelector('#room-status'),hint=document.querySelector('#object-hint');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const labels=[...document.querySelectorAll('.object-label')];
const names={work:'The desk · Selected work',about:'The globe · About me',notes:'The shelf · Notes & discoveries',play:'The TV · Experiments',sketch:'The easel · Sketchbook',bed:'The bed · Off the clock',cat:'The cat · A little head scratch?'};
const anchors={work:[-2.38,2.4,.28],about:[.30,3.95,-2.63],notes:[-2.3,3.5,-2.6],play:[-.2,2.52,-2.65],sketch:[2.63,2.05,2.32],bed:[2,1.4,-.5],cat:[-.30,.95,1.25]};
let renderer,camera,controls,composer,outline,scene,sun,hemi,lamp,hovered=null,selected=null,press=null,catUntil=0,resetTween=null,labelVisible=true,homeDistance=16;
const objects=new Map(),meshes=[],raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),clock=new THREE.Clock();
const target=new THREE.Vector3(0,1.45,0),homeDirection=new THREE.Vector3(10,9.3,14).normalize();
function highlight(){
 const key=selected||hovered,group=objects.get(key);outline.selectedObjects=group?[group]:[];
 for(const [id,object]of objects)object.traverse(o=>{if(!o.isMesh||!o.material.emissive)return;o.material.emissive.copy(o.userData.baseEmission);o.material.emissiveIntensity=o.userData.baseIntensity;if(id===key){o.material.emissive.lerp(new THREE.Color('#d0b88a'),.16);o.material.emissiveIntensity=Math.max(.25,o.material.emissiveIntensity);}});
 host.classList.toggle('over-object',Boolean(hovered));hint.textContent=hovered?names[hovered]:'Drag to look around · Click an object to explore';
}
function pick(event){
 const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
 // Complete-scene raycasting respects foreground objects and walls.
 let o=raycaster.intersectObjects(meshes,false)[0]?.object;while(o){if(o.userData.interactive)return o.userData.interactive;o=o.parent;}return null;
}
function activate(key,trigger){
 selected=key;highlight();
 if(key==='cat'){catUntil=clock.elapsedTime+2.4;hint.textContent='Purrr. Your visit has been approved.';status.textContent='The cat enjoyed a head scratch.';setTimeout(()=>{if(selected==='cat'){selected=null;highlight();}},2400);return;}
 window.openRoomPanel(key==='sketch'?'play':key,trigger);
}
function resize(){
 const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();homeDistance=w/h<.8?20:w/h<1.1?18:16;controls.minDistance=homeDistance*.78;controls.maxDistance=homeDistance*1.22;controls.enableZoom=!matchMedia('(max-width: 1024px)').matches;
 if(!host.dataset.moved)camera.position.copy(target).addScaledVector(homeDirection,homeDistance);controls.update();
}
function daylight(value){
 const t=Number(value)/100;sun.position.set(-9,3.8+t*2.7,2+t*4);sun.color.set(t>.6?'#fff0ce':t>.3?'#ffd39f':'#ffb883');sun.intensity=.85+t*2.3;hemi.intensity=.65+t*.5;lamp.intensity=(1-t)*9;renderer.toneMappingExposure=.96+t*.10;document.querySelector('#light-state').textContent=t>.66?'4:00 PM':t>.33?'5:00 PM':'6:00 PM';
}
function resetView(){
 host.dataset.moved='';controls.target.copy(target);resetTween={start:camera.position.clone(),end:target.clone().addScaledVector(homeDirection,homeDistance),at:clock.elapsedTime};if(reduced){camera.position.copy(resetTween.end);resetTween=null;controls.update();}
}
async function init(){
 try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.outputColorSpace=THREE.SRGBColorSpace;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,1,.1,80);camera.position.copy(target).addScaledVector(homeDirection,homeDistance);
  controls=new OrbitControls(camera,canvas);controls.target.copy(target);controls.enableDamping=true;controls.dampingFactor=.07;controls.rotateSpeed=.48;controls.enablePan=false;controls.minAzimuthAngle=.10;controls.maxAzimuthAngle=Math.PI/2-.10;controls.minPolarAngle=Math.PI/5;controls.maxPolarAngle=Math.PI/2.6;controls.addEventListener('start',()=>{resetTween=null;host.dataset.moved='true';});
  hemi=new THREE.HemisphereLight('#e4efff','#a77c55',1.15);scene.add(hemi);
  sun=new THREE.DirectionalLight('#fff0ce',3.15);sun.position.set(-9,6.5,6);sun.target.position.set(0,0,0);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-6,right:6,top:7,bottom:-6,near:.5,far:32});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;sun.shadow.radius=3;scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight('#e2eaff',.75);fill.position.set(4,6,8);scene.add(fill);lamp=new THREE.PointLight('#ffbe74',0,4,2);lamp.position.set(3.08,1.35,-1.55);scene.add(lamp);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.10}));ground.rotation.x=-Math.PI/2;ground.position.y=-.31;ground.receiveShadow=true;scene.add(ground);
  composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));outline=new OutlinePass(new THREE.Vector2(800,650),scene,camera);outline.edgeStrength=3;outline.edgeGlow=.12;outline.edgeThickness=1.4;outline.visibleEdgeColor.set('#a97949');outline.hiddenEdgeColor.set('#a97949');outline.pulsePeriod=0;composer.addPass(outline);composer.addPass(new OutputPass());resize();
  const gltf=await new GLTFLoader().loadAsync('assets/room.glb',p=>{if(p.total)status.textContent=`Opening the room · ${Math.round(p.loaded/p.total*100)}%`;});scene.add(gltf.scene);gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(o=>{if(o.userData.interactive)objects.set(o.userData.interactive,o);if(o.isMesh){o.castShadow=true;o.receiveShadow=true;meshes.push(o);}});
  for(const object of objects.values())object.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.userData.baseEmission=o.material.emissive?.clone();o.userData.baseIntensity=o.material.emissiveIntensity;}});
  document.querySelector('#room-loading').hidden=true;host.classList.add('is-ready');status.textContent='3D room ready. Drag to rotate or choose an object below.';daylight(document.querySelector('#daylight').value);new ResizeObserver(resize).observe(host);
  canvas.addEventListener('pointermove',e=>{if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>6){press.dragged=true;return;}const key=pick(e);if(key!==hovered){hovered=key;highlight();}});
  canvas.addEventListener('pointerleave',()=>{hovered=null;highlight();});canvas.addEventListener('pointerdown',e=>{press={x:e.clientX,y:e.clientY,dragged:false};});
  canvas.addEventListener('pointerup',e=>{if(press&&!press.dragged&&Math.hypot(e.clientX-press.x,e.clientY-press.y)<7){const key=pick(e);if(key)activate(key,canvas);}press=null;});canvas.addEventListener('pointercancel',()=>{press=null;});
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home'){resetView();return;}const s=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));s.theta+=e.key==='ArrowLeft'?.10:e.key==='ArrowRight'?-.10:0;s.phi+=e.key==='ArrowUp'?-.06:e.key==='ArrowDown'?.06:0;s.theta=THREE.MathUtils.clamp(s.theta,controls.minAzimuthAngle,controls.maxAzimuthAngle);s.phi=THREE.MathUtils.clamp(s.phi,controls.minPolarAngle,controls.maxPolarAngle);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));host.dataset.moved='true';controls.update();});
  document.querySelector('#reset-view').addEventListener('click',resetView);document.querySelector('#daylight').addEventListener('input',e=>daylight(e.target.value));
  document.querySelector('#labels-toggle').addEventListener('click',e=>{labelVisible=!labelVisible;host.classList.toggle('labels-hidden',!labelVisible);e.currentTarget.textContent=labelVisible?'Hide labels':'Show labels';e.currentTarget.setAttribute('aria-pressed',String(labelVisible));});
  document.querySelectorAll('[data-object]').forEach(b=>{b.addEventListener('click',()=>activate(b.dataset.object,b));for(const e of ['focus','pointerenter'])b.addEventListener(e,()=>{hovered=b.dataset.object;highlight();});for(const e of ['blur','pointerleave'])b.addEventListener(e,()=>{hovered=null;highlight();});});
  document.querySelector('#detail').addEventListener('close',()=>{selected=null;highlight();});const cat=objects.get('cat'),base=cat?.scale.clone();
  renderer.setAnimationLoop(()=>{if(document.hidden)return;const t=clock.getElapsedTime();if(resetTween){const p=Math.min(1,(t-resetTween.at)/.6);camera.position.lerpVectors(resetTween.start,resetTween.end,p*p*(3-2*p));if(p===1)resetTween=null;}if(cat&&!reduced){cat.scale.y=base.y*(1+Math.sin(t*1.8)*.008);cat.position.y=t<catUntil?Math.abs(Math.sin(t*7))*.035:0;}controls.update();for(const l of labels){const p=new THREE.Vector3(...anchors[l.dataset.object]).project(camera);l.style.left=((p.x*.5+.5)*100)+'%';l.style.top=((-p.y*.5+.5)*100)+'%';l.hidden=p.z>1;}composer.render();});
 }catch(error){console.error('3D room could not load',error);document.querySelector('#room-loading').hidden=false;document.querySelector('#room-loading').innerHTML='<span class="loading-flower">✳</span><p>The 3D room couldn’t open.</p><small>Try a browser with WebGL enabled. Every portfolio section is still available below.</small><button class="text-link" onclick="location.reload()">Try again ↗</button>';status.textContent='3D rendering unavailable. Portfolio navigation is still available.';document.querySelectorAll('[data-object]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.object;window.openRoomPanel(id==='sketch'?'play':id==='cat'?'about':id,b);}));}
}
init();
