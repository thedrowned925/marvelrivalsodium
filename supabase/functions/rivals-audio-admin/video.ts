import {Fault,github,base64,REPO} from './core.ts';
export const MAX_VIDEO=25*1024*1024;
// Validate ISO BMFF boxes and the actual AVC visual sample entry, not a filename or client metadata.
export function inspectVideo(bytes:Uint8Array){
 if(bytes.length<32||bytes.length>MAX_VIDEO)throw new Fault(400,'Video en fazla 25 MB olabilir.');
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),str=(p:number,n=4)=>String.fromCharCode(...bytes.subarray(p,p+n));
 type Box={type:string,start:number,end:number};
 function boxes(start:number,end:number):Box[]{const out:Box[]=[];for(let p=start;p<end;){if(p+8>end)throw new Fault(400,'MP4 dosyası eksik.');let size=v.getUint32(p),head=8;if(size===1){if(p+16>end)throw new Fault(400,'Geçersiz MP4.');size=Number(v.getBigUint64(p+8));head=16}if(size===0)size=end-p;if(size<head||p+size>end||!Number.isSafeInteger(size))throw new Fault(400,'Geçersiz MP4 boyutu.');out.push({type:str(p+4),start:p+head,end:p+size});p+=size;if(out.length>10000)throw new Fault(400,'MP4 yapısı çok karmaşık.')}return out}
 const find=(parent:Box,type:string)=>boxes(parent.start,parent.end).find(b=>b.type===type);
 const top=boxes(0,bytes.length),moov=top.find(b=>b.type==='moov');if(!moov||!top.some(b=>b.type==='ftyp')||!top.some(b=>b.type==='mdat'&&b.end>b.start))throw new Fault(400,'MP4 (H.264) video seç.');
 const header=find(moov,'mvhd');if(!header)throw new Fault(400,'Video süresi okunamadı.');const version=bytes[header.start],offset=header.start+(version===1?20:12);if(version>1||offset+(version===1?12:8)>header.end)throw new Fault(400,'Geçersiz video süresi.');const scale=v.getUint32(offset),ticks=version===1?Number(v.getBigUint64(offset+4)):v.getUint32(offset+4),duration=ticks/scale;
 if(!Number.isFinite(duration)||duration<=0||duration>90)throw new Fault(400,'Video 90 saniyeden kısa olmalı.');
 let width=0,height=0,videoTracks=0;
 for(const trak of boxes(moov.start,moov.end).filter(b=>b.type==='trak')){const mdia=find(trak,'mdia');if(!mdia)continue;const hdlr=find(mdia,'hdlr');if(!hdlr||hdlr.start+12>hdlr.end||str(hdlr.start+8)!=='vide')continue;videoTracks++;const minf=find(mdia,'minf'),stbl=minf&&find(minf,'stbl'),stsd=stbl&&find(stbl,'stsd');if(!stsd||stsd.start+8>stsd.end)throw new Fault(400,'Video kodeği okunamadı.');const entries=boxes(stsd.start+8,stsd.end);if(entries.length!==1||!['avc1','avc3'].includes(entries[0].type))throw new Fault(400,'Tarayıcı uyumu için MP4 / H.264 olarak dışa aktar.');const e=entries[0];if(e.start+28>e.end)throw new Fault(400,'Video boyutları okunamadı.');width=v.getUint16(e.start+24);height=v.getUint16(e.start+26)}
 if(videoTracks!==1||width!==1920||height!==1080)throw new Fault(400,'Video yatay 1920 × 1080 piksel olmalı.');return {width,height,duration};
}
export async function videoAction(action:string,body:any,owner:any,admin:any,roster:any,_url:string){
 const checked=(r:any)=>{if(r.error)throw new Fault(503,'Video işlemi kaydedilemedi. Tekrar dene.');return r.data};
 const rpc=async(name:string,args:any={})=>checked(await admin.rpc(name,args));
 const token=await rpc('rivals_github_token');if(!token)throw new Fault(400,'Önce GitHub bağlantısını tamamla.');
 if(action==='video_prepare'){
  const character=String(body.character||'');if(!Object.hasOwn(roster,character)||!Number.isInteger(body.size)||body.size<32||body.size>MAX_VIDEO)throw new Fault(400,'Geçerli karakter ve en fazla 25 MB video seç.');
  const id=crypto.randomUUID(),path=character+'/'+id+'.mp4';checked(await admin.from('rivals_video_uploads').insert({id,admin_id:owner.user_id,character,path}));
  const signed=checked(await admin.storage.from('rivals-video-uploads').createSignedUploadUrl(path));return {id,path,token:signed.token};
 }
 if(action!=='video_publish')throw new Fault(404,'Video işlemi bulunamadı.');
 if(!/^[a-f0-9-]{36}$/.test(String(body.id)))throw new Fault(400,'Geçersiz yükleme.');
 const job=checked(await admin.from('rivals_video_uploads').select('*').eq('id',body.id).eq('admin_id',owner.user_id).maybeSingle());if(!job)throw new Fault(404,'Yükleme bulunamadı.');if(job.status==='published')return {published:true,commit:job.commit_sha};if(job.status==='failed')throw new Fault(409,'Bu yükleme tamamlanamadı. Dosyayı yeniden seç.');
 if(!await rpc('rivals_acquire_lock',{job:job.id}))throw new Fault(409,'Başka bir yayın sürüyor. Biraz sonra tekrar dene.');
 let committed=job.status==='github_saved',attempted=false;
 const publish=async()=>{const url='https://raw.githubusercontent.com/'+REPO+'/'+job.commit_sha+'/assets/video/managed/'+job.path;await rpc('rivals_finish_video',{job:job.id,account:owner.user_id,url,seconds:job.duration});await admin.storage.from('rivals-video-uploads').remove([job.path]);return {published:true,commit:job.commit_sha}};
 try{
  if(committed)return await publish();
  if(job.status==='publishing'&&job.commit_sha){
   const comparison=await github(token,'/compare/'+job.commit_sha+'...main');if(['ahead','identical'].includes(comparison.status)){committed=true;checked(await admin.from('rivals_video_uploads').update({status:'github_saved'}).eq('id',job.id));return await publish()}
  }
  const pending=checked(await admin.from('rivals_video_uploads').select('id,status,commit_sha').neq('id',job.id).in('status',['publishing','github_saved']));if(pending.some((x:any)=>x.status==='github_saved'||x.commit_sha))throw new Fault(409,'Önce bekleyen video yayınını tamamla.');
  const file=checked(await admin.storage.from('rivals-video-uploads').download(job.path));const bytes=new Uint8Array(await file.arrayBuffer());let meta;try{meta=inspectVideo(bytes)}catch(e){await admin.from('rivals_video_uploads').update({status:'failed'}).eq('id',job.id);await admin.storage.from('rivals-video-uploads').remove([job.path]);throw e}job.duration=meta.duration;
  checked(await admin.from('rivals_video_uploads').update({status:'publishing',duration:meta.duration}).eq('id',job.id));
  const videoBlob=await github(token,'/git/blobs',{content:base64(bytes),encoding:'base64'}),path='assets/video/managed/'+job.path;
  const tracks=checked(await admin.from('rivals_character_videos').select('character,video_path,duration'));
  const manifest=Object.fromEntries(tracks.map((x:any)=>[x.character,{path:'assets/video/managed/'+x.video_path,duration:x.duration}]));manifest[job.character]={path,duration:meta.duration};
  const manifestBlob=await github(token,'/git/blobs',{content:JSON.stringify({characters:manifest},null,2)+'\n',encoding:'utf-8'});
  for(let attempt=0;attempt<3;attempt++){
   const ref=await github(token,'/git/ref/heads/main'),parent=await github(token,'/git/commits/'+ref.object.sha);
   const tree=await github(token,'/git/trees',{base_tree:parent.tree.sha,tree:[{path,mode:'100644',type:'blob',sha:videoBlob.sha},{path:'assets/video/managed-manifest.json',mode:'100644',type:'blob',sha:manifestBlob.sha}]});
   const commit=await github(token,'/git/commits',{message:'video: publish '+job.character+' from admin panel',tree:tree.sha,parents:[ref.object.sha]});job.commit_sha=commit.sha;
   checked(await admin.from('rivals_video_uploads').update({commit_sha:commit.sha}).eq('id',job.id));attempted=true;
   try{await github(token,'/git/refs/heads/main',{sha:commit.sha,force:false},'PATCH');committed=true;break}catch(e){if(e instanceof Fault&&e.status===409)attempted=false;if(!(e instanceof Fault)||e.status!==409||attempt===2)throw e}
  }
  checked(await admin.from('rivals_video_uploads').update({status:'github_saved'}).eq('id',job.id));return await publish();
 }catch(e){
  if(committed||attempted)throw new Fault(503,'GitHub yayın onayı bekliyor. Bekleyen video yayınını tamamla düğmesine bas.');
  throw e;
 }finally{await rpc('rivals_release_lock',{job:job.id}).catch(()=>{})}
}
