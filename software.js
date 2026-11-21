// Depth-buffered canvas renderer for browsers where the WebGL context is disabled.
import {Color, Vector3} from 'three';
export function software(canvas, model) {
 const ctx = canvas.getContext('2d',{alpha:false});
 const meshes=[];
 model.updateMatrixWorld(true);
 model.traverse(object=>{if(object.isMesh && object.visible) meshes.push(object)});
 const nv=meshes.reduce((sum,m)=>sum+m.geometry.attributes.position.count,0);
 const count=nv+6, near=.047;
 const array=()=>new Float32Array(count);
 const px=array(),py=array(),pz=array(),U=array(),V=array(),vx=array(),vy=array(),vz=array(),sx=array(),sy=array(),iz=array(),lit=array();
 const type=new Uint8Array(count),texId=new Uint16Array(count),color=new Uint32Array(count),clip=new Uint8Array(count);
 const tex=[],textureIds=new Map(),solid=[],glass=[];
 const pos=new Vector3(),normal=new Vector3(),light=new Vector3(.3,.85,.45).normalize();
 let base=0,w,h,focal,im,pixels,depth;
 for(const mesh of meshes){
   const g=mesh.geometry, material=mesh.material;
   const image=material.map?.image;
   if(image && !textureIds.has(image)){
     const bitmap=document.createElement('canvas');
     const scale=Math.min(1,512/Math.max(image.width,image.height));
     bitmap.width=Math.max(1,Math.round(image.width*scale)); bitmap.height=Math.max(1,Math.round(image.height*scale));
     const brush=bitmap.getContext('2d');
     brush.drawImage(image,0,0,bitmap.width,bitmap.height);
     tex.push({w:bitmap.width,h:bitmap.height,p:new Uint32Array(brush.getImageData(0,0,bitmap.width,bitmap.height).data.buffer)});
     textureIds.set(image,tex.length);
   }
   const tint=new Color().copy(material.color).convertLinearToSRGB();
   const rgb=Math.round(tint.r*255) | Math.round(tint.g*255)<<8 | Math.round(tint.b*255)<<16;
   for(let j=0;j<g.attributes.position.count;j++){
     const i=base+j;
     pos.fromBufferAttribute(g.attributes.position,j).applyMatrix4(mesh.matrixWorld);
     px[i]=pos.x; py[i]=-pos.z; pz[i]=pos.y;
     normal.fromBufferAttribute(g.attributes.normal,j).transformDirection(mesh.matrixWorld);
     lit[i]=.76+.24*Math.max(0,normal.dot(light)); color[i]=rgb;
     if(image && g.attributes.uv){texId[i]=textureIds.get(image); U[i]=g.attributes.uv.getX(j); V[i]=g.attributes.uv.getY(j);}
   }
   const dest=material.transparent && material.opacity<.65 ? glass : solid;
   const length=g.index?.count??g.attributes.position.count;
   for(let j=0;j<length;j++)dest.push(base+(g.index?g.index.getX(j):j));
   base+=g.attributes.position.count;
 }
 const ni=solid.length,indices=new Uint32Array([...solid,...glass]);
 function project(i){
  const q=1/vz[i];iz[i]=q;sx[i]=w*.5+vx[i]*q*focal;sy[i]=h*.5-vy[i]*q*focal;
  clip[i]=(vz[i]<near?1:0)|(vx[i]*focal<-.5*w*vz[i]?2:0)|(vx[i]*focal>.5*w*vz[i]?4:0)|(vy[i]*focal<-.5*h*vz[i]?8:0)|(vy[i]*focal>.5*h*vz[i]?16:0)
 }
 function intersect(a,b,j){const t=(near-vz[a])/(vz[b]-vz[a]);vz[j]=near;vx[j]=vx[a]+(vx[b]-vx[a])*t;vy[j]=vy[a]+(vy[b]-vy[a])*t;lit[j]=lit[a]+(lit[b]-lit[a])*t;color[j]=color[a];type[j]=type[a];texId[j]=texId[a];U[j]=U[a]+(U[b]-U[a])*t;V[j]=V[a]+(V[b]-V[a])*t;project(j);return j}
 function tri(a,b,c,transparent){
  const ax=sx[a],ay=sy[a],bx=sx[b],by=sy[b],cx=sx[c],cy=sy[c];
  const den=(bx-ax)*(cy-ay)-(cx-ax)*(by-ay);if(Math.abs(den)<.09)return;
  const x0=Math.max(0,Math.ceil(Math.min(ax,bx,cx)-.5)),x1=Math.min(w-1,Math.floor(Math.max(ax,bx,cx)-.5));
  const y0=Math.max(0,Math.ceil(Math.min(ay,by,cy)-.5)),y1=Math.min(h-1,Math.floor(Math.max(ay,by,cy)-.5));if(x1<x0||y1<y0)return;
  const dux=(cy-ay)/den,duy=(ax-cx)/den,dvx=(ay-by)/den,dvy=(bx-ax)/den;
  const sa=lit[a],sb=lit[b],sc=lit[c],za=iz[a],zb=iz[b],zc=iz[c],col=color[a],r=col&255,g=(col>>>8)&255,bl=(col>>>16)&255;
  const map=texId[a]?tex[texId[a]-1]:null;const ua=U[a]*za,ub=U[b]*zb-ua,uc=U[c]*zc-ua,va=V[a]*za,vb=V[b]*zb-va,vc=V[c]*zc-va;
  for(let row=y0;row<=y1;row++){
   const syncY=row+.5-ay;let u=dux*(x0+.5-ax)+duy*syncY,v=dvx*(x0+.5-ax)+dvy*syncY;
   let at=row*w+x0;
   for(let colx=x0;colx<=x1;colx++,at++,u+=dux,v+=dvx){
    if(u<-.00001||v<-.00001||u+v>1.00001)continue;
    const z=za+(zb-za)*u+(zc-za)*v;if(z<depth[at])continue;
    if(transparent){const old=pixels[at];pixels[at]=0xff000000|(((((old>>>16)&255)*.94+12)|0)<<16)|(((((old>>>8)&255)*.95+9)|0)<<8)|(((old&255)*.96+6)|0);continue}
    depth[at]=z;
    if(map){const tu=Math.max(0,Math.min(map.w-1,(ua+u*ub+v*uc)*map.w/z|0)),tv=Math.max(0,Math.min(map.h-1,(va+u*vb+v*vc)*map.h/z|0));pixels[at]=map.p[tv*map.w+tu];continue}
    const s=sa+(sb-sa)*u+(sc-sa)*v;
    pixels[at]=0xff000000|(Math.min(255,bl*s*.99)<<16)|(Math.min(255,g*s)<<8)|Math.min(255,r*s*1.025)
   }
  }
 }
 function nearTriangle(a,b,c,glass){
  const corners=[a,b,c],poly=[];let j=nv;
  for(let k=0;k<3;k++){const u=corners[k],v=corners[(k+1)%3];if(vz[u]>=near)poly.push(u);if((vz[u]>=near)!==(vz[v]>=near))poly.push(intersect(u,v,j++))}
  for(let k=1;k<poly.length-1;k++)tri(poly[0],poly[k],poly[k+1],glass)
 }
 return (camera)=>{
  const x=camera.position.x,y=-camera.position.z,yaw=-camera.rotation.y,pitch=camera.rotation.x;
  const ratio=Math.min(1,640/Math.max(canvas.clientWidth,canvas.clientHeight));const cw=Math.max(1,Math.round(canvas.clientWidth*ratio)),ch=Math.max(1,Math.round(canvas.clientHeight*ratio));
  if(cw!==w||ch!==h){w=canvas.width=cw;h=canvas.height=ch;im=ctx.createImageData(w,h);pixels=new Uint32Array(im.data.buffer);depth=new Float32Array(w*h);focal=.5*h/Math.tan((w/h<1?78:67)*Math.PI/360)}
  pixels.fill(0xffd8d1ba);depth.fill(0);
  const sn=Math.sin(yaw),cs=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch),eyeZ=camera.position.y;
  for(let i=0;i<nv;i++){const sk=type[i]===3,dx=px[i]-(sk?0:x),dy=py[i]-(sk?0:y),dz=pz[i]-(sk?0:eyeZ),forward=dx*sn+dy*cs;vx[i]=dx*cs-dy*sn;vy[i]=dz*cp-forward*sp;vz[i]=forward*cp+dz*sp;project(i)}
  for(let j=0;j<indices.length;j+=3){const a=indices[j],b=indices[j+1],c=indices[j+2];if(clip[a]&clip[b]&clip[c])continue;if((clip[a]|clip[b]|clip[c])&1)nearTriangle(a,b,c,j>=ni);else tri(a,b,c,j>=ni)}
  ctx.putImageData(im,0,0)
 }
}
