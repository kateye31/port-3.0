// One entry per portfolio section, in tour order. `objects` are the
// userData.interactive keys that open it (see furnish.js). `shot` frames the
// camera: `frame` lists interactive keys or object names to fit, `dir` is where
// the camera sits relative to them. `ground` is the page colour field and
// `outline` the baby tint for hover outlines. `sheet` is the torn corner's colour.
export const SECTIONS = Object.freeze([
  { id: 'about', title: 'About me', note: 'the painting & the easel', objects: ['painting', 'easel'],
    ground: '#FFB7FF', outline: '#FFD3FF', ink: '#3A1236', sheet: '#F32B6E',
    anchor: [2.15, 3.55, -2.85], shot: { frame: ['painting'], dir: [-.12, .1, 1], fit: 1.4, minRadius: 1.1 } },
  { id: 'projects', title: 'Projects', nav: 'Work', note: 'the computer', objects: ['desk'],
    ground: '#826AED', outline: '#D4B0FF', ink: '#FFFFFF', sheet: '#C879FF',
    anchor: [-2.9, 2.35, .35], shot: { frame: ['k-computerScreen'], dir: [1, .16, .02], fit: 1, minRadius: 1.45 } },
  { id: 'skills', title: 'Skills', note: 'the book on the coffee table', objects: ['table'],
    ground: '#8CF6FA', outline: '#3BF4FB', ink: '#0C2E33', sheet: '#2BC4D9',
    anchor: [-.15, 1.15, 1.25], shot: { frame: ['skills-book'], dir: [.45, 1.5, .8], fit: 1, minRadius: .78 } },
  { id: 'experience', title: 'Experience', note: 'the coat rack', objects: ['coatrack'],
    ground: '#F05F5F', outline: '#FFB0A8', ink: '#FFFFFF', sheet: '#FFB38A',
    anchor: [-2.72, 3.0, 2.62], shot: { dir: [.75, .3, 1], fit: 1.0 } },
  { id: 'education', title: 'Education', note: 'the wall by the window', objects: ['diploma', 'education_board'],
    ground: '#CAFF8A', outline: '#E2FFB8', ink: '#1F3307', sheet: '#7FD13B',
    anchor: [-3.2, 4.0, 2.45], shot: { dir: [1, .22, .3], fit: 1.05 } },
  { id: 'books', title: 'My books', note: 'the bookshelf', objects: ['bookshelf'],
    ground: '#FFA463', outline: '#FFD2A8', ink: '#2A1405', sheet: '#826AED',
    anchor: [-2.3, 3.35, -2.4], shot: { dir: [.22, .55, 1], fit: 1.0 } },
  { id: 'offclock', title: 'Off the clock', note: 'the tv, the records, the globe & the bed', objects: ['tv', 'bed', 'record', 'globe'],
    ground: '#C879FF', outline: '#E8C9FF', ink: '#26093D', sheet: '#3BF4FB',
    anchor: [.05, 2.85, -2.5], shot: { frame: ['k-televisionModern', 'record-player', 'globe'], dir: [0, .14, 1], fit: 1, minRadius: 1.2 } },
  { id: 'contact', title: 'Say hello', note: 'the cat', objects: ['cat'],
    ground: '#F32B6E', outline: '#FFB3CC', ink: '#FFFFFF', sheet: '#FFB7FF',
    anchor: null, shot: { dir: [.6, .55, 1], fit: 1.3, minRadius: .9 } },
]);

export const HOME = Object.freeze({ ground: '#FFC49B', ink: '#1E1631' });
export const LAMP = Object.freeze({ key: 'lamp', outline: '#FFE7A3' });

export const sectionById = id => SECTIONS.find(s => s.id === id);
export const sectionForObject = key => SECTIONS.find(s => s.objects.includes(key));
