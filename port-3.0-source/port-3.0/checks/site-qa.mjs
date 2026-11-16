// Browser QA for the room portfolio. Usage:
//   node checks/site-qa.mjs [baseUrl] [outDir]
// Drives the real page in headless Chromium (SwiftShader WebGL) at desktop and
// phone sizes, exercises hover/click/keyboard/menu/tour, and writes screenshots
// plus report.json. Exits 1 on console errors or failed assertions.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] || 'http://localhost:5174/';
const out = path.resolve(process.argv[3] || 'checks/site-results');
fs.mkdirSync(out, { recursive: true });
const report = { base, errors: [], checks: [] };
const check = (name, ok, detail = '') => { report.checks.push({ name, ok: Boolean(ok), detail }); console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ' · ' + detail : ''}`); };
const shot = (page, name) => page.screenshot({ path: path.join(out, `${name}.png`) });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function open(viewport, opts = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: Boolean(opts.touch), isMobile: Boolean(opts.touch), reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') report.errors.push(`${viewport.width}: ${m.text()}`); });
  page.on('pageerror', e => report.errors.push(`${viewport.width}: ${e.message}`));
  await page.goto(base + (opts.hash || ''), { waitUntil: 'domcontentloaded' });
  return page;
}
const settle = (page, ms = 1900) => page.waitForTimeout(ms);
const ready = page => page.waitForFunction(() => document.body.dataset.view !== 'loading', null, { timeout: 300000 });

// Find a canvas pixel that picks a given section by sampling a grid.
async function findObject(page, sectionId) {
  const box = await page.locator('#room-canvas').boundingBox();
  for (let y = .12; y < .95; y += .04) for (let x = .08; x < .95; x += .03) {
    const px = box.x + box.width * x, py = box.y + box.height * y;
    await page.mouse.move(px, py);
    await page.waitForTimeout(45);
    const hit = await page.evaluate(() => document.querySelector('#cursor').dataset.state === 'grow' ? document.querySelector('#cursor-label').textContent : '');
    const want = await page.evaluate(id => (document.querySelector(`.hotspot[data-go="${id}"]`)?.getAttribute('aria-label')) || '', sectionId);
    if (hit && hit === want) return { x: px, y: py };
  }
  return null;
}

// ---------- desktop ----------
{
  const page = await open({ width: 1440, height: 900 });
  await page.waitForTimeout(700); await shot(page, 'd-0-loader');
  await ready(page); await settle(page, 1500);
  await page.mouse.move(300, 700);
  await shot(page, 'd-1-home');
  check('home view after load', await page.evaluate(() => document.body.dataset.view === 'home'));
  check('hotspots placed', await page.evaluate(() => [...document.querySelectorAll('.hotspot')].filter(b => !b.hidden && b.style.transform).length >= 6));
  check('custom cursor active', await page.evaluate(() => document.body.classList.contains('has-cursor')));

  const pc = await findObject(page, 'projects');
  check('hover computer grows cursor + label', pc, pc ? `${Math.round(pc.x)},${Math.round(pc.y)}` : 'not found');
  if (pc) { await page.mouse.move(pc.x, pc.y); await settle(page, 500); await shot(page, 'd-2-hover-computer'); }

  if (pc) { await page.mouse.click(pc.x, pc.y); } else { await page.click('.hotspot[data-go="projects"]', { force: true }); }
  await settle(page, 2300);
  check('click computer opens projects', await page.evaluate(() => location.hash === '#projects' && document.body.dataset.section === 'projects'));
  await page.mouse.move(700, 500); await shot(page, 'd-3-projects');
  const next = page.locator('.panel [data-project-step="1"], .m-next').first();
  await next.hover({ force: true }); await settle(page, 350);
  await page.keyboard.press('ArrowRight'); await settle(page, 600);
  check('ArrowRight flips to project 2', await page.evaluate(() => document.querySelector('.card-meta').textContent.trim().startsWith('2')));
  await page.keyboard.press('ArrowLeft'); await settle(page, 600);
  await shot(page, 'd-4-project-next-hover');
  { const bb = await page.locator('.m-next').boundingBox(); await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); } await settle(page, 600);
  check('project carousel advances', await page.evaluate(() => document.querySelector('.card-meta').textContent.trim().startsWith('2')));

  for (const id of ['about', 'skills', 'experience', 'education', 'offclock', 'contact']) {
    await page.evaluate(id => { location.hash = id; }, id); await settle(page, 2300);
    await page.mouse.move(720, 450);
    check(`section ${id} renders`, await page.evaluate(id => document.body.dataset.section === id && document.querySelector('#panel-inner').textContent.length > 80, id));
    await shot(page, `d-5-${id}`);
  }
  // keyboard: ArrowRight walks, Escape returns home
  await page.evaluate(() => { location.hash = 'about'; }); await settle(page, 1800);
  await page.keyboard.press('ArrowRight'); await settle(page, 1800);
  check('ArrowRight goes to next section', await page.evaluate(() => document.body.dataset.section === 'projects'));
  await page.keyboard.press('Escape'); await settle(page, 1800);
  check('Escape returns to the room', await page.evaluate(() => document.body.dataset.view === 'home'));
  // wheel walks the tour
  await page.mouse.move(900, 450); await page.mouse.wheel(0, 300); await settle(page, 2200);
  check('wheel starts the tour', await page.evaluate(() => document.body.dataset.section === 'about'));
  await page.evaluate(() => { const p = document.querySelector('#panel'); p.scrollTop = p.scrollHeight; }); await page.mouse.move(1100, 500); await page.mouse.wheel(0, 600); await settle(page, 1500);
  check('scrolling past the end of a panel stays put', await page.evaluate(() => document.body.dataset.section === 'about'));
  await page.evaluate(() => history.back()); await settle(page, 1800);
  // menu
  await page.click('#menu-button'); await settle(page, 400);
  await shot(page, 'd-6-menu');
  check('menu opens with focus inside', await page.evaluate(() => !document.querySelector('#menu').hidden && document.querySelector('#menu').contains(document.activeElement)));
  await page.click('#menu-main [data-go="experience"]'); await settle(page, 2200);
  check('menu navigates', await page.evaluate(() => document.body.dataset.section === 'experience' && document.querySelector('#menu').hidden));
  // overflow: nothing wider than the viewport
  check('no horizontal overflow (desktop)', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.context().close();
}

// ---------- laptop width ----------
{
  const page = await open({ width: 1280, height: 720 }, { hash: '#skills' });
  await ready(page); await settle(page, 2300); await page.mouse.move(640, 360);
  await shot(page, 'l-skills');
  await page.context().close();
  const page2 = await open({ width: 1280, height: 720 }); await ready(page2); await settle(page2, 1600); await shot(page2, 'l-home');
  await page2.context().close();
}

// ---------- phone ----------
{
  const page = await open({ width: 390, height: 844 }, { touch: true });
  await ready(page); await settle(page, 1600);
  await shot(page, 'm-1-home');
  check('no custom cursor on touch', await page.evaluate(() => !document.body.classList.contains('has-cursor')));
  await page.tap('.tour'); await settle(page, 2300);
  await shot(page, 'm-2-about');
  check('tour button opens About', await page.evaluate(() => document.body.dataset.section === 'about'));
  await page.tap('#step-next'); await settle(page, 2300);
  await shot(page, 'm-3-skills');
  await page.evaluate(() => { location.hash = 'projects'; }); await settle(page, 2300);
  await shot(page, 'm-4-projects');
  await page.evaluate(() => { location.hash = 'experience'; }); await settle(page, 2300);
  await shot(page, 'm-5-experience');
  check('no horizontal overflow (phone)', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  check('panel fits on phone', await page.evaluate(() => { const r = document.querySelector('#panel').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight + 1; }));
  await page.click('#menu-button'); await settle(page, 400); await shot(page, 'm-6-menu');
  await page.context().close();
}

// ---------- reduced motion ----------
{
  const page = await open({ width: 1440, height: 900 }, { reduced: true, hash: '#education' });
  await ready(page); await settle(page, 900);
  await shot(page, 'r-education');
  check('reduced motion lands directly', await page.evaluate(() => document.body.dataset.section === 'education'));
  await page.context().close();
}

await browser.close();
check('no console errors', report.errors.length === 0, report.errors.slice(0, 5).join(' | '));
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
process.exit(report.checks.every(c => c.ok) ? 0 : 1);
