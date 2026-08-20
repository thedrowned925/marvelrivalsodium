/* ODIUM Marvel Rivals comic runtime v6.7 — Pages loader */
(async()=>{
  document.body.classList.add('rivals-theme');
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
  for(const href of ['./responsive-v6.css?v=6.2.1','./detail-art-v6.css?v=6.6.2']){
    const css=document.createElement('link');css.rel='stylesheet';css.href=href;document.head.appendChild(css);
  }
  try{
    const url='https://raw.githubusercontent.com/thedrowned925/marvelrivalsodium/main/hotfix-v3.js?v=5.0&ts='+Date.now();
    const response=await fetch(url,{cache:'no-store'});
    if(!response.ok) throw new Error('Runtime fetch failed: '+response.status);
    (0,eval)(await response.text());
  }catch(error){console.error('[ODIUM] Marvel Rivals runtime could not load',error);}
  const art=document.createElement('script');art.src='./art-v6.js?v=6.7.1';art.defer=true;document.head.appendChild(art);
})();
