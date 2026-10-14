import * as THREE from 'three';

// Reuse the GLB's plain floor notebook as the lower cover. Details are small
// box meshes so this prop remains editable without a Blender re-export.
export function addSketchbook(model) {
  const book = new THREE.Group();
  book.name = 'sketchbook';
  book.userData.interactive = 'sketchbook';
  book.position.set(-2.22, 1.428, -.78);
  book.rotation.y = THREE.MathUtils.degToRad(4);
  model.add(book);

  const cover = new THREE.MeshStandardMaterial({ color: '#C48166', roughness: .92 });
  const paper = new THREE.MeshStandardMaterial({ color: '#FFF1DA', roughness: .96 });
  const wood = new THREE.MeshStandardMaterial({ color: '#B48056', roughness: .9 });
  const graphite = new THREE.MeshStandardMaterial({ color: '#384447', roughness: .9 });
  const eraser = new THREE.MeshStandardMaterial({ color: '#DFA38C', roughness: .95 });
  function box(name, dimensions, position, material, angle = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.rotation.y = angle;
    mesh.castShadow = mesh.receiveShadow = true;
    book.add(mesh);
    return mesh;
  }
  const existing = model.getObjectByName('Notebook');
  if (existing?.isMesh) {
    existing.geometry.computeBoundingBox();
    const size = existing.geometry.boundingBox.getSize(new THREE.Vector3());
    book.add(existing);
    existing.name = 'sketchbook_cover';
    existing.position.set(0, .012, 0);
    existing.rotation.set(0, 0, 0);
    existing.scale.set(.52 / size.x, .024 / size.y, .65 / size.z);
    existing.material = cover;
    existing.castShadow = existing.receiveShadow = true;
  } else {
    box('sketchbook_cover', [.52, .024, .65], [0, .012, 0], cover);
  }
  for (let i = 0; i < 4; i++) {
    box(`sketchbook_pages_${i + 1}`, [.49, .008, .62],
      [.008 + i * .007, .028 + i * .008, i * .003], paper,
      THREE.MathUtils.degToRad(i * .7));
  }
  box('sketchbook_front_cover', [.51, .018, .64], [0, .066, 0], cover);
  box('sketchbook_spine', [.025, .064, .65], [-.25, .032, 0], cover);
  box('sketchbook_label', [.18, .002, .10], [-.055, .076, .06], paper);

  const pencil = new THREE.Group();
  pencil.name = 'sketchbook_pencil';
  pencil.position.set(.125, .087, -.025);
  pencil.rotation.y = THREE.MathUtils.degToRad(-12);
  book.add(pencil);
  for (const [name, dimensions, position, material] of [
    ['pencil_body', [.018, .018, .40], [0, 0, 0], wood],
    ['pencil_tip', [.012, .012, .035], [0, 0, .2175], graphite],
    ['pencil_eraser', [.019, .019, .035], [0, 0, -.2175], eraser],
  ]) pencil.add(box(name, dimensions, position, material));
  return book;
}
