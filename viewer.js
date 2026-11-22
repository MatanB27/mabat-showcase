import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';
import { walkHeight } from './navigation.js';

export async function start(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error('Model unavailable');
  const {scene:model} = await new GLTFLoader().parseAsync(await response.arrayBuffer(), '');
  const nav = JSON.parse(model.getObjectByName('MabatWalk').userData.walkthrough);
  const view = document.querySelector('#view'), tour=view.closest('main');
  const canvas=document.createElement('canvas');
  canvas.tabIndex=0;
  canvas.setAttribute('aria-label','הליכה באמצעות WASD או חצים. Q ו־E מסובבים את המבט.');
  const camera=new THREE.PerspectiveCamera(69,1,.035,200);
  camera.rotation.order='YXZ';
  let render;
  const context=canvas.getContext('webgl2',{antialias:true});
  if(context){
    const renderer=new THREE.WebGLRenderer({canvas,context,antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.15;
    const scene=new THREE.Scene();
    scene.background=new THREE.Color(0xe6e1d8);
    const sun=new THREE.DirectionalLight(0xfff3df,.7);
    sun.position.set(6,11,4);
    scene.add(model,sun,new THREE.HemisphereLight(0xfff4df,0xafafa9,1.35));
    for(const [x,y,w,d,base] of nav.areas){
      const light=new THREE.PointLight(0xfff2da,6,6);
      light.position.set(x+w/2,base+2.25,-y-d/2);
      scene.add(light);
    }
    render=()=>{renderer.setSize(view.clientWidth,view.clientHeight,false);renderer.render(scene,camera)};
  }else{
    const {software}=await import('./software.js');
    const paint=software(canvas,model);
    render=()=>paint(camera);
  }
  view.replaceChildren(canvas);
  function draw(){
    if(!view.clientHeight)return;
    camera.aspect=view.clientWidth/view.clientHeight;
    camera.updateProjectionMatrix();
    render();
  }
  const room=document.querySelector('#room');
  room.replaceChildren(...nav.viewpoints.map(({name},i)=>new Option(name,String(i))));
  function enter([x,y,angle,height]){
    camera.position.set(x,height+1.62,-y);
    camera.rotation.set(0,angle,0,'YXZ');
    canvas.focus({preventScroll:true});draw();
  }
  room.onchange=()=>enter(nav.viewpoints[room.selectedIndex].pose);
  const held=new Set();
  function move(dx,dy){
    const p=camera.position;
    let height=walkHeight(p.x+dx,-p.z,p.y-1.62,nav);
    if(height!==null){p.x+=dx;p.y=height+1.62;}
    height=walkHeight(p.x,-p.z+dy,p.y-1.62,nav);
    if(height!==null){p.z-=dy;p.y=height+1.62;}
  }
  let frame=0,last=0;
  function step(dt){
    const down=(a,b)=>Number(held.has(a)||held.has(b));
    const forward=down('KeyW','ArrowUp')-down('KeyS','ArrowDown');
    const right=down('KeyD','ArrowRight')-down('KeyA','ArrowLeft');
    camera.rotation.y+=(down('KeyQ')-down('KeyE'))*dt*1.7;
    const angle=camera.rotation.y,speed=dt*1.65/Math.max(1,Math.hypot(forward,right));
    move((right*Math.cos(angle)-forward*Math.sin(angle))*speed,(forward*Math.cos(angle)+right*Math.sin(angle))*speed);
    draw();
  }
  function tick(now){
    frame=0;if(!held.size)return;
    step(Math.min(.05,(now-last)/1000));last=now;
    frame=requestAnimationFrame(tick);
  }
  function begin(code){
    if(held.has(code))return;
    held.add(code);
    if(!frame){last=performance.now();step(.018);frame=requestAnimationFrame(tick);}
  }
  function stop(){held.clear();cancelAnimationFrame(frame);frame=0;}
  window.addEventListener('pagehide',stop);window.addEventListener('blur',stop);
  const keys=new Set(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
  tour.addEventListener('keydown',e=>{if(keys.has(e.code) && e.target!==room){e.preventDefault();begin(e.code);}});
  window.addEventListener('keyup',e=>held.delete(e.code));
  for(const button of tour.querySelectorAll('[data-code]')){
    button.onpointerdown=e=>{button.setPointerCapture(e.pointerId);begin(button.dataset.code);};
    button.onlostpointercapture=()=>held.delete(button.dataset.code);
    button.onclick=e=>{if(!e.detail){held.add(button.dataset.code);step(.09);held.delete(button.dataset.code);}};
  }
  let lastPoint;
  canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);lastPoint=[e.clientX,e.clientY];};
  canvas.onpointermove=e=>{
    if(!lastPoint||!canvas.hasPointerCapture(e.pointerId))return;
    camera.rotation.y+=(e.clientX-lastPoint[0])*.005;
    camera.rotation.x=THREE.MathUtils.clamp(camera.rotation.x+(e.clientY-lastPoint[1])*.005,-1.35,1.35);
    lastPoint=[e.clientX,e.clientY];draw();
  };
  canvas.onlostpointercapture=()=>{lastPoint=null;};
  new ResizeObserver(draw).observe(view);
  enter(nav.start);

}
