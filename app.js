/* UKAY — living landing engine: 3D + parallel scroll + live bidding sim */
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const peso=n=>'₱'+Math.round(n).toLocaleString('en-PH');

/* ---------- progress + nav + cursor + menu ---------- */
addEventListener('scroll',()=>{
  const h=document.documentElement, p=h.scrollTop/(h.scrollHeight-h.clientHeight)*100;
  $('#progress').style.width=p+'%';
  $$('.band-row').forEach(r=>{
    const sp=parseFloat(r.dataset.speed||8), half=(r.scrollWidth/r.childElementCount)||800;
    const raw=(h.scrollTop*sp*0.12)%half; // continuous loop, no snapping
    const off=-(((raw%half)+half)%half); // pinned to (-half,0] so the strip never gaps
    r.style.transform=`translate3d(${off}px,0,0)`;
  });
  $$('#how .how, .sell-visual').forEach(el=>{
    const sp=parseFloat(el.dataset.speed||0); if(!sp) return;
    const rc=el.getBoundingClientRect();
    const raw=(innerHeight/2-(rc.top+rc.height/2))*sp*0.04;
    const off=Math.max(-30,Math.min(30,raw)); // clamped — no runaway drift
    el.style.translate=`0 ${off}px`;
  });
},{passive:true});

const cur=$('#cursor');
addEventListener('pointermove',e=>{cur.style.left=e.clientX+'px';cur.style.top=e.clientY+'px';});
$$('a,.btn,button').forEach(b=>{b.addEventListener('mouseenter',()=>{cur.style.width='34px';cur.style.height='34px'});b.addEventListener('mouseleave',()=>{cur.style.width='14px';cur.style.height='14px'})});
$('#menuBtn').onclick=()=>$('#mobileMenu').classList.toggle('open');
$$('#mobileMenu a').forEach(a=>a.onclick=()=>$('#mobileMenu').classList.remove('open'));

/* ---------- 3D hero : soft floating thrift orbs ---------- */
(function(){
  const cv=$('#webgl'); if(!cv||typeof THREE==='undefined') return;
  const renderer=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true});
  const scene=new THREE.Scene();
  scene.fog=new THREE.Fog(0xfbfbf8,9,17); // depth falloff — far orbs melt into the bg
  const cam=new THREE.PerspectiveCamera(55,1,0.1,100); cam.position.z=9;
  const amb=new THREE.AmbientLight(0xffffff,.9); scene.add(amb);
  const key=new THREE.DirectionalLight(0xffffff,.9); key.position.set(4,6,6); scene.add(key);
  const orbs=[];
  const cols=[0xd8ecdd,0xf3e7cf,0xd9e8ff,0xffe3d3,0xcdeeda,0xf6f1e6];
  for(let i=0;i<26;i++){
    const s=i%4===0? .9+Math.random()*1.1 : .28+Math.random()*.7;
    const g=new THREE.SphereGeometry(s,28,28);
    const z=(Math.random()-.5)*6-1, depth=(z+4)/6; // 0 far → 1 near
    const m=new THREE.MeshStandardMaterial({color:cols[i%cols.length],roughness:.55,metalness:.08,transparent:true,opacity:.35+.55*depth});
    const mesh=new THREE.Mesh(g,m);
    mesh.position.set((Math.random()-.5)*16,(Math.random()-.5)*10,z);
    mesh.userData={y:mesh.position.y,sp:.3+Math.random()*.9,ph:Math.random()*Math.PI*2,rx:(Math.random()-.5)*.004};
    scene.add(mesh); orbs.push(mesh);
  }
  // hero ring
  const ring=new THREE.Mesh(new THREE.TorusGeometry(4.4,.06,16,120),new THREE.MeshBasicMaterial({color:0x147a4b,transparent:true,opacity:.28}));
  ring.position.set(3.4,.4,-2); ring.rotation.x=1.1; scene.add(ring);
  let mx=0,my=0; addEventListener('pointermove',e=>{mx=(e.clientX/innerWidth-.5);my=(e.clientY/innerHeight-.5)});
  function size(){const r=cv.parentElement.getBoundingClientRect();renderer.setSize(r.width,r.height,false);renderer.setPixelRatio(Math.min(devicePixelRatio,2));cam.aspect=r.width/r.height;cam.updateProjectionMatrix()}
  size(); addEventListener('resize',size);
  const t0=performance.now();
  (function loop(t){
    const e=(t-t0)/1000;
    orbs.forEach(o=>{o.position.y=o.userData.y+Math.sin(e*o.userData.sp+o.userData.ph)*.7;o.rotation.x+=o.userData.rx;o.rotation.y+=.002});
    ring.rotation.z=e*.12;
    cam.position.x+=((mx*1.4)-cam.position.x)*.04;
    cam.position.y+=((-my*1.0)-cam.position.y)*.04;
    cam.lookAt(0,0,0);
    renderer.render(scene,cam); requestAnimationFrame(loop);
  })(t0);
})();

