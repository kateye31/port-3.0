// Keys are the interactive parent names produced by GLTFLoader.
// Descendant meshes inherit their parent's entry; there is no fallback color.
// Experience uses blue instead of SPEC's butter to honor the no-yellow request.
export const SECTIONS = Object.freeze({
  Desk: Object.freeze({ section: 'education', color: '#A8E6CF' }),
  frame_degree: Object.freeze({ section: 'education', color: '#A8E6CF' }),
  education_corkboard: Object.freeze({ section: 'education', color: '#A8E6CF' }),
  education_textbooks: Object.freeze({ section: 'education', color: '#A8E6CF' }),
  Globe: Object.freeze({ section: 'about', color: '#FF7F6E' }),
  Bookshelf: Object.freeze({ section: 'misc', color: '#C6C8D6' }),
  Modern_TV: Object.freeze({ section: 'projects', color: '#C9B6FF' }),
  Easel: Object.freeze({ section: 'about', color: '#FF7F6E' }),
  sketchbook: Object.freeze({ section: 'about', color: '#FF7F6E' }),
  Bed: Object.freeze({ section: 'experience', color: '#A9C7FF' }),
  Cat: Object.freeze({ section: 'about', color: '#FF7F6E' }),
  Lamp: Object.freeze({ section: 'education', color: '#A8E6CF' }),
});
