/* Live managed audio overlays existing bundled voice clips. */
(()=>{
 const cfg=window.ODIUM_ADMIN_CONFIG;if(!cfg||!window.OdiumSupabase)return;
 const client=OdiumSupabase.createClient(cfg.url,cfg.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:4}}});
 const rows=new Map();let loading=false;
 const valid=url=>typeof url==='string'&&url.startsWith(cfg.url+'/storage/v1/object/public/rivals-audio/');
 function apply(row){if(!row?.character)return;rows.set(row.character,{hover:valid(row.hover_url)?row.hover_url:null,detail:valid(row.detail_url)?row.detail_url:null});window.OdiumAudio?.setTracks(Object.fromEntries(rows))}
 async function load(){if(loading||document.hidden)return;loading=true;try{const {data,error}=await client.from('rivals_audio_tracks').select('character,hover_url,detail_url');if(!error&&data){rows.clear();data.forEach(apply);window.OdiumAudio?.setTracks(Object.fromEntries(rows))}}catch{}finally{loading=false}}
 let channel=null,timer=null;
 function start(){if(channel)return;channel=client.channel('rivals-public-audio').on('postgres_changes',{event:'*',schema:'public',table:'rivals_audio_tracks'},payload=>{if(payload.eventType==='DELETE'){rows.delete(payload.old.character);window.OdiumAudio?.setTracks(Object.fromEntries(rows))}else apply(payload.new)}).subscribe(status=>{if(status==='SUBSCRIBED')load()});timer=setInterval(load,30000);load()}
 window.addEventListener('online',load);window.addEventListener('focus',load);document.addEventListener('visibilitychange',load);window.addEventListener('pagehide',()=>{clearInterval(timer);if(channel)client.removeChannel(channel);channel=null});window.addEventListener('pageshow',start);start();
})();
