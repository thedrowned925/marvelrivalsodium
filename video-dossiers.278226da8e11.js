/* Audible dossier videos with visitor-controlled volume and detail-audio sequencing. */
(()=>{
 const cfg=window.ODIUM_ADMIN_CONFIG;if(!cfg||!window.OdiumSupabase)return;
 const client=OdiumSupabase.createClient(cfg.url,cfg.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const rows=new Map(),controllers=new Map();let channel=null,timer=null,loading=false,loadedOnce=false,pendingDetail=null;
 const VOLUME_KEY='odium-video-volume';
 const STYLE='.dossier-video-volume{position:absolute;right:24px;bottom:84px;z-index:8;display:flex;align-items:center;gap:10px;padding:9px 12px;background:#090d17d9;border:1px solid #ffffff2b;backdrop-filter:blur(10px);font:12px RivalsBody,Inter,sans-serif;letter-spacing:.08em;color:#f4f3ea;box-shadow:0 10px 28px #0006}.dossier-video-volume[hidden]{display:none}.dossier-video-volume span{color:#ffda29;font-family:RivalsDisplay,RivalsBody,Oswald,sans-serif;font-size:14px}.dossier-video-volume b{min-width:34px;text-align:right;font-weight:600;letter-spacing:0;color:#fff}.dossier-video-volume input[type=range]{width:112px;accent-color:#ffda29;cursor:pointer}@media(max-width:620px){.dossier-video-volume{right:14px;bottom:70px;padding:8px 10px}.dossier-video-volume input[type=range]{width:86px}}';
 if(!document.getElementById('odium-video-volume-style')){const style=document.createElement('style');style.id='odium-video-volume-style';style.textContent=STYLE;document.head.append(style)}
 const slug=name=>String(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const valid=row=>row&&typeof row.video_url==='string'&&/^https:\/\/raw\.githubusercontent\.com\/thedrowned925\/marvelrivalsodium\/[a-f0-9]{40}\/assets\/video\/managed\/[a-z0-9-]+\/[a-f0-9-]+\.mp4$/.test(row.video_url)&&Number(row.duration)>0&&Number(row.duration)<=90;
 const event=(el,name)=>el.dispatchEvent(new CustomEvent('odium:video-'+name,{bubbles:true}));
 const clamp=v=>Math.min(1,Math.max(0,Number(v)||0));
 let volume=(()=>{try{const saved=localStorage.getItem(VOLUME_KEY);return saved===null?.9:clamp(saved)}catch{return .9}})();
 function saveVolume(){try{localStorage.setItem(VOLUME_KEY,String(volume))}catch{}}
 function setAllVolume(value,unmute=true){volume=clamp(value);saveVolume();for(const c of controllers.values()){c.video.volume=volume;if(unmute)c.video.muted=volume===0;c.range.value=String(volume);c.value.textContent=Math.round(volume*100)+'%'}}
 function volumeControl(c){
  const box=document.createElement('label');box.className='dossier-video-volume';box.setAttribute('aria-label','Video ses seviyesi');
  const title=document.createElement('span');title.textContent='SES';
  const range=document.createElement('input');range.type='range';range.min='0';range.max='1';range.step='.05';range.value=String(volume);range.setAttribute('aria-label','Video ses seviyesi');
  const value=document.createElement('b');value.textContent=Math.round(volume*100)+'%';
  box.append(title,range,value);c.range=range;c.value=value;c.control=box;
  const update=e=>{e.stopPropagation();setAllVolume(range.value,true);if(volume>0){c.video.muted=false;c.video.play().catch(()=>{})}};
  range.addEventListener('input',update);range.addEventListener('change',update);box.addEventListener('click',e=>e.stopPropagation());box.addEventListener('pointerdown',e=>e.stopPropagation());
  return box;
 }
 function destroy(el){const c=controllers.get(el);if(!c)return;clearTimeout(c.deadline);clearTimeout(c.fade);c.video.pause();c.video.removeAttribute('src');c.video.load();c.video.remove();c.control?.remove();el.classList.remove('is-video-playing');controllers.delete(el)}
 function release(root){for(const el of [...controllers.keys()])if(root===el||root.contains(el)||!el.isConnected)destroy(el)}
 function paused(el){return document.hidden||(!el.classList.contains('is-detail')&&!!document.querySelector('#characterModal[open]'))}
 function flushDetail(el){if(!pendingDetail||!el?.classList.contains('is-detail'))return;const key=slug(el.dataset.hero);if(key!==pendingDetail.key)return;const name=pendingDetail.name;pendingDetail=null;if(el.isConnected&&el.closest('dialog')?.open)window.OdiumAudio?.playNow?.(name)}
 function finish(el,c){if(c.done)return;c.done=true;clearTimeout(c.deadline);c.video.pause();el.classList.remove('is-video-playing');c.fade=setTimeout(()=>{if(controllers.get(el)!==c)return;c.video.hidden=true;c.control.hidden=true;c.video.removeAttribute('src');c.video.load();event(el,'finished');flushDetail(el)},900)}
 async function startPlayback(el,c){
  if(paused(el))return;
  c.video.muted=volume===0;c.video.volume=volume;
  try{await c.video.play()}
  catch{
   c.video.muted=true;
   try{await c.video.play()}catch{finish(el,c)}
  }
 }
 function attach(el){
  if(el.classList.contains('is-detail')&&!el.closest('dialog')?.open)return;
  for(const node of [...controllers.keys()])if(!node.isConnected)destroy(node);
  const key=slug(el.dataset.hero),row=rows.get(key);
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(!valid(row)||reduced){if((loadedOnce||reduced)&&el.classList.contains('is-detail')&&pendingDetail?.key===key){const name=pendingDetail.name;pendingDetail=null;window.OdiumAudio?.playNow?.(name)}return;}
  if(controllers.get(el)?.url===row.video_url)return;destroy(el);
  const video=document.createElement('video');video.className='dossier-video';video.muted=volume===0;video.defaultMuted=false;video.volume=volume;video.playsInline=true;video.preload='metadata';video.setAttribute('aria-hidden','true');video.tabIndex=-1;video.src=row.video_url;
  const c={video,url:row.video_url,duration:Number(row.duration),done:false,deadline:null,fade:null,control:null,range:null,value:null};controllers.set(el,c);el.prepend(video);el.append(volumeControl(c));event(el,'starting');
  video.addEventListener('playing',()=>{if(!c.done){c.control.hidden=false;el.classList.add('is-video-playing');clearTimeout(c.deadline);c.deadline=setTimeout(()=>finish(el,c),Math.max(12000,(c.duration-video.currentTime+12)*1000))}});
  video.addEventListener('ended',()=>finish(el,c));video.addEventListener('error',()=>finish(el,c));
  c.deadline=setTimeout(()=>finish(el,c),Math.min(110000,(Number(row.duration)+20)*1000));
  startPlayback(el,c);
 }
 function sync(){for(const el of document.querySelectorAll('.dossier-stage')){const c=controllers.get(el),row=rows.get(slug(el.dataset.hero));if(c&&!valid(row)){destroy(el);event(el,'finished')}else attach(el)}}
 function visibility(){for(const [el,c]of controllers){if(c.done)continue;if(paused(el)){c.video.pause();clearTimeout(c.deadline)}else{clearTimeout(c.deadline);c.deadline=setTimeout(()=>finish(el,c),15000);startPlayback(el,c)}}}
 function resolvePendingAfterLoad(){if(!pendingDetail||!loadedOnce)return;const row=rows.get(pendingDetail.key);if(valid(row)){const stage=[...document.querySelectorAll('#characterModal .dossier-stage.is-detail')].find(el=>slug(el.dataset.hero)===pendingDetail.key);if(stage)attach(stage);return;}const name=pendingDetail.name;pendingDetail=null;window.OdiumAudio?.playNow?.(name)}
 function queueDetailAudio(name){const key=slug(name);if(!key)return false;if(loadedOnce&&!valid(rows.get(key)))return false;pendingDetail={key,name};if(loadedOnce){const stage=[...document.querySelectorAll('#characterModal .dossier-stage.is-detail')].find(el=>slug(el.dataset.hero)===key);if(stage)attach(stage)}return true}
 async function load(){if(loading||document.hidden)return;loading=true;try{const {data,error}=await client.from('rivals_character_videos').select('character,video_url,duration');if(!error&&data){rows.clear();for(const row of data)if(valid(row))rows.set(row.character,row);sync()}}catch{}finally{loadedOnce=true;loading=false;resolvePendingAfterLoad()}}
 function unlockSound(){if(volume<=0)return;for(const [el,c] of controllers){if(c.done)continue;c.video.muted=false;c.video.volume=volume;if(!paused(el)&&c.video.paused)c.video.play().catch(()=>{})}}
 function start(){if(channel)return;channel=client.channel('rivals-dossier-videos').on('postgres_changes',{event:'*',schema:'public',table:'rivals_character_videos'},()=>load()).subscribe(s=>{if(s==='SUBSCRIBED')load()});timer=setInterval(load,30000);load();sync()}
 window.DossierVideo={attach,release,visibility,queueDetailAudio,hasActive:root=>[...controllers].some(([el,c])=>root?.contains(el)&&!c.done)};
 document.querySelector('#characterModal')?.addEventListener('close',()=>{pendingDetail=null});
 document.addEventListener('pointerdown',unlockSound,{capture:true});document.addEventListener('keydown',unlockSound,{capture:true});document.addEventListener('visibilitychange',()=>{visibility();load()});window.addEventListener('online',load);window.addEventListener('focus',load);
 window.addEventListener('pagehide',()=>{clearInterval(timer);if(channel)client.removeChannel(channel);channel=null;pendingDetail=null;release(document)});window.addEventListener('pageshow',start);start();
})();
