/** Mesin 3D: satu renderer WebGL dipakai bergantian untuk semua kartu (hemat memori HP). */
import * as THREE from 'three';
import type { Aset } from './hitung';

type Tampilan = { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D; m: THREE.Group; fase: number; sudah?: boolean };
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene, kamera: THREE.PerspectiveCamera;
let daftar: Tampilan[] = [];
let jalan = false;
const pelan = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function siap(): boolean {
  if (renderer) return true;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas'), antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch {
    return false;
  }
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  scene = new THREE.Scene();
  kamera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  kamera.position.set(0, 0, 6.2);
  const studio = new THREE.Scene();
  const bola = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true }));
  const pos = bola.geometry.attributes.position;
  const warna: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 10, v = 0.18 + Math.max(0, y) * 0.75;
    warna.push(v * 1.08, v, v * 0.86);
  }
  bola.geometry.setAttribute('color', new THREE.Float32BufferAttribute(warna, 3));
  studio.add(bola);
  ([[0, 6, 3, 8, 3], [-6, 1, 4, 2, 6], [6, 2, 2, 2, 6], [0, -4, 6, 10, 1]] as const).forEach((p, idx) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(p[3], p[4]), new THREE.MeshBasicMaterial({ color: idx === 3 ? 0x332a18 : 0xffffff, side: THREE.DoubleSide }));
    m.position.set(p[0], p[1], p[2]);
    m.lookAt(0, 0, 0);
    studio.add(m);
  });
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(studio, 0.04).texture;
  const l = new THREE.DirectionalLight(0xffffff, 1.6);
  l.position.set(3, 4, 5);
  scene.add(l, new THREE.AmbientLight(0xffffff, 0.3));
  return true;
}

function warnaEmas(a: Aset): number {
  if (a.jenis === 'batangan') return 0xffcf4d;
  if (a.sub === 'Putih') return 0xf1f3f6;
  const k = a.kadar ?? '750';
  const p = /^\d{3}$/.test(k) ? +k / 1000 : /K$/.test(k) ? parseInt(k) / 24 : parseInt(k) / 100;
  return p < 0.5 ? 0xf2a86a : p < 0.8 ? 0xffc453 : 0xffcc3f;
}
const logam = (w: number, kasar = 0.18) => new THREE.MeshStandardMaterial({ color: w, metalness: 1, roughness: kasar, envMapIntensity: 1.25 });

function tekstur(baris: [string, number, string, number][], w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d')!;
  x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#fff'; x.textAlign = 'center';
  baris.forEach(([t, s, b, y]) => { x.font = `${b} ${s}px "Plus Jakarta Sans", sans-serif`; x.fillText(t, w / 2, y); });
  x.strokeStyle = '#fff'; x.lineWidth = 6; x.strokeRect(26, 26, w - 52, h - 52);
  return new THREE.CanvasTexture(c);
}

function batang(a: Aset) {
  const g = new THREE.Group();
  const W = 1.25, H = 2.0, r = 0.16, s = new THREE.Shape();
  s.moveTo(-W / 2 + r, -H / 2); s.lineTo(W / 2 - r, -H / 2); s.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + r);
  s.lineTo(W / 2, H / 2 - r); s.quadraticCurveTo(W / 2, H / 2, W / 2 - r, H / 2); s.lineTo(-W / 2 + r, H / 2);
  s.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - r); s.lineTo(-W / 2, -H / 2 + r); s.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + r, -H / 2);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 12 });
  geo.center();
  g.add(new THREE.Mesh(geo, logam(warnaEmas(a))));
  const t = tekstur([[(a.merek ?? '').toUpperCase(), 54, '800', 120], ['FINE GOLD', 40, '700', 300], ['999.9', 64, '800', 380], [(a.pecahan ?? '').replace(' g', ' gr'), 86, '800', 520]], 400, 640);
  const muka = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.92, H * 0.92), new THREE.MeshStandardMaterial({ color: warnaEmas(a), metalness: 1, roughness: 0.32, bumpMap: t, bumpScale: 3, envMapIntensity: 1.1 }));
  muka.position.z = 0.121;
  g.add(muka);
  const kartu = new THREE.Mesh(new THREE.BoxGeometry(W + 0.45, H + 0.7, 0.04), new THREE.MeshStandardMaterial({ color: 0xe9e4d6, metalness: 0.1, roughness: 0.55 }));
  kartu.position.z = -0.12;
  g.add(kartu);
  return g;
}

const permata = () => new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0, roughness: 0, envMapIntensity: 3 }));

