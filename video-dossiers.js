/* One muted video per visible dossier. Poster is always the underlying fallback. */
(()=>{
 const cfg=window.ODIUM_ADMIN_CONFIG;if(!cfg||!window.OdiumSupabase)return;
 const client=OdiumSupabase.createClient(cfg.url,cfg.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const rows=new Map(),controllers=new Map();let channel=null,timer=null,loading=false;
 const slug=name=>String(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const valid=row=>row&&typeof row.video_url==='string'&&/^https:\/\/raw\.githubusercontent\.com\/thedrowned925\/marvelrivalsodium\/[a-f0-9]{40}\/assets\/video\/managed\/[a-z0-9-]+\/[a-f0-9-]+\.mp4$/.test(row.video_url)&&Number(row.duration)>0&&Number(row.duration)<=90;
 const event=(el,name)=>el.dispatchEvent(new CustomEvent('odium:video-'+name,{bubbles:true}));
 function destroy(el){const c=controllers.get(el);if(!c)return;clearTimeout(c.deadline);clearTimeout(c.fade);c.video.pause();c.video.removeAttribute('src');c.video.load();c.video.remove();el.classList.remove('is-video-playing');controllers.delete(el)}
 function release(root){for(const el of controllers.keys())if(root===el||root.contains(el)||!el.isConnected)destroy(el)}
 function paused(el){return document.hidden||(!el.classList.contains('is-detail')&&!!document.querySelector('#characterModal[open]'))}
 function finish(el,c){if(c.done)return;c.done=true;clearTimeout(c.deadline);c.video.pause();el.classList.remove('is-video-playing');c.fade=setTimeout(()=>{if(controllers.get(el)!==c)return;c.video.hidden=true;c.video.removeAttribute('src');c.video.load();event(el,'finished')},900)}
 function attach(el){
  if(el.classList.contains('is-detail')&&!el.closest('dialog')?.open)return;
  for(const node of controllers.keys())if(!node.isConnected)destroy(node);
  const row=rows.get(slug(el.dataset.hero));if(!valid(row)||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  if(controllers.get(el)?.url===row.video_url)return;destroy(el);
  const video=document.createElement('video');video.className='dossier-video';video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='metadata';video.setAttribute('aria-hidden','true');video.tabIndex=-1;video.src=row.video_url;
  const c={video,url:row.video_url,duration:Number(row.duration),done:false,deadline:null,fade:null};controllers.set(el,c);el.prepend(video);event(el,'starting');
  video.addEventListener('playing',()=>{if(!c.done){el.classList.add('is-video-playing');clearTimeout(c.deadline);c.deadline=setTimeout(()=>finish(el,c),Math.max(12000,(c.duration-video.currentTime+12)*1000))}});
  video.addEventListener('ended',()=>finish(el,c));video.addEventListener('error',()=>finish(el,c));
  c.deadline=setTimeout(()=>finish(el,c),Math.min(110000,(Number(row.duration)+20)*1000));
  if(!paused(el))video.play().catch(()=>finish(el,c));else clearTimeout(c.deadline);
 }
 function sync(){for(const el of document.querySelectorAll('.dossier-stage')){const c=controllers.get(el),row=rows.get(slug(el.dataset.hero));if(c&&!valid(row)){destroy(el);event(el,'finished')}else attach(el)}}
 function visibility(){for(const [el,c]of controllers){if(c.done)continue;if(paused(el)){c.video.pause();clearTimeout(c.deadline)}else{clearTimeout(c.deadline);c.deadline=setTimeout(()=>finish(el,c),15000);c.video.play().catch(()=>finish(el,c))}}}
 async function load(){if(loading||document.hidden)return;loading=true;try{const {data,error}=await client.from('rivals_character_videos').select('character,video_url,duration');if(!error&&data){rows.clear();for(const row of data)if(valid(row))rows.set(row.character,row);sync()}}catch{}finally{loading=false}}
 function start(){if(channel)return;channel=client.channel('rivals-dossier-videos').on('postgres_changes',{event:'*',schema:'public',table:'rivals_character_videos'},()=>load()).subscribe(s=>{if(s==='SUBSCRIBED')load()});timer=setInterval(load,30000);load();sync()}
 window.DossierVideo={attach,release,visibility,hasActive:root=>[...controllers].some(([el,c])=>root?.contains(el)&&!c.done)};document.addEventListener('visibilitychange',()=>{visibility();load()});window.addEventListener('online',load);window.addEventListener('focus',load);
 window.addEventListener('pagehide',()=>{clearInterval(timer);if(channel)client.removeChannel(channel);channel=null;release(document)});window.addEventListener('pageshow',start);start();
})();
