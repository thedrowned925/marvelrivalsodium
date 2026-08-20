/* ODIUM Tracker V3 runtime hotfix */
(() => {
  const RAW_MAIN = 'https://raw.githubusercontent.com/thedrowned925/marvelrivalsodium/main/';
  const q = s => document.querySelector(s);
  const fmt = new Intl.NumberFormat('tr-TR');

  function installV3UI(){
    if(!document.querySelector('link[data-odium-ui-v3]')){
      const link=document.createElement('link');link.rel='stylesheet';link.href='ui-v3.css?v=3.2';link.dataset.odiumUiV3='1';document.head.appendChild(link);
    }
    if(!q('.ui-v3-badge')) document.body.insertAdjacentHTML('beforeend','<div class="ui-v3-badge">ODIUM TRACKER · UI V3.2</div>');
    const update=q('.update-line');
    if(update && !q('.hero-digest-v3')){
      update.insertAdjacentHTML('afterend',`<div class="hero-digest-v3"><article><small>VERİ REVİZYONU</small><strong id="v3Revision" class="cyan">—</strong><span>Canlı dataset kimliği</span></article><article><small>AKTİF KARAKTER</small><strong id="v3Active">—</strong><span>İlerlemesi başlayan karakter</span></article><article><small>KALİTE HAVUZU</small><strong id="v3Quality">—</strong><span>Kontrol + oyuna eklenen</span></article></div>`);
    }
    refreshDigest();
  }

  function refreshDigest(){
    if(typeof state==='undefined' || !state?.data) return;
    const d=state.data,s=d.stats||{};
    const active=(d.characters||[]).filter(c=>Number(c.progress||0)>0).length;
    const revision=String(d.dataRevision||'—').slice(0,8).toUpperCase();
    if(q('#v3Revision')) q('#v3Revision').textContent=revision;
    if(q('#v3Active')) q('#v3Active').textContent=fmt.format(active);
    if(q('#v3Quality')) q('#v3Quality').textContent=fmt.format(Number(s.checked||0)+Number(s.added||0));
  }

  async function fetchJSONNoCache(url){
    const res=await fetch(`${url}${url.includes('?')?'&':'?'}v=${Date.now()}`,{cache:'no-store'});
    if(!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.json();
  }

  window.__odiumDetailAttempts = window.__odiumDetailAttempts || new Map();
  detailData = async function(c){
    if(state.cache?.has(c.name)) return state.cache.get(c.name);
    const path=c.detailPath || `data/characters/${slug(c.name)}.json`;
    const candidates=[`${RAW_MAIN}${path}`,`./${path}`];
    let lastError;
    for(let round=0;round<3;round++){
      for(const url of candidates){
        try{
          const data=await fetchJSONNoCache(url);
          if(!data || !Array.isArray(data.rows)) throw new Error('Invalid detail payload');
          state.cache?.set(c.name,data);
          return data;
        }catch(err){lastError=err}
      }
      if(round<2) await new Promise(r=>setTimeout(r,900*(round+1)));
    }
    throw lastError || new Error('Character detail unavailable');
  };

  openDetail = async function(name){
    const c=state.data?.characters?.find(x=>x.name===name),m=q('#characterModal');if(!c||!m)return;
    state.detail={c,d:null,q:'',st:'all',page:1,size:25};
    q('#modalContent').innerHTML=`<div class="vault loading"><span class="modal-kicker">// CHARACTER DATA VAULT</span><h3>${esc(c.name)}</h3><p>${fmt.format(c.total)} satırlık canlı Excel verisi hazırlanıyor…</p><div class="skeleton"><i></i><i></i><i></i><i></i></div></div>`;
    if(!m.open)m.showModal();document.body.classList.add('modal-open');
    try{state.detail.d=await detailData(c);detail();}
    catch(err){
      console.error('ODIUM detail load failed',err);
      q('#modalContent').innerHTML=`<div class="vault error"><span class="modal-kicker">// DETAIL SYNC WAITING</span><h3>${esc(c.name)}</h3><p>Karakter özeti bağlı, fakat satır verisi GitHub ana veri dalında henüz görünmüyor. Otomatik senkronu tekrar kontrol edebilirsin.</p><section class="vault-stats">${tile('TOPLAM',c.total,'Excel satırı')}${tile('BEKLEYEN',c.waiting)}${tile('KAYIT',c.recorded)}${tile('KONTROL',c.checked)}${tile('OYUNDA',c.added)}</section><div style="margin-top:22px"><button class="btn primary" id="v3Retry"><span>Tekrar Kontrol Et</span><b>↻</b></button></div><p style="margin-top:16px;opacity:.55;font-size:9px">Aranan dosya: ${esc(c.detailPath||`data/characters/${slug(c.name)}.json`)}</p></div>`;
      q('#v3Retry')?.addEventListener('click',()=>openDetail(c.name));
    }
  };

  const oldRender=typeof render==='function'?render:null;
  if(oldRender){
    render=function(...args){const out=oldRender(...args);setTimeout(()=>{installV3UI();refreshDigest()},0);return out};
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installV3UI,{once:true}); else installV3UI();
  setTimeout(refreshDigest,1200);
})();
