import { SECTIONS, HOME, sectionById } from './sections.js';
import { LINKS, ABOUT, SKILLS, PROJECTS, EXPERIENCE, MOMENTS, EDUCATION, AWARDS, COURSEWORK, ORGS, OFF_CLOCK, SHOWS, BADGES, BOOKS } from './content.js';
import { orlandoNow, lightAt } from './clock.js';

const $ = s => document.querySelector(s);
const body = document.body;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
let room = null, current = null, projectIndex = 0, lastFocus = null;

// ---------------- section content ----------------
const photo = (name, alt, cls = '') => `<img class="${cls}" src="assets/photos/${name}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
const tags = list => `<ul class="tags">${list.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;

const render = {
  about: () => `
    <figure class="polaroid tilt-r">${photo('profile.jpg', 'Katrina’s profile picture: a tabby cat looking up')}<figcaption>my profile picture</figcaption></figure>
    <p class="lede">${esc(ABOUT.lede)}</p>
    ${ABOUT.body.map(p => `<p>${esc(p)}</p>`).join('')}
    <h3 class="hand">things I love</h3>${tags(ABOUT.likes)}
    <figure class="polaroid tilt-l wide">${photo('monkey.jpg', 'Katrina holding a capuchin monkey in front of a pink building')}<figcaption>me &amp; a new friend</figcaption></figure>
    <p class="aside">This whole room started as a sketch on graph paper.</p>`,
  skills: () => `
    <div class="badges" aria-hidden="true">${BADGES.map(b => `<img src="assets/badges/${b.file}.svg" alt="" height="28" loading="lazy">`).join('')}</div>
    <div class="bluecard">
      ${SKILLS.map(g => `<h3 class="hand">${esc(g.group)}</h3><ul class="dots">${g.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`).join('')}
    </div>
    <p class="aside">The same blocks are in the skills book on the coffee table.</p>`,
  projects: () => {
    const p = PROJECTS[projectIndex];
    return `
    <div class="papers">
      <div class="paper-back b1"></div><div class="paper-back b2"></div>
      <article class="paper-card" data-project="${p.id}">
        <svg class="clip" viewBox="0 0 30 74" aria-hidden="true"><path d="M21 22v34a8 8 0 0 1-16 0V12a6 6 0 0 1 12 0v40a3 3 0 0 1-6 0V22"/></svg>
        <p class="card-meta"><span class="tabular">${projectIndex + 1} / ${PROJECTS.length}</span>${p.featured ? '<span class="featured">featured</span>' : ''}</p>
        <h3 class="card-title">${esc(p.title)}${p.subtitle ? `<small>${esc(p.subtitle)}</small>` : ''}</h3>
        ${p.when ? `<p class="hand when">${esc(p.when)}</p>` : ''}
        <ul class="chips">${p.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        <p class="card-text">${esc(p.text)}</p>
        ${p.note ? `<p class="hand card-note">${esc(p.note)}</p>` : ''}
        ${p.links ? `<p class="card-links">${p.links.map(([label, href]) => `<a href="${href}" target="_blank" rel="noopener">${esc(label)} <span aria-hidden="true">↗</span></a>`).join('')}</p>` : ''}
      </article>
    </div>
    <ol class="project-dots" aria-label="All projects">${PROJECTS.map((x, i) => `<li><button data-project-jump="${i}" aria-current="${i === projectIndex}" aria-label="${esc(x.title)}"><span>${esc(x.title)}</span></button></li>`).join('')}</ol>
    <p class="aside">${p.media.video ? 'The demo is playing on the computer.' : p.media.image.includes('photos/') ? 'Photo: Unsplash, until a demo is ready.' : 'On the computer: a screenshot of the project.'}</p>`;
  },
  books: () => `
    <p class="lede">My favourites, and a few current reads.</p>
    <ul class="book-grid">${BOOKS.map((b, i) => `<li style="--r:${[-2, 1.5, -1, 2, -1.5, 1][i % 6]}deg"><img src="assets/books/${b.image}.webp" alt="" loading="lazy"><b>${esc(b.title)}</b><span>${esc(b.author)}</span></li>`).join('')}</ul>`,
  experience: () => `
    <ol class="timeline">${EXPERIENCE.map(e => `
      <li><p class="hand when">${esc(e.when)}</p><h3>${esc(e.role)}</h3><p class="org">${esc(e.org)}</p><p>${esc(e.text)}</p></li>`).join('')}
    </ol>
    <h3 class="hand">hackathons, shadows &amp; showing up</h3>
    <ul class="moments">${MOMENTS.map(m => `<li><span class="hand when">${esc(m.when)}</span><b>${esc(m.what)}</b><span>${esc(m.note)}</span></li>`).join('')}</ul>`,
  education: () => `
    ${EDUCATION.map(e => `<div class="school"><p class="hand when">${esc(e.when)}</p><h3>${esc(e.degree)}</h3><p class="org">${esc(e.school)}</p><p>${esc(e.detail)}</p></div>`).join('')}
    <h3 class="hand">awards &amp; scholarships</h3>${tags(AWARDS)}
    <h3 class="hand">coursework I liked</h3>${tags(COURSEWORK)}
    <h3 class="hand">where you’ll find me</h3>${tags(ORGS)}`,
  offclock: () => `
    <p class="lede">${esc(OFF_CLOCK.text)}</p>
    <h3 class="hand">on the tv right now</h3>
    <ul class="shows">${SHOWS.map((s, i) => `<li><button data-show="${i}" aria-pressed="false">${esc(s.title)}</button></li>`).join('')}</ul>
    <p class="aside">Pick one and it plays on the TV.</p>
    <h3 class="hand">front row seats</h3>
    <p>${esc(OFF_CLOCK.stage)}</p>
    <h3 class="hand">passport stamps</h3>
    <div class="trips">${OFF_CLOCK.places.map((p, i) => `<figure class="polaroid ${i % 2 ? 'tilt-r' : 'tilt-l'}">${photo(p.image + '.webp', p.name)}<figcaption>${esc(p.name)}</figcaption></figure>`).join('')}</div>
    <p class="aside">${esc(OFF_CLOCK.more)} Photos: Unsplash.</p>`,
  contact: () => `
    <p class="lede">I’d love to hear about your team, your hackathon or your cat.</p>
    <a class="big-link" href="mailto:${LINKS.email}">${LINKS.email}</a>
    <ul class="contact-list">
      <li><a href="${LINKS.github}" target="_blank" rel="noopener">GitHub <span>kateye31</span></a></li>
      <li><a href="${LINKS.linkedin}" target="_blank" rel="noopener">LinkedIn <span>katrina-adewale</span></a></li>
      <li><a href="${LINKS.resume}" target="_blank" rel="noopener">Résumé <span>PDF</span></a></li>
    </ul>
    <p class="aside">The cat says hi too. Give it another click.</p>`,
};

// ---------------- navigation ----------------
const order = SECTIONS.map(s => s.id);
const INK_FILTER = 'brightness(0) saturate(100%) invert(9%) sepia(19%) saturate(2400%) hue-rotate(225deg)';
function light(hex) { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255; return (.299 * r + .587 * g + .114 * b) > 165; }
function go(id, { push = true } = {}) {
  if (id === 'home' || !sectionById(id)) return goHome({ push });
  const section = sectionById(id), first = !current;
  current = id;
  body.dataset.view = 'section';
  body.dataset.section = id;
  document.documentElement.style.setProperty('--ground', section.ground);
  document.documentElement.style.setProperty('--on-ground', section.ink);
  document.documentElement.style.setProperty('--tint', section.outline);
  $('meta[name="theme-color"]').content = section.ground;
  document.documentElement.style.setProperty('--sheet', section.sheet);
  document.documentElement.style.setProperty('--on-sheet', light(section.sheet) ? '#1E1631' : '#FFFDF8');
  // Katrina's arrows are white; on pale grounds they're inked instead.
  document.documentElement.style.setProperty('--arrow-filter', light(section.ground) ? INK_FILTER : 'drop-shadow(0 2px 3px rgb(30 22 49 / .25))');
  $('#sheet-heading').textContent = section.title;
  $('#sheet-note').textContent = section.note;
  $('#panel-inner').innerHTML = render[id]();
  $('#panel').scrollTop = 0;
  const i = order.indexOf(id), prev = SECTIONS[(i - 1 + order.length) % order.length], next = SECTIONS[(i + 1) % order.length];
  $('#step-prev span').textContent = prev.title; $('#step-prev').dataset.go = prev.id; $('#step-prev').setAttribute('aria-label', `Previous: ${prev.title}`);
  $('#step-next span').textContent = next.title; $('#step-next').dataset.go = next.id; $('#step-next').setAttribute('aria-label', `Next: ${next.title}`);
  replay($('#scene'), first ? 'enter' : 'swap');
  if (room) room.goTo(id);
  if (id !== 'offclock') room?.showShow(null);
  if (push) history.pushState({ id }, '', `#${id}`);
  document.title = `${section.title} · Katrina Adewale`;
  $('#announce').textContent = `${section.title}`;
  syncMenu();
}
function goHome({ push = true } = {}) {
  current = null;
  body.dataset.view = 'home'; delete body.dataset.section;
  document.documentElement.style.setProperty('--ground', homeLight.ground);
  document.documentElement.style.setProperty('--on-ground', homeLight.ink);
  $('meta[name="theme-color"]').content = homeLight.ground;
  room?.home();
  if (push && location.hash) history.pushState({ id: 'home' }, '', location.pathname);
  document.title = 'Katrina Adewale';
  syncMenu();
}
// Restart a CSS entrance without leaving stale classes around.
function replay(el, name) {
  el.classList.remove('enter', 'swap'); void el.offsetWidth; el.classList.add(name);
}
const step = dir => { const i = order.indexOf(current); go(current ? order[(i + dir + order.length) % order.length] : order[0]); };

addEventListener('popstate', () => { const id = location.hash.slice(1); go(id || 'home', { push: false }); });

document.addEventListener('click', e => {
  const show = e.target.closest('[data-show]');
  if (show) {
    const i = Number(show.dataset.show), on = show.getAttribute('aria-pressed') !== 'true';
    document.querySelectorAll('[data-show]').forEach(b => b.setAttribute('aria-pressed', String(on && b === show)));
    room?.showShow(on ? i : null);
    return;
  }
  const t = e.target.closest('[data-go], [data-project-step], [data-project-jump]');
  if (!t) return;
  if (t.dataset.go) { e.preventDefault(); closeMenu(); go(t.dataset.go); return; }
  const n = t.dataset.projectStep ? projectIndex + Number(t.dataset.projectStep) : Number(t.dataset.projectJump);
  projectIndex = (n + PROJECTS.length) % PROJECTS.length;
  const panel = $('#panel'), y = panel.scrollTop;
  $('#panel-inner').innerHTML = render.projects();
  panel.scrollTop = t.dataset.projectJump ? 0 : y;
  replay($('.papers'), t.dataset.projectStep === '-1' ? 'from-left' : 'from-right');
  room?.showProject(PROJECTS[projectIndex]);
  $('#announce').textContent = PROJECTS[projectIndex].title;
  if (t.dataset.projectStep && t.closest('.panel')) $(`.panel [data-project-step="${t.dataset.projectStep}"]`)?.focus();
});

addEventListener('keydown', e => {
  if (!$('#menu').hidden) { if (e.key === 'Escape') closeMenu(); return; }
  if (e.target.closest('input, textarea')) return;
  if (e.key === 'Escape' && current) goHome();
  if (current && e.key === 'ArrowRight' && !e.target.closest('canvas')) step(1);
  if (current && e.key === 'ArrowLeft' && !e.target.closest('canvas')) step(-1);
});

// Wheel walks the tour like a slow scroll, without hijacking the panel's own scrolling.
let wheelAcc = 0, wheelLock = 0;
addEventListener('wheel', e => {
  if (body.dataset.view === 'loading' || !$('#menu').hidden) return;
  const panel = e.target.closest('.panel');
  if (panel && panel.scrollHeight > panel.clientHeight + 2) {
    const atTop = panel.scrollTop <= 0, atEnd = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2;
    if (!(e.deltaY < 0 && atTop) && !(e.deltaY > 0 && atEnd)) return;
  }
  const now = performance.now(); if (now < wheelLock) return;
  wheelAcc += e.deltaY;
  if (Math.abs(wheelAcc) > 120) {
    const dir = Math.sign(wheelAcc); wheelAcc = 0; wheelLock = now + 1300;
    if (!current) { if (dir > 0) go(order[0]); }
    else if (dir < 0 && current === order[0]) goHome();
    else if (!(dir > 0 && current === order[order.length - 1])) step(dir);
  }
}, { passive: true });

// ---------------- menu ----------------
function buildMenu() {
  $('#menu-list').innerHTML = `<li><button data-go="home"><i style="--c:${HOME.ground}"></i>The room</button></li>` +
    SECTIONS.map(s => `<li><button data-go="${s.id}"><i style="--c:${s.ground}"></i>${esc(s.title)}<small>${esc(s.note)}</small></button></li>`).join('');
}
function syncNav() { $('#nav-work').setAttribute('aria-current', current === 'projects' ? 'page' : 'false'); }
function syncMenu() { syncNav(); document.querySelectorAll('#menu-list button').forEach(b => b.setAttribute('aria-current', String(b.dataset.go === (current || 'home')))); }
function openMenu() {
  lastFocus = document.activeElement;
  const m = $('#menu'); m.hidden = false; replay(m, 'enter');
  $('#menu-button').setAttribute('aria-expanded', 'true');
  m.querySelector('[aria-current="true"]')?.focus() ?? $('#menu-close').focus();
}
function closeMenu() {
  const m = $('#menu'); if (m.hidden) return;
  m.hidden = true; $('#menu-button').setAttribute('aria-expanded', 'false');
  if (lastFocus?.isConnected && !lastFocus.closest('#menu')) lastFocus.focus();
}
$('#menu-button').addEventListener('click', openMenu);
$('#menu-close').addEventListener('click', closeMenu);
$('#menu').addEventListener('click', e => { if (e.target === $('#menu')) closeMenu(); });
$('#menu').addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const f = [...$('#menu').querySelectorAll('button, a')]; const a = f[0], z = f.at(-1);
  if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
  else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
});
$('#lamp-button').addEventListener('click', e => {
  if (!room) return;
  const on = room.toggleLamp(); e.currentTarget.textContent = `lamp: ${on ? 'on' : 'off'}`; e.currentTarget.setAttribute('aria-pressed', String(on));
});

