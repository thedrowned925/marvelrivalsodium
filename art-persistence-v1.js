/* ODIUM Marvel Rivals — artwork persistence across live rerenders v1.0 */
(()=>{
  const cache=new Map();
  const ART_VER='11.3';

  const nameOf=card=>card?.dataset?.name||card?.querySelector?.('.char-name')?.textContent?.trim()||'';
  const good=img=>!!(img&&img.src&&!img.hidden&&img.naturalWidth!==0);

  function capture(card){
    if(!card||!card.matches?.('.char-card'))return;
    const name=nameOf(card);if(!name)return;
    const old=cache.get(name)||{};
    const base=card.querySelector(':scope > .mr-hero-art-base');
    const hover=card.querySelector(':scope > .mr-hero-art-hover');
    if(good(base))old.base=base.currentSrc||base.src;
    if(good(hover))old.hover=hover.currentSrc||hover.src;
    const focus=card.style.getPropertyValue('--art-focus');
    if(focus)old.focus=focus;
    if(old.base||old.hover)cache.set(name,old);
  }

  function captureTree(node){
    if(!(node instanceof Element))return;
    if(node.matches('.char-card'))capture(node);
    node.querySelectorAll?.('.char-card').forEach(capture);
  }

  function restore(card){
    if(!card||!card.matches?.('.char-card'))return;
    const name=nameOf(card),saved=cache.get(name);
    if(!saved)return;

    let base=card.querySelector(':scope > .mr-hero-art-base');
    let hover=card.querySelector(':scope > .mr-hero-art-hover');
    if(!base){base=document.createElement('img');base.className='mr-hero-art mr-hero-art-base';base.alt='';base.decoding='async';base.loading='eager';card.prepend(base)}
    if(!hover){hover=document.createElement('img');hover.className='mr-hero-art mr-hero-art-hover';hover.alt='';hover.decoding='async';hover.loading='eager';base.after(hover)}

    if(saved.base){base.src=saved.base;base.hidden=false;card.dataset.baseArt='persistent-cache'}
    if(saved.hover){hover.src=saved.hover;hover.hidden=false;card.dataset.hoverArt='persistent-cache'}
    else if(saved.base){hover.src=saved.base;hover.hidden=false;card.dataset.hoverArt='base-fallback'}
    if(saved.focus)card.style.setProperty('--art-focus',saved.focus);

    // Make the existing art engine keep the restored nodes instead of refetching them.
    card.dataset.artV11=ART_VER;
    card.dataset.artPersistent='true';
  }

  function restoreTree(node){
    if(!(node instanceof Element))return;
    if(node.matches('.char-card'))restore(node);
    node.querySelectorAll?.('.char-card').forEach(restore);
  }

  function boot(){
    const grid=document.getElementById('characterGrid');
    if(!grid)return;

    grid.querySelectorAll('.char-card').forEach(capture);
    grid.addEventListener('load',e=>{
      if(e.target?.matches?.('.mr-hero-art-base,.mr-hero-art-hover'))capture(e.target.closest('.char-card'));
    },true);

    new MutationObserver(records=>{
      for(const record of records){
        record.removedNodes.forEach(captureTree);
        record.addedNodes.forEach(restoreTree);
      }
      requestAnimationFrame(()=>grid.querySelectorAll('.char-card').forEach(restore));
    }).observe(grid,{childList:true,subtree:true});

    document.body.addEventListener('odium:data-rendered',()=>requestAnimationFrame(()=>grid.querySelectorAll('.char-card').forEach(restore)));
    setInterval(()=>grid.querySelectorAll('.char-card').forEach(capture),15000);
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