/* ---------- phone 3D tilt + orbit parallax ---------- */
(function(){
  const stage=$('#phoneTilt'); if(!stage) return;
  const hero=$('.hero');
  hero.addEventListener('pointermove',e=>{
    const r=hero.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
    stage.style.transform=`rotateY(${x*16}deg) rotateX(${-y*12}deg)`;
    $$('.orbit').forEach(o=>{const d=+o.dataset.depth||20;o.style.setProperty('--px',x*d+'px');o.style.setProperty('--py',y*d+'px')});
  });
  hero.addEventListener('pointerleave',()=>{stage.style.transform='rotateY(0) rotateX(0)'});
})();

/* ---------- GSAP reveals + counters + bar ---------- */
function fallbackReveal(){$$('.reveal').forEach(el=>{el.style.opacity=1;el.style.transform='none'})}
if(typeof gsap!=='undefined'){
  gsap.registerPlugin(ScrollTrigger);
  $$('.reveal').forEach((el,i)=>{
    gsap.to(el,{opacity:1,y:0,duration:1,ease:'power4.out',delay:(i%4)*.05,clearProps:'transform',
      scrollTrigger:{trigger:el,start:'top 88%'}});
  });
  gsap.to('.hero-copy h1',{yPercent:-8,scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
  gsap.to('.phone-tilt',{y:-70,rotate:2,scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1.2}});
} else fallbackReveal();

/* counters */
const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting) return; io.unobserve(e.target);
  const to=+e.target.dataset.to, t0=performance.now();
  (function tick(t){const p=Math.min((t-t0)/1400,1), v=Math.round(to*(1-Math.pow(1-p,3)));
    e.target.textContent=v.toLocaleString(); if(p<1) requestAnimationFrame(tick)})(t0);
}),{threshold:.5});
$$('.count').forEach(c=>io.observe(c));
setTimeout(()=>{const b=$('#barFill'); if(b) b.style.width='86%'},600);

