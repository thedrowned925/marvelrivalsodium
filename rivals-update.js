(()=>{
  const DATA_URL='data/rivals-update.json';
  const REFRESH_MS=30000;
  const root=document.getElementById('rivalsUpdateCard');
  if(!root)return;

  const $=id=>document.getElementById(id);
  const els={
    badge:$('rivalsUpdateBadgeText'),
    build:$('rivalsUpdateBuild'),
    title:$('rivalsUpdateTitle'),
    message:$('rivalsUpdateMessage'),
    detection:$('rivalsUpdateDetection'),
    compatibility:$('rivalsUpdateCompatibility'),
    link:$('rivalsUpdateSource'),
    action:$('rivalsUpdateAction')
  };
  const labels={compatible:'MOD UYUMLU',checking:'UYUM KONTROLÜ',affected:'MOD RİSKLİ'};
  const escText=v=>String(v??'').trim();
  let lastKey='';

  function titleMarkup(data){
    const raw=escText(data.title)||'Marvel Rivals güncelleme durumu';
    const parts=raw.split(/\s+/);
    if(parts.length<2)return raw;
    const last=parts.pop();
    return `${parts.join(' ')} <em>${last}</em>`;
  }

  function render(data){
    const status=['compatible','checking','affected'].includes(data.status)?data.status:'checking';
    const key=[data.buildId,status,data.checkedAt,data.message,data.action].join('|');
    if(key===lastKey)return;
    lastKey=key;
    root.dataset.status=status;
    els.badge.textContent=labels[status];
    els.build.textContent=`PUBLIC BUILD ${escText(data.buildId)||'—'}`;
    els.title.innerHTML=titleMarkup(data);
    els.message.textContent=escText(data.message)||'Güncelleme durumu kontrol ediliyor.';
    els.detection.textContent=data.patchVersion?`Yama ${data.patchVersion}`:'Steam public build';
    els.compatibility.textContent=escText(data.compatibilityNote)||'Kontrol bekleniyor';
    const source=data.source||{};
    if(source.url){
      els.link.href=source.url;
      els.link.hidden=false;
      els.link.firstElementChild.textContent=escText(source.label)||'Kaynağı aç';
    }else{
      els.link.hidden=true;
    }
    const action=escText(data.action);
    els.action.hidden=!action;
    if(action)els.action.innerHTML=`<b>ÖNEMLİ:</b> ${action}`;
  }

  async function refresh(){
    try{
      const res=await fetch(`${DATA_URL}?t=${Date.now()}`,{cache:'no-store'});
      if(!res.ok)throw new Error(`HTTP ${res.status}`);
      render(await res.json());
    }catch(err){
      console.warn('Rivals update status could not be refreshed.',err);
    }
  }

  refresh();
  const timer=setInterval(()=>{if(!document.hidden)refresh()},REFRESH_MS);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  addEventListener('online',refresh);
  addEventListener('beforeunload',()=>clearInterval(timer),{once:true});
})();
