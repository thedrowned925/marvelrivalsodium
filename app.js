const RAW_DATA_URL = 'https://raw.githubusercontent.com/thedrowned925/marvelrivalsodium/main/data/data.json';
const LOCAL_DATA_URL = './data/data.json';
const nf = new Intl.NumberFormat('tr-TR');
let state = { data:null, filter:'all', search:'', sort:'progress-desc' };

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));

async function fetchJSON(url){
  const sep = url.includes('?') ? '&' : '?';
  const res = await fetch(`${url}${sep}v=${Date.now()}`, {cache:'no-store'});
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadData(isRefresh=false){
  setSync('syncing');
  try{
    state.data = await fetchJSON(RAW_DATA_URL);
  }catch(err){
    console.warn('Raw GitHub veri kaynağına ulaşılamadı, yerel snapshot kullanılıyor.', err);
    state.data = await fetchJSON(LOCAL_DATA_URL);
  }
  renderAll(isRefresh);
  setSync('online');
}

function setSync(mode){
  const pill=$('#syncPill'), text=$('#syncText');
  pill.dataset.mode=mode;
  text.textContent = mode==='online' ? 'CANLI VERİ' : mode==='syncing' ? 'SENKRONİZE EDİLİYOR' : 'BAĞLANTI HATASI';
}

function renderAll(isRefresh=false){
  const d=state.data, s=d.stats;
  $$('[data-stat]').forEach(el=>{
    const key=el.dataset.stat, value=s[key] ?? 0;
    animateNumber(el,value,isRefresh?400:900);
  });
  $('#heroProgress').textContent=`${Number(s.progress).toLocaleString('tr-TR',{maximumFractionDigits:2})}%`;
  $('#heroWorked').textContent=`${nf.format(s.worked)} / ${nf.format(s.totalLines)} satır`;
  $('#progressOrbit').style.setProperty('--p',clamp(s.progress,0,100));
  const updateText = d.generatedAt ? `Son veri değişimi: ${formatDate(d.generatedAt)}` : (d.sourceWorkbookUpdatedText || 'Canlı kaynak bağlı');
  $('#sourceUpdate').textContent=updateText;
  $('#footerSync').textContent=d.generatedAt ? formatDate(d.generatedAt) : 'LIVE';
  ['waiting','recorded','checked','added'].forEach(k=>{
    const pct=s.totalLines ? (s[k]/s.totalLines*100) : 0;
    requestAnimationFrame(()=> $(`[data-bar="${k}"]`).style.width=`${Math.max(pct,k!=='waiting'&&s[k]>0?0.5:0)}%`);
  });
  renderTicker(d);
  renderCharacters();
}

function formatDate(iso){
  const dt=new Date(iso);
  if(Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString('tr-TR',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Istanbul'});
}

function animateNumber(el,target,duration=700){
  const start=performance.now(); const from=Number((el.textContent||'0').replace(/\D/g,''))||0;
  const step=now=>{
    const p=clamp((now-start)/duration,0,1), eased=1-Math.pow(1-p,3);
    el.textContent=nf.format(Math.round(from+(target-from)*eased));
    if(p<1) requestAnimationFrame(step);
  }; requestAnimationFrame(step);
}

function renderTicker(d){
  const active=[...d.characters].filter(c=>c.progress>0).sort((a,b)=>b.progress-a.progress).slice(0,5);
  const pieces=['ODIUM // LIVE TRACKER','MARVEL RIVALS TÜRKÇE DUBLAJ',`${nf.format(d.stats.totalLines)} TOPLAM SATIR`,...active.map(c=>`${c.name.toUpperCase()} %${c.progress}`)];
  const once=pieces.map(x=>`<span>${escapeHTML(x)}</span><b>✦</b>`).join('');
  $('#tickerTrack').innerHTML=once+once;
}

function filteredCharacters(){
  const q=state.search.trim().toLocaleLowerCase('tr-TR');
  let arr=state.data.characters.filter(c=>{
    const filterOK=state.filter==='all'||c.status===state.filter;
    const hay=`${c.name} ${c.voiceActor||''}`.toLocaleLowerCase('tr-TR');
    return filterOK && (!q||hay.includes(q));
  });
  const [key,dir]=state.sort.split('-');
  arr.sort((a,b)=>{
    let v=0;
    if(key==='name') v=a.name.localeCompare(b.name,'tr');
    else v=(a[key]??0)-(b[key]??0);
    return dir==='desc'?-v:v;
  });
  return arr;
}

function statusLabel(s){return s==='Baslamadi'?'Başlamadı':s==='Tamamlandi'?'Tamamlandı':s}
function statusColor(s){return s==='Tamamlandi'?'#d9ff52':s==='Devam Ediyor'?'#52e8ff':'#766b82'}

function renderCharacters(){
  const arr=filteredCharacters(), grid=$('#characterGrid');
  $('#resultCount').textContent=`${arr.length} karakter`;
  $('#emptyState').hidden=arr.length!==0;
  grid.innerHTML=arr.map((c,i)=>`
    <article class="char-card tilt-card" data-name="${escapeAttr(c.name)}" style="--status-color:${statusColor(c.status)}" tabindex="0" role="button" aria-label="${escapeAttr(c.name)} detaylarını aç">
      <span class="char-number">${String(i+1).padStart(2,'0')}</span>
      <div class="char-head"><div><div class="char-name">${escapeHTML(c.name)}</div><div class="status-badge"><i></i>${statusLabel(c.status)}</div></div></div>
      <div class="char-progress-row"><span>${nf.format(c.recorded+c.checked+c.added)} / ${nf.format(c.total)} işlendi</span><strong>%${Number(c.progress).toLocaleString('tr-TR',{maximumFractionDigits:1})}</strong></div>
      <div class="char-bar"><i style="width:${clamp(c.progress,0,100)}%"></i></div>
      <div class="char-meta"><span>SESLENDİREN<br><b>${escapeHTML(c.voiceActor||'Atanmadı')}</b></span><span>TOPLAM<br><b>${nf.format(c.total)} SATIR</b></span></div>
    </article>`).join('');
  setupTilt();
  $$('.char-card').forEach(card=>{
    const open=()=>openModal(card.dataset.name);
    card.addEventListener('click',open);
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
  });
}

function openModal(name){
  const c=state.data.characters.find(x=>x.name===name); if(!c)return;
  const modal=$('#characterModal');
  $('#modalContent').innerHTML=`<div class="modal-inner">
    <span class="modal-kicker">// CHARACTER DOSSIER</span>
    <h3>${escapeHTML(c.name)}</h3>
    <div class="modal-actor">${escapeHTML(c.voiceActor?`Seslendiren: ${c.voiceActor}`:'Seslendirmen henüz atanmadı')}</div>
    <div class="modal-big"><strong>%${Number(c.progress).toLocaleString('tr-TR',{maximumFractionDigits:2})}</strong><span>${nf.format(c.recorded+c.checked+c.added)} / ${nf.format(c.total)} işlenmiş satır</span></div>
    <div class="char-bar"><i style="width:${clamp(c.progress,0,100)}%"></i></div>
    <div class="modal-breakdown">
      <div><small>BEKLİYOR</small><b>${nf.format(c.waiting)}</b></div>
      <div><small>KAYIT</small><b>${nf.format(c.recorded)}</b></div>
      <div><small>KONTROL</small><b>${nf.format(c.checked)}</b></div>
      <div><small>OYUNDA</small><b>${nf.format(c.added)}</b></div>
    </div>
  </div>`;
  modal.showModal();
}

function escapeHTML(v=''){return String(v).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
function escapeAttr(v=''){return escapeHTML(v)}

function setupControls(){
  $('#searchInput').addEventListener('input',e=>{state.search=e.target.value;renderCharacters()});
  $('#sortSelect').addEventListener('change',e=>{state.sort=e.target.value;renderCharacters()});
  $('#filterTabs').addEventListener('click',e=>{
    const btn=e.target.closest('button[data-filter]'); if(!btn)return;
    $$('#filterTabs button').forEach(b=>b.classList.toggle('active',b===btn));
    state.filter=btn.dataset.filter; renderCharacters();
  });
  $('#modalClose').addEventListener('click',()=>$('#characterModal').close());
  $('#characterModal').addEventListener('click',e=>{if(e.target===$('#characterModal')) $('#characterModal').close()});
}

function setupReveal(){
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{
    if(e.isIntersecting){const delay=Number(e.target.dataset.delay||0);setTimeout(()=>e.target.classList.add('visible'),delay);io.unobserve(e.target)}
  }),{threshold:.12});
  $$('.reveal').forEach(el=>io.observe(el));
}

function setupTilt(){
  if(matchMedia('(pointer:coarse)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  $$('.tilt-card').forEach(card=>{
    if(card.dataset.tiltReady)return; card.dataset.tiltReady='1';
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5; const y=(e.clientY-r.top)/r.height-.5;
      const max=card.classList.contains('portal-wrap')?6:2.6;
      card.style.transform=`perspective(900px) rotateX(${-y*max}deg) rotateY(${x*max}deg) translateY(-2px)`;
    });
    card.addEventListener('mouseleave',()=>card.style.transform='');
  });
}

