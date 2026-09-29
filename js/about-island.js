/* ============================================================
   THE ISLAND — the About section's particle scene
   ------------------------------------------------------------
   One house, three palms, a sea and some weather, drawn as a
   point cloud by a software rasteriser. No WebGL and no three.js: the
   whole thing is a z-buffered triangle mesh sampled into points and
   accumulated additively into one ImageData, which is both small enough
   to ship uncompiled and cheap enough to run beside the rest of the page.

   IT IS ALSO THE TRANSITION. The work grid disperses, the island gathers
   out of the dust and settles to the left while About arrives beside it
   — one sticky track, every beat a pure function of scroll position, so
   it unplays exactly in reverse.

   AND IT IS THE OPENING. js/opening.js borrows this same engine for the
   lid (see THE OPENING'S ADDITIONS and window.NPIsland at the bottom):
   the two scenes never run at once, so there is one engine, not two.

   Nothing here runs unless the track is on screen and the tab is
   visible, and none of the layout engages until this file says so: the
   html gets .atoll-on only after the scene is standing up, so no-JS and a
   failed load both leave the page in its ordinary stacked form.

   Reduced motion gets the island and loses the travel — one static
   frame in the About column, no disperse, no orbit, no drift.
   ============================================================ */
(function () {
  'use strict';

  var host   = document.getElementById('atoll');
  var stage  = document.querySelector('.atoll__stage');
  var cvs    = document.getElementById('atoll-canvas');
  var track  = host;
  var deskEl = document.getElementById('desk');
  var aboutEl= document.getElementById('about-sec');
  var work   = document.getElementById('work');
  var fit    = document.querySelector('.atoll__fit');
  var aHead  = aboutEl.querySelector('.sect__h');
  var aSide  = aboutEl.querySelector('.about__side');
  var site   = document.getElementById('site');
  if (!host || !stage || !cvs || !deskEl || !aboutEl || !work) return;

  var ctx = cvs.getContext('2d', { alpha: true });
  if (!ctx) return;

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var folders = [].slice.call(work.querySelectorAll('.folder'));
  var reduceMo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The About section is revealed by site.js's observer in the ordinary
     page; inside the sticky track the timeline owns its opacity, so set
     the switch now and let the inline style do the work. */
  if (site) site.setAttribute('data-about', '');

  /* ============================================================
     THE SCENE
     ============================================================ */
/* ============ MESH ============ */
var POS=[], MAT=[], ELEM=[], CUR_ELEM=0;
var E_TERRAIN=0,E_HOUSE=1,E_PALM=2,E_FIG=3,E_CLOUD=4;
function T(a,b,c,m){POS.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);MAT.push(m);ELEM.push(CUR_ELEM);}
function Q(a,b,c,d,m){T(a,b,c,m);T(a,c,d,m);}
function box(cx,cy,cz,w,h,d,m,mTop){
  var x0=cx-w/2,x1=cx+w/2,y0=cy,y1=cy+h,z0=cz-d/2,z1=cz+d/2;
  Q([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],m);
  Q([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],m);
  Q([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],m);
  Q([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],m);
  Q([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],mTop===undefined?m:mTop);
  Q([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],m);
}
/* a UV sphere. Q(P00,P01,P11,P10) winds so the face normal points outward,
   which is what the renderer's facing test wants. */
function sphere(cx,cy,cz,r,m,SEG,RING,sy){
  SEG=SEG||10; RING=RING||6; sy=sy===undefined?1:sy;
  for(var i=0;i<RING;i++){
    var f0=Math.PI*i/RING, f1=Math.PI*(i+1)/RING;
    var y0=Math.cos(f0)*sy, y1=Math.cos(f1)*sy, r0=Math.sin(f0), r1=Math.sin(f1);
    for(var j=0;j<SEG;j++){
      var a0=2*Math.PI*j/SEG, a1=2*Math.PI*(j+1)/SEG;
      var c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
      var P00=[cx+r*r0*c0, cy+r*y0, cz+r*r0*s0];
      var P01=[cx+r*r0*c1, cy+r*y0, cz+r*r0*s1];
      var P11=[cx+r*r1*c1, cy+r*y1, cz+r*r1*s1];
      var P10=[cx+r*r1*c0, cy+r*y1, cz+r*r1*s0];
      if(i===0) T(P00,P11,P10,m);
      else if(i===RING-1) T(P00,P01,P11,m);
      else Q(P00,P01,P11,P10,m);
    }
  }
}
var GRASS=1,SAND=2,WET=3,ROCK=4,WOOD=5,WALL=6,ROOF=7,LEAF=8,WATER=9,SKIN=10,SHIRT=11,GLOW=12,STONE=13,FOAM=14,VAPOR=15,SHALLOW=16;

var R=2.75, H=1.10;
function ih(d){var t=Math.min(1,d/R);return H*Math.pow(Math.max(0,1-t*t),0.72);}
function nz(th){return 1+0.06*Math.sin(3*th+0.4)+0.035*Math.sin(7*th+1.9)+0.018*Math.sin(13*th+0.7);}
function bump(x,z){return 0.055*Math.sin(x*2.3+0.5)*Math.cos(z*2.1-0.3);}
CUR_ELEM=E_TERRAIN;
(function island(){
  var NS=34, NR=8;
  function P(i,j){
    var th=2*Math.PI*j/NS, rr=R*(i/NR)*nz(th);
    var y=ih(R*(i/NR));
    var x=rr*Math.cos(th), z=rr*Math.sin(th);
    if(i>0&&i<NR) y+=bump(x,z);
    return [x,y,z];
  }
  for(var j=0;j<NS;j++){
    T([0,H,0],P(1,j+1),P(1,j),GRASS);
    for(var i=1;i<NR;i++){
      var t=(i+0.5)/NR;
      var m = t>0.86?WET : t>0.70?SAND : GRASS;
      Q(P(i,j),P(i,j+1),P(i+1,j+1),P(i+1,j),m);
    }
  }
})();

/* ---- house: gable cabin, chimney through the left pitch ---- */
CUR_ELEM=E_HOUSE;
(function house(){
  var cx=0.12, cz=-0.22, y0=ih(Math.hypot(cx,cz))-0.02;
  var w=1.12, dp=0.92, wh=0.58, rh=0.62, ov=0.13;
  box(cx,y0,cz,w,wh,dp,WALL);
  var x0=cx-w/2,x1=cx+w/2,z0=cz-dp/2,z1=cz+dp/2,yt=y0+wh,ap=yt+rh;
  // gable ends
  T([x0,yt,z1],[x1,yt,z1],[cx,ap,z1],WALL);
  T([x1,yt,z0],[x0,yt,z0],[cx,ap,z0],WALL);
  // roof planes with overhang
  var ex=w/2+ov, ez=dp/2+ov, ey=yt-ov*0.55;
  Q([cx-ex,ey,cz+ez],[cx,ap,cz+ez],[cx,ap,cz-ez],[cx-ex,ey,cz-ez],ROOF);
  Q([cx,ap,cz+ez],[cx+ex,ey,cz+ez],[cx+ex,ey,cz-ez],[cx,ap,cz-ez],ROOF);
  // ridge cap
  box(cx-0.03,ap-0.02,cz,0.06,0.05,dp+0.26,ROOF);
  // chimney
  box(cx-0.40,yt+0.10,cz-0.14,0.20,0.78,0.20,STONE);
  // door + window, pushed just proud of the wall
  Q([cx-0.14,y0,z1+0.012],[cx+0.14,y0,z1+0.012],[cx+0.14,y0+0.40,z1+0.012],[cx-0.14,y0+0.40,z1+0.012],WOOD);
  Q([x1+0.012,y0+0.22,cz-0.10],[x1+0.012,y0+0.22,cz+0.18],[x1+0.012,y0+0.46,cz+0.18],[x1+0.012,y0+0.46,cz-0.10],GLOW);
  Q([cx-0.36,y0+0.24,z1+0.012],[cx-0.62,y0+0.24,z1+0.012],[cx-0.62,y0+0.46,z1+0.012],[cx-0.36,y0+0.46,z1+0.012],GLOW);
  // deck
  box(cx,y0-0.06,cz+dp/2+0.28,w*0.86,0.07,0.52,WOOD);
})();

/* ---- palms ---- */
function palm(px,pz,ht,lean,seedn){
  var y0=ih(Math.hypot(px,pz)), SEG=7, rad=0.075;
  var prev=null;
  for(var s=0;s<=SEG;s++){
    var t=s/SEG, y=y0+ht*t;
    var bx=px+lean*t*t*0.9, bz=pz+lean*t*t*0.35;
    var r=rad*(1-0.55*t);
    var ring=[];
    for(var k=0;k<6;k++){var a=2*Math.PI*k/6;ring.push([bx+r*Math.cos(a),y,bz+r*Math.sin(a)]);}
    if(prev) for(var k2=0;k2<6;k2++) Q(prev[k2],prev[(k2+1)%6],ring[(k2+1)%6],ring[k2],WOOD);
    prev=ring;
  }
  var tx=px+lean*0.9, tz=pz+lean*0.35, ty=y0+ht;
  for(var f=0;f<8;f++){
    var a=2*Math.PI*f/8+seedn, L=0.62+0.20*Math.sin(f*2.3+seedn);
    var dx=Math.cos(a), dz=Math.sin(a);
    var p0=[tx,ty,tz];
    var p1=[tx+dx*L*0.5, ty+0.16, tz+dz*L*0.5];
    var p2=[tx+dx*L, ty-0.16, tz+dz*L];
    var wv=0.085;
    var ox=-dz*wv, oz=dx*wv;
    Q([p0[0]+ox,p0[1],p0[2]+oz],[p1[0]+ox*1.5,p1[1],p1[2]+oz*1.5],[p1[0]-ox*1.5,p1[1],p1[2]-oz*1.5],[p0[0]-ox,p0[1],p0[2]-oz],LEAF);
    T([p1[0]+ox*1.5,p1[1],p1[2]+oz*1.5],p2,[p1[0]-ox*1.5,p1[1],p1[2]-oz*1.5],LEAF);
  }
}
CUR_ELEM=E_PALM;
palm(1.62,-0.42,1.85,0.26,0.3);
palm(-1.42,0.86,1.55,-0.22,1.7);
palm(0.72,1.58,1.35,0.10,2.9);

/* ---- clouds: soft blobs ringing the island high up, so there is sky
       behind the silhouette from every orbit angle ---- */
CUR_ELEM=E_CLOUD;
function puff(px,py,pz,s,seedn){
  for(var i=0;i<5;i++){
    var a=seedn+i*1.91;
    var ox=Math.cos(a)*s*(0.26+0.18*Math.sin(a*2.7));
    var oz=Math.sin(a*1.3)*s*0.20;
    var oy=Math.sin(a*2.1)*s*0.10;
    var rr=s*(0.46+0.22*Math.abs(Math.sin(a*1.7+0.6)));
    sphere(px+ox,py+oy,pz+oz,rr,VAPOR,8,4,0.70);
  }
}
puff(-3.70, 3.10,-3.80, 1.02, 0.4);
puff( 3.60, 3.55,-2.85, 0.90, 2.1);
puff(-0.95, 4.00,-5.60, 1.14, 3.7);
puff( 4.60, 2.95, 1.95, 0.84, 5.2);
puff(-4.50, 3.35, 2.60, 0.96, 1.3);
puff( 1.55, 4.25, 4.70, 0.90, 4.4);

/* ---- rocks ---- */
function rock(rx,rz,s){
  var y0=ih(Math.hypot(rx,rz));
  for(var i=0;i<5;i++){
    var a0=2*Math.PI*i/5, a1=2*Math.PI*(i+1)/5;
    T([rx,y0+s*1.1,rz],
      [rx+s*Math.cos(a0),y0,rz+s*Math.sin(a0)],
      [rx+s*Math.cos(a1),y0,rz+s*Math.sin(a1)],ROCK);
  }
}
CUR_ELEM=E_TERRAIN;
rock(-1.95,-1.05,0.20); rock(2.05,0.95,0.16); rock(-0.35,-1.85,0.13);

  /* ============================================================
     THE RENDERER
     ============================================================ */
/* ============ PER-ELEMENT TRIANGLE POOLS ============ */
var NE=5, EIDX=[], ECUM=[], EAREA=[0,0,0,0,0];
function prepTris(){
  for(var e=0;e<NE;e++){ EIDX[e]=[]; EAREA[e]=0; }
  var areas=new Float32Array(MAT.length);
  for(var i=0;i<MAT.length;i++){
    var b=i*9;
    var ux=POS[b+3]-POS[b], uy=POS[b+4]-POS[b+1], uz=POS[b+5]-POS[b+2];
    var vx=POS[b+6]-POS[b], vy=POS[b+7]-POS[b+1], vz=POS[b+8]-POS[b+2];
    var cx=uy*vz-uz*vy, cy=uz*vx-ux*vz, cz=ux*vy-uy*vx;
    areas[i]=0.5*Math.sqrt(cx*cx+cy*cy+cz*cz);
    var e2=ELEM[i]; EIDX[e2].push(i); EAREA[e2]+=areas[i];
  }
  for(var e3=0;e3<NE;e3++){
    var L=EIDX[e3], c=new Float32Array(L.length), run=0;
    for(var k=0;k<L.length;k++){ run+=areas[L[k]]; c[k]=run; }
    ECUM[e3]=c;
  }
}
function pickTriIn(e){
  var c=ECUM[e], lo=0, hi=c.length-1, t=Math.random()*EAREA[e];
  while(lo<hi){ var m=(lo+hi)>>1; if(c[m]<t) lo=m+1; else hi=m; }
  return EIDX[e][lo];
}

/* ============ SURFACE CLOUD ============ */
var S_P=null,S_N=null,S_M=null,S_E=null,S_PH=null,S_RT=null,S_SC=null,SN=0;
function spawnSurf(i,e){
  var o=i*3;
  if(shape===1){
    var u=Math.random()*2-1, th=Math.random()*6.28318, r=Math.sqrt(1-u*u), R=2.35;
    var x=r*Math.cos(th), y=u, z=r*Math.sin(th);
    S_P[o]=x*R; S_P[o+1]=y*R+0.3; S_P[o+2]=z*R;
    S_N[o]=x; S_N[o+1]=y; S_N[o+2]=z; S_M[i]=1+((i*7)%12); return;
  }
  var ti=pickTriIn(e), b=ti*9;
  var r1=Math.sqrt(Math.random()), r2=Math.random();
  var a=1-r1, bb=r1*(1-r2), c=r1*r2;
  S_P[o]  =POS[b]*a  +POS[b+3]*bb+POS[b+6]*c;
  S_P[o+1]=POS[b+1]*a+POS[b+4]*bb+POS[b+7]*c;
  S_P[o+2]=POS[b+2]*a+POS[b+5]*bb+POS[b+8]*c;
  var ux=POS[b+3]-POS[b], uy=POS[b+4]-POS[b+1], uz=POS[b+5]-POS[b+2];
  var vx=POS[b+6]-POS[b], vy=POS[b+7]-POS[b+1], vz=POS[b+8]-POS[b+2];
  var nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
  var nl=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;
  S_N[o]=nx/nl; S_N[o+1]=ny/nl; S_N[o+2]=nz/nl;
  if(e===4){ // push cloud points off the shell so the puff has volume
    var j=(Math.random()-0.68)*0.40;
    S_P[o]+=S_N[o]*j; S_P[o+1]+=S_N[o+1]*j*0.6; S_P[o+2]+=S_N[o+2]*j;
  }
  S_M[i]=MAT[ti];
}
/* explicit budgets — area weighting alone starves the house and the palms */
var SHARE=[0.40,0.185,0.16,0.030,0.135];
function buildSurf(N){
  SN=N; S_P=new Float32Array(N*3); S_N=new Float32Array(N*3); S_SC=new Float32Array(N*3);
  S_M=new Uint8Array(N); S_E=new Uint8Array(N); S_PH=new Float32Array(N); S_RT=new Float32Array(N);
  var i=0;
  if(shape===1){
    for(;i<N;i++){ S_E[i]=0; spawnSurf(i,0); S_PH[i]=Math.random(); S_RT[i]=0.34+Math.random()*0.62; }
  } else {
    var SH=[SHARE[0],SHARE[1],SHARE[2],SHARE[3],cloudsOn?SHARE[4]:0];
    /* An element with no triangles (E_FIG, since the figure went) would
       pick from an empty pool and put its whole share on pixel 0,0. */
    for(var _z=0;_z<5;_z++) if(EAREA[_z]<=0) SH[_z]=0;
    var tot=SH[0]+SH[1]+SH[2]+SH[3]+SH[4];
    var last=4; while(last>0&&SH[last]<=0) last--;
    for(var e=0;e<NE;e++){
      if(SH[e]<=0) continue;
      var cnt = e===last ? N-i : Math.round(N*SH[e]/tot);
      for(var k=0;k<cnt&&i<N;k++,i++){ S_E[i]=e; spawnSurf(i,e); S_PH[i]=Math.random();
        // clouds turn over across several seconds, not one
        S_RT[i]= e===4 ? 0.085+Math.random()*0.105 : 0.34+Math.random()*0.62; }
    }
    for(;i<N;i++){ S_E[i]=0; spawnSurf(i,0); S_PH[i]=Math.random(); S_RT[i]=0.34+Math.random()*0.62; }
  }
  for(var j=0;j<N;j++){
    var a=Math.random()*6.28318, u2=Math.random()*2-1, s=Math.sqrt(1-u2*u2), d=0.35+Math.random()*0.65;
    S_SC[j*3]=s*Math.cos(a)*d; S_SC[j*3+1]=u2*d*0.7+0.25; S_SC[j*3+2]=s*Math.sin(a)*d;
  }
}

/* ============ WATER ============ */
var W_X=null,W_Z=null,W_PH=null,W_FM=null,W_FD=null,W_SC=null,W_MT=null,WN=0;
var WIN=1.55,WOUT=17.5,SHORE=2.86;
function buildWater(N){
  WN=N; W_X=new Float32Array(N); W_Z=new Float32Array(N); W_PH=new Float32Array(N);
  W_FM=new Float32Array(N); W_FD=new Float32Array(N); W_SC=new Float32Array(N*3);
  W_MT=new Uint8Array(N);
  for(var i=0;i<N;i++){
    /* a third of the sea is open water, spread evenly across the middle
       distance: that is what fills the bottom of the frame behind the
       footer, at whatever angle the island has turned to */
    var r = (i%3===0) ? SHORE+(Math.random()-0.42)*1.6
          : (i%3===1) ? WIN+(WOUT-WIN)*Math.pow(Math.random(),1.7)
                      : 3.4+5.6*Math.pow(Math.random(),1.25);
    var th=Math.random()*6.28318;
    W_X[i]=r*Math.cos(th); W_Z[i]=r*Math.sin(th); W_PH[i]=Math.random();
    var fd=1-Math.min(1,Math.max(0,(r-SHORE)/(WOUT-SHORE)));
    W_FD[i]=(0.06+0.94*fd*fd*fd)*1.05;
    W_FM[i]=Math.exp(-Math.pow((r-SHORE)/0.42,2))*1.5;
    if(i%3===2) W_FD[i]=2.1-0.9*((r-3.4)/5.6);
    /* three bands of blue, fixed at build time: pale surf on the shore line,
       shallow teal over the shelf, deep blue out to the horizon */
    W_MT[i] = W_FM[i]>0.55 ? FOAM : (W_FD[i]>0.55 ? SHALLOW : WATER);
    var a=Math.random()*6.28318, u2=Math.random()*2-1, s=Math.sqrt(1-u2*u2), d=0.35+Math.random()*0.65;
    W_SC[i*3]=s*Math.cos(a)*d; W_SC[i*3+1]=u2*d*0.7+0.25; W_SC[i*3+2]=s*Math.sin(a)*d;
  }
}
/* ============ CHIMNEY SMOKE ============
   The chimney top sits at roughly (-0.28, 2.53, -0.36). Smoke is its own
   little system rather than mesh: each particle's whole path is a pure
   function of its phase, so it costs one pass and unplays with the scrub. */
var SM_A=null,SM_PH=null,SM_RT=null,SM_R0=null,SM_N=null,SM_SC=null,SMN=0;
var SMX=-0.28, SMY=2.50, SMZ=-0.36;
function buildSmoke(N){
  SMN=N; SM_A=new Float32Array(N); SM_PH=new Float32Array(N); SM_RT=new Float32Array(N);
  SM_R0=new Float32Array(N); SM_N=new Float32Array(N*3); SM_SC=new Float32Array(N*3);
  for(var i=0;i<N;i++){
    SM_A[i]=Math.random()*6.28318;
    SM_PH[i]=Math.random();
    SM_RT[i]=0.16+Math.random()*0.15;
    SM_R0[i]=0.012+Math.random()*0.052;
    var a=Math.random()*6.28318, u=Math.random()*2-1, sr=Math.sqrt(1-u*u);
    SM_N[i*3]=sr*Math.cos(a); SM_N[i*3+1]=u; SM_N[i*3+2]=sr*Math.sin(a);
    var d=0.35+Math.random()*0.65;
    SM_SC[i*3]=sr*Math.cos(a)*d; SM_SC[i*3+1]=u*d*0.7+0.25; SM_SC[i*3+2]=sr*Math.sin(a)*d;
  }
}

var TN=4096,TMASK=TN-1,SINT=new Float32Array(TN);
for(var _t=0;_t<TN;_t++) SINT[_t]=Math.sin(_t/TN*6.283185307);
var INV2PI=TN/6.283185307;
function fsin(a){ return SINT[Math.floor(a*INV2PI)&TMASK]; }
function fcos(a){ return SINT[Math.floor((a+1.5707963268)*INV2PI)&TMASK]; }

/* ============ PALETTES ============ */
var MCOL=[[0,0,0],
 [104,168,96],[226,200,150],[176,146,104],[120,114,104],[168,120,78],
 [236,222,196],[214,96,64],[84,150,96],[22,86,192],[230,186,148],
 [80,124,196],[255,226,150],[164,158,148],
 [118,198,242],   /* 14 FOAM   — surf reads pale blue, not cream */
 [214,210,200],   /* 15 VAPOR  — cloud + chimney smoke */
 [26,134,208],    /* 16 SHALLOW— water over the shelf */
 /* 17-19 are the opening's boat. Duller than they look on paper: a few
    thousand points on one small object saturate an additive buffer. */
 [156,104,64],    /* 17 HULL */
 [206,194,172],   /* 18 DECK */
 [150,206,240]];  /* 19 WAKE */
var SITECOL=[[251,247,240],[235,220,191],[215,199,171],[199,175,142],[159,152,135],[112,107,88]];
var PLUT=new Float32Array(20*3), palMode=0;
function buildLUT(){
  palMode = palette==='island'?0 : palette==='site'?1 : palette==='phosphor'?2 : 3;
  for(var m=0;m<20;m++){
    var c;
    if(palMode===0) c=MCOL[m]||MCOL[2];
    else if(palMode===1) c=SITECOL[Math.min(5,Math.max(0,(m*0.34)|0))];
    else c=[70,240,110];
    PLUT[m*3]=c[0]; PLUT[m*3+1]=c[1]; PLUT[m*3+2]=c[2];
  }
}
var ENV=new Float32Array(257);
for(var _e=0;_e<=256;_e++) ENV[_e]=Math.sin(Math.PI*Math.pow(_e/256,0.62));

/* ============ BUFFERS ============ */
var pcv=document.createElement('canvas'), pctx=pcv.getContext('2d',{alpha:false});
var bl1=document.createElement('canvas'), b1x=bl1.getContext('2d',{alpha:false});
var bl2=document.createElement('canvas'), b2x=bl2.getContext('2d',{alpha:false});
var img=null,u8=null,u32=null,BW=0,BH=0;
function allocBuf(){
  var w=cvs.width,h=cvs.height;
  var cap=CAP, sc=Math.min(1,Math.sqrt(cap/(w*h)));
  BW=Math.max(2,Math.round(w*sc)); BH=Math.max(2,Math.round(h*sc));
  pcv.width=BW; pcv.height=BH;
  bl1.width=Math.max(2,BW>>2); bl1.height=Math.max(2,BH>>2);
  bl2.width=Math.max(2,BW>>4); bl2.height=Math.max(2,BH>>4);
  img=pctx.createImageData(BW,BH); u8=img.data; u32=new Uint32Array(u8.buffer);
  allocDepth();
}

/* ============ SCRATCH + DEPTH ============ */
var WPOS=null,WNRM=null,WMAT=null,WB=null,SXi=null,SYi=null,SZf=null,NCAP=0;
var dbuf=null,DW=0,DH=0,DSHIFT=1;
function allocScratch(n){
  if(n<=NCAP) return;
  NCAP=n;
  WPOS=new Float32Array(n*3); WNRM=new Float32Array(n*3);
  WMAT=new Uint8Array(n); WB=new Float32Array(n);
  SXi=new Int32Array(n); SYi=new Int32Array(n); SZf=new Float32Array(n);
}
function allocDepth(){
  DW=Math.max(2,BW>>DSHIFT); DH=Math.max(2,BH>>DSHIFT);
  dbuf=new Float32Array(DW*DH);
}

/* ============ THE OPENING'S ADDITIONS ============
   js/opening.js borrows this renderer; everything in this block is
   inert (diss 0, boat off) whenever About has it.

   THE EROSION is a per-point cull, not a fade: each point carries a fixed
   threshold from a 4096 table and is gone once the dissolve, weighted by
   where it lands on screen, passes it. Fastest in the middle, slowest on
   the silhouette, and never a visible group leaving at once. */
var diss=0, D_AR=1.35, D_CY=0.50, D_R=0.62;
var THR=new Float32Array(4096);
for(var _q=0;_q<4096;_q++) THR[_q]=Math.random();
function radAt(X,Y){
  var m=BW<BH?BW:BH;
  var dx=(X-BW*0.5)/D_AR, dy=(Y-BH*D_CY);
  var d=Math.sqrt(dx*dx+dy*dy)/(m*D_R);
  if(d>=1) return 0;
  var u=1-d; return u*u;
}
/* The boat and its wake: the opening builds the arrays, this only draws
   them. Materials 17+ are how they escape the erosion. */
var B_P=null,B_N=null,B_M=null,BN=0, boatOn=0,boatX=0,boatY=0,boatZ=0,boatC=1,boatS=0;
var WK_P=null,WK_A=null,WKN=0, wakeOn=0;

/* ============ RENDER ============ */
var liveCount=0;
var _ex=0,_ey=0,_ez=0,_fx=0,_fy=0,_fz=0,_rx=0,_rz=0,_ux=0,_uy=0,_uz=0;
var _asp=1,_F=1,_LX=0,_LY=0,_LZ=0,_fat=false,_drawn=0,_xs=0,_ys=0;

function plot(px,py,pz,nx,ny,nz,mi,b){
  var dx=px-_ex, dy=py-_ey, dz=pz-_ez;
  var vz=dx*_fx+dy*_fy+dz*_fz;
  if(vz<0.25) return;
  var sxp=(dx*_rx+dz*_rz)/vz*_F/_asp*0.5+0.5+_xs;
  if(sxp<0||sxp>=1) return;
  var syp=0.5-(dx*_ux+dy*_uy+dz*_uz)/vz*_F*0.5-_ys;
  if(syp<0||syp>=1) return;
  var vl=Math.sqrt(dx*dx+dy*dy+dz*dz)||1;
  var nv=(nx*dx+ny*dy+nz*dz)/vl;
  var anv=nv<0?-nv:nv;
  var face=nv<0?1:0.14;
  var dd=nx*_LX+ny*_LY+nz*_LZ; if(dd<0) dd=-dd;
  var e=1-anv, rim=e*e*e;
  var br=((0.16+0.80*dd)*face+rim*0.85)*b*gain*(3.4/vz);
  if(br<=0.004) return;
  var cr,cg,cb;
  if(palMode===3){
    var tq=(py+1.6)*0.294; if(tq<0)tq=0; else if(tq>1)tq=1;
    cr=63+169*tq; cg=138+38*tq; cb=226-130*tq;
  } else { var li=mi*3; cr=PLUT[li]; cg=PLUT[li+1]; cb=PLUT[li+2]; }
  var X=(sxp*BW)|0, Y=(syp*BH)|0, p=(Y*BW+X)<<2;
  var r=cr*br, g=cg*br, bb2=cb*br;
  u8[p]+=r; u8[p+1]+=g; u8[p+2]+=bb2;
  if(_fat){
    if(X+1<BW){ u8[p+4]+=r; u8[p+5]+=g; u8[p+6]+=bb2; }
    if(Y+1<BH){ var q=p+(BW<<2); u8[q]+=r; u8[q+1]+=g; u8[q+2]+=bb2;
      if(X+1<BW){ u8[q+4]+=r; u8[q+5]+=g; u8[q+6]+=bb2; } }
  }
  _drawn++;
}

function renderParticles(t,dt){
  buildLUT();
  u32.fill(0xFF000000);
  var cp=Math.cos(pitch), sp=Math.sin(pitch), cy=Math.cos(yaw), sy=Math.sin(yaw);
  var bob=spin?0.05*Math.sin(t*0.7):0;
  var tgx=panX, tgy=0.28+bob+panY, D=dist+distBias;
  var ex=tgx+D*cp*sy, ey=tgy+D*sp, ez=D*cp*cy;
  var fx=tgx-ex, fy=tgy-ey, fz=-ez;
  var fl=Math.sqrt(fx*fx+fy*fy+fz*fz); fx/=fl;fy/=fl;fz/=fl;
  var rx=-fz, rz=fx; var rl=Math.sqrt(rx*rx+rz*rz)||1; rx/=rl; rz/=rl;
  _ux=-rz*fy; _uy=rz*fx-rx*fz; _uz=rx*fy;
  _asp=BW/BH; _F=1/Math.tan(0.46);
  var ll=Math.sqrt(0.42*0.42+0.80*0.80+0.42*0.42);
  _LX=-0.42/ll; _LY=0.80/ll; _LZ=0.42/ll;
  _ex=ex;_ey=ey;_ez=ez;_fx=fx;_fy=fy;_fz=fz;_rx=rx;_rz=rz;
  _drawn=0; _xs=xShift; _ys=yShift;
  var splatN = psize===3 ? 0.30 : psize===2 ? 0.44 : 1;

  var wOn=(water && shape===0);
  var smOn=(smoke && shape===0);
  var N=SN+(wOn?WN:0)+(smOn?SMN:0)+(boatOn>0?BN:0)+(wakeOn>0?WKN:0);
  allocScratch(N);
  var SCA=scatter*6.4;

  /* ---- 1. advance every particle and bank its world position ----
         Nothing of the island is drawn at fadeIn 0 (the opening's crossing),
         so none of it is walked either. */
  var n=0, isle=fadeIn>0.0005;
  if(!isle){ wOn=false; smOn=false; }
  for(var i=0;isle&&i<SN;i++){
    var o=i*3, el=S_E[i], ch=ECH[el];
    var env=1, lift=0, dfx=0, dfy=0, dfz=0;
    if(ch>0){
      var ph=S_PH[i]+S_RT[i]*ch*dt;
      if(ph>=1){ ph-=Math.floor(ph); S_PH[i]=ph; spawnSurf(i,el); }
      else S_PH[i]=ph;
      env=ENV[(ph*256)|0];
      // clouds travel sideways over their life instead of puffing off the
      // surface — same lifecycle machinery, read as wind
      if(el===4){ dfx=ph*0.72; dfy=ph*0.06; dfz=ph*0.17; }
      else lift=ph*0.13;
      if(env<=0.02) continue;
    }
    var q=n*3;
    WPOS[q]  =S_P[o]  +S_N[o]  *lift+dfx+(SCA>0?S_SC[o]  *SCA:0);
    WPOS[q+1]=S_P[o+1]+S_N[o+1]*lift+dfy+(SCA>0?S_SC[o+1]*SCA:0);
    WPOS[q+2]=S_P[o+2]+S_N[o+2]*lift+dfz+(SCA>0?S_SC[o+2]*SCA:0);
    WNRM[q]=S_N[o]; WNRM[q+1]=S_N[o+1]; WNRM[q+2]=S_N[o+2];
    WMAT[n]=S_M[i]; WB[n]=el===4 ? env*fadeIn*1.05 : env*fadeIn; n++;
  }
  if(wOn){
    var wch=ECH[4];
    var t1=t*1.35,t2=t*1.02,t3=t*1.85, wstep=dt*(0.20+0.45*(wch>0?wch:0));
    for(var w=0;w<WN;w++){
      var x=W_X[w], z=W_Z[w];
      var a1=x*0.62+t1, a2=z*0.78-t2, a3=(x+z)*1.15+t3;
      var c3=fcos(a3);
      var y=0.082*fsin(a1)+0.062*fsin(a2)+0.036*fsin(a3);
      var gx=0.0508*fcos(a1)+0.0414*c3;
      var gz=0.0484*fcos(a2)+0.0414*c3;
      var nl2=Math.sqrt(gx*gx+1+gz*gz);
      var tw=1;
      if(wch>0){ var pw=W_PH[w]+wstep; if(pw>=1) pw-=1; W_PH[w]=pw; tw=0.55+0.45*ENV[(pw*256)|0]; }
      var crest=(y+0.03)*6.6; if(crest<0) crest=0;
      var foam=W_FM[w], o2=w*3, q2=n*3;
      WPOS[q2]  =x+(SCA>0?W_SC[o2]  *SCA:0);
      WPOS[q2+1]=y+(SCA>0?W_SC[o2+1]*SCA:0);
      WPOS[q2+2]=z+(SCA>0?W_SC[o2+2]*SCA:0);
      WNRM[q2]=-gx/nl2; WNRM[q2+1]=1/nl2; WNRM[q2+2]=-gz/nl2;
      WMAT[n]=W_MT[w];
      WB[n]=(0.30+0.85*crest+foam*0.40)*tw*W_FD[w]*1.28*fadeIn; n++;
    }
  }

  if(smOn){
    for(var sm=0;sm<SMN;sm++){
      var sph=SM_PH[sm]+SM_RT[sm]*dt; if(sph>=1) sph-=1; SM_PH[sm]=sph;
      var pp=sph*sph, rad=SM_R0[sm]+pp*0.40, ang=SM_A[sm]+sph*2.1;
      var q5=n*3, o5=sm*3;
      WPOS[q5]  =SMX+rad*fcos(ang)+pp*0.88+(SCA>0?SM_SC[o5]  *SCA:0);
      WPOS[q5+1]=SMY+sph*1.85      +(SCA>0?SM_SC[o5+1]*SCA:0);
      WPOS[q5+2]=SMZ+rad*fsin(ang)+pp*0.21+(SCA>0?SM_SC[o5+2]*SCA:0);
      WNRM[q5]=SM_N[o5]; WNRM[q5+1]=SM_N[o5+1]; WNRM[q5+2]=SM_N[o5+2];
      WMAT[n]=VAPOR;
      var fo=1-sph; fo*=fo;
      WB[n]=fo*(sph<0.09?sph*11.1:1)*0.92*fadeIn; n++;
    }
  }

  /* ---- 1b. the opening's boat, turned to face its travel, and the wake
         it has laid down in world space ---- */
  if(boatOn>0){
    for(var b1=0;b1<BN;b1++){
      var ob=b1*3, qb=n*3, bx=B_P[ob], bz=B_P[ob+2], bnx=B_N[ob], bnz=B_N[ob+2];
      WPOS[qb]=bx*boatC-bz*boatS+boatX; WPOS[qb+1]=B_P[ob+1]+boatY; WPOS[qb+2]=bx*boatS+bz*boatC+boatZ;
      WNRM[qb]=bnx*boatC-bnz*boatS; WNRM[qb+1]=B_N[ob+1]; WNRM[qb+2]=bnx*boatS+bnz*boatC;
      WMAT[n]=B_M[b1]; WB[n]=boatOn*0.42; n++;
    }
  }
  if(wakeOn>0){
    for(var w1=0;w1<WKN;w1++){
      var aw=WK_A[w1]; if(aw<=0.004) continue;
      var qw=n*3, ow=w1*3;
      WPOS[qw]=WK_P[ow]; WPOS[qw+1]=WK_P[ow+1]; WPOS[qw+2]=WK_P[ow+2];
      WNRM[qw]=0; WNRM[qw+1]=1; WNRM[qw+2]=0;
      WMAT[n]=19; WB[n]=aw*wakeOn*0.95; n++;
    }
  }

  /* ---- 2. depth pre-pass at quarter scale.
         At one point per pixel a full-res depth test never catches anything,
         so the buffer is coarse and every cell collects several points. ---- */
  var useZ=(occl>0);
  if(useZ) dbuf.fill(1e9);
  for(var k=0;k<n;k++){
    var q3=k*3;
    var dx=WPOS[q3]-ex, dy=WPOS[q3+1]-ey, dz=WPOS[q3+2]-ez;
    var vz=dx*fx+dy*fy+dz*fz;
    if(vz<0.25){ SZf[k]=-1; continue; }
    var sxp=(dx*rx+dz*rz)/vz*_F/_asp*0.5+0.5+_xs;
    var syp=0.5-(dx*_ux+dy*_uy+dz*_uz)/vz*_F*0.5-_ys;
    if(sxp<0||sxp>=1||syp<0||syp>=1){ SZf[k]=-1; continue; }
    var X=(sxp*BW)|0, Y=(syp*BH)|0;
    SXi[k]=X; SYi[k]=Y; SZf[k]=vz;
    if(useZ){
      var di=(Y>>DSHIFT)*DW+(X>>DSHIFT);
      if(vz<dbuf[di]) dbuf[di]=vz;
    }
  }

  /* ---- 3. shade whatever survived ---- */
  for(var k2=0;k2<n;k2++){
    var vz2=SZf[k2];
    if(vz2<0) continue;
    var X2=SXi[k2], Y2=SYi[k2];
    if(useZ && vz2>dbuf[(Y2>>DSHIFT)*DW+(X2>>DSHIFT)]+occl) continue;
    /* the opening's erosion — before the lighting, so a culled point costs nothing */
    if(diss>0 && WMAT[k2]<17 && diss*(0.42+1.25*radAt(X2,Y2))>THR[k2&4095]) continue;
    var q4=k2*3;
    var nx=WNRM[q4], ny=WNRM[q4+1], nz=WNRM[q4+2];
    var dx2=WPOS[q4]-ex, dy2=WPOS[q4+1]-ey, dz2=WPOS[q4+2]-ez;
    var vl=Math.sqrt(dx2*dx2+dy2*dy2+dz2*dz2)||1;
    var nv=(nx*dx2+ny*dy2+nz*dz2)/vl;
    var anv=nv<0?-nv:nv;
    var face=nv<0?1:backLit;
    var dd=nx*_LX+ny*_LY+nz*_LZ; if(dd<0) dd=-dd;
    var e2=1-anv, rim=e2*e2*e2;
    var br=((0.16+0.80*dd)*face+rim*0.85)*WB[k2]*gain*splatN*(3.4/vz2);
    if(br<=0.004) continue;
    var mi=WMAT[k2], cr,cg,cb;
    if(palMode===3){
      var tq=(WPOS[q4+1]+1.6)*0.294; if(tq<0)tq=0; else if(tq>1)tq=1;
      cr=63+169*tq; cg=138+38*tq; cb=226-130*tq;
    } else { var li=mi*3; cr=PLUT[li]; cg=PLUT[li+1]; cb=PLUT[li+2]; }
    var p=(Y2*BW+X2)<<2;
    var r=cr*br, g=cg*br, bb2=cb*br;
    u8[p]+=r; u8[p+1]+=g; u8[p+2]+=bb2;
    if(psize===2){
      if(X2+1<BW){ u8[p+4]+=r; u8[p+5]+=g; u8[p+6]+=bb2; }
      if(Y2+1<BH){ var qq=p+(BW<<2); u8[qq]+=r; u8[qq+1]+=g; u8[qq+2]+=bb2;
        if(X2+1<BW){ u8[qq+4]+=r; u8[qq+5]+=g; u8[qq+6]+=bb2; } }
    } else if(psize===3){
      // 3x3 splat, bright centre and a dimmer ring — this is what closes the
      // gaps between points and stops the background reading through the form
      var hr=r*0.42, hg=g*0.42, hb=bb2*0.42;
      var x0=X2>0, x1=X2+1<BW, y0=Y2>0, y1=Y2+1<BH, row=BW<<2;
      if(x0){ u8[p-4]+=hr; u8[p-3]+=hg; u8[p-2]+=hb; }
      if(x1){ u8[p+4]+=hr; u8[p+5]+=hg; u8[p+6]+=hb; }
      if(y0){ var pu=p-row; u8[pu]+=hr; u8[pu+1]+=hg; u8[pu+2]+=hb;
        if(x0){ u8[pu-4]+=hr*0.6; u8[pu-3]+=hg*0.6; u8[pu-2]+=hb*0.6; }
        if(x1){ u8[pu+4]+=hr*0.6; u8[pu+5]+=hg*0.6; u8[pu+6]+=hb*0.6; } }
      if(y1){ var pd=p+row; u8[pd]+=hr; u8[pd+1]+=hg; u8[pd+2]+=hb;
        if(x0){ u8[pd-4]+=hr*0.6; u8[pd-3]+=hg*0.6; u8[pd-2]+=hb*0.6; }
        if(x1){ u8[pd+4]+=hr*0.6; u8[pd+5]+=hg*0.6; u8[pd+6]+=hb*0.6; } }
    }
    _drawn++;
  }
  liveCount=_drawn;

  pctx.putImageData(img,0,0);
  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; ctx.filter='none';
  ctx.fillStyle='#000'; ctx.fillRect(0,0,cvs.width,cvs.height);
  if(bloom>0){
    b1x.filter='blur(2.5px)'; b1x.drawImage(pcv,0,0,bl1.width,bl1.height);
    b2x.filter='blur(2px)';   b2x.drawImage(bl1,0,0,bl2.width,bl2.height);
    ctx.globalCompositeOperation='lighter'; ctx.filter='none';
    ctx.globalAlpha=1.15*bloom; ctx.drawImage(bl2,0,0,cvs.width,cvs.height);
    ctx.globalAlpha=0.80*bloom; ctx.drawImage(bl1,0,0,cvs.width,cvs.height);
  }
  ctx.globalCompositeOperation='lighter'; ctx.filter='none'; ctx.globalAlpha=1;
  ctx.drawImage(pcv,0,0,cvs.width,cvs.height);
  ctx.globalCompositeOperation='source-over';
}

  /* ============================================================
     THE PAGE
     ============================================================ */
/* ============ THE DRIVER ============
   Scroll timeline, camera, input, lifecycle. Everything above this point
   is the scene and the renderer; this is the only part that knows about
   the page. */

/* ---- state. Neel's picked settings are the defaults. ---- */
var palette='island', psize=1, bloom=0.55, gain=1.8, spin=1, water=1, shape=0;
var cloudsOn=1, smoke=1;
var ECH=[1,0,1,0,1,1];            /* 0-4 mesh elements, 5 water */
var scatter=0, fadeIn=0, occl=0.12, backLit=0.55;
var yaw=-0.62, pitch=0.24, dist=5.6, tYaw=yaw, tPitch=pitch, tDist=dist;
var panX=0,panY=0,tPanX=0,tPanY=0, xShift=0, yShift=0, distBias=0;
var CW_PX=0, CH_PX=0, nPoints=0;
/* Framebuffer cap. Solidity is points per buffer pixel, so this and the
   point count move together; the opening runs its own. */
var CAP=1000000;

/* Point count is the perf lever, not resolution — measured, not guessed.
   Phones get a third of the desktop budget and the adaptive step below
   can halve it once more if the frame rate doesn't hold. */
function budget(){
  var w=innerWidth;
  return w<=560 ? 34000 : w<=980 ? 58000 : 115000;
}
function makeCloud(){
  var wOn=(water&&shape===0), wshare=wOn?0.42:0;
  var sOn=(smoke&&shape===0), sshare=sOn?0.026:0;
  var nw=Math.round(nPoints*wshare), nsm=Math.round(nPoints*sshare);
  buildSurf(nPoints-nw-nsm); buildWater(Math.max(1,nw)); buildSmoke(Math.max(1,nsm));
}
function layout(){
  if(lent) return;
  needLayout=false;
  var w=stage.clientWidth||900, h=stage.clientHeight||620;
  cvs.classList.toggle('mx', innerWidth>820);
  cvs.classList.toggle('my', innerWidth<=820);
  cvs.width=Math.round(w*DPR); cvs.height=Math.round(h*DPR);
  cvs.style.width=w+'px'; cvs.style.height=h+'px';
  CW_PX=w; CH_PX=h;
  allocBuf();
  var b=budget();
  if(b!==nPoints){ nPoints=b; makeCloud(); }
}

/* ---- the timeline ----
   Every beat is a pure function of P, so scrubbing backwards unplays it
   exactly. Nothing here is a one-way switch. */
function seg(p,a,b){var v=(p-a)/(b-a);return v<0?0:v>1?1:v;}
function ease(v){return v<0.5?4*v*v*v:1-Math.pow(-2*v+2,3)/2;}

var fvec=folders.map(function(_,i){
  var a=(i/Math.max(1,folders.length))*6.28318+0.7;
  return {x:Math.cos(a),y:Math.sin(a)*0.8,r:(i%2?1:-1)*(14+i*4)};
});
var scrubbing=false, P=0;

function timeline(){
  /* The first stage-height of the track is a hold — the Work grid sits
     still for a full screen of scrolling before any of this starts. */
  var r=track.getBoundingClientRect(), hold=stage.offsetHeight;
  var travel=r.height-stage.offsetHeight-hold;
  P = travel<=0 ? 0 : Math.max(0,Math.min(1,(-r.top-hold)/travel));

  var worksOut=ease(seg(P,0.06,0.32));
  scatter = 1-ease(seg(P,0.22,0.70));
  fadeIn  = seg(P,0.20,0.52);
  var aboutIn=ease(seg(P,0.58,0.78));

  /* The folders keep their entrance pop; the scrub can't afford its
     240ms transition, so the transition is cut the first time we move
     one and restored if the reader scrolls back out of the beat. */
  var want = worksOut>0.0005;
  if(want!==scrubbing){ scrubbing=want; work.classList.toggle('is-scrubbing',want); }
  deskEl.style.opacity=(1-worksOut).toFixed(3);
  /* main.css sets .site[data-desk] .work to pointer-events:auto, which
     beats the value inherited from the desk — so the faded folders kept
     catching clicks over the About pane. Turn .work off itself, and hide
     the desk once it is gone so its folders also leave the tab order. */
  var deskGone=worksOut>0.5;
  deskEl.style.pointerEvents=deskGone?'none':'';
  work.style.pointerEvents=deskGone?'none':'';
  deskEl.style.visibility=worksOut>0.995?'hidden':'';
  for(var i=0;i<folders.length;i++){
    var v=fvec[i], k=worksOut, f=folders[i];
    /* translate/rotate/scale, not transform: .folder's entrance owns the
       transform shorthand and its 420ms ease would smear the scrub. The
       individual properties compose with it and carry no transition. */
    if(k<=0.0005){ f.style.translate=''; f.style.rotate=''; f.style.scale=''; }
    else{
      f.style.translate=(v.x*46*k)+'% '+(v.y*46*k)+'%';
      f.style.rotate=(v.r*k)+'deg';
      f.style.scale=(1-0.22*k).toFixed(3);
    }
  }

  /* The section itself is never faded — the canvas lives inside it, and
     the island has to be there a third of a screen before the copy is.
     Only the heading and the panel arrive. */
  var ao=aboutIn.toFixed(3), atr='translateY('+((1-aboutIn)*16).toFixed(2)+'px)';
  if(aHead){ aHead.style.opacity=ao; aHead.style.transform=atr; }
  if(aSide){ aSide.style.opacity=ao; aSide.style.transform=atr;
             aSide.style.pointerEvents=aboutIn>0.5?'auto':'none'; }

  /* Fit the island into the measured slot and dissolve its far edge
     before the copy starts — a mask, not a clip, so there is no line. */
  if(fit && CW_PX>0){
    var cb=fit.getBoundingClientRect(), vb=cvs.getBoundingClientRect();
    var L=cb.left-vb.left, T=cb.top-vb.top, W=cb.width, H=cb.height;
    var narrow=innerWidth<=820;
    var edge = narrow ? (T+H)/CH_PX : (L+W)/CW_PX;
    cvs.style.setProperty('--m1', (100-(100-edge*100+2)*aboutIn).toFixed(1)+'%');
    cvs.style.setProperty('--m2', Math.min(100,100-(100-edge*100-14)*aboutIn).toFixed(1)+'%');
    /* the sea's full-width lower band, for the footer to sit in */
    cvs.style.setProperty('--b1', (100-40*aboutIn).toFixed(1)+'%');
    cvs.style.setProperty('--b2', (100-22*aboutIn).toFixed(1)+'%');
    var sc=Math.min(W/CW_PX, H/CH_PX);
    if(sc>0.02){
      xShift=((L+W/2)/CW_PX-0.5)*aboutIn;
      yShift=(0.5-(T+H/2+(narrow?14:0))/CH_PX)*aboutIn;
      /* the fit is a canvas-to-slot ratio, so tall things (the palms)
         still overhang on a stacked layout — give it extra room */
      distBias=(1/sc-1)*5.6*(narrow?0.92:0.72)*aboutIn;
    }
  }
}

/* ---- the loop ----
   Runs only while the track is on screen and the tab is visible. Off it,
   the island costs nothing. */
var running=false, lastT=0, fAcc=0, fN=0, slowFor=0, trimmed=false;
var dragging=false,panning=false,lastX=0,lastY=0,pinchD=0;
var lent=false, onScreen=false, needLayout=false, stillMode=false;
function frame(now){
  if(!running) return;
  var t=now/1000, dt=Math.min(0.05,(now-lastT)/1000); lastT=now;
  if(needLayout) layout();
  timeline();
  if(spin && !dragging) tYaw+=dt*0.10;
  yaw+=(tYaw-yaw)*0.12; pitch+=(tPitch-pitch)*0.12; dist+=(tDist-dist)*0.12;
  panX+=(tPanX-panX)*0.14; panY+=(tPanY-panY)*0.14;
  if(fadeIn>0.004) renderParticles(t,dt);
  else { ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,cvs.width,cvs.height); }

  /* One adaptive step. If the frame rate can't hold through the gather —
     the heaviest beat — halve the cloud once and never look again. */
  fAcc+=dt; fN++;
  if(fAcc>1){
    if(!trimmed && fadeIn>0.5 && fN/fAcc<22){ slowFor++; if(slowFor>1){ trimmed=true; nPoints=Math.round(nPoints*0.55); makeCloud(); } }
    else slowFor=0;
    fAcc=0; fN=0;
  }
  requestAnimationFrame(frame);
}
function start(){ if(running||lent||stillMode) return; running=true; lastT=performance.now(); requestAnimationFrame(frame); }
function stop(){ running=false; }

