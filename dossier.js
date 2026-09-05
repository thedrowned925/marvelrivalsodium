/* Character-specific live dossier composition; shared by home and detail. */
(()=>{
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const nf=new Intl.NumberFormat('tr-TR');const num=n=>nf.format(Number(n)||0);const percent=n=>Number(n||0).toLocaleString('tr-TR',{maximumFractionDigits:1});
 const icons={mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',check:'<path d="m9 12 2 2 4-4M12 2l8 4v6c0 5-8 9-8 9s-8-4-8-9V6Z"/>',game:'<path d="M6 7h12c3 0 4 5 4 9s-4 3-6 0H8c-2 3-6 4-6 0S3 7 6 7ZM6 10v5M3.5 12.5h5M17 11h.01M20 14h.01"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',file:'<path d="M14 2H5v20h14V7ZM14 2v6h5M8 12h8M8 16h6"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>'};
 const icon=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[k]||icons.file}</svg>`;
 const profile=n=>(window.HERO_DESIGN||{})[n]||{name:n,color:'#586580',emblem:null};
 const status=s=>s==='Tamamlandi'?'TAMAMLANDI':s==='Devam Ediyor'?'DEVAM EDİYOR':'KAYIT BEKLİYOR';
 const stages=[['recorded','KAYIT ALINDI','Ses kaydı tamamlanan replikler.','mic','01'],['checked','KONTROL EDİLDİ','Kalite kontrolünden geçen kayıtlar.','check','02'],['added','OYUNA EKLENDİ','Oyun paketine entegre edilen sesler.','game','03'],['waiting','SIRADAKİ REPLİKLER','Henüz kayıt bekleyen replikler.','clock','04']];
 let roster=[],selected='Dr.Strange',snapshot=null;
 function stage(c,s=c,detail=false,data=null){
  const p=profile(c.name),worked=Number(s.worked??((s.recorded||0)+(s.checked||0)+(s.added||0))),total=Number(s.total||0),actor=data?.voiceActor||c.voiceActor||'Henüz atanmadı';const progress=Number(s.progress||0),tag=detail?'h3':'h2';
  return `<section class="dossier-stage ${detail?'is-detail':''}" data-hero="${esc(c.name)}" style="--hero-color:${p.color}">
   <div class="dossier-scene" aria-hidden="true"></div><div class="dossier-banner" aria-hidden="true"></div>
   <div class="dossier-identity">${p.emblem?`<img class="dossier-emblem" src="${esc(p.emblem)}" alt="" width="500" height="500" />`:''}<img class="dossier-portrait" data-portrait alt="${esc(p.name)}" width="900" height="1100" decoding="async" />
    <div class="dossier-name"><span>MARVEL RIVALS / TÜRKÇE DUBLAJ</span><${tag}>${esc(p.name)}</${tag}><div class="dossier-status">${status(s.status||c.status)}</div></div>
   </div>
   <div class="dossier-production"><div class="dossier-label">SESLENDİRME DOSYASI <span></span></div>
    <div class="voice-panel"><span class="diamond">${icon('mic')}</span><div><small>TÜRKÇE SESİ</small><strong>${esc(actor)}</strong><span>ODIUM Studios</span></div></div>
    <div class="dossier-progress"><div><small>ÜRETİM İLERLEMESİ</small><strong>%${percent(progress)}</strong></div><div class="dossier-progressbar"><i style="width:${Math.min(100,Math.max(0,progress))}%"></i></div><p><b>${num(worked)}</b> / ${num(total)} replik işlendi</p></div>
    <div class="dossier-totals"><div><span>TOPLAM REPLİK</span><b>${num(total)}</b></div><div><span>İŞLENEN REPLİK</span><b>${num(worked)}</b></div></div>
    <p class="dossier-note">İşlenen replikler; kaydı alınan, kontrol edilen ve oyuna eklenen satırların toplamıdır.</p>
   </div>
   <div class="dossier-flow"><div class="dossier-label">KAYITTAN OYUNA <span></span></div>${stages.map(([key,title,desc,ico,no])=>`<div class="production-step"><div class="step-icon"><span class="diamond">${icon(ico)}</span><small>${no}</small></div><div><h4>${title}</h4><p>${desc}</p><div class="step-meter"><i style="width:${Math.min(100,total?(Number(s[key]||0)/total*100):0)}%"></i></div></div><strong>${num(s[key])}</strong></div>`).join('')}
   </div>
   <div class="dossier-actions"><span class="dossier-file-no">ODIUM / ${String(roster.findIndex(x=>x.name===c.name)+1).padStart(2,'0')}</span><div>${detail?'<a class="dossier-open" href="#lineList" data-view-lines>'+icon('file')+' REPLİKLERİ GÖR</a>':`<button class="dossier-open" data-open="${esc(c.name)}">${icon('file')} REPLİK DOSYASINI AÇ</button>`}<button class="dossier-export" data-export="${esc(c.name)}">${icon('download')} AFİŞİ İNDİR</button></div></div>
  </section>`;
 }
 function mount(root){
  root.querySelectorAll('.dossier-stage').forEach(el=>{
   const name=el.dataset.hero;CharacterArt.bind(el.querySelector('[data-portrait]'),name,'detail');
   el.querySelector('.dossier-emblem')?.addEventListener('error',e=>{e.target.hidden=true},{once:true});
  });
  root.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{window.OdiumAudio?.playName(b.dataset.open);window.openDetail(b.dataset.open)}));
  root.querySelectorAll('[data-view-lines]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();document.querySelector('#modalContent .all-lines')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});}));
  root.querySelectorAll('[data-export]').forEach(b=>b.addEventListener('click',async()=>{
   const c=roster.find(c=>c.name===b.dataset.export);if(!c)return;
   const old=b.innerHTML;b.disabled=true;b.textContent='AFİŞ HAZIRLANIYOR…';
   try{const source=root.closest('#modalContent')?window.getDossierDetail?.():null;await window.PosterRenderer.download(c,source?.d,snapshot?.generatedAt);b.textContent='AFİŞ İNDİRİLDİ';}
   catch(e){b.textContent='İNDİRİLEMEDİ · TEKRAR DENE';console.warn('[ODIUM] poster export',e);}
   finally{b.disabled=false;setTimeout(()=>{if(b.isConnected)b.innerHTML=old},2500)}
  }));
 }
 function spotlight(){const root=document.getElementById('spotlight');if(!root||!roster.length)return;const c=roster.find(c=>c.name===selected)||roster[0];selected=c.name;root.innerHTML=`<div class="spotlight-navigation"><span>KARAKTER ODAĞI <b>${String(roster.indexOf(c)+1).padStart(2,'0')} / ${roster.length}</b></span><div><button data-cycle="-1" aria-label="Önceki karakter">←</button><button data-cycle="1" aria-label="Sonraki karakter">→</button></div></div>`+stage(c);mount(root);root.querySelectorAll('[data-cycle]').forEach(b=>b.onclick=()=>{selected=roster[(roster.indexOf(c)+Number(b.dataset.cycle)+roster.length)%roster.length].name;spotlight()});}
 function update(data){snapshot=data;roster=data.characters;spotlight();}
 function decorateCards(){document.querySelectorAll('#characterGrid .char-card').forEach(card=>{const p=profile(card.dataset.name);card.style.setProperty('--hero-color',p.color);const head=card.querySelector('.char-name');if(head)head.textContent=p.name;const art=card.querySelector('.char-art');if(p.emblem&&art&&!art.querySelector('.card-emblem')){const img=new Image();img.className='card-emblem';img.src=p.emblem;img.alt='';img.loading='lazy';img.onerror=()=>img.hidden=true;art.prepend(img)};});}
 window.Dossier={stage,mount,update,decorateCards,profile,icon};
})();