// ---------------- hotspots ----------------
function buildHotspots() {
  $('#hotspots').innerHTML = SECTIONS.map(s => `<button class="hotspot" data-go="${s.id}" style="--tint:${s.outline}" aria-label="${esc(s.title)}"><img src="assets/drawn/cursor-dot.webp" alt=""><span>${esc(s.title)}</span></button>`).join('');
}
function placeHotspots(points) {
  for (const [id, el] of [['monitorL', $('.m-prev')], ['monitorR', $('.m-next')]]) {
    const p = points[id];
    el.style.transform = `translate3d(${p.x + (id === 'monitorL' ? -64 : 64)}px, ${p.y}px, 0)`;
  }
  for (const b of $('#hotspots').children) {
    const p = points[b.dataset.go];
    b.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
    b.hidden = !p.visible;
  }
}

// ---------------- cursor ----------------
// Trails the pointer with a lerp (like the reference), grows into one of
// Katrina's drawn cursor states over things you can act on.
function setupCursor() {
  if (!finePointer) return null;
  body.classList.add('has-cursor');
  const el = $('#cursor'), label = $('#cursor-label');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 }, aim = { ...pos };
  let shown = false, roomState = null;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    aim.x = e.clientX; aim.y = e.clientY;
    if (!shown) { pos.x = aim.x; pos.y = aim.y; shown = true; el.classList.add('on'); }
    if (room) room.setParallax(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5);
    update(e.target);
  }, { passive: true });
  document.addEventListener('pointerleave', () => { el.classList.remove('on'); shown = false; });
  addEventListener('pointerdown', () => el.classList.add('press'));
  addEventListener('pointerup', () => el.classList.remove('press'));
  function update(target) {
    const hit = target.closest?.('[data-cursor], a, button, .hotspot');
    let state = 'dot';
    if (hit?.dataset.cursor) state = hit.dataset.cursor;
    else if (hit?.classList.contains('hotspot')) state = sectionById(hit.dataset.go)?.enter ? 'enter' : 'grow';
    else if (hit) state = 'link';
    else if (target.id === 'room-canvas' && roomState) state = roomState.enter ? 'enter' : 'grow';
    el.dataset.state = state;
    const over = target.id === 'room-canvas' ? roomState?.label : hit?.classList.contains('hotspot') ? hit.getAttribute('aria-label') : '';
    const text = state === 'enter' || state === 'grow' ? over || '' : '';
    label.textContent = text; label.style.setProperty('--tint', roomState?.tint || 'var(--tint)');
    el.classList.toggle('labelled', Boolean(text));
  }
  function frame() {
    const k = reduced ? 1 : .2;
    pos.x += (aim.x - pos.x) * k; pos.y += (aim.y - pos.y) * k;
    el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return {
    room(detail) {
      roomState = detail.key ? { label: detail.section ? detail.section.title : 'the lamp', enter: Boolean(detail.section?.enter), tint: detail.section?.outline || '#FFE7A3' } : null;
      update(document.elementFromPoint(aim.x, aim.y) || body);
    },
  };
}

