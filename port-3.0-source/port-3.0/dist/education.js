import * as THREE from 'three';

// Physical, wall-mounted props. All lettering is a texture on a solid face.
export function addEducationWall(model) {
  const wood=new THREE.MeshStandardMaterial({name:'education_oak',color:'#79523D',roughness:.94});
  const cork=new THREE.MeshStandardMaterial({name:'education_cork',color:'#B88960',roughness:1});
  const paper=new THREE.MeshStandardMaterial({name:'education_paper',color:'#FFF1DA',roughness:.96});
  const mint=new THREE.MeshStandardMaterial({name:'education_mint',color:'#A8E6CF',roughness:.92});
  function print(name,lines,background='#FFF1DA',ink='#384447',width=1024,height=512){
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,width,height);
    ctx.strokeStyle=ink;ctx.lineWidth=3;ctx.strokeRect(22,22,width-44,height-44);
    ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';
    lines.forEach((line,i)=>{ctx.font=`${i===0?'600':'400'} ${Math.min(64,height/(lines.length+2))}px Georgia, serif`;ctx.fillText(line,width/2,height*(i+1)/(lines.length+1),width-90);});
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshStandardMaterial({name,map:texture,roughness:.96});
    material.userData.printedText=lines.join(' · ');return material;
  }
  function box(parent,name,size,position,material,front){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),front?[material,material,material,material,front,material]:material);
    mesh.name=name;mesh.position.set(...position);parent.add(mesh);return mesh;
  }
  function group(name,key,y){
    const g=new THREE.Group();g.name=name;g.userData.interactive=key;
    // The solid near pier, outside the existing window aperture (z <= 1.9).
    g.position.set(-3.26,y,2.45);g.rotation.y=Math.PI/2;model.add(g);return g;
  }
  const diploma=group('frame_degree','diploma',3.59);
  box(diploma,'diploma_frame',[.94,.72,.08],[0,0,0],wood);
  box(diploma,'diploma_mat',[.84,.62,.012],[0,0,.046],paper);
  box(diploma,'diploma_print',[.75,.53,.008],[0,0,.057],paper,
    print('diploma_lettering',['UNIVERSITY OF CENTRAL FLORIDA','B.S. Computer Science','Expected Dec 2027'], '#FFF1DA','#384447',1024,720));
  const board=group('education_corkboard','education_board',2.67);
  box(board,'corkboard_frame',[.94,1.08,.065],[0,0,0],wood);
  box(board,'corkboard_surface',[.85,.99,.018],[0,0,.038],cork);
  const cards=[['B.S. Computer Science,','UCF'],['Minor in Intelligent','Robotic Systems'],['Expected Dec 2027']];
  cards.forEach((lines,i)=>{
    const card=new THREE.Group();card.name=`education_card_${i+1}`;card.position.set(i===1?.025:-.015,.32-i*.32,.055);card.rotation.z=THREE.MathUtils.degToRad([2,-3,2][i]);board.add(card);
    box(card,`${card.name}_paper`,[.74,.265,.009],[0,0,0],paper,print(`${card.name}_lettering`,lines,i===1?'#E4EFDF':'#FFF1DA','#384447',1024,360));
    const pin=new THREE.Mesh(new THREE.SphereGeometry(.018,12,8),mint);pin.name=`education_pin_${i+1}`;pin.position.set(0,.108,.017);card.add(pin);
  });
  model.updateMatrixWorld(true);
  return [diploma,board];
}
