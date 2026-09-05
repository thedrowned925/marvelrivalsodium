import {createClient} from 'npm:@supabase/supabase-js@2.115.0';
import roster from './roster.json' with {type:'json'};
import {REPO,MAX_FILE,Fault,sha256,fileType,base64,username,password,github} from './core.ts';
const SB_URL=Deno.env.get('SUPABASE_URL')!,KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,ANON=Deno.env.get('SUPABASE_ANON_KEY')!;
const admin=createClient(SB_URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const origin='https://thedrowned925.github.io';
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Cache-Control':'no-store','Content-Type':'application/json','Vary':'Origin'};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
const ok=<T>(result:{data:T,error:unknown}):T=>{if(result.error)throw new Fault(503,'İşlem kaydedilemedi. Lütfen tekrar dene.');return result.data};
const rpc=async(name:string,args:Record<string,unknown>={})=>ok(await admin.rpc(name,args));
async function auth(req:Request){
 const token=req.headers.get('authorization')?.replace(/^Bearer /i,'');if(!token)throw new Fault(401,'Yönetici girişi gerekli.');
 const {data,error}=await admin.auth.getUser(token);if(error||!data.user)throw new Fault(401,'Oturum sona erdi. Yeniden giriş yap.');
 const owner=ok(await admin.from('rivals_admins').select('user_id,username').eq('user_id',data.user.id).maybeSingle());if(!owner)throw new Fault(403,'Yönetici yetkin yok.');
 let claims;try{claims=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))}catch{throw new Fault(401,'Geçersiz oturum.')}
 if(!claims.session_id||!await rpc('rivals_session_valid',{session:claims.session_id,account:data.user.id}))throw new Fault(401,'Oturum kapatılmış. Yeniden giriş yap.');
 return {user:data.user,owner,token};
}
async function limit(req:Request,action:string){const ip=req.headers.get('x-forwarded-for')?.split(',')[0]||'shared';if(!await rpc('rivals_rate_limit',{bucket:await sha256(new TextEncoder().encode(action+':'+ip))}))throw new Fault(429,'Çok fazla deneme yapıldı. Bir dakika sonra tekrar dene.')}
async function login(body:Record<string,unknown>){
 const name=username(body.username);const owner=ok(await admin.from('rivals_admins').select('user_id').eq('username',name).maybeSingle());
 if(!owner)throw new Fault(401,'Kullanıcı adı veya şifre hatalı.');
 const user=await admin.auth.admin.getUserById(owner.user_id);if(!user.data.user?.email)throw new Fault(401,'Kullanıcı adı veya şifre hatalı.');
 const client=createClient(SB_URL,ANON,{auth:{persistSession:false,autoRefreshToken:false}});
 const result=await client.auth.signInWithPassword({email:user.data.user.email,password:String(body.password||'')});
 if(result.error||!result.data.session)throw new Fault(401,'Kullanıcı adı veya şifre hatalı.');
 return {access_token:result.data.session.access_token,refresh_token:result.data.session.refresh_token};
}
async function bootstrap(body:Record<string,unknown>){
 const control=ok(await admin.from('rivals_control').select('bootstrap_hash').eq('id',true).single());
 if(!control.bootstrap_hash||typeof body.code!=='string'||await sha256(new TextEncoder().encode(body.code))!==control.bootstrap_hash)throw new Fault(403,'Kurulum kodu geçersiz veya kullanılmış.');
 const exists=ok(await admin.from('rivals_admins').select('user_id').limit(1));if(exists.length)throw new Fault(409,'Yönetici hesabı zaten oluşturulmuş.');
 const name=username(body.username),pass=password(body.password),email=String(body.email||'').trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Fault(400,'Geçerli bir e-posta yaz.');
 const created=await admin.auth.admin.createUser({email,password:pass,email_confirm:true});
 if(created.error||!created.data.user)throw new Fault(400,'Hesap oluşturulamadı. E-posta bilgilerini kontrol et.');
 const inserted=await admin.from('rivals_admins').insert({user_id:created.data.user.id,username:name});
 if(inserted.error){await admin.auth.admin.deleteUser(created.data.user.id);throw new Fault(409,'Kurulum başka bir istek tarafından tamamlandı.')}
 ok(await admin.from('rivals_control').update({bootstrap_hash:null}).eq('id',true));return {created:true};
}
async function publish(req:Request,owner:{user_id:string}){
 const form=await req.formData(),character=String(form.get('character')||''),job=String(form.get('job')||'');
 if(!Object.hasOwn(roster,character)||!/^[0-9a-f-]{36}$/.test(job))throw new Fault(400,'Geçersiz karakter veya işlem.');
 const oldJob=ok(await admin.from('rivals_audio_jobs').select('*').eq('id',job).maybeSingle());
 if(oldJob){if(oldJob.admin_id!==owner.user_id)throw new Fault(403,'İşlem yetkisi yok.');if(oldJob.status==='published')return {published:true,commit:oldJob.commit_sha};if(oldJob.status==='github_saved'){await rpc('rivals_finish_publish',{job});return {published:true,commit:oldJob.commit_sha}}throw new Fault(409,'Bu işlem zaten işlendi. Yeni bir yükleme başlat.')}
 const token=await rpc('rivals_github_token');if(!token)throw new Fault(400,'Önce Ayarlar bölümünden GitHub bağlantısını tamamla.');
 if(!await rpc('rivals_acquire_lock',{job}))throw new Fault(409,'Başka bir yayın sürüyor. Biraz sonra tekrar dene.');
 const uploaded:string[]=[];let committed=false,referenceAttempted=false;
 try{
  const pending=ok(await admin.from('rivals_audio_jobs').select('id,status,commit_sha').in('status',['github_saved','publishing']));if(pending.some((x:any)=>x.status==='github_saved'||x.commit_sha))throw new Fault(409,'Önce bekleyen yayını tamamla.');
  const tracks=ok(await admin.from('rivals_audio_tracks').select('*'));
  const track:any={...(tracks.find((x:any)=>x.character===character)||{}),character};delete track.commit_sha;delete track.updated_at;
  const files=[];
  for(const kind of ['hover','detail']){
   const file=form.get(kind);if(!(file instanceof File)||!file.size)continue;
   if(file.size>MAX_FILE)throw new Fault(400,'Her ses dosyası en fazla 10 MB olabilir.');
   const bytes=new Uint8Array(await file.arrayBuffer()),type=fileType(bytes),hash=await sha256(bytes),path=`${character}/${kind}-${hash}.${type.extension}`;
   files.push({path:'assets/audio/managed/'+path,bytes,mime:type.mime,storage:path});
   track[kind+'_path']='assets/audio/managed/'+path;track[kind+'_url']=SB_URL+'/storage/v1/object/public/rivals-audio/'+path;
  }
  if(!files.length)throw new Fault(400,'En az bir ses dosyası seç.');
  ok(await admin.from('rivals_audio_jobs').insert({id:job,admin_id:owner.user_id,character,status:'publishing',track}));
  const tree=[];
  for(const file of files){
   const result=await admin.storage.from('rivals-audio').upload(file.storage,file.bytes,{contentType:file.mime,cacheControl:'31536000',upsert:false});
   if(result.error&&!/already exists|duplicate/i.test(result.error.message))throw new Fault(503,'Ses yüklenemedi. Tekrar dene.');if(!result.error)uploaded.push(file.storage);
   const blob=await github(token,'/git/blobs',{content:base64(file.bytes),encoding:'base64'});tree.push({path:file.path,mode:'100644',type:'blob',sha:blob.sha});
  }
  const manifest=Object.fromEntries(tracks.map((x:any)=>[x.character,{hover:x.hover_path,detail:x.detail_path}]));manifest[character]={hover:track.hover_path||null,detail:track.detail_path||null};
  const blob=await github(token,'/git/blobs',{content:JSON.stringify({characters:manifest},null,2)+'\n',encoding:'utf-8'});tree.push({path:'assets/audio/managed-manifest.json',mode:'100644',type:'blob',sha:blob.sha});
  let commit;
  for(let attempt=0;attempt<3;attempt++){
   const ref=await github(token,'/git/ref/heads/main'),parent=await github(token,'/git/commits/'+ref.object.sha);
   const built=await github(token,'/git/trees',{base_tree:parent.tree.sha,tree});
   commit=await github(token,'/git/commits',{message:`audio: publish ${character} from admin panel`,tree:built.sha,parents:[ref.object.sha]});
   ok(await admin.from('rivals_audio_jobs').update({commit_sha:commit.sha,track}).eq('id',job));referenceAttempted=true;
   try{await github(token,'/git/refs/heads/main',{sha:commit.sha,force:false},'PATCH');committed=true;break}catch(error){if(error instanceof Fault&&error.status===409)referenceAttempted=false;if(!(error instanceof Fault)||error.status!==409||attempt===2)throw error}
  }
  ok(await admin.from('rivals_audio_jobs').update({status:'github_saved',commit_sha:commit.sha,track}).eq('id',job));
  await rpc('rivals_finish_publish',{job});return {published:true,commit:commit.sha};
 }catch(error){
  if(!committed&&!referenceAttempted){await admin.from('rivals_audio_jobs').update({status:'failed'}).eq('id',job);if(uploaded.length)await admin.storage.from('rivals-audio').remove(uploaded)}
  if(committed||referenceAttempted)throw new Fault(503,'GitHub kaydı tamamlandı; canlı yayın onayı bekliyor. Bekleyen yayını tamamla düğmesini kullan.');throw error;
 }finally{await rpc('rivals_release_lock',{job}).catch(()=>{})}
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers});
 if(req.method!=='POST')return reply({error:'POST gerekli.'},405);
 if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply({error:'İzin verilmeyen kaynak.'},403);
 if(Number(req.headers.get('content-length')||0)>22*1024*1024)return reply({error:'Dosyalar çok büyük.'},413);
 const action=new URL(req.url).searchParams.get('action');
 try{
  if(action==='login'||action==='bootstrap'){await limit(req,action);const body=await req.json();return reply(action==='login'?await login(body):await bootstrap(body))}
  const {user,owner,token}=await auth(req);
  if(action==='status'){const key=await rpc('rivals_github_token');return reply({username:owner.username,githubConnected:!!key,tracks:ok(await admin.from('rivals_audio_tracks').select('*')),jobs:ok(await admin.from('rivals_audio_jobs').select('id,character,status,commit_sha,created_at').eq('admin_id',user.id).order('created_at',{ascending:false}).limit(5))})}
  if(action==='github'){
   const body=await req.json(),key=String(body.token||'').trim();if(key.length<20||key.length>500)throw new Fault(400,'Geçerli bir GitHub anahtarı gir.');
   const repo=await github(key,'');if(!repo.permissions?.push)throw new Fault(403,'Bu anahtarın depoya yazma yetkisi yok.');
   await github(key,'/git/blobs',{content:'ODIUM audio publisher permission check',encoding:'utf-8'});
   await rpc('rivals_save_github_token',{token:key});return reply({connected:true});
  }
  if(action==='publish')return reply(await publish(req,owner));
  if(action==='retry'){
   const body=await req.json(),job=ok(await admin.from('rivals_audio_jobs').select('id,status,commit_sha').eq('id',body.job).eq('admin_id',user.id).single());
   if(!job.commit_sha||!['github_saved','publishing'].includes(job.status))throw new Fault(409,'Tamamlanabilecek bir yayın bulunamadı.');
   if(!await rpc('rivals_acquire_lock',{job:job.id}))throw new Fault(409,'Başka bir yayın sürüyor.');
   try{
    if(job.status==='publishing'){const key=await rpc('rivals_github_token');const comparison=await github(key,'/compare/'+job.commit_sha+'...main');if(!['ahead','identical'].includes(comparison.status)){ok(await admin.from('rivals_audio_jobs').update({status:'failed'}).eq('id',job.id));throw new Fault(409,'GitHub kaydı uygulanmamış. Dosyaları yeniden yükleyebilirsin.')}ok(await admin.from('rivals_audio_jobs').update({status:'github_saved'}).eq('id',job.id))}
    await rpc('rivals_finish_publish',{job:job.id})}finally{await rpc('rivals_release_lock',{job:job.id})}return reply({published:true,commit:job.commit_sha});
  }
  if(action==='account'){
   const body=await req.json();
   if(body.password){const {error}=await admin.auth.admin.updateUserById(user.id,{password:password(body.password)});if(error)throw new Fault(400,'Şifre değiştirilemedi.')}
   if(body.username)ok(await admin.from('rivals_admins').update({username:username(body.username)}).eq('user_id',user.id));return reply({updated:true});
  }
  throw new Fault(404,'İşlem bulunamadı.');
 }catch(error){return reply({error:error instanceof Fault?error.message:'İşlem tamamlanamadı. Bağlantını kontrol edip tekrar dene.'},error instanceof Fault?error.status:500)}
});
