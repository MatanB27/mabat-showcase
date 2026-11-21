import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';

export async function start(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error('Model unavailable');
  const model = await new GLTFLoader().parseAsync(await response.arrayBuffer(), '');
  const view = document.querySelector('#view');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9e7df);
  scene.add(model.scene, new THREE.HemisphereLight(0xfffaf2, 0xfff0da, 2.1));
  const light = new THREE.DirectionalLight(0xfff8ea, 1.2);
  light.position.set(4,8,3);
  scene.add(light);
  const renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  view.replaceChildren(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(78,1,0.025,100);
  camera.rotation.order = 'YXZ';
  const rooms = [[0.6,1.55,0.45,-2.1],[-0.35,1.52,-0.25,1.05],[-0.5,1.52,0.7,-3.9],[0.65,1.52,-1.35,3.1]];
  function draw() {
    if (!view.clientWidth || !view.clientHeight) return;
    renderer.setSize(view.clientWidth,view.clientHeight,false);
    camera.aspect = view.clientWidth / view.clientHeight;
    camera.updateProjectionMatrix();
    renderer.render(scene,camera);
  }
  const select = document.querySelector('#room');
  function enterRoom() {
    const [x,y,z,yaw] = rooms[select.selectedIndex];
    camera.position.set(x,y,z);
    camera.rotation.set(-0.08,yaw,0,'YXZ');
    draw();
  }
  select.onchange = enterRoom;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label','מבט בתוך הדירה. גררו או השתמשו במקשי החצים כדי להסתכל סביב.');
  function turn(x,y) {
    camera.rotation.y += x;
    camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x+y,-1.35,1.35);
    draw();
  }
  let last;
  canvas.onpointerdown = e => { canvas.setPointerCapture(e.pointerId); last=[e.clientX,e.clientY]; };
  canvas.onpointermove = e => {
    if (!last || !canvas.hasPointerCapture(e.pointerId)) return;
    turn((e.clientX-last[0])*.006,(e.clientY-last[1])*.006);
    last=[e.clientX,e.clientY];
  };
  canvas.onlostpointercapture = () => { last=null; };
  canvas.onkeydown = e => {
    const delta={ArrowLeft:[.12,0],ArrowRight:[-.12,0],ArrowUp:[0,.12],ArrowDown:[0,-.12]}[e.key];
    if (delta) { e.preventDefault(); turn(...delta); }
  };
  new ResizeObserver(draw).observe(view);
  enterRoom();
  return {draw};
}