// ---------------- Katrina's time + page views ----------------
let homeLight = { ground: HOME.ground, ink: HOME.ink };
function tickClock() {
  const { hour, label } = orlandoNow(), l = lightAt(hour);
  homeLight = l;
  $('#clock-time').textContent = label;
  $('#clock-phase').textContent = l.phase;
  document.documentElement.style.setProperty('--home-ground', l.ground);
  document.documentElement.style.setProperty('--home-ink', l.ink);
  body.classList.toggle('is-night', l.night);
  if (!current && body.dataset.view !== 'loading') {
    document.documentElement.style.setProperty('--ground', l.ground);
    document.documentElement.style.setProperty('--on-ground', l.ink);
    $('meta[name="theme-color"]').content = l.ground;
  }
  room?.setClock(l);
}
tickClock(); setInterval(tickClock, 30000);

// One hit per browser session.
(async () => {
  // Local previews count against a separate key so they never touch the real number.
  const live = !/^(localhost|127\.|\[::1\])/.test(location.hostname);
  const key = `https://abacus.jasoncameron.dev/%s/katrinaadewale-dev/${live ? 'views' : 'preview-views'}`;
  let verb = 'get';
  try { if (!sessionStorage.getItem('counted')) { verb = 'hit'; sessionStorage.setItem('counted', '1'); } } catch { verb = 'hit'; }
  try {
    const r = await fetch(key.replace('%s', verb)); if (!r.ok) throw 0;
    const { value } = await r.json();
    $('#views').textContent = Number(value).toLocaleString('en-US');
    $('#views-word').textContent = Number(value) === 1 ? 'visit' : 'visits';
    $('#views-wrap').hidden = false;
  } catch { /* the counter is a nicety; hide it if it's down */ }
})();

