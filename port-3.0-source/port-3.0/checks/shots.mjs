// Fast screenshots: node checks/shots.mjs [width] [height] [sections...]
import { chromium } from 'playwright'; import fs from 'node:fs';
const [w = 1440, h = 900, ...ids] = process.argv.slice(2);
const out = 'checks/shots'; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const touch = Number(w) < 700;
const p = await b.newPage({ viewport: { width: +w, height: +h }, hasTouch: touch, isMobile: touch });
const errs = []; p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('response', r => r.status() >= 400 && errs.push(r.status() + ' ' + r.url())); p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5174/');
await p.waitForFunction(() => document.body.dataset.view !== 'loading', null, { timeout: 120000 });
await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/${w}-home.png` });
for (const id of ids.length ? ids : ['about', 'skills', 'projects', 'experience', 'education', 'offclock', 'contact']) {
  await p.evaluate(id => { location.hash = id; }, id); await p.waitForTimeout(4800);
  if (!touch) await p.mouse.move(+w * .55, +h * .5);
  await p.screenshot({ path: `${out}/${w}-${id}.png` });
}
console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].join('\n') : 'no console errors');
await b.close();