/* ---------- LIVE SIMULATION : timers, prices, toasts, feed ---------- */
const names=['mika','joen','ram','bea','kiko','sari','enzo','lia','marco','sofia','drei','ana'];
const fmt=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
const fmtH=s=>`${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
let mega=2*3600+14*60+55;
setInterval(()=>{mega=Math.max(0,mega-1);const el=$('#megaTimer');if(el)el.textContent=fmtH(mega)},1000);

/* per-card countdowns */
setInterval(()=>{$$('.t').forEach(t=>{let s=+t.dataset.t||0;s=s>0?s-1:599;t.dataset.t=s;t.textContent=fmt(s)})},1000);
setInterval(()=>{const p=$('#phoneTimer');if(!p)return;let[a,b]=p.textContent.split(':').map(Number);let s=a*60+b-1;if(s<0)s=299;p.textContent=fmt(s)},1000);

function toast(html){
  const box=$('#toasts'), d=document.createElement('div'); d.className='toast'; d.innerHTML=html;
  box.appendChild(d); while(box.children.length>3) box.firstChild.remove();
  setTimeout(()=>{d.style.opacity='0';d.style.transition='opacity .5s';setTimeout(()=>d.remove(),500)},4200);
}
setTimeout(()=>toast('<b>@bea</b> just sold a trench coat for <b>₱1,950</b> 🔥'),2500);
setTimeout(()=>toast('Friday 8PM live unlocked at <b>5,000</b> waitlist 👀'),16000);

let cart=0, earn=12840;
function bumpCart(x,y){
  cart++; $('#cartCount').textContent=cart;
  const c=$('#cartBtn').getBoundingClientRect(), f=document.createElement('div');
  f.className='fly-dot'; f.style.left=x+'px'; f.style.top=y+'px';
  document.body.appendChild(f);
  requestAnimationFrame(()=>{f.style.left=(c.left+20)+'px';f.style.top=(c.top+10)+'px';f.style.transform='scale(.4)';f.style.opacity='.4'});
  setTimeout(()=>f.remove(),850);
}
function bidOn(card,btn,x,y){
  const priceEl=card?$('.price',card):$('#phonePrice');
  const bidsEl=card?$('.bids',card):null;
  let cur=parseInt((priceEl.textContent||'₱0').replace(/[^\d]/g,''))||1000;
  const inc=cur>3000?150:cur>1000?80:40;
  cur+=inc; priceEl.textContent=peso(cur);
  if(bidsEl){const n=parseInt(bidsEl.textContent)||0;bidsEl.textContent=(n+1)+' bids'}
  if(btn) {btn.textContent='Bid placed ✓ '+peso(cur+inc); setTimeout(()=>btn.innerHTML='Bid now',1600)}
  if(x!==undefined) bumpCart(x,y);
  toast(`<b>You</b> bid <b>${peso(cur)}</b> ${card?('· '+card.dataset.name):'· Levi\'s Trucker'} ⚡`);
}
$$('[data-bid]').forEach(btn=>btn.addEventListener('click',e=>{
  const card=btn.closest('.drop'); bidOn(card,btn,e.clientX,e.clientY);
}));
/* ambient rival bids — prices tick silently, toast only sometimes */
setInterval(()=>{
  const cards=$$('.drop'); if(!document.hasFocus()&&Math.random()<.3) return;
  const card=cards[Math.floor(Math.random()*cards.length)];
  const priceEl=$('.price',card); let cur=parseInt(priceEl.textContent.replace(/[^\d]/g,''));
  const inc=[40,60,80,120][Math.floor(Math.random()*4)]; cur+=inc;
  priceEl.textContent=peso(cur);
  const bidsEl=$('.bids',card); bidsEl.textContent=((parseInt(bidsEl.textContent)||0)+1)+' bids';
  if(Math.random()<.5) return; // most bids pass quietly — notification only once in a while
  const who=names[Math.floor(Math.random()*names.length)];
  toast(`<b>@${who}</b> bid <b>${peso(cur)}</b> · ${card.dataset.name}`);
  const feed=$('#phoneFeed');
  if(feed){const s=document.createElement('span');s.innerHTML=`<b>@${who}</b> bid ${peso(cur)}`;feed.prepend(s);while(feed.children.length>3)feed.lastChild.remove()}
},9000);
/* earnings ticker */
setInterval(()=>{earn+=Math.floor(120+Math.random()*480);const e=$('#earnNum');if(e)e.textContent=peso(earn)},2800);
$('#cartBtn').onclick=()=>toast(cart?`You have <b>${cart}</b> active bid${cart>1?'s':''} — checkout unlocks on launch 💚`:'Tap <b>Bid now</b> on any drop to feel it ⚡');

/* ---------- magnetic buttons ---------- */
$$('.magnetic').forEach(b=>{
  b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.12}px,${(e.clientY-r.top-r.height/2)*.18}px)`});
  b.addEventListener('pointerleave',()=>b.style.transform='');
});

/* ---------- early access form (mock) ---------- */
$('#earlyForm').addEventListener('submit',e=>{
  e.preventDefault();
  const v=$('#email').value.trim(), msg=$('#formMsg');
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)){msg.textContent='Hmm — that email looks off. Try again?';msg.style.color='#ffd66e';return}
  msg.textContent='You\'re in! Check '+v+' on launch day — ₱200 voucher reserved ✓';
  msg.style.color='#fff';
  toast(`Welcome to the waitlist, <b>${v.split('@')[0]}</b> 🎉 ₱200 locked in`);
  $('#email').value='';
});
