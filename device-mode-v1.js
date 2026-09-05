/* ODIUM Marvel Rivals — device classifier + mobile controller v1.0 */
(()=>{
  const root=document.documentElement;
  const body=document.body;
  let current='';
  let nav=null;
  let observer=null;
  let resizeTimer=null;

  function uaMobile(){
    if(navigator.userAgentData&&typeof navigator.userAgentData.mobile==='boolean')return navigator.userAgentData.mobile;
    return /Android|iPhone|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent||'');
  }
  function isIPad(){
    return /iPad/i.test(navigator.userAgent||'') || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  }
  function classify(){
    const coarse=matchMedia('(pointer:coarse)').matches;
    const touch=(navigator.maxTouchPoints||0)>0 || 'ontouchstart' in window;
    const mobileUA=uaMobile();
    const ipad=isIPad();
    const vw=Math.min(window.innerWidth||9999, window.screen?.width||9999);
    if(mobileUA || (coarse&&touch&&vw<=767))return 'mobile';
    if(ipad || (coarse&&touch&&vw<=1180))return 'tablet';
    return 'desktop';
  }

  function setMode(mode){
    if(current===mode)return;
    body.classList.remove('device-mobile','device-tablet','device-desktop');
    body.classList.add(`device-${mode}`);
    root.dataset.device=mode;
    current=mode;
    if(mode==='mobile')mountBottomNav(); else unmountBottomNav();
    body.dispatchEvent(new CustomEvent('odium:devicechange',{detail:{mode}}));
  }

  function mountBottomNav(){
    if(nav&&nav.isConnected)return;
    nav=document.createElement('nav');
    nav.className='mobile-bottom-nav';
    nav.setAttribute('aria-label','Mobil hızlı gezinme');
    nav.innerHTML=`
      <a href="#overview" data-target="overview"><b>⌂</b><span>GENEL</span></a>
      <a href="#pipeline" data-target="pipeline"><b>↯</b><span>AŞAMALAR</span></a>
      <a href="#characters" data-target="characters"><b>✦</b><span>KARAKTERLER</span></a>`;
    body.appendChild(nav);
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
      nav.querySelectorAll('a').forEach(x=>x.classList.remove('active'));
      a.classList.add('active');
    }));
    observeSections();
  }

  function unmountBottomNav(){
    if(nav){nav.remove();nav=null;}
    if(observer){observer.disconnect();observer=null;}
  }

  function observeSections(){
    if(observer)observer.disconnect();
    const sections=['overview','pipeline','characters'].map(id=>document.getElementById(id)).filter(Boolean);
    if(!sections.length||!nav)return;
    observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible)return;
      nav.querySelectorAll('a').forEach(a=>a.classList.toggle('active',a.dataset.target===visible.target.id));
    },{rootMargin:'-25% 0px -55% 0px',threshold:[0,.15,.35,.6]});
    sections.forEach(s=>observer.observe(s));
  }

  function normalizeTouchCards(){
    if(current==='desktop')return;
    document.querySelectorAll('#characterGrid .char-card').forEach(card=>{
      card.style.removeProperty('--rx');
      card.style.removeProperty('--ry');
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    });
  }

  function optimizeMotion(){
    const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
    if(current==='mobile'||reduced){
      body.classList.add('reduced-mobile-motion');
    }else{
      body.classList.remove('reduced-mobile-motion');
    }
  }

  function refresh(){
    setMode(classify());
    optimizeMotion();
    normalizeTouchCards();
    if(current==='mobile'&&nav)observeSections();
  }

  function boot(){
    refresh();
    const grid=document.getElementById('characterGrid');
    if(grid)new MutationObserver(()=>requestAnimationFrame(normalizeTouchCards)).observe(grid,{childList:true,subtree:true});
    window.addEventListener('resize',()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(refresh,120);
    },{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(refresh,180),{passive:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
