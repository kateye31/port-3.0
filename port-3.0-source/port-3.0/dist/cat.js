import * as THREE from 'three';

// Coordinates belong to the shipped GLB (Y up), not the future 4m SPEC room.
export const CAT_WAYPOINTS = Object.freeze([
  Object.freeze([0, .185, 1.5]),
  Object.freeze([-.12, .185, 1.9]),
  Object.freeze([.12, .185, 2.1]),
]);
const radius = .9, clearance = .025;

export function createCatController(scene, { reduced = false, random = Math.random } = {}) {
  const cat = scene.getObjectByName('Cat');
  if (!cat) throw new Error('Missing existing ginger Cat');
  const parts = [];
  cat.traverse(o => { if (o.isMesh) parts.push(o); });
  // This GLB has no skeleton or clips. Preserve all 22 original meshes/materials.
  scene.updateMatrixWorld(true);
  for (const part of parts) scene.attach(part);
  cat.position.set(-.1, .15, 1.18);
  cat.updateMatrixWorld(true);
  for (const part of parts) cat.attach(part);
  function pivot(name, world, parent, members) {
    const group = new THREE.Group(); group.name = name;
    parent.add(group);
    group.position.copy(parent.worldToLocal(new THREE.Vector3(...world)));
    group.updateMatrixWorld(true);
    for (const part of members) group.attach(part);
    return group;
  }
  const body = pivot('cat_body_rig', [-.1,.38,1.18], cat, parts.filter(p => /^(Cat_body|Cat_haunch|Tabby_stripe)/.test(p.name)));
  const head = pivot('cat_head_rig', [-.47,.46,1.27], cat, parts.filter(p => /^(Cat_head|Cat_ear|Pink_inner_ear|Cream_muzzle|Cat_nose|Sleepy_eye|Whisker)/.test(p.name)));
  const tail = pivot('cat_tail_rig', [.32,.38,1], cat, parts.filter(p => p.name === 'Cat_tail'));
  const ears = ['', '001'].map((suffix, i) => pivot(`cat_ear_rig${suffix}`, [i?-.33:-.63,.63,i?1.19:1.21], head, parts.filter(p => p.name === `Cat_ear${suffix}` || p.name === `Pink_inner_ear${suffix}`)));
  const paws = parts.filter(p => p.name.startsWith('Cat_paw'));
  const moving = [body, head, tail, ...ears, ...paws];
  const rest = moving.map(o => ({ position: o.position.clone(), rotation: o.rotation.clone(), scale: o.scale.clone() }));
  const obstacles = [];
  scene.updateMatrixWorld(true);
  scene.traverse(o => {
    if (!o.isMesh || parts.includes(o)) return;
    for (let parent=o; parent; parent=parent.parent) if (parent.name==='Rug') return;
    const box = new THREE.Box3().setFromObject(o);
    // Floor/rug support is allowed; even low slippers remain obstacles.
    if (box.max.y > .19 && box.min.y < 1.1) obstacles.push({ name:o.name, box });
  });
  function isClear(position) {
    if (Math.abs(position.x)+radius > 3.4 || Math.abs(position.z)+radius > 3.0) return false;
    return obstacles.every(({box}) => {
      const x=THREE.MathUtils.clamp(position.x,box.min.x,box.max.x);
      const z=THREE.MathUtils.clamp(position.z,box.min.z,box.max.z);
      return Math.hypot(position.x-x,position.z-z) > radius+clearance;
    });
  }
  const points = CAT_WAYPOINTS.map(p => new THREE.Vector3(...p));
  const curves = points.map((p,i) => new THREE.QuadraticBezierCurve3(p, p.clone().lerp(points[(i+1)%3],.5), points[(i+1)%3]));
  // Preflight the whole swept circle, including turning/stretching, before moving.
  for (const curve of curves) for(let i=0;i<=100;i++) {
    if (!isClear(curve.getPoint(i/100))) throw new Error('Cat route obstructed; update waypoints for this room.');
  }
  cat.position.copy(points[0]);
  let time=0, wait=15+random()*15, index=0, progress=0, walking=false;
  let stretch=-1, nextEar=3+random()*5, earStart=-10, earIndex=0, blocked=0;
  const candidate = new THREE.Vector3(), bounds = new THREE.Box3();
  function groundPose(){
    cat.updateMatrixWorld(true);
    cat.position.y += .185-bounds.setFromObject(cat).min.y;
    cat.updateMatrixWorld(true);
  }
  function pose() {
    moving.forEach((o,i) => { o.position.copy(rest[i].position); o.rotation.copy(rest[i].rotation); o.scale.copy(rest[i].scale); });
    if (reduced) return;
    const reach=stretch<0?0:Math.sin(Math.PI*Math.min(1,stretch/2.4))**2;
    const step=walking&&stretch<0?Math.sin(time*10):0;
    body.scale.set(1+reach*.10,1+Math.sin(time*1.8)*.012-reach*.12,1);
    body.position.y += Math.abs(step)*.016;
    head.position.x -= reach*.055;
    head.position.y += .065 + reach*.025 + Math.abs(step)*.012;
    head.rotation.z = -.12 + reach*.22;
    tail.rotation.y = Math.sin(time*1.4)*.10;
    tail.rotation.x = Math.sin(time*.8)*.035;
    ears[earIndex].rotation.x = time-earStart<.45?Math.sin((time-earStart)/.45*Math.PI*2)*.22:0;
    paws.forEach((paw,i) => { paw.position.x += (i?-step:step)*.04-reach*.06; paw.position.y += Math.max(0,i?-step:step)*.025; });
  }
  function update(dt) {
    if (!Number.isFinite(dt) || dt<=0) return;
    if (reduced) { if(stretch>=0){stretch+=Math.min(dt,.1);if(stretch>=2.4)stretch=-1;}return; }
    // Bounded steps prevent tab suspension and long frames from teleporting the cat.
    let remaining=Math.min(dt,.1);
    while(remaining>1e-8){
      const step=Math.min(remaining,1/60); remaining-=step; time+=step;
      if(time>=nextEar){earStart=time;earIndex=random()<.5?0:1;nextEar=time+4+random()*6;}
      if(stretch>=0){stretch+=step;if(stretch>=2.4)stretch=-1;}
      else if(!walking){wait-=step;if(wait<=0)walking=true;}
      else {
        const curve=curves[index], next=Math.min(1,progress+step*.22/curve.getLength());
        curve.getPoint(next,candidate);
        if(isClear(candidate)){
          cat.position.copy(candidate); progress=next;
          const direction=curve.getTangent(next), target=Math.atan2(direction.z,-direction.x);
          const difference=Math.atan2(Math.sin(target-cat.rotation.y),Math.cos(target-cat.rotation.y));
          cat.rotation.y+=difference*(1-Math.exp(-step*5));
          if(progress===1){index=(index+1)%3;progress=0;walking=false;wait=15+random()*15;}
        }else{blocked++;walking=false;wait=15;}
      }
      pose();
    }
    groundPose();
  }
  let audioContext;
  async function meow() {
    try {
      const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
      if(!Context)return;
      audioContext ||= new Context();
      await audioContext.resume();
      const now=audioContext.currentTime, voice=audioContext.createOscillator(), gain=audioContext.createGain(), filter=audioContext.createBiquadFilter();
      voice.type='triangle';voice.frequency.setValueAtTime(470,now);voice.frequency.exponentialRampToValueAtTime(740,now+.10);voice.frequency.exponentialRampToValueAtTime(330,now+.55);
      filter.type='bandpass';filter.frequency.setValueAtTime(1500,now);filter.frequency.linearRampToValueAtTime(650,now+.55);filter.Q.value=1.4;
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.12,now+.035);gain.gain.exponentialRampToValueAtTime(.001,now+.58);
      voice.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);
      voice.onended=()=>{voice.disconnect();filter.disconnect();gain.disconnect();};
      voice.start(now);voice.stop(now+.6);
    } catch { /* Silent fallback when audio is unsupported or blocked. */ }
  }
  pose();groundPose();
  return {
    cat, update, obstacles,
    interact(){if(stretch>=0)return false;stretch=0;void meow();return true;},
    getAnchor(){return bounds.setFromObject(cat).getCenter(new THREE.Vector3()).setY(bounds.max.y+.12);},
    get state(){return {mode:stretch>=0?'stretch':walking?'walk':'rest',index,progress,wait,blocked,time,audio:audioContext?.state||'unavailable'};},
  };
}
