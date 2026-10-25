import { SECTIONS, HOME, sectionById } from './sections.js';
import { LINKS, ABOUT, SKILLS, PROJECTS, EXPERIENCE, MOMENTS, EDUCATION, AWARDS, COURSEWORK, ORGS, OFF_CLOCK, SHOWS, BADGES, BOOKS, ALBUMS } from './content.js';
import { orlandoNow, lightAt } from './clock.js';

const $ = s => document.querySelector(s);
const body = document.body;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
// Same query as room.js and styles.css: phones and portrait tablets get the bottom sheet.
const stacked = matchMedia('(max-width: 759px) and (min-height: 501px), (max-width: 1100px) and (orientation: portrait)');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
let room = null, current = null, projectIndex = 0, lastFocus = null;

// ---------------- section content ----------------
const photo = (name, alt, cls = '') => `<img class="${cls}" src="assets/photos/${name}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
const tags = list => `<ul class="tags">${list.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;

// Soft paper tints from Katrina's palette (dark ink stays readable on all).
const PAPERS = [
  ['#FFF1C9', '#F05F5F', '#6FA8FF'],   // butter
  ['#FFE0F2', '#826AED', '#3BF4FB'],   // pink
  ['#DDF7FF', '#F32B6E', '#CAFF8A'],   // sky
  ['#EFE6FF', '#FFB7FF', '#F05F5F'],   // lilac
  ['#E9FFD4', '#C879FF', '#FFB38A'],   // lime
  ['#FFE6D6', '#3BF4FB', '#826AED'],   // peach
  ['#DFFBF5', '#F05F5F', '#FFD166'],   // mint
  ['#F7F4EF', '#6FA8FF', '#F32B6E'],   // paper
];
const render = {
  about: () => `
    <figure class="polaroid tilt-r wide-shot">${photo('me-pink-wall.webp', 'Katrina smiling up at the sun in front of a pink wall')}</figure>
    <p class="lede">${esc(ABOUT.lede)}</p>
    ${ABOUT.body.map(p => `<p>${esc(p)}</p>`).join('')}
    <h3 class="hand">things I love</h3>${tags(ABOUT.likes)}
    <figure class="polaroid tilt-l wide-shot won">${photo('kh-jetson.webp', 'Katrina and her Fireline teammates on stage at Knight Hacks IX holding their prizes')}<span class="won-trophies" aria-hidden="true"><img src="assets/drawn/trophy.png" alt=""><img src="assets/drawn/trophy.png" alt=""></span><figcaption>Knight Hacks IX</figcaption></figure>
    <div class="photo-pair about-pair">
    <figure class="polaroid tilt-l">${photo('monkey.jpg', 'Katrina holding a capuchin monkey in front of a pink building')}<figcaption>me &amp; a new friend</figcaption></figure>
    <figure class="polaroid tilt-r">${photo('concert.webp', 'A crowd making a heart with their hands at a beabadoobee concert')}<figcaption>beabadoobee concert</figcaption></figure>
    </div>
    <h3 class="hand">travel blog</h3>
    <figure class="polaroid tilt-r wide-shot">${photo(OFF_CLOCK.places[0].image + '.webp', OFF_CLOCK.places[0].name)}<figcaption>${esc(OFF_CLOCK.places[0].name)}</figcaption></figure>
    <button class="see-more" data-see="offclock:travel" data-cursor="next">see more of my travels <img src="assets/drawn/scribble-b.webp" alt="" width="986" height="506"></button>
    <p class="aside">This whole room started as a sketch on graph paper.</p>`,
  skills: () => `
    <div class="badges" aria-hidden="true">${BADGES.map(b => `<img src="assets/badges/${b.file}.svg" alt="" height="28" loading="lazy">`).join('')}</div>
    <div class="bluecard">
      ${SKILLS.map(g => `<h3 class="hand">${esc(g.group)}</h3><ul class="dots">${g.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`).join('')}
    </div>
    <p class="aside">The same blocks are in the skills book on the coffee table.</p>`,
  projects: () => {
    const p = PROJECTS[projectIndex];
    // Each project gets its own sheet of paper; the two behind it rotate too.
    const [paper, back1, back2] = PAPERS[projectIndex % PAPERS.length];
    return `
    <div class="papers" style="--paper-card:${paper};--paper-b1:${back1};--paper-b2:${back2}">
      <div class="paper-back b1"></div><div class="paper-back b2"></div>
      <article class="paper-card" data-project="${p.id}">
        <svg class="clip" viewBox="0 0 30 74" aria-hidden="true"><path d="M21 22v34a8 8 0 0 1-16 0V12a6 6 0 0 1 12 0v40a3 3 0 0 1-6 0V22"/></svg>
        ${p.featured ? '<img class="card-star" src="assets/drawn/star.png" alt="Featured project" width="360" height="380">' : ''}
        ${p.media.video ? `<div class="card-video"><video src="${p.media.video}" poster="${p.media.poster}" muted loop playsinline autoplay preload="auto" aria-label="${esc(p.title)} demo"></video></div>` : ''}
        <p class="card-meta"><span class="tabular">${projectIndex + 1} / ${PROJECTS.length}</span></p>
        <h3 class="card-title">${esc(p.title)}${p.subtitle ? `<small>${esc(p.subtitle)}</small>` : ''}</h3>
        ${p.when ? `<p class="hand when">${esc(p.when)}</p>` : ''}
        ${p.wins ? `<p class="card-wins" aria-label="${p.wins} wins">${'<img src="assets/drawn/trophy.png" alt="" width="290" height="325">'.repeat(p.wins)}<span class="hand">${p.wins} wins!</span></p>` : ''}
        <ul class="chips">${p.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        <p class="card-text">${esc(p.text)}</p>
        ${p.note ? `<p class="hand card-note">${esc(p.note)}</p>` : ''}
        ${p.links ? `<p class="card-links">${p.links.map(([label, href]) => `<a href="${href}" target="_blank" rel="noopener">${esc(label)} <span aria-hidden="true">↗</span></a>`).join('')}</p>` : ''}
      </article>
    </div>
    ${p.photos ? `<div class="project-photos">${p.photos.map((ph, i) => `<figure class="polaroid ${i % 2 ? 'tilt-r' : 'tilt-l'}">${photo(ph.image, ph.alt)}<figcaption>${esc(ph.caption)}</figcaption></figure>`).join('')}</div>` : ''}
    <ol class="project-dots" aria-label="All projects">${PROJECTS.map((x, i) => `<li><button data-project-jump="${i}" aria-current="${i === projectIndex}" aria-label="${esc(x.title)}"><span>${esc(x.title)}</span></button></li>`).join('')}</ol>
    <nav class="project-pager" aria-label="Flip through projects">
      <button class="pp-btn pp-prev" data-project-step="-1" data-cursor="prev" aria-label="Previous project"><img src="assets/drawn/scribble-a.webp" alt="" width="986" height="506"></button>
      <p class="pp-now"><span class="pp-count tabular">project ${projectIndex + 1} / ${PROJECTS.length}</span><b class="pp-title">${esc(p.title)}</b></p>
      <button class="pp-btn pp-next" data-project-step="1" data-cursor="next" aria-label="Next project"><img src="assets/drawn/scribble-b.webp" alt="" width="986" height="506"></button>
    </nav>
    <p class="aside">${p.media.video ? 'The demo is playing on the computer.' : p.media.image.includes('photos/') ? 'Photo: Unsplash, until a demo is ready.' : 'On the computer: a screenshot of the project.'}</p>`;
  },
  books: () => `
    <p class="lede">My favourites, and a few current reads.</p>
    <ul class="book-grid">${BOOKS.map((b, i) => `<li style="--r:${[-2, 1.5, -1, 2, -1.5, 1][i % 6]}deg"><img src="assets/books/${b.image}.webp" alt="" loading="lazy"><b>${esc(b.title)}</b><span>${esc(b.author)}</span></li>`).join('')}</ul>`,
  experience: () => `
    <ol class="timeline">${EXPERIENCE.map(e => `
      <li>${e.logo ? `<span class="exp-logo"><img src="assets/orgs/${e.logo}" alt="" loading="lazy"></span>` : ''}<p class="hand when">${esc(e.when)}</p><h3>${esc(e.role)}</h3><p class="org">${esc(e.org)}</p><p>${esc(e.text)}</p></li>`).join('')}
    </ol>
    <h3 class="hand">hackathons, shadows &amp; showing up</h3>
    <ul class="moments">${MOMENTS.map(m => `<li><span class="hand when">${esc(m.when)}</span><b>${esc(m.what)}</b><span>${esc(m.note)}</span></li>`).join('')}</ul>`,
  education: () => `
    ${EDUCATION.map(e => `<div class="school"><p class="hand when">${esc(e.when)}</p><h3>${esc(e.degree)}</h3><p class="org">${esc(e.school)}</p><p>${esc(e.detail)}</p></div>`).join('')}
    <h3 class="hand">awards &amp; scholarships</h3>${tags(AWARDS)}
    <h3 class="hand">coursework I liked</h3>${tags(COURSEWORK)}
    <h3 class="hand">where you’ll find me</h3>
    <ul class="orgs">${ORGS.map(o => `<li><span class="org-logo" style="--bg:${o.bg}"><img src="assets/orgs/${o.logo}.webp" alt="" loading="lazy"></span><b>${esc(o.name)}</b></li>`).join('')}</ul>`,
  offclock: () => `
    <p class="lede">${esc(OFF_CLOCK.text)}</p>
    <h3 class="hand">on the tv right now</h3>
    <ul class="shows">${SHOWS.map((s, i) => `<li><button data-show="${i}" aria-pressed="false">${esc(s.title)}</button></li>`).join('')}</ul>
    <p class="aside">Pick one and it plays on the TV.</p>
    <h3 class="hand">on the record player</h3>
    <ul class="albums">${ALBUMS.map((a, i) => `<li><button data-album="${i}" aria-pressed="false" title="${esc(a.title)} · ${esc(a.artist)}"><img src="assets/albums/${a.image}.webp" alt="" loading="lazy"><span><b>${esc(a.title)}</b>${esc(a.artist)}</span></button></li>`).join('')}</ul>
    <h3 class="hand">front row seats</h3>
    <ul class="playbills">${OFF_CLOCK.playbills.map(p => `<li><span class="pb-head"><b>PLAYBILL</b><small>${esc(p.theatre)}</small></span><img src="assets/musicals/${p.image}.webp" alt="${esc(p.show)} poster art" loading="lazy"></li>`).join('')}</ul>
    <p>${esc(OFF_CLOCK.stage)}</p>
    <h3 class="hand" id="travel">travel blog</h3>
    <div class="trips">${OFF_CLOCK.places.map((p, i) => `<figure class="polaroid ${i % 2 ? 'tilt-r' : 'tilt-l'}">${photo(p.image + '.webp', p.name)}<figcaption>${esc(p.name)}</figcaption></figure>`).join('')}</div>
`,
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
  const after = SECTIONS[(order.indexOf(id) + 1) % order.length];
  $('#panel-inner').innerHTML = render[id]() + `<button class="next-up" data-go="${after.id}" data-cursor="next"><span class="hand">next up</span>${esc(after.title)} <img src="assets/drawn/scribble-b.webp" alt="" width="986" height="506"></button>`;
  $('#panel').scrollTop = 0;
  setPeek?.(false);
  const i = order.indexOf(id), prev = SECTIONS[(i - 1 + order.length) % order.length], next = SECTIONS[(i + 1) % order.length];
  $('#step-prev span').textContent = prev.title; $('#step-prev').dataset.go = prev.id; $('#step-prev').setAttribute('aria-label', `Previous: ${prev.title}`);
  $('#step-next span').textContent = next.title; $('#step-next').dataset.go = next.id; $('#step-next').setAttribute('aria-label', `Next: ${next.title}`);
  replay($('#scene'), first ? 'enter' : 'swap');
  if (room) room.goTo(id);
  if (id === 'projects') syncScreen();
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
  const album = e.target.closest('[data-album]');
  if (album) {
    const on = album.getAttribute('aria-pressed') !== 'true';
    document.querySelectorAll('[data-album]').forEach(b => b.setAttribute('aria-pressed', String(on && b === album)));
    room?.playAlbum(on ? Number(album.dataset.album) : null);
    return;
  }
  const see = e.target.closest('[data-see]');
  if (see) {
    const [id, anchor] = see.dataset.see.split(':');
    go(id);
    requestAnimationFrame(() => setTimeout(() => {
      const panel = $('#panel'), el = document.getElementById(anchor);
      if (el) panel.scrollTo({ top: el.offsetTop - 18, behavior: reduced ? 'auto' : 'smooth' });
    }, reduced ? 0 : 700));
    return;
  }
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
  syncScreen();
  $('#announce').textContent = PROJECTS[projectIndex].title;
  if (t.dataset.projectStep && t.closest('.panel')) $(`.panel [data-project-step="${t.dataset.projectStep}"]`)?.focus();
});

addEventListener('keydown', e => {
  if (!$('#menu').hidden) { if (e.key === 'Escape') closeMenu(); return; }
  if (e.target.closest('input, textarea')) return;
  if (e.key === 'Escape' && current) goHome();
  const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
  if (!current || !dir || e.target.closest('canvas')) return;
  // In Projects the arrow keys flip through projects; elsewhere they walk the room.
  if (current === 'projects') $(`.m-arrow[data-project-step="${dir}"]`).click(); else step(dir);
});

// Scrolling only ever reads. On the home page a scroll down starts the tour;
// inside a section the wheel scrolls the panel, wherever the pointer is, and
// moving on is always a choice (arrows, arrow keys, the link at the end).
let wheelAcc = 0;
addEventListener('wheel', e => {
  if (body.dataset.view === 'loading' || !$('#menu').hidden) return;
  if (current) {
    if (!e.target.closest('.panel')) $('#panel').scrollBy({ top: e.deltaY, behavior: 'auto' });
    return;
  }
  wheelAcc = Math.max(0, wheelAcc + e.deltaY);
  if (wheelAcc > 160) { wheelAcc = 0; go(order[0]); }
}, { passive: true });

// ---------------- menu ----------------
function buildMenu() {
  // Three big doors first; the rest of the room sits in a quieter list below.
  const MAIN = ['projects', 'experience', 'about'];
  const item = s => `<li><button data-go="${s.id}" style="--c:${s.ground}"><i></i>${esc(s.title)}</button></li>`;
  $('#menu-main').innerHTML = MAIN.map(id => item(sectionById(id))).join('');
  $('#menu-list').innerHTML = SECTIONS.filter(s => !MAIN.includes(s.id) && s.id !== 'contact').map(item).join('');
}
function syncNav() {
  $('#nav-work').setAttribute('aria-current', current === 'projects' ? 'page' : 'false');
  $('#nav-exp').setAttribute('aria-current', current === 'experience' ? 'page' : 'false');
}
function syncMenu() { syncNav(); document.querySelectorAll('#menu-main button, #menu-list button, .menu-home').forEach(b => b.setAttribute('aria-current', String(b.dataset.go === (current || 'home')))); }
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
let vinylAt = null;
function placeHotspots(points) {
  vinylAt = points.vinyl;
  for (const [id, el] of [['monitorL', $('.m-prev')], ['monitorR', $('.m-next')]]) {
    const p = points[id];
    let x = p.x + (id === 'monitorL' ? -64 : 64);
    // Never tuck the right arrow under the panel.
    const edge = !stacked.matches ? $('#panel').getBoundingClientRect().left - 48 : innerWidth - 40;
    if (id === 'monitorR') x = Math.min(x, edge);
    el.style.transform = `translate3d(${x}px, ${p.y}px, 0)`;
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
    else if (hit?.classList.contains('hotspot')) state = 'grow';
    else if (hit) state = 'link';
    else if (target.id === 'room-canvas' && roomState) state = 'grow';
    el.dataset.state = state;
    // The hotspot shows its own coloured label, so the cursor only labels the 3D room.
    const over = target.id === 'room-canvas' ? roomState?.label : '';
    const text = state === 'grow' ? over || '' : '';
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
      roomState = detail.key ? { label: detail.section ? detail.section.title : 'the lamp', tint: detail.section?.outline || '#FFE7A3' } : null;
      update(document.elementFromPoint(aim.x, aim.y) || body);
    },
  };
}