function setupCursor(){
  if(matchMedia('(pointer:coarse)').matches)return;
  const glow=$('#cursorGlow');
  addEventListener('pointermove',e=>{glow.style.left=`${e.clientX}px`;glow.style.top=`${e.clientY}px`},{passive:true});
}

function setupCosmos(){
  const canvas=$('#cosmos'),ctx=canvas.getContext('2d',{alpha:true});
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  let w,h,dpr,stars=[];
  function resize(){dpr=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);const count=Math.min(150,Math.max(55,Math.floor(w*h/12000)));stars=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.3+.2,s:Math.random()*.18+.03,a:Math.random()*.7+.18,t:Math.random()*6.28}))}
  function draw(ts){ctx.clearRect(0,0,w,h);for(const p of stars){p.y-=p.s;if(p.y<-3){p.y=h+3;p.x=Math.random()*w}const a=p.a*(.7+.3*Math.sin(ts*.0015+p.t));ctx.fillStyle=`rgba(210,195,255,${a})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}if(!reduced)requestAnimationFrame(draw)}
  resize();addEventListener('resize',resize);requestAnimationFrame(draw);
}

setupControls();setupReveal();setupCursor();setupCosmos();setupTilt();loadData();
setInterval(()=>loadData(true).catch(()=>setSync('error')),60000);
