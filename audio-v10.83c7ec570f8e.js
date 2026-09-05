/* ODIUM Marvel Rivals — hover/detail voice playback v11 */
(()=>{
  const RAW=new URL('./assets/audio/',document.baseURI).href;
  const TRACKS={
    'blade':{
      hover:'hover/intikam.wav',
      detail:'detail/BİN kesik ulti.wav'
    },
    'groot':{
      hover:'hover/Groot_ulti1_ADIM_GROOOOT.wav',
      detail:'detail/Groot_ulti2_Adimiz_Groot.wav'
    },
    'iron-fist':{
      hover:'hover/IronFist_ulti2_skin_GongXiFaCai.wav',
      detail:'detail/IronFist_ulti1_Ejderhayi_Saldik.wav'
    },
    'spider-man':{
      hover:'hover/SpiderMan_ulti2_OrumcekAdama_Bulasmayin.wav',
      detail:'detail/SpiderMan_ulti1_HerkeseBendenAg.wav'
    },
    'the-punisher':{
      hover:'hover/Punisher_ulti1_Cellat.wav',
      detail:'detail/Punisher_ulti2_Kendi_Yontemlerimle.wav'
    },
    'punisher':{
      hover:'hover/Punisher_ulti1_Cellat.wav',
      detail:'detail/Punisher_ulti2_Kendi_Yontemlerimle.wav'
    }
  };

  const slug=v=>String(v||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  const getName=card=>card?.dataset?.name||card?.querySelector('.char-name')?.textContent?.trim()||'';
  let managed={};
  const getTracks=card=>{const key=slug(getName(card)),base=TRACKS[key]||{},extra=managed[key]||{};const tracks={hover:extra.hover||base.hover,detail:extra.detail||base.detail};return tracks.hover||tracks.detail?tracks:null};

  const hoverAudio=new Audio();
  const detailAudio=new Audio();
  hoverAudio.preload='auto';
  detailAudio.preload='auto';
  hoverAudio.volume=.90;
  detailAudio.volume=.95;

  let hoverCard=null;

  function reset(audio){
    audio.pause();
    try{audio.currentTime=0}catch{}
  }
  function stopHover(){reset(hoverAudio);hoverCard=null;}
  function stopDetail(){reset(detailAudio);}
  function src(path){return path.startsWith('https://')?path:`${RAW}${path}?v=11`;}

  function playHover(card){
    const tracks=getTracks(card);
    if(!tracks?.hover)return;
    stopHover();
    stopDetail();
    hoverCard=card;
    hoverAudio.src=src(tracks.hover);
    hoverAudio.play().catch(()=>{});
  }

  function playDetail(card){
    const tracks=getTracks(card);
    if(!tracks?.detail)return;
    stopHover();
    stopDetail();
    detailAudio.src=src(tracks.detail);
    detailAudio.play().catch(()=>{});
  }

  function bind(card){
    if(!card||card.dataset.audioV11==='1'||!getTracks(card))return;
    card.dataset.audioV11='1';
    card.addEventListener('mouseenter',()=>playHover(card));
    card.addEventListener('mouseleave',()=>{if(hoverCard===card)stopHover();});
    card.addEventListener('click',()=>playDetail(card),{capture:true});
    card.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' ')playDetail(card);
    });
  }

  window.OdiumAudio={playName:name=>playDetail({dataset:{name}}),setTracks:tracks=>{managed=tracks;scan()}};

  function scan(){
    document.querySelectorAll('#characterGrid .char-card').forEach(bind);
  }

  function warmAudio(){
    // Browsers may block audible hover playback until the page receives a user gesture.
    // A first pointer/key interaction unlocks subsequent hover playback where required.
    [hoverAudio,detailAudio].forEach(a=>{
      a.muted=true;
      const p=a.play();
      if(p&&typeof p.then==='function')p.then(()=>{a.pause();a.muted=false;}).catch(()=>{a.muted=false;});
      else a.muted=false;
    });
  }

  function boot(){
    scan();
    const grid=document.querySelector('#characterGrid');
    if(grid)new MutationObserver(()=>requestAnimationFrame(scan)).observe(grid,{childList:true,subtree:true});
    const modal=document.querySelector('#characterModal');
    if(modal)modal.addEventListener('close',stopDetail);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){stopHover();stopDetail();}});
    window.addEventListener('blur',stopHover);
    document.addEventListener('pointerdown',warmAudio,{once:true,capture:true});
    document.addEventListener('keydown',warmAudio,{once:true,capture:true});
  }

  document.readyState==='loading'
    ?document.addEventListener('DOMContentLoaded',boot,{once:true})
    :boot();
})();