function boot(){
/* ---- orbit, pan, zoom. Only once the island is actually there. ---- */
function pt(e){return e.touches?{x:e.touches[0].clientX,y:e.touches[0].clientY}:{x:e.clientX,y:e.clientY};}
function live(){return fadeIn>0.45;}
function zoomBy(f){ tDist=Math.max(2.4,Math.min(18,tDist*f)); }
function startDrag(e,pan){ if(!live())return; dragging=true; panning=pan; var p=pt(e); lastX=p.x; lastY=p.y; }
function moveDrag(e){
  if(!dragging) return;
  var p=pt(e), dx=p.x-lastX, dy=p.y-lastY;
  if(panning){ var k=dist*0.0016; tPanX-=dx*k; tPanY+=dy*k;
    tPanX=Math.max(-4,Math.min(4,tPanX)); tPanY=Math.max(-3,Math.min(3,tPanY)); }
  else { tYaw-=dx*0.0085; tPitch=Math.max(-0.26,Math.min(1.08,tPitch+dy*0.006)); }
  lastX=p.x; lastY=p.y;
}
cvs.addEventListener('mousedown',function(e){ if(!live())return; startDrag(e,e.button===2||e.shiftKey); e.preventDefault(); });
cvs.addEventListener('contextmenu',function(e){ if(live()) e.preventDefault(); });
addEventListener('mousemove',moveDrag);
addEventListener('mouseup',function(){dragging=false;panning=false;});
/* Never swallow an ordinary wheel — the page has to keep scrolling
   through the island, which is the whole sequence. */
cvs.addEventListener('wheel',function(e){
  if(!live()||!(e.shiftKey||e.ctrlKey||e.metaKey)) return;
  e.preventDefault(); zoomBy(1+Math.sign(e.deltaY)*0.10);
},{passive:false});
cvs.addEventListener('touchstart',function(e){ if(!live())return;
  if(e.touches.length===2){ dragging=false;
    pinchD=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY); }
},{passive:true});
cvs.addEventListener('touchmove',function(e){ if(!live())return;
  if(e.touches.length===2){
    var d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
    if(pinchD) zoomBy(pinchD/d); pinchD=d; e.preventDefault();
  }
},{passive:false});
cvs.addEventListener('touchend',function(){dragging=false;panning=false;pinchD=0;});