function perhiasan(a: Aset) {
  const g = new THREE.Group(), w = warnaEmas(a), m = logam(w, 0.16);
  const b = a.bentuk ?? 'Cincin';
  if (b === 'Cincin' || b === 'Lainnya') {
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.16, 32, 96), m));
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.22, 12), m); d.position.y = 1.0; g.add(d);
    const p = permata(); p.position.y = 1.22; p.scale.set(1, 1.15, 1); g.add(p);
    g.rotation.x = 0.35;
  } else if (b === 'Gelang') {
    const gl = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.14, 24, 96), m); gl.scale.z = 2.2; g.add(gl);
    g.add(new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.05, 12, 96), logam(w, 0.35)));
    g.rotation.x = 1.0;
  } else if (b === 'Anting') {
    [-0.55, 0.55].forEach((x) => {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 20, 64), m); r.position.x = x; r.rotation.y = x > 0 ? 0.5 : -0.5; g.add(r);
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), m); s.position.set(x, -0.45, 0); g.add(s);
    });
  } else if (b === 'Liontin') {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.62, 40, 30), m); l.scale.set(0.85, 1.1, 0.35); g.add(l);
    const c = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 12, 32), m); c.position.y = 0.82; g.add(c);
    const p = permata(); p.scale.setScalar(0.9); p.position.z = 0.2; g.add(p);
  } else {
    const n = 30, R = 1.05;
    for (let i = 0; i < n; i++) {
      const s = (i / n) * Math.PI * 1.7 - Math.PI * 1.35;
      const mata = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.028, 8, 18), m);
      mata.position.set(Math.cos(s) * R, Math.sin(s) * R * 1.05 + 0.25, 0);
      mata.rotation.z = s; mata.rotation.y = i % 2 ? Math.PI / 2 : 0;
      g.add(mata);
    }
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.26, 32, 24), m); l.scale.set(1, 1.25, 0.45); l.position.y = -0.95; g.add(l);
    const p = permata(); p.scale.setScalar(0.6); p.position.set(0, -0.95, 0.14); g.add(p);
  }
  return g;
}

function cadangan(c: HTMLCanvasElement, a: Aset) {
  const x = c.getContext('2d');
  if (!x) return;
  c.width = 264; c.height = 300;
  const gr = x.createLinearGradient(0, 0, 264, 300);
  gr.addColorStop(0, '#F6DE93'); gr.addColorStop(1, '#B9851A');
  if (a.jenis === 'batangan') { x.fillStyle = gr; x.beginPath(); x.roundRect(72, 40, 120, 200, 14); x.fill(); }
  else { x.lineWidth = 26; x.strokeStyle = gr; x.beginPath(); x.arc(132, 160, 70, 0, 7); x.stroke(); }
}

function buang(g: THREE.Object3D) {
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREE.MeshStandardMaterial | undefined;
    if (mat) { mat.bumpMap?.dispose(); mat.dispose(); }
  });
}

/** Pasang model 3D ke kanvas. Kembalikan fungsi pelepas. */
export function pasang(c: HTMLCanvasElement, a: Aset, fase = 0): () => void {
  if (!siap()) { cadangan(c, a); return () => {}; }
  c.width = Math.max(1, c.clientWidth * 2);
  c.height = Math.max(1, c.clientHeight * 2);
  const ctx = c.getContext('2d');
  if (!ctx) return () => {};
  const t: Tampilan = { c, ctx, m: a.jenis === 'batangan' ? batang(a) : perhiasan(a), fase };
  daftar.push(t);
  if (!jalan) { jalan = true; requestAnimationFrame(putar); }
  return () => { daftar = daftar.filter((x) => x !== t); buang(t.m); };
}

const t0 = performance.now();
let terakhir = 0;
function putar(now: number) {
  requestAnimationFrame(putar);
  if (!renderer || now - terakhir < 33 || document.hidden) return;
  terakhir = now;
  const t = pelan ? 0.6 : (now - t0) / 1000;
  for (const v of daftar) {
    const r = v.c.getBoundingClientRect();
    if (!r.width || (v.sudah && (r.bottom < 0 || r.top > innerHeight))) continue;
    v.sudah = true;
    scene.add(v.m);
    v.m.rotation.y = Math.sin(t * 0.7 + v.fase) * 0.9;
    v.m.position.y = Math.sin(t * 1.3 + v.fase) * 0.06;
    kamera.aspect = v.c.width / v.c.height;
    kamera.updateProjectionMatrix();
    renderer.setSize(v.c.width, v.c.height, false);
    renderer.render(scene, kamera);
    v.ctx.clearRect(0, 0, v.c.width, v.c.height);
    v.ctx.drawImage(renderer.domElement, 0, 0);
    scene.remove(v.m);
  }
}