// ---------------- boot ----------------
buildMenu(); buildHotspots();
const cursor = setupCursor();
document.addEventListener('room:hover', e => { cursor?.room(e.detail); });
document.addEventListener('room:pick', e => {
  const { key, section } = e.detail;
  if (key === 'lamp') { $('#lamp-button').click(); return; }
  if (!section) return;
  if (section.id === current && key === 'cat') { room.pet(); return; }
  go(section.id);
});

const start = location.hash.slice(1);
function reveal() {
  body.dataset.view = 'home';
  if (start && sectionById(start)) go(start, { push: false }); else goHome({ push: false });
  setTimeout(() => $('#loader').remove(), reduced ? 0 : 900);
}
(async () => {
  const pct = $('#loader-pct');
  const setProgress = p => { pct.textContent = `${Math.round(p * 100)}%`; document.documentElement.style.setProperty('--load', p); };
  try {
    const { createRoom } = await import('./room.js');
    room = await createRoom({ canvas: $('#room-canvas'), onProgress: setProgress });
    setProgress(1);
    room.onAnchors(placeHotspots);
    room.showProject(PROJECTS[projectIndex]);
    tickClock();
    // Let the sketch finish "drawing" before it hands over to the real room.
    setTimeout(reveal, reduced ? 0 : 450);
  } catch (error) {
    console.error('The 3D room could not open', error);
    body.classList.add('no-room');
    $('#loader-text').textContent = 'the 3D room needs WebGL, so here is the paper version';
    setTimeout(reveal, 1200);
  }
})();