prepTris();
nPoints=budget();
makeCloud();
layout();
addEventListener('resize',layout);

if('IntersectionObserver' in window){
  new IntersectionObserver(function(en){ onScreen=en[0].isIntersecting; if(onScreen) start(); else stop(); },
    {rootMargin:'20% 0px'}).observe(track);
} else { onScreen=true; start(); }
/* Only back on if the track is actually in view — coming back to the tab
   used to restart the loop wherever the reader was on the page. */
document.addEventListener('visibilitychange',function(){ if(document.hidden) stop(); else if(onScreen) start(); });
}

  /* ---------- reduced motion ----------
     Content kept, travel dropped. The island is rendered once into the
     column the cards used to hold; the page stays a plain stack. */
  var stillN=0;
  function stillFrame(){
    if(lent) return;
    if(nPoints!==stillN){ nPoints=stillN; makeCloud(); }
    var w=cvs.clientWidth||320, h=cvs.clientHeight||240;
    cvs.width=Math.round(w*DPR); cvs.height=Math.round(h*DPR);
    CW_PX=w; CH_PX=h; allocBuf();
    renderParticles(2.0, 0);
  }
  function still(){
    stillMode=true;
    document.documentElement.classList.add('atoll-still');
    palette='island'; psize=1; bloom=0.55; gain=1.8; occl=0.12; backLit=0.55;
    spin=0; scatter=0; fadeIn=1; ECH=[0,0,0,0,0,0]; smoke=1; cloudsOn=1;
    yaw=-0.62; pitch=0.24; dist=6.4; distBias=0; xShift=0; yShift=0;
    prepTris(); stillN=Math.min(70000,budget()); stillFrame();
    var rt; addEventListener('resize',function(){ clearTimeout(rt); rt=setTimeout(stillFrame,180); });
  }

  if (reduceMo) still();
  else { document.documentElement.classList.add('atoll-on'); boot(); }

  /* ---------- lent to the opening ----------
     js/opening.js holds this engine for the length of the lid. take()
     parks the About loop and points the renderer at the opening's canvas
     with the opening's look; give() puts every one of those back, and
     About rebuilds at its own budget before it next draws. */
  var kept=null, U=[0,0,0];
  window.NPIsland = {
    take: function(canvas, o){
      if(lent) return false;
      stop(); lent=true;
      kept={cvs:cvs,ctx:ctx,gain:gain,bloom:bloom,spin:spin,occl:occl,ECH:ECH,
            yaw:yaw,tYaw:tYaw,pitch:pitch,tPitch:tPitch,dist:dist,tDist:tDist,
            panX:panX,panY:panY,tPanX:tPanX,tPanY:tPanY,xShift:xShift,yShift:yShift,
            distBias:distBias,scatter:scatter,fadeIn:fadeIn,CAP:CAP};
      cvs=canvas; ctx=canvas.getContext('2d',{alpha:false});
      gain=o.gain; bloom=o.bloom; occl=o.occl; spin=0; if(o.ECH) ECH=o.ECH;
      yaw=tYaw=o.yaw; pitch=tPitch=o.pitch; dist=tDist=o.dist;
      panX=panY=tPanX=tPanY=0; xShift=yShift=distBias=0; scatter=0; fadeIn=1; CAP=o.cap;
      this.size(o.points);
      return true;
    },
    size: function(points, d){
      if(!lent) return;
      if(d) dist=tDist=d;
      var w=cvs.clientWidth||innerWidth, h=cvs.clientHeight||innerHeight;
      cvs.width=Math.round(w*DPR); cvs.height=Math.round(h*DPR);
      CW_PX=w; CH_PX=h; allocBuf();
      if(points && points!==nPoints){ nPoints=points; makeCloud(); }
    },
    points: function(){ return nPoints; },
    set: function(fade, erode, wake){ fadeIn=fade; diss=erode; wakeOn=wake; },
    carry: function(bp,bn,bm,bnum, wp,wa,wnum){ B_P=bp; B_N=bn; B_M=bm; BN=bnum; WK_P=wp; WK_A=wa; WKN=wnum; },
    boat: function(on,x,y,z,c,s){ boatOn=on; boatX=x; boatY=y; boatZ=z; boatC=c; boatS=s; },
    yaw: function(){ return yaw; },
    /* The inverse of renderParticles' camera, for placing the boat by where
       it should be on screen. Same construction line for line — if that
       camera changes, this changes with it. No bob: spin is 0 while lent. */
    unproject: function(sx, sy, vz){
      var cp=Math.cos(pitch), sp=Math.sin(pitch), cy=Math.cos(yaw), sy2=Math.sin(yaw);
      var tgx=panX, tgy=0.28+panY, D=dist+distBias;
      var ex=tgx+D*cp*sy2, ey=tgy+D*sp, ez=D*cp*cy;
      var fx=tgx-ex, fy=tgy-ey, fz=-ez, fl=Math.sqrt(fx*fx+fy*fy+fz*fz)||1; fx/=fl; fy/=fl; fz/=fl;
      var rx=-fz, rz=fx, rl=Math.sqrt(rx*rx+rz*rz)||1; rx/=rl; rz/=rl;
      var ux=-rz*fy, uy=rz*fx-rx*fz, uz=rx*fy;
      var F=1/Math.tan(0.46), asp=BW/BH;
      var a=(sx-0.5-xShift)*2*asp/F*vz, b=(0.5-sy-yShift)*2/F*vz;
      U[0]=ex+fx*vz+rx*a+ux*b; U[1]=ey+fy*vz+uy*b; U[2]=ez+fz*vz+rz*a+uz*b;
      return U;
    },
    render: function(t, dt){ if(lent) renderParticles(t, dt); },
    blank: function(){ if(!lent) return; ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle='#000'; ctx.fillRect(0,0,cvs.width,cvs.height); },
    give: function(){
      if(!lent) return;
      diss=0; boatOn=0; wakeOn=0;
      var k=kept; kept=null;
      cvs=k.cvs; ctx=k.ctx; gain=k.gain; bloom=k.bloom; spin=k.spin; occl=k.occl; ECH=k.ECH;
      yaw=k.yaw; tYaw=k.tYaw; pitch=k.pitch; tPitch=k.tPitch; dist=k.dist; tDist=k.tDist;
      panX=k.panX; panY=k.panY; tPanX=k.tPanX; tPanY=k.tPanY; xShift=k.xShift; yShift=k.yShift;
      distBias=k.distBias; scatter=k.scatter; fadeIn=k.fadeIn; CAP=k.CAP;
      lent=false;
      if(stillMode){ stillFrame(); return; }
      /* Rebuilding at About's budget is the one expensive step in the
         handback, so it waits for idle; frame() does it first if About
         is scrolled to before then. */
      needLayout=true;
      (window.requestIdleCallback||function(f){ return setTimeout(f,200); })(function(){ if(needLayout) layout(); });
      if(onScreen && !document.hidden) start();
    }
  };
})();
