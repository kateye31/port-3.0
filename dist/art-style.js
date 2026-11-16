import * as THREE from 'three';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

export const INK = '#594334';

// Deterministic, low-contrast dry-brush marks, not baked lighting or gradients.
function paperTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fffdf8';ctx.fillRect(0,0,128,128);
  let seed=27;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<240;i++){
    ctx.fillStyle=`rgba(111,93,74,${.015+random()*.045})`;
    ctx.fillRect(random()*128,random()*128,2+random()*12,.5+random());
  }
  const texture=new THREE.CanvasTexture(canvas);texture.name='subtle_dry_brush';texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  return texture;
}

function pivotParts(parent,parts,name,degrees){
  parent.updateWorldMatrix(true,true);
  const bounds=new THREE.Box3();parts.forEach(p=>bounds.union(new THREE.Box3().setFromObject(p)));
  const pivot=new THREE.Group();pivot.name=name;parent.add(pivot);
  pivot.position.copy(parent.worldToLocal(bounds.getCenter(new THREE.Vector3())));
  pivot.updateWorldMatrix(true,false);parts.forEach(p=>pivot.attach(p));
  pivot.rotation.y=THREE.MathUtils.degToRad(degrees);
  return pivot;
}

export function applyArtStyle(model){
  const desk=model.getObjectByName('Desk');
  const mug=['Mug','Coffee','Mug_handle'].map(n=>model.getObjectByName(n)).filter(Boolean);
  if(desk&&mug.length===3)pivotParts(desk,mug,'casual_mug',4);
  for(const [suffix,angle]of [['',-5],['001',4]]){
    const parts=['Slipper_sole','Slipper_top'].map(n=>model.getObjectByName(n+suffix)).filter(Boolean);
    // Keep the turned toes outside the cat's existing swept-clearance corridor.
    if(parts.length===2)pivotParts(model,parts,`casual_slippers${suffix}`,angle).position.x+=.045;
  }
  const easel=model.getObjectByName('Easel');
  if(easel)pivotParts(easel,[...easel.children],'casual_easel',3);
  if(desk){
    const noteMaterial=new THREE.MeshStandardMaterial({name:'sticky_note_paper',color:'#E4E6C2',roughness:.96});
    for(let i=0;i<2;i++){
      const note=new THREE.Mesh(new THREE.BoxGeometry(.13,.003,.16),noteMaterial);
      note.name=`desk_sticky_note_${i+1}`;note.position.set(-1.82,1.428+i*.004,-.86+i*.025);note.rotation.y=THREE.MathUtils.degToRad(i?4:-3);desk.add(note);
      // Short graphite strokes lie on the paper, not floating lettering.
      for(let row=0;row<3;row++){
        const stroke=new THREE.Mesh(new THREE.BoxGeometry(.07-row*.01,.0005,.002),new THREE.MeshStandardMaterial({color:'#796F59',roughness:1}));
        stroke.name=`note_${i+1}_pencil_mark_${row}`;stroke.position.set(-.012,.0018,-.035+row*.025);note.add(stroke);
      }
    }
    const pencil=new THREE.Group();pencil.name='loose_desk_pencil';pencil.position.set(-1.8,1.456,-.29);pencil.rotation.y=THREE.MathUtils.degToRad(-5);desk.add(pencil);
    for(const [name,length,z,color]of [['wood',.23,0,'#B48056'],['graphite',.025,.1275,'#594334']]){
      const part=new THREE.Mesh(new THREE.BoxGeometry(.013,.013,length),new THREE.MeshStandardMaterial({name:`loose_pencil_${name}`,color,roughness:.95}));part.name=`loose_pencil_${name}`;part.position.z=z;pencil.add(part);
    }
  }
  const texture=paperTexture(),meshes=[];
  model.traverse(o=>{if(o.isMesh)meshes.push(o);});
  const inkMaterial=new THREE.LineBasicMaterial({color:INK,transparent:true,opacity:.38,depthWrite:false,toneMapped:false});
  const outlined=[];
  for(const mesh of meshes){
    let hash=0;for(const c of mesh.name)hash=(hash*31+c.charCodeAt(0))>>>0;
    function matte(material){
      const copy=material.clone();
      if(copy.isMeshStandardMaterial){
        copy.roughness=Math.max(.9,copy.roughness);copy.metalness=0;
        if(!copy.map){copy.map=texture;copy.color.offsetHSL(((hash%11)-5)*.0015,0,((hash%7)-3)*.003);}
      }
      return copy;
    }
    mesh.material=Array.isArray(mesh.material)?mesh.material.map(matte):matte(mesh.material);
    mesh.geometry.computeBoundingBox();
    const size=mesh.geometry.boundingBox.getSize(new THREE.Vector3()).multiply(mesh.scale);
    // Sparse geometric creases supplement the silhouette pass. Skip tiny details
    // and floorboards so text, fur, keyboard keys and floor grain stay quiet.
    if(Math.max(size.x,size.y,size.z)>.35&&!/Floorboard|Cat_|Whisker|Sleepy_eye|Tabby_stripe|curtain/i.test(mesh.name)){
      const edges=new THREE.EdgesGeometry(mesh.geometry,35);
      if(edges.attributes.position.count){
        const lines=new THREE.LineSegments(edges,inkMaterial);lines.name=`ink_${mesh.name}`;lines.raycast=()=>{};mesh.add(lines);
      }else edges.dispose();
    }
    let architecture=false;for(let p=mesh.parent;p;p=p.parent)if(p.name==='Architecture')architecture=true;
    if(!architecture)outlined.push(mesh);
  }
  model.updateMatrixWorld(true);
  return outlined;
}

export function createInkPass(scene,camera){
  const pass=new OutlinePass(new THREE.Vector2(800,650),scene,camera);
  pass.edgeStrength=1.4;pass.edgeThickness=1;pass.edgeGlow=0;pass.pulsePeriod=0;
  pass.visibleEdgeColor.set(INK);pass.hiddenEdgeColor.set(0);
  // OutlinePass normally adds luminous color. Alpha composite the resting ink
  // instead, so brown lines darken lit surfaces without turning into a glow.
  const overlay=pass.overlayMaterial;
  overlay.blending=THREE.NormalBlending;
  overlay.uniforms.inkColor={value:new THREE.Color(INK)};
  overlay.fragmentShader='uniform vec3 inkColor;\n'+overlay.fragmentShader.replace('gl_FragColor = finalColor;',
    'float coverage = clamp(max(max(finalColor.r, finalColor.g), finalColor.b) / max(max(inkColor.r, inkColor.g), inkColor.b), 0.0, 0.78); gl_FragColor = vec4(inkColor, coverage);');
  return pass;
}
