/**
 * CRISTALU 3D ENGINE — v0.1 (socle)
 * ---------------------------------------------------------
 * Viewer Three.js réutilisable : hero, showroom, configurateur.
 * API publique (stable, prévue pour l'étape suivante) :
 *   const v = await createViewer(el, { autoRotate, controls, background })
 *   v.setProduct(buildProduct(config))   // modèle procédural
 *   v.loadModel('/assets/models/xxx.glb') // vrais modèles GLB/GLTF
 *   v.setFinish('#2b2d30')                // couleur du profilé
 *   v.dispose()
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const FINISHES = {
  anthracite: { label: 'Anthracite RAL 7016', hex: '#2b2d30' },
  noir:       { label: 'Noir sablé',          hex: '#121314' },
  blanc:      { label: 'Blanc RAL 9016',      hex: '#f2f2ef' },
  alu:        { label: 'Aluminium brossé',    hex: '#b9bcc0' },
  bronze:     { label: 'Bronze',              hex: '#6b5646' },
  chene:      { label: 'Plaxé chêne doré',    hex: '#9a6b3c' },
};

/** Construit un produit procédural à partir d'une config (même schéma que le configurateur). */
export function buildProduct(cfg = {}) {
  const c = { type: 'fenetre', width: 1.4, height: 1.4, leaves: 2, finish: '#2b2d30', profile: 0.07, ...cfg };
  const g = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: c.finish, metalness: 0.75, roughness: 0.32 });
  frameMat.name = 'frame';
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xcfe3ea, metalness: 0, roughness: 0.03, transmission: 0.92, thickness: 0.02,
    transparent: true, opacity: 0.35, envMapIntensity: 1.6, side: THREE.DoubleSide,
  });
  const p = c.profile, d = 0.09, W = c.width, H = c.height;
  const bar = (w, h, x, y, depth = d) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), frameMat);
    m.position.set(x, y, 0); m.castShadow = true; g.add(m); return m;
  };

  if (c.type === 'pergola') {
    const postH = H, s = 0.12;
    [[-W/2, -W/2], [W/2, -W/2], [-W/2, W/2], [W/2, W/2]].forEach(([x, z]) => {
      const m = bar(s, postH, x, 0, s); m.position.z = z;
    });
    const beam = (len, rotY, x, z) => { const m = bar(len + s, 0.2, 0, postH/2 - 0.1, s); m.rotation.y = rotY; m.position.x = x; m.position.z = z; };
    beam(W, 0, 0, -W/2); beam(W, 0, 0, W/2); beam(W, Math.PI/2, -W/2, 0); beam(W, Math.PI/2, W/2, 0);
    for (let i = 0; i < 12; i++) {
      const m = bar(0.16, 0.025, 0, postH/2 - 0.06, W);
      m.position.x = -W/2 + 0.12 + i * (W - 0.24) / 11; m.rotation.z = 0.5; g.userData.blades = (g.userData.blades || []).concat(m);
    }
    return g;
  }

  // Dormant
  bar(W, p, 0, H/2 - p/2); bar(W, p, 0, -H/2 + p/2);
  bar(p, H, -W/2 + p/2, 0); bar(p, H, W/2 - p/2, 0);

  const leaves = c.type === 'porte' ? 1 : c.leaves;
  const innerW = W - 2 * p, innerH = H - 2 * p;
  const lw = innerW / leaves;
  for (let i = 0; i < leaves; i++) {
    const cx = -innerW/2 + lw/2 + i * lw;
    const z = c.type === 'baie' ? (i % 2 ? 0.03 : -0.03) : 0;
    const sp = p * 0.8;
    const L = new THREE.Group(); L.position.set(cx, 0, z);
    [[lw, sp, 0, innerH/2 - sp/2], [lw, sp, 0, -innerH/2 + sp/2], [sp, innerH, -lw/2 + sp/2, 0], [sp, innerH, lw/2 - sp/2, 0]]
      .forEach(([w, h, x, y]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d*0.8), frameMat); m.position.set(x, y, 0); L.add(m); });
    if (c.type === 'porte') {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(lw - 2*sp, innerH * 0.35, 0.03), frameMat);
      panel.position.y = -innerH * 0.3; L.add(panel);
      const gl = new THREE.Mesh(new THREE.BoxGeometry(lw - 2*sp, innerH * 0.55, 0.012), glassMat);
      gl.position.y = innerH * 0.17; L.add(gl);
    } else {
      const gl = new THREE.Mesh(new THREE.BoxGeometry(lw - 2*sp, innerH - 2*sp, 0.012), glassMat); L.add(gl);
    }
    // poignée
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.04), new THREE.MeshStandardMaterial({ color: 0xd9d9d9, metalness: 1, roughness: .2 }));
    h.position.set((i % 2 ? -1 : 1) * (lw/2 - sp/2), 0, d/2); L.add(h);
    g.add(L);
  }
  if (c.type === 'murrideau') {
    // meneaux/traverses supplémentaires
    for (let i = 1; i < 3; i++) bar(W, p*0.6, 0, -H/2 + i * H/3);
  }
  return g;
}