// ---------------- Katrina's local time ----------------
let homeLight = { ground: HOME.ground, ink: HOME.ink };
function tickClock() {
  const l = lightAt(orlandoNow().hour);
  homeLight = l;
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

// Private visit log: one silent hit per browser session, never shown on the
// page. Katrina reads the number at abacus.jasoncameron.dev/get/katrinaadewale-dev/views.
// Local previews count against a separate key so they never touch the real number.
try {
  if (!sessionStorage.getItem('counted')) {
    sessionStorage.setItem('counted', '1');
    const live = /(^|.)katrinaadewale.dev$/.test(location.hostname);
    fetch(`https://abacus.jasoncameron.dev/hit/katrinaadewale-dev/${live ? 'views' : 'preview-views'}`).catch(() => {});
  }
} catch { /* storage blocked: skip counting */ }

// ---------------- music notes from the record player ----------------
const NOTES = ['note-treble', 'note-half', 'note-half2', 'note-eighth', 'note-eighth2', 'note-flat', 'note-bass'];
if (!reduced) setInterval(() => {
  if (!vinylAt?.visible || document.hidden || body.dataset.view === 'loading') return;
  const n = document.createElement('img'), drift = (Math.random() - .5) * 120;
  n.src = `assets/drawn/${NOTES[Math.floor(Math.random() * NOTES.length)]}.png`; n.alt = '';
  n.style.cssText = `left:${vinylAt.x}px;top:${vinylAt.y}px;--dx:${drift}px;--rot:${(Math.random() - .5) * 40}deg;--s:${body.dataset.section === 'offclock' ? .8 : .5}`;
  $('#notes').append(n); n.addEventListener('animationend', () => n.remove());
}, 2600);

// ---------------- project demos ----------------
// Videos only exist while Projects is open: the card plays the demo and the
// desk monitor mirrors that same element.
function syncScreen() {
  const p = PROJECTS[projectIndex], v = current === 'projects' ? $('.card-video video') : null;
  if (v) v.play().catch(() => {});
  room?.showProject({ ...p, videoEl: v });
}

// ---------------- phone sheet ----------------
// Tap (or drag) the grip to lower the sheet and see the room, tap again to read.
const grip = $('#sheet-grip');
const setPeek = on => { body.classList.toggle('peek', on); grip.setAttribute('aria-pressed', String(on)); grip.setAttribute('aria-label', on ? 'Show the text again' : 'Show more of the room'); };
grip.addEventListener('click', () => setPeek(!body.classList.contains('peek')));
let dragY = null;
grip.addEventListener('pointerdown', e => { dragY = e.clientY; });
addEventListener('pointerup', e => { if (dragY !== null && Math.abs(e.clientY - dragY) > 30) setPeek(e.clientY > dragY); dragY = null; });
addEventListener('touchstart', () => body.classList.add('touched'), { once: true, passive: true });

// ---------------- boot ----------------
buildMenu(); buildHotspots();
const cursor = setupCursor();
document.addEventListener('room:hover', e => { cursor?.room(e.detail); });
document.addEventListener('room:pick', e => {
  const { key, section } = e.detail;
  if (key === 'lamp') { $('#lamp-button').click(); return; }
  if (!section) return;
  if (section.id === current && key === 'cat') { room.pet(); return; }
  if (section.id === current) return;
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
    syncScreen();
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
