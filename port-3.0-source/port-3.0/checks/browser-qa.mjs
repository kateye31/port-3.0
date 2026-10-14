// Uses installed Chrome and its DevTools protocol; no automation dependency.
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import http from 'node:http';

const out = path.resolve('checks/browser-results');
const lampOnly = process.argv.includes('--lamp-only');
const highlightOnly = process.argv.includes('--highlight-only');
const sketchbookOnly = process.argv.includes('--sketchbook-only');
const catOnly = process.argv.includes('--cat-only');
const educationOnly = process.argv.includes('--education-only');
const styleOnly = process.argv.includes('--style-only');
await fs.mkdir(out, { recursive: true });
const siteRoot = path.resolve('dist');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(siteRoot, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(siteRoot + path.sep)) throw new Error('Invalid path');
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const siteURL = process.env.ROOM_QA_URL || `http://127.0.0.1:${server.address().port}/`;
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'room-browser-qa-'));
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader', 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
let ws;
const report = { url: siteURL, testedAt: new Date().toISOString(), checks: [], errors: [], warnings: [], failedRequests: [] };
const delay = ms => new Promise(r => setTimeout(r, ms));
try {
  let port;
  for (let i = 0; i < 100 && !port; i++) {
    try { port = (await fs.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; }
    catch { await delay(100); }
  }
  assert(port, 'Chrome did not start');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  const requests = new Map();
  ws.onmessage = event => {
    const msg = JSON.parse(event.data);
    if (msg.id) {
      const item = pending.get(msg.id);
      if (!item) return;
      pending.delete(msg.id); clearTimeout(item.timer);
      msg.error ? item.reject(new Error(JSON.stringify(msg.error))) : item.resolve(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') report.errors.push(msg.params.exceptionDetails);
    else if (msg.method === 'Log.entryAdded' && ['error', 'warning'].includes(msg.params.entry.level)) report.warnings.push(msg.params.entry);
    else if (msg.method === 'Network.requestWillBeSent') requests.set(msg.params.requestId, msg.params.request.url);
    else if (msg.method === 'Network.loadingFailed') report.failedRequests.push({ url: requests.get(msg.params.requestId), error: msg.params.errorText });
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 45000);
    pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const check = async (name, expression) => {
    let actual = await evaluate(expression);
    // Software WebGL can render below 5 FPS: wait for an animation frame to
    // reach its final state instead of assuming a wall-clock sleep rendered it.
    if(highlightOnly||sketchbookOnly||catOnly||educationOnly||styleOnly)for(let i=0;i<30&&!actual;i++){await delay(150);actual=await evaluate(expression);}
    report.checks.push({ name, passed: Boolean(actual), actual });
    console.log(`${actual ? 'PASS' : 'FAIL'} ${name}`);
    if(highlightOnly&&!actual)console.log(await evaluate(`JSON.stringify({selected:__roomQA().selected,hovered:__roomQA().hovered,states:[...__roomQA().highlightStates].map(([id,s])=>[id,s.amount,s.to]),focus:!!__roomQA().focusTween,dialog:document.querySelector('#detail').open})`));
  };
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const key = async (name, code = name) => {
    const windowsVirtualKeyCode = { Escape: 27, Tab: 9, Home: 36, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 }[name];
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code, windowsVirtualKeyCode });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code, windowsVirtualKeyCode });
  };
  const screenshot = async name => {
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    await fs.writeFile(path.join(out, `${name}.png`), Buffer.from(data, 'base64'));
  };
  const viewport = (width, height, mobile = false) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  const waitReady = async () => {
    for (let i = 0; i < 120; i++) {
      if (await evaluate(`document.querySelector('#room')?.classList.contains('is-ready')`)) return;
      await delay(250);
    }
    throw new Error('Room did not reach ready state');
  };
  await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable'); await send('Network.enable');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await viewport(1440, 1000);
  // Record the actual camera, controls and light state without changing site files.
  await send('Fetch.enable', { patterns: [{ urlPattern: '*room.js', requestStage: 'Response' }] });
  const originalMessage = ws.onmessage;
  ws.onmessage = async event => {
    const msg = JSON.parse(event.data);
    if (msg.method !== 'Fetch.requestPaused') { originalMessage(event); return; }
    const { requestId } = msg.params;
    try {
      const response = await send('Fetch.getResponseBody', { requestId });
      const body = response.base64Encoded ? Buffer.from(response.body, 'base64').toString('utf8') : response.body;
      const instrumentation = '\nwindow.__roomQA = () => ({camera,controls,scene,sun,hemi,lamp,renderer,outline,inkPass,objects,selected,hovered,resetTween,catController,reduced,SECTIONS,highlightStates,focusTween});\n';
      await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/javascript; charset=utf-8' }], body: Buffer.from(body + instrumentation).toString('base64') });
    } catch (error) { report.errors.push({ instrumentation: String(error) }); await send('Fetch.continueRequest', { requestId }); }
  };
  await send('Page.navigate', { url: siteURL });
  await waitReady(); await delay(900);
  if(styleOnly){
    await evaluate('document.fonts.ready');
    await check('All scene standard materials are matte and nonmetallic', `(()=>{let ok=true;__roomQA().scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.isMeshStandardMaterial)ok&&=m.roughness>=.85&&m.metalness===0});return ok})()`);
    await check('Resting ink is warm brown, 1px, no glow; separate colored selection pass', `(()=>{const q=__roomQA();return q.inkPass!==q.outline&&q.inkPass.visibleEdgeColor.getHexString()==='594334'&&q.inkPass.edgeThickness===1&&q.inkPass.edgeGlow===0&&q.inkPass.selectedObjects.length>100})()`);
    await check('Off-axis props, paper notes and loose pencil exist', `(()=>{const s=__roomQA().scene;return ['casual_mug','casual_slippers','casual_slippers001','casual_easel','loose_desk_pencil'].every(n=>{const o=s.getObjectByName(n);return o&&Math.abs(o.rotation.y)>=2*Math.PI/180&&Math.abs(o.rotation.y)<=6*Math.PI/180})&&Boolean(s.getObjectByName('desk_sticky_note_2'))})()`);
    const home=await evaluate(`__roomQA().camera.position.toArray()`);
    await evaluate(`document.activeElement.blur();document.querySelector('#room').dispatchEvent(new PointerEvent('pointerleave'))`);
    await screenshot('look-default');
    await click('#labels-toggle');
    for(const [name,theta]of [['left-wall',1.30],['right-wall',.20]]){
      await evaluate(`(async()=>{const T=await import('three'),q=__roomQA(),s=new T.Spherical().setFromVector3(q.camera.position.clone().sub(q.controls.target));s.theta=${theta};q.camera.position.copy(q.controls.target).add(new T.Vector3().setFromSpherical(s));q.controls.update();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))})()`);
      await check(`${name}: view remains inside existing camera constraints`, `(()=>{const c=__roomQA().controls;return c.getAzimuthalAngle()>=c.minAzimuthAngle&&c.getAzimuthalAngle()<=c.maxAzimuthAngle&&c.getPolarAngle()>=c.minPolarAngle&&c.getPolarAngle()<=c.maxPolarAngle})()`);
      const clip=await evaluate(`(()=>{const r=document.querySelector('#room-canvas').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,scale:1}})()`);
      const {data}=await send('Page.captureScreenshot',{format:'png',clip});
      await fs.writeFile(path.join(out,`look-${name}.png`),Buffer.from(data,'base64'));
    }
    await evaluate(`__roomQA().camera.position.fromArray(${JSON.stringify(home)});__roomQA().controls.update()`);
    await click('#labels-toggle');
    await click('[data-object="work"]');
    await check('Education still uses mint tint and outline over brown ink', `__roomQA().outline.visibleEdgeColor.getHexString()==='a8e6cf'&&__roomQA().highlightStates.get('work').amount===1`);
    await check('Paper panel uses loaded handwriting, 1 degree tilt and no blur', `(()=>{const d=document.querySelector('#detail'),s=getComputedStyle(d),b=getComputedStyle(d,'::backdrop');return s.fontFamily.includes('Patrick Hand')&&document.fonts.check('20px "Patrick Hand Local"')&&s.backgroundImage==='none'&&b.backdropFilter==='none'&&s.transform.startsWith('matrix(0.999848')})()`);
    await screenshot('look-paper-panel');
    await key('Escape');
    await viewport(390,844,true);await delay(500);await click('[data-object="work"]');
    await check('Handwritten mobile panel stays within viewport', `(()=>{const r=document.querySelector('#detail').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()`);
    await screenshot('look-mobile-panel');
    await check('No rendering exceptions or WebGL shader warnings', `${report.errors.length}===0&&${JSON.stringify(report.warnings)}.every(e=>!/shader|WebGL.*(error|invalid)/i.test(e.text))`);
  }else if(educationOnly){
    await check('Three Education props have explicit mint configuration', `['diploma','education_board','education_books'].every(id=>{const q=__roomQA(),o=q.objects.get(id);return o&&q.SECTIONS[o.name].section==='education'&&q.SECTIONS[o.name].color==='#A8E6CF'})`);
    await check('Exactly three physical pinned cards and textured book spines', `(()=>{const s=__roomQA().scene;return [1,2,3].every(i=>s.getObjectByName('education_pin_'+i)?.isMesh&&s.getObjectByName('education_card_'+i+'_paper')?.material[4].map?.isCanvasTexture&&s.getObjectByName('textbook_'+i+'_spine')?.material[4].map?.isCanvasTexture)})()`);
    await check('No floating text; display mounted outside window aperture', `(async()=>{const T=await import('three'),q=__roomQA();return ['diploma','education_board','education_books'].every(id=>{const o=q.objects.get(id),b=new T.Box3().setFromObject(o);let valid=true;o.traverse(m=>{if(m.isSprite)valid=false;if(m.isMesh)valid&&=m.geometry.type==='BoxGeometry'||m.geometry.type==='SphereGeometry'});return valid&&b.min.z>=1.9&&b.max.z<=3.0&&b.min.x>=-3.33})})()`);
    for(const [id,mesh] of [['diploma','diploma_print'],...([1,2,3].map(i=>['education_board',`education_card_${i}_paper`])),...([1,2,3].map(i=>['education_books',`textbook_${i}_spine`]))]){
      const point=await evaluate(`(async()=>{const T=await import('three'),q=__roomQA(),p=q.scene.getObjectByName(${JSON.stringify(mesh)}).getWorldPosition(new T.Vector3()).project(q.camera),r=document.querySelector('#room-canvas').getBoundingClientRect();return{x:r.left+(p.x*.5+.5)*r.width,y:r.top+(-p.y*.5+.5)*r.height}})()`);
      await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
      await check(`${mesh}: raycast and mint outline`, `__roomQA().hovered===${JSON.stringify(id)}&&__roomQA().outline.visibleEdgeColor.getHexString()==='a8e6cf'&&__roomQA().highlightStates.get(${JSON.stringify(id)}).amount===1`);
      await check(`${mesh}: all face materials tint mint`, `(()=>{const q=__roomQA(),m=q.scene.getObjectByName(${JSON.stringify(mesh)}),color=q.highlightStates.get(${JSON.stringify(id)}).color;return m.material.every(v=>v.emissive.equals(v.userData.baseEmission.clone().lerp(color,.18)))})()`);
      await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
      await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
      await check(`${mesh}: opens Education with supplied details`, `document.querySelector('#detail').open&&['B.S. Computer Science, UCF','Minor in Intelligent Robotic Systems','Expected Dec 2027'].every(t=>document.querySelector('#detail-content').textContent.includes(t))`);
      await key('Escape');
      await check('Camera restored after dismissal', `!__roomQA().focusTween&&!document.querySelector('#detail').open`);
    }
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:20,y:20});
    await screenshot('education-wall');
    await check('No browser exceptions', `${report.errors.length}===0`);
  }else if(catOnly){
    await check('Existing cat uses rigid head/body/tail and ear pivots', `(()=>{const c=__roomQA().objects.get('cat');return ['cat_head_rig','cat_body_rig','cat_tail_rig','cat_ear_rig','cat_ear_rig001'].every(n=>c.getObjectByName(n))})()`);
    if(process.env.ROOM_QA_URL){
      const start=await evaluate(`__roomQA().catController.cat.position.toArray()`);
      let moved=false;
      for(let i=0;i<90&&!moved;i++){
        await delay(1000);
        moved=await evaluate(`(()=>{const p=__roomQA().catController.cat.position;return Math.hypot(p.x-${start[0]},p.z-${start[2]})>.025})()`);
      }
      report.naturalMovement={start,end:await evaluate(`__roomQA().catController.cat.position.toArray()`)};
      await check('Cat wanders on real animation frames without advancing its clock in the test', String(moved));
    }
    const point=await evaluate(`(async()=>{const T=await import('three'),q=__roomQA(),p=new T.Box3().setFromObject(q.objects.get('cat')).getCenter(new T.Vector3()).project(q.camera),r=document.querySelector('#room-canvas').getBoundingClientRect();return{x:r.left+(p.x*.5+.5)*r.width,y:r.top+(-p.y*.5+.5)*r.height}})()`);
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
    await check('Cat meshes remain directly raycastable', `__roomQA().hovered==='cat'`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
    await check('Pointer click stretches and starts user-gesture audio without panel', `__roomQA().catController.state.mode==='stretch'&&__roomQA().catController.state.audio==='running'&&!document.querySelector('#detail').open`);
    await evaluate(`for(let i=0;i<7;i++)__roomQA().catController.update(.1)`);
    await screenshot('cat-stretch');
    const {data}=await send('Page.captureScreenshot',{format:'png',clip:{x:Math.max(0,point.x-120),y:Math.max(0,point.y-100),width:240,height:200,scale:3}});
    await fs.writeFile(path.join(out,'cat-closeup.png'),Buffer.from(data,'base64'));
    await check('Cat stays coral when selected', `__roomQA().outline.visibleEdgeColor.getHexString()==='ff7f6e'`);
    report.route=await evaluate(`(()=>{const c=__roomQA().catController,visited=new Set();for(let i=0;i<1200;i++){c.update(.1);visited.add(c.state.index)}return{visited:[...visited],blocked:c.state.blocked}})()`);
    await check('Wander visits all three stops without collision blocks', `${report.route.visited.length}===3&&${report.route.blocked}===0`);
    await click('.room-shortcuts [data-object="cat"]');
    await check('Accessible shortcut also triggers stretch', `__roomQA().catController.state.mode==='stretch'`);
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await send('Page.reload');await waitReady();
    await check('Reduced motion keeps cat stationary, including click', `(()=>{const c=__roomQA().catController,p=c.cat.matrixWorld.clone();c.interact();for(let i=0;i<400;i++)c.update(.1);return c.cat.matrixWorld.equals(p)&&c.state.mode==='rest'})()`);
    await check('Camera constraints preserved', `(()=>{const c=__roomQA().controls;return c.minAzimuthAngle===.1&&c.maxAzimuthAngle===Math.PI/2-.1&&c.minPolarAngle===Math.PI/5&&c.maxPolarAngle===Math.PI/2.6&&!c.enablePan})()`);
    await check('No browser exceptions', `${report.errors.length}===0`);
  }else if(sketchbookOnly){
    await check('Sketchbook is registered as coral About target', `(()=>{const q=__roomQA(),b=q.objects.get('sketchbook');return b&&q.SECTIONS[b.name].section==='about'&&q.SECTIONS[b.name].color==='#FF7F6E'})()`);
    const point=await evaluate(`(async()=>{const T=await import('three'),q=__roomQA(),b=q.objects.get('sketchbook'),p=new T.Box3().setFromObject(b).getCenter(new T.Vector3()).project(q.camera),r=document.querySelector('#room-canvas').getBoundingClientRect();return{x:r.left+(p.x*.5+.5)*r.width,y:r.top+(-p.y*.5+.5)*r.height}})()`);
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
    await check('Pointer selects sketchbook rather than desk', `__roomQA().hovered==='sketchbook'`);
    await check('Sketchbook hover uses coral outline and emissive', `(()=>{const q=__roomQA(),s=q.highlightStates.get('sketchbook'),cover=q.objects.get('sketchbook').getObjectByName('sketchbook_cover');return s.amount===1&&q.outline.visibleEdgeColor.getHexString()==='ff7f6e'&&cover.material.emissive.equals(cover.userData.baseEmission.clone().lerp(s.color,.18))})()`);
    await screenshot('sketchbook-desk');
    const {data}=await send('Page.captureScreenshot',{format:'png',clip:{x:Math.max(0,point.x-140),y:Math.max(0,point.y-110),width:280,height:220,scale:2}});
    await fs.writeFile(path.join(out,'sketchbook-closeup.png'),Buffer.from(data,'base64'));
    await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
    await check('Clicking sketchbook opens About panel', `__roomQA().selected==='sketchbook'&&document.querySelector('#detail').open&&document.querySelector('#detail-title').textContent.includes('Katrina')`);
    await key('Escape');
    await check('Escape closes sketchbook About panel', `!document.querySelector('#detail').open&&__roomQA().selected===null`);
    await click('.room-shortcuts [data-object="sketchbook"]');
    await check('Accessible Sketchbook shortcut opens About', `document.querySelector('#detail').open&&document.querySelector('#detail-title').textContent.includes('Katrina')`);
  }else if(highlightOnly){
    await check('Every interactive group and button has explicit config', `(()=>{const q=__roomQA();return q.objects.size===Object.keys(q.SECTIONS).length&&[...q.objects.values()].every(o=>q.SECTIONS[o.name]?.section&&q.SECTIONS[o.name]?.color)&&[...document.querySelectorAll('[data-object]')].every(b=>q.SECTIONS[q.objects.get(b.dataset.object)?.name])})()`);
    report.coverage=await evaluate(`Object.fromEntries([...__roomQA().objects].map(([id,o])=>[id,{name:o.name,...__roomQA().SECTIONS[o.name]}]))`);
    await check('No yellow or shared gold in highlight palette', `(async()=>{const q=__roomQA(),T=await import('three');return Object.values(q.SECTIONS).every(c=>{const hsl=new T.Color(c.color).getHSL({});return !(hsl.h>=.07&&hsl.h<=.19&&hsl.s>.2)})})()`);
    const home=await evaluate(`({position:__roomQA().camera.position.toArray(),target:__roomQA().controls.target.toArray()})`);
    for(const id of ['work','about','notes','play','sketch','sketchbook','bed','cat','lamp']){
      const selector=`[data-object="${id}"]`;
      await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);await delay(220);
      await check(`${id}: hover/focus outline uses its configured color`, `(()=>{const q=__roomQA(),o=q.objects.get(${JSON.stringify(id)}),color=q.SECTIONS[o.name].color.slice(1).toLowerCase();return q.outline.selectedObjects[0]===o&&q.outline.visibleEdgeColor.getHexString()===color&&q.outline.hiddenEdgeColor.getHexString()===color&&q.highlightStates.get(${JSON.stringify(id)}).amount===1})()`);
      await check(`${id}: emissive tint uses the same section color`, `(()=>{const q=__roomQA(),id=${JSON.stringify(id)},s=q.highlightStates.get(id);return q.objects.get(id).children.filter(o=>o.isMesh&&!o.userData.lampEmission).every(o=>o.material.emissive.equals(o.userData.baseEmission.clone().lerp(s.color,.18)))})()`);
      if(['work','play','bed','sketch'].includes(id))await screenshot(`highlight-${id}`);
      if(id!=='lamp'&&id!=='cat'){
        await click(selector);await delay(520);
        await check(`${id}: selection retains color, opens panel and eases camera`, `(()=>{const q=__roomQA();return q.selected===${JSON.stringify(id)}&&document.querySelector('#detail').open&&!q.focusTween&&q.camera.position.distanceTo(q.controls.target)<${Math.hypot(...home.position.map((v,i)=>v-home.target[i]))}-.1&&q.controls.getAzimuthalAngle()>=q.controls.minAzimuthAngle&&q.controls.getAzimuthalAngle()<=q.controls.maxAzimuthAngle})()`);
        if(id==='work')await screenshot('highlight-education-panel');
        if(id==='about'){
          await send('Input.dispatchMouseEvent',{type:'mousePressed',x:20,y:20,button:'left',clickCount:1});
          await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:20,y:20,button:'left',clickCount:1});
        }else await key('Escape');
        await delay(520);
        await check(`${id}: dismissal restores camera and clears selection`, `(()=>{const q=__roomQA(),p=${JSON.stringify(home.position)};return !document.querySelector('#detail').open&&q.selected===null&&q.camera.position.toArray().every((v,i)=>Math.abs(v-p[i])<.001)})()`);
      }
      await evaluate(`document.activeElement.blur();document.querySelector('#room-canvas').dispatchEvent(new PointerEvent('pointerleave'))`);await delay(200);
      await check(`${id}: leaving restores original materials`, `(()=>{const q=__roomQA(),s=q.highlightStates.get(${JSON.stringify(id)});return s.amount===0&&q.objects.get(${JSON.stringify(id)}).children.filter(o=>o.isMesh&&!o.userData.lampEmission).every(o=>o.material.emissive.equals(o.userData.baseEmission))})()`);
    }
    await click('#lamp-toggle');await delay(200);
    await check('Lamp stays off while highlighted; bulb and shade emission remain zero', `__roomQA().lamp.intensity===0&&__roomQA().objects.get('lamp').children.filter(o=>o.userData.lampEmission).every(o=>o.material.emissiveIntensity===0&&o.material.emissive.getHex()===0)`);
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await send('Page.reload');await waitReady();
    await click('[data-object="work"]');
    await check('Reduced motion removes highlight and camera tween delays', `__roomQA().highlightStates.get('work').amount===1&&!__roomQA().focusTween`);
  }else if(lampOnly){
    await check('Room background is pure black', `__roomQA().scene.background.getHex()===0 && getComputedStyle(document.querySelector('#room')).backgroundColor==='rgb(0, 0, 0)'`);
    await check('Lamp has exact light settings and independent group', `(()=>{const q=__roomQA();return q.lamp.color.getHexString()==='ffd9a0'&&q.lamp.intensity===6&&q.lamp.distance===4&&q.lamp.castShadow&&q.hemi.intensity===.5&&q.objects.get('lamp').children.length===4&&!q.objects.get('bed').children.some(o=>o.name==='Lamp_shade')})()`);
    await check('Both bulb and shade emit when on', `__roomQA().objects.get('lamp').children.filter(o=>o.userData.lampEmission).every(o=>o.material.emissiveIntensity>0&&o.material.emissive.getHexString()==='ffd9a0')`);
    await check('Camera constraints unchanged', `(()=>{const c=__roomQA().controls;return c.minAzimuthAngle===.1&&c.maxAzimuthAngle===Math.PI/2-.1&&c.minPolarAngle===Math.PI/5&&c.maxPolarAngle===Math.PI/2.6&&!c.enablePan&&c.minDistance===16*.78&&c.maxDistance===16*1.22})()`);
    await screenshot('lamp-on');
    const point=await evaluate(`(async()=>{const T=await import('three'),q=__roomQA(),shade=q.objects.get('lamp').children.find(o=>o.name==='Lamp_shade'),p=new T.Box3().setFromObject(shade).getCenter(new T.Vector3()).project(q.camera),r=document.querySelector('#room-canvas').getBoundingClientRect();return{x:r.left+(p.x*.5+.5)*r.width,y:r.top+(-p.y*.5+.5)*r.height}})()`);
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
    await check('Actual pointer raycast identifies lamp rather than bed', `__roomQA().hovered==='lamp'`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
    await check('Click turns light and both emissives off and dims ambient', `__roomQA().lamp.intensity===0&&__roomQA().hemi.intensity===.15&&__roomQA().objects.get('lamp').children.filter(o=>o.userData.lampEmission).every(o=>o.material.emissiveIntensity===0&&o.material.emissive.getHex()===0)&&!document.querySelector('#detail').open`);
    await check('Off state is saved', `localStorage.getItem('katrina-room:lamp-on')==='false'&&document.querySelector('#lamp-toggle').getAttribute('aria-pressed')==='false'`);
    await evaluate(`document.querySelector('#daylight').value=0;document.querySelector('#daylight').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#lamp-toggle').focus()`);
    await check('Daylight and focus highlighting cannot relight an off lamp', `__roomQA().lamp.intensity===0&&__roomQA().hemi.intensity===.15&&__roomQA().objects.get('lamp').children.filter(o=>o.userData.lampEmission).every(o=>o.material.emissiveIntensity===0&&o.material.emissive.getHex()===0)`);
    await screenshot('lamp-off');
    await send('Page.reload');await waitReady();
    await check('Off state survives reload', `__roomQA().lamp.intensity===0&&document.querySelector('#lamp-toggle').getAttribute('aria-pressed')==='false'`);
    await evaluate(`document.querySelector('#lamp-toggle').focus()`);
    // Use a native Enter key for the accessible button.
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    await check('Keyboard toggle restores light and both emissives', `__roomQA().lamp.intensity===6&&__roomQA().hemi.intensity===.5&&localStorage.getItem('katrina-room:lamp-on')==='true'&&__roomQA().objects.get('lamp').children.filter(o=>o.userData.lampEmission).every(o=>o.material.emissiveIntensity>0)`);
    await send('Page.reload');await waitReady();
    await check('On state survives reload', `__roomQA().lamp.intensity===6`);
    await send('Page.addScriptToEvaluateOnNewDocument',{source:`Storage.prototype.getItem=function(){throw new DOMException('Blocked','SecurityError')};Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError')};`});
    await send('Page.reload');await waitReady();
    await check('Blocked storage reads still allow room to load', `__roomQA().lamp.intensity===6`);
    await click('#lamp-toggle');
    await check('Blocked storage writes still allow lamp switching', `__roomQA().lamp.intensity===0&&__roomQA().hemi.intensity===.15&&document.querySelector('#room').classList.contains('is-ready')`);
  }else{
  await screenshot('desktop-day');
  await check('Model renders with no horizontal overflow', `document.querySelector('#room').classList.contains('is-ready') && document.documentElement.scrollWidth <= innerWidth`);
  await check('All configured interaction groups and real shadow-casting sunlight', `__roomQA().objects.size===Object.keys(__roomQA().SECTIONS).length && __roomQA().sun.castShadow && __roomQA().renderer.info.render.triangles>0`);
  report.scene = await evaluate(`({triangles:__roomQA().renderer.info.render.triangles, groups:[...__roomQA().objects.keys()], camera:__roomQA().camera.position.toArray()})`);
  await click('header .resume');
  await check('Top résumé opens honest placeholder', `document.querySelector('#detail').open && document.querySelector('#detail-content').textContent.includes('hasn’t been added')`);
  await key('Escape'); await delay(200);
  await check('Escape restores résumé focus and page scroll', `!document.querySelector('#detail').open && document.activeElement.matches('header .resume') && document.body.style.overflow===''`);
  await click('#misc-toggle');
  await check('Small side menu opens', `document.querySelector('#misc-menu').open && document.querySelector('#misc-toggle').getAttribute('aria-expanded')==='true'`);
  await click('#misc-menu [data-panel="about"]'); await delay(200);
  await check('Menu transitions to readable detail dialog', `document.querySelector('#detail').open && !document.querySelector('#misc-menu').open && document.querySelector('#detail-title').textContent.includes('Katrina') && document.body.style.overflow==='hidden'`);
  await screenshot('desktop-detail'); await key('Escape'); await delay(150);
  await check('Menu-origin dialog restores side-menu focus', `document.activeElement.id==='misc-toggle'`);
  for (const id of ['work', 'about', 'notes', 'play', 'bed']) {
    await click(`.room-shortcuts [data-object="${id}"]`);
    await check(`${id} shortcut opens detail and selects mesh`, `document.querySelector('#detail').open && __roomQA().selected===${JSON.stringify(id)} && __roomQA().outline.selectedObjects.length===1`);
    await key('Escape'); await delay(80);
  }
  await click('.room-shortcuts [data-object="cat"]');
  await check('Cat interaction remains in room', `!document.querySelector('#detail').open && document.querySelector('#room-status').textContent.includes('stretches')`);
  await click('#labels-toggle');
  await check('Hide labels updates visible state and accessibility state', `document.querySelector('#room').classList.contains('labels-hidden') && document.querySelector('#labels-toggle').getAttribute('aria-pressed')==='false'`);
  await click('#labels-toggle');
  await evaluate(`document.querySelector('#daylight').value=0; document.querySelector('#daylight').dispatchEvent(new Event('input',{bubbles:true}));`);
  await delay(400); await screenshot('desktop-evening');
  await check('Daylight slider changes sun independently of lamp', `__roomQA().sun.intensity===.85 && __roomQA().lamp.intensity===6 && document.querySelector('#light-state').textContent==='6:00 PM'`);
  await evaluate(`document.querySelector('#room-canvas').focus()`);
  await key('ArrowLeft');
  await evaluate(`for(let i=0;i<22;i++)for(const key of ['ArrowLeft','ArrowDown'])document.querySelector('#room-canvas').dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}))`);
  await check('Keyboard rotation stops at azimuth/pitch limits', `Math.abs(__roomQA().controls.getAzimuthalAngle()-__roomQA().controls.maxAzimuthAngle)<.001 && Math.abs(__roomQA().controls.getPolarAngle()-__roomQA().controls.maxPolarAngle)<.001`);
  await screenshot('desktop-orbit-limit');
  await key('Home'); await delay(900);
  await check('Home resets camera', `__roomQA().camera.position.distanceTo(__roomQA().controls.target)>15.99 && __roomQA().camera.position.distanceTo(__roomQA().controls.target)<16.01 && !__roomQA().resetTween`);
  await evaluate(`document.querySelector('#daylight').value=100; document.querySelector('#daylight').dispatchEvent(new Event('input',{bubbles:true})); document.activeElement.blur();`);
  for (const width of [390, 360, 768]) {
    await viewport(width, 844, width < 768); await delay(600);
    await screenshot(`viewport-${width}`);
    await check(`${width}px has no horizontal overflow and keeps résumé/menu`, `document.documentElement.scrollWidth<=innerWidth && document.querySelector('header .resume').getBoundingClientRect().width>0 && document.querySelector('#misc-toggle').getBoundingClientRect().width>0`);
    await check(`${width}px disables room zoom`, `!__roomQA().controls.enableZoom`);
  }
  await viewport(390, 844, true); await delay(400);
  await click('.room-shortcuts [data-object="work"]'); await delay(300);
  await screenshot('mobile-detail');
  await check('Mobile detail fits viewport and traps focus', `(()=>{const d=document.querySelector('#detail'),r=d.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&d.contains(document.activeElement)})()`);
  await key('Tab');
  await check('Tab stays in modal', `document.querySelector('#detail').contains(document.activeElement)`);
  await key('Escape');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.reload'); await waitReady();
  await check('Reduced motion disables animated reset', `__roomQA().reduced && (document.querySelector('#reset-view').click(), !__roomQA().resetTween)`);
  // Deliberately fail WebGL on a fresh page to exercise ordinary navigation.
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `const get=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).startsWith('webgl')?null:get.call(this,type,...args)};` });
  await send('Page.reload'); await delay(1200);
  await check('WebGL failure shows useful fallback', `document.querySelector('#room-status').textContent.includes('unavailable')`);
  await click('.room-shortcuts [data-object="work"]');
  await check('Navigation works without WebGL', `document.querySelector('#detail').open`);
  }
  report.result = report.checks.every(c => c.passed) ? 'passed' : 'issues found';
} catch (error) {
  report.result = 'blocked'; report.errors.push({ runner: String(error) }); console.error(error);
} finally {
  const reportName=styleOnly?'style-report.json':educationOnly?'education-report.json':catOnly?'cat-report.json':sketchbookOnly?'sketchbook-report.json':highlightOnly?'highlight-report.json':lampOnly?'lamp-report.json':'report.json';
  await fs.writeFile(path.join(out, reportName), JSON.stringify(report, null, 2));
  ws?.close(); chrome.kill(); server.close();
  console.log(`Report: ${path.join(out, reportName)}`);
  process.exitCode = report.result === 'passed' ? 0 : 1;
}
