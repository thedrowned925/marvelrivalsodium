/* ODIUM Marvel Rivals comic runtime v11.6 — persistent live art + isolated device UI */
(async()=>{
  document.body.classList.add('rivals-theme');

  const uaMobile=()=>{
    if(navigator.userAgentData&&typeof navigator.userAgentData.mobile==='boolean')return navigator.userAgentData.mobile;
    return /Android|iPhone|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent||'');
  };
  const ipad=/iPad/i.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const coarse=matchMedia('(pointer:coarse)').matches;
  const touch=(navigator.maxTouchPoints||0)>0||'ontouchstart' in window;
  const vw=Math.min(window.innerWidth||9999,window.screen?.width||9999);
  const initialMode=(uaMobile()||(coarse&&touch&&vw<=767))?'mobile':(ipad||(coarse&&touch&&vw<=1180))?'tablet':'desktop';
  document.body.classList.add(`device-${initialMode}`);
  document.documentElement.dataset.device=initialMode;

  const style=document.createElement('style');
  style.textContent=`
    .rivals-theme #cosmos{background:radial-gradient(circle at 73% 17%,#153c55 0,#10152e 28%,#090a13 56%,#05060b 100%)!important}
    .rivals-theme .aurora-a{background:#59edff!important;opacity:.11!important;filter:blur(110px)!important}
    .rivals-theme .aurora-b{background:#ff4cac!important;opacity:.12!important;filter:blur(105px)!important}
    .rivals-theme .scanlines{opacity:.055!important;background:repeating-linear-gradient(0deg,#fff2 0 1px,transparent 1px 4px),radial-gradient(circle,#ffd82e22 0 1px,transparent 1.5px) 0 0/18px 18px!important}
    .rivals-theme ::selection{background:#ffd82e;color:#0a0c13}
    .rivals-theme *{scrollbar-color:#59edff #0d0f1d}
  `;
  document.head.appendChild(style);

  for(const href of [
    './responsive-v6.css?v=6.2.1',
    './detail-art-v6.css?v=6.6.2',
    './card-art-v7.css?v=7.0.1',
    './card-fix-v10.css?v=10.0.1',
    './card-art-v11.css?v=11.3.1',
    './card-recovery-v11.css?v=11.4.0',
    './hero-v10.css?v=10.0.1',
    './mobile-v1.css?v=1.0.0'
  ]){
    const css=document.createElement('link');css.rel='stylesheet';css.href=href;document.head.appendChild(css);
  }

  try{
    const url='https://raw.githubusercontent.com/thedrowned925/marvelrivalsodium/main/hotfix-v3.js?v=5.0&ts='+Date.now();
    const response=await fetch(url,{cache:'no-store'});
    if(!response.ok)throw new Error('Runtime fetch failed: '+response.status);
    (0,eval)(await response.text());
  }catch(error){console.error('[ODIUM] base runtime could not load',error);}

  for(const src of [
    './card-art-v11.js?v=11.3.1',
    './card-recovery-v11.js?v=11.4.0',
    './art-persistence-v1.js?v=1.0.0',
    './detail-art-v10.js?v=10.0.1',
    './hero-v10.js?v=10.0.1',
    './device-mode-v1.js?v=1.0.0',
    './live-refresh-v1.js?v=1.0.0'
  ]){
    const script=document.createElement('script');script.src=src;script.async=false;document.head.appendChild(script);
  }

  try{
    const response=await fetch('https://raw.githubusercontent.com/thedrowned925/marvelrivalsodium/main/audio-v10.js?v=10.0.1&ts='+Date.now(),{cache:'no-store'});
    if(response.ok)(0,eval)(await response.text());
  }catch(error){console.warn('[ODIUM] character audio module unavailable',error);}
})();
