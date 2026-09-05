/* One local-only artwork pipeline. No remote probes, eval or DOM repair loops. */
(()=>{
  const manifest=window.ODIUM_ART||{};
  const encode=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safePath=p=>typeof p==='string'&&/^assets\/characters\/[a-z0-9/_.-]+$/.test(p)?p:null;
  function paths(name,type){const item=manifest[name]||{};return [...new Set([safePath(item[type]?.file),safePath(item[type==='card'?'detail':'card']?.file)].filter(Boolean))];}
  function bind(img,name,type,onSuccess,onFailure){
    const candidates=paths(name,type);let index=0;
    function next(){
      if(index>=candidates.length){img.hidden=true;img.removeAttribute('src');onFailure?.();return;}
      img.src=candidates[index++];
    }
    img.onload=()=>{img.hidden=false;onSuccess?.();};img.onerror=next;next();
  }
  function cardMarkup(name,index){const sources=paths(name,'card');const initials=name.split(/[ .-]+/).filter(Boolean).map(s=>s[0]).slice(0,2).join('');return `<div class="char-art"><div class="art-fallback" ${sources.length?'hidden':''}><b>${encode(initials)}</b><span>Karakter görseli hazırlanıyor</span></div><img class="art-base" alt="" width="600" height="600" loading="${index<4?'eager':'lazy'}" decoding="async" ${sources.length?'':'hidden'} /></div>`;}
  function mount(card){
    const name=card.dataset.name;const fallback=card.querySelector('.art-fallback');
    bind(card.querySelector('.art-base'),name,'card',()=>fallback.hidden=true,()=>{fallback.hidden=false;fallback.querySelector('span').textContent=paths(name,'card').length?'Görsel şu an yüklenemedi':'Karakter görseli hazırlanıyor';});
    const item=manifest[name];if(!item?.detail||item.detail.file===item.card?.file)return;
    let started=false;
    function hover(){if(started)return;started=true;const img=new Image();img.className='art-hover';img.alt='';img.decoding='async';card.querySelector('.char-art').append(img);bind(img,name,'detail',()=>card.dataset.hoverReady='true');}
    card.addEventListener('mouseenter',hover,{once:true});card.addEventListener('focus',hover,{once:true});
  }
  function detail(head,name){const img=new Image();img.className='vault-art';img.alt='';img.width=650;img.height=650;head.append(img);bind(img,name,'detail');}
  window.CharacterArt={cardMarkup,mount,detail,bind};
})();