export async function createViewer(container, opts = {}) {
  const o = { autoRotate: true, controls: true, background: null, camera: [2.2, 0.6, 3.2], exposure: 1.0, zoom: false, ...opts };
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: o.background === null });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = o.exposure;
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  if (o.background) scene.background = new THREE.Color(o.background);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(...o.camera);
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 3); key.castShadow = true; scene.add(key);
  const rim = new THREE.DirectionalLight(0xff4a52, 0.9); rim.position.set(-3, 1, -2); scene.add(rim);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(4, 64), new THREE.ShadowMaterial({ opacity: 0.25 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.95; ground.receiveShadow = true; scene.add(ground);

  let controls = null;
  if (o.controls) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.enableZoom = o.zoom; controls.enablePan = false;
    controls.autoRotate = o.autoRotate; controls.autoRotateSpeed = 0.8;
    controls.minPolarAngle = 0.9; controls.maxPolarAngle = 1.9;
    controls.minDistance = 2; controls.maxDistance = 9;
  }

  const holder = new THREE.Group(); scene.add(holder);
  let current = null;
  const mouse = { x: 0, y: 0 };
  window.addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; });

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(container); resize();

  let running = true, t0 = performance.now();
  const io = new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) loop(); });
  io.observe(container);

  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    const t = (performance.now() - t0) / 1000;
    holder.position.y = Math.sin(t * 0.8) * 0.03;
    if (!o.controls || o.parallax) { holder.rotation.y += (mouse.x * 0.6 + Math.sin(t*0.3)*0.25 - holder.rotation.y) * 0.04; holder.rotation.x += (mouse.y * 0.2 - holder.rotation.x) * 0.04; }
    if (current?.userData.blades) current.userData.blades.forEach(b => b.rotation.z = 0.2 + (Math.sin(t*0.6)+1) * 0.5);
    controls?.update();
    renderer.render(scene, camera);
  }
  loop();

  const api = {
    scene, camera, renderer, THREE,
    setProduct(obj) {
      if (current) holder.remove(current);
      current = obj; holder.add(obj);
      // cadrage
      const box = new THREE.Box3().setFromObject(obj); const size = box.getSize(new THREE.Vector3());
      const s = 1.8 / Math.max(size.x, size.y, size.z); obj.scale.setScalar(s);
      const c = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3()); obj.position.sub(c);
      obj.traverse(m => { if (m.isMesh) m.castShadow = true; });
      return obj;
    },
    async loadModel(url) {
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const gltf = await new GLTFLoader().loadAsync(url);
      return api.setProduct(gltf.scene);
    },
    setFinish(hex) {
      current?.traverse(m => { if (m.isMesh && m.material?.name === 'frame') m.material.color.set(hex); });
    },
    dispose() { running = false; io.disconnect(); renderer.dispose(); container.innerHTML = ''; },
  };
  return api;
}
