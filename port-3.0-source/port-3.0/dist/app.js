const detail = document.querySelector('#detail');
const menu = document.querySelector('#misc-menu');
const menuToggle = document.querySelector('#misc-toggle');
let lastTrigger = null;

// Replace these draft sections with Katrina's own project stories and résumé.
// No experience, education, employment or project outcomes are invented.
const panels = {
  education: `<div class="detail-content"><p class="eyebrow">EDUCATION</p><h2 id="detail-title">Learning, in progress.</h2><p class="detail-intro">B.S. Computer Science, UCF</p><div class="notebook"><small>UNIVERSITY OF CENTRAL FLORIDA</small><p>Minor in Intelligent Robotic Systems</p><p>Expected Dec 2027</p></div><button class="text-link" data-panel="work">Explore the projects ↗</button></div>`,
  experience: `<div class="detail-content"><p class="eyebrow">EXPERIENCE</p><h2 id="detail-title">Experience.</h2><p class="detail-intro">A place for the roles, contributions, and lessons behind the work.</p><p class="placeholder-note">Experience draft · Roles, dates, and accomplishments have not been added yet.</p><button class="text-link" data-panel="work">Explore the projects ↗</button></div>`,
  bed: `<div class="detail-content"><p class="eyebrow">OFF THE CLOCK</p><h2 id="detail-title">Room to recharge.</h2><p class="detail-intro">The quiet corner of the room: soft bedding, a little lamplight, and space to switch off.</p><div class="notebook"><small>A LITTLE INTERMISSION</small><p>Even big ideas need a good night’s sleep.</p></div><p class="placeholder-note">This section is ready for the personal interests and stories you’d like to share.</p><button class="text-link" data-panel="work">Back to the work ↗</button></div>`,
  work: `<div class="detail-content"><p class="eyebrow">01 / AT THE DESK</p><h2 id="detail-title">Things brought to life.</h2><p class="detail-intro">A closer look at the ideas, decisions, and details behind the work.</p><article class="project-preview"><img src="assets/room-preview.png" alt="The modeled 3D bedroom portfolio"><div class="project-copy"><span class="eyebrow">PERSONAL WEBSITE · 2026</span><h3>A room for ideas</h3><p>A portfolio imagined as a sunlit 3D bedroom. Explore the room, or head straight to the work.</p><span class="tag">Interaction design</span><span class="tag">Creative development</span></div></article><button class="text-link" data-panel="case">Inside this project ↗</button><p class="placeholder-note">Portfolio draft · Add your selected projects and real case studies here. This room is the first piece on display.</p></div>`,
  case: `<div class="detail-content"><p class="eyebrow">PROJECT NOTES / THE PORTFOLIO</p><h2 id="detail-title">From a sketch<br>to a small world.</h2><p class="detail-intro">The starting point was a room sketched on graph paper: a desk, a bookshelf, a globe, a television, and an easel. Each object became a way into the portfolio.</p><div class="about-grid"><div><h3>The idea</h3><p>Make an inviting personal space that feels worth exploring, while keeping the work one click away.</p></div><div><h3>The details</h3><p>Live window light and shadows, constrained rotation, object highlights, keyboard controls, and a layout that adapts to smaller screens.</p></div></div><div class="notebook"><small>ONE GUIDING PRINCIPLE</small><p>A room to remember.<br>A portfolio that’s easy to read.</p></div><p class="placeholder-note">Modeled in Blender and rendered live in Three.js. Window light, shadows, camera movement, and object selection are computed in your browser.</p><div class="detail-actions"><button class="primary" data-close>Back to the room <span>↗</span></button><button class="text-link" data-panel="work">All work</button></div></div>`,
  about: `<div class="detail-content"><p class="eyebrow">02 / AROUND THE GLOBE</p><h2 id="detail-title">Hello, I’m Katrina.</h2><p class="detail-intro">Welcome to my little corner of the internet. This room brings the work and the things behind it into one place.</p><div class="about-grid"><div><h3>A place to make.</h3><p>The desk holds the work: projects, ideas, and the process of bringing them to life.</p></div><div><h3>A place to wander.</h3><p>The rest of the room leaves a little space for sketches, discoveries, and experiments.</p></div></div><div class="notebook"><small>A NOTE FROM THE ROOM</small><p>Look around. Stay curious.<br>Make yourself at home.</p></div><p class="placeholder-note">About section draft · Your background, current focus, and contact details will make this space yours.</p><button class="text-link" data-panel="work">Take a look at the work ↗</button></div>`,
  notes: `<div class="detail-content"><p class="eyebrow">03 / ON THE SHELF</p><h2 id="detail-title">A collection in progress.</h2><p class="detail-intro">A quiet place for the things that spark the next idea.</p><p class="shelf-label">SHELF SECTIONS · READY TO PERSONALIZE</p><div class="shelf-row"><span>01</span><div><h3>Books & bookmarks</h3><p>Space for the reads and references you return to.</p></div></div><div class="shelf-row"><span>02</span><div><h3>Little discoveries</h3><p>Space for interesting places, objects, and ideas.</p></div></div><div class="shelf-row"><span>03</span><div><h3>Notes to self</h3><p>Space for thoughts worth keeping.</p></div></div><p class="placeholder-note">The shelf is waiting for your own recommendations and notes.</p></div>`,
  play: `<div class="detail-content"><p class="eyebrow">04 / AT THE EASEL</p><h2 id="detail-title">Room to play.</h2><p class="detail-intro">Small experiments, loose sketches, and ideas that don’t need to become anything just yet.</p><img class="sketch-image" src="assets/room-preview.png" alt="A 3D bedroom with a cat, bed, and easel"><div class="about-grid"><div><h3>Try a different light.</h3><p>Use the afternoon light slider beneath the room to shift its mood.</p></div><div><h3>Explore at your pace.</h3><p>Drag to rotate the room. Hover or focus an object to highlight it, and give the cat a little head scratch.</p></div></div><p class="placeholder-note">Sketchbook draft · Add your own illustrations, experiments, and creative side projects here.</p><button class="primary" data-close>Back to exploring <span>↗</span></button></div>`,
  resume: `<div class="detail-content"><p class="eyebrow">THE SHORT VERSION</p><h2 id="detail-title">Résumé.</h2><p class="detail-intro">The essentials, all in one place.</p><div class="empty-resume"><div class="paper-icon" aria-hidden="true">▤</div><h3>Coming into focus.</h3><p>A résumé hasn’t been added to this portfolio yet. Once it’s ready, you’ll be able to view and download it here.</p></div><button class="text-link" data-panel="work">Explore the work in the meantime ↗</button></div>`
};
function openPanel(name, trigger) {
  if (!panels[name]) return;
  if (!detail.open && !menu.open) lastTrigger = trigger;
  if (menu.open) menu.close();
  document.querySelector('#detail-content').innerHTML = panels[name];
  if (!detail.open) detail.showModal();
  document.body.style.overflow = 'hidden';
  detail.scrollTop = 0;
  detail.querySelector('.close').focus();
}
document.addEventListener('click', event => {
  const panelButton = event.target.closest('[data-panel]');
  if (panelButton) openPanel(panelButton.dataset.panel, panelButton);
  const closeButton = event.target.closest('[data-close]');
  if (closeButton) closeButton.closest('dialog').close();
});
menuToggle.addEventListener('click', () => {
  lastTrigger = menuToggle;
  menu.showModal();
  menuToggle.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
});
for (const dialog of [detail, menu]) {
  dialog.addEventListener('click', e => {
    if (e.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    menuToggle.setAttribute('aria-expanded', String(menu.open));
    if (!detail.open && !menu.open) {
      document.body.style.overflow = '';
      if (lastTrigger?.isConnected) lastTrigger.focus();
    }
  });
}

window.openRoomPanel = openPanel;
