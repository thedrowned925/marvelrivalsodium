/* Accurate 1920×1080 character posters. Pure canvas renderer, also usable for QA. */
(function(root){
 const W=1920,H=1080,heading='RivalsDisplay, RivalsBody, sans-serif',body='RivalsBody, sans-serif';
 const fmt=n=>Number(n||0).toLocaleString('tr-TR');
 function font(ctx,size,family=body){ctx.font=`${size}px ${family}`;ctx.textBaseline='top'}
 function text(ctx,s,x,y,size,color='#f7f3e9',family=heading){font(ctx,size,family);ctx.fillStyle=color;ctx.fillText(String(s),x,y)}
 function lines(ctx,value,width){let words=String(value).split(/\s+/),out=[],row='';for(const word of words){const next=row?row+' '+word:word;if(ctx.measureText(next).width>width&&row){out.push(row);row=word}else row=next}if(row)out.push(row);return out;}
 function fit(ctx,value,width,maxSize,minSize,family,maxLines){let size=maxSize,list;do{font(ctx,size,family);list=lines(ctx,value,width);if(list.length<=maxLines&&list.every(x=>ctx.measureText(x).width<=width))break;size-=2}while(size>=minSize);return{size:Math.max(size,minSize),lines:list};}
 function paragraph(ctx,value,x,y,width,size=24,color='#b8c2d4',lineHeight=1.45,family=body){font(ctx,size,family);ctx.fillStyle=color;const list=lines(ctx,value,width);list.forEach((s,i)=>ctx.fillText(s,x,y+i*size*lineHeight));return list.length*size*lineHeight;}
 function cover(ctx,image,x,y,w,h){if(!image)return;const ratio=Math.max(w/image.width,h/image.height),iw=image.width*ratio,ih=image.height*ratio;ctx.drawImage(image,x+(w-iw)/2,y+(h-ih)/2,iw,ih)}
 function contain(ctx,image,x,y,w,h){if(!image)return;const ratio=Math.min(w/image.width,h/image.height);ctx.drawImage(image,x+(w-image.width*ratio)/2,y+(h-image.height*ratio)/2,image.width*ratio,image.height*ratio)}
 function polygon(ctx,points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill()}
 function line(ctx,x,y,w,color='#ffffff30'){ctx.fillStyle=color;ctx.fillRect(x,y,w,1)}
 function diamond(ctx,x,y,no){ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle='#101525';ctx.strokeStyle='#ffda29';ctx.lineWidth=2;ctx.fillRect(-34,-34,68,68);ctx.strokeRect(-34,-34,68,68);ctx.restore();text(ctx,no,x-14,y-19,32,'#fff');polygon(ctx,[[x-26,y+49],[x+32,y+49],[x+26,y+75],[x-32,y+75]],'#ffda29');text(ctx,no,x-9,y+51,21,'#101724')}
 function paint(canvas,payload,assets){
  canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');const c=payload.character,d=payload.data||{},s=d.summary||c,p=payload.profile;
  const worked=s.worked??((s.recorded||0)+(s.checked||0)+(s.added||0)),total=Number(s.total||0),progress=Number(s.progress||0),actor=d.voiceActor||c.voiceActor||'Henüz atanmadı';
  ctx.fillStyle='#141b31';ctx.fillRect(0,0,W,H);ctx.save();ctx.globalAlpha=.3;cover(ctx,assets.scene,0,0,W,H);ctx.restore();
  let bg=ctx.createLinearGradient(650,0,W,H);bg.addColorStop(0,'#1a254888');bg.addColorStop(1,'#0b1227ee');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  polygon(ctx,[[0,0],[535,0],[698,H],[222,H],[0,570]],p.color||'#b53a3c');polygon(ctx,[[509,0],[521,0],[675,H],[663,H]],'#11172866');
  if(assets.emblem){ctx.save();ctx.globalAlpha=.24;contain(ctx,assets.emblem,55,40,485,485);ctx.restore()}
  ctx.save();ctx.shadowColor='#03071360';ctx.shadowBlur=30;contain(ctx,assets.portrait,12,90,665,860);ctx.restore();
  let fade=ctx.createLinearGradient(0,700,0,H);fade.addColorStop(0,'#0d122200');fade.addColorStop(1,'#0a1124dd');ctx.fillStyle=fade;ctx.fillRect(0,700,700,380);
  text(ctx,'MARVEL RIVALS / TÜRKÇE DUBLAJ',68,796,20,'#ffffffb8',body);
  const title=fit(ctx,p.name.toUpperCase(),580,78,44,heading,2);title.lines.forEach((v,i)=>text(ctx,v,65,833+i*title.size*1.02,title.size));
  const st=s.status==='Tamamlandi'?'TAMAMLANDI':s.status==='Devam Ediyor'?'DEVAM EDİYOR':'KAYIT BEKLİYOR';
  ctx.fillStyle='#0d1328d9';ctx.fillRect(68,1010,310,38);ctx.fillStyle='#ffda29';ctx.fillRect(68,1010,5,38);text(ctx,st,87,1017,23,'#f6ebc2');
  text(ctx,'SESLENDİRME DOSYASI',748,75,35);line(ctx,748,130,433);
  text(ctx,'TÜRKÇE SESİ',748,174,22,'#ffda29',body);
  const voice=fit(ctx,actor,440,42,26,heading,2);voice.lines.forEach((v,i)=>text(ctx,v,748,220+i*voice.size*1.14,voice.size));
  text(ctx,'ODIUM Studios',748,338,22,'#aab7ca',body);
  line(ctx,748,398,433);text(ctx,'ÜRETİM İLERLEMESİ',748,432,26,'#e1e3df');text(ctx,'%'+progress.toLocaleString('tr-TR',{maximumFractionDigits:1}),748,489,100,'#ffda29');
  ctx.fillStyle='#ffffff23';ctx.fillRect(748,606,433,10);ctx.fillStyle='#ffda29';ctx.fillRect(748,606,433*Math.min(100,Math.max(0,progress))/100,10);
  text(ctx,fmt(worked)+' / '+fmt(total)+' replik işlendi',748,640,25,'#c0cad8',body);line(ctx,748,704,433);
  text(ctx,'TOPLAM REPLİK',748,743,20,'#adb9cb',body);text(ctx,fmt(total),748,784,57);text(ctx,'İŞLENEN REPLİK',982,743,20,'#adb9cb',body);text(ctx,fmt(worked),982,784,57);
  paragraph(ctx,'İşlenen replikler; kaydı alınan, kontrol edilen ve oyuna eklenen satırların toplamıdır.',748,892,440,21,'#a6b2c6');
  text(ctx,'KAYITTAN OYUNA',1290,75,35);line(ctx,1290,130,560);
  const defs=[['recorded','KAYIT ALINDI','Ses kaydı tamamlanan replikler.'],['checked','KONTROL EDİLDİ','Kalite kontrolünden geçen kayıtlar.'],['added','OYUNA EKLENDİ','Oyun paketine entegre edilen sesler.'],['waiting','SIRADAKİ REPLİKLER','Henüz kayıt bekleyen replikler.']];
  defs.forEach(([key,label,desc],i)=>{const y=215+i*182;diamond(ctx,1328,y+15,String(i+1).padStart(2,'0'));text(ctx,label,1410,y-8,29,i===0?'#ffda29':'#f6f3ed');paragraph(ctx,desc,1410,y+41,330,22,'#aebcd0');font(ctx,45,heading);const val=fmt(s[key]);text(ctx,val,1847-ctx.measureText(val).width,y-8,45,'#f6df8d');ctx.fillStyle='#ffffff1a';ctx.fillRect(1410,y+111,435,3);ctx.fillStyle='#ffda29';ctx.fillRect(1410,y+111,435*Math.min(1,total?Number(s[key]||0)/total:0),3)});
  line(ctx,748,1005,1102);const date=new Date(d.generatedAt||payload.generatedAt);const stamp=Number.isNaN(date.getTime())?'':'VERİ TARİHİ / '+date.toLocaleString('tr-TR',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Istanbul'});
  text(ctx,stamp,748,1030,18,'#8c9db2',body);font(ctx,24,heading);text(ctx,'ODIUM / TÜRKÇE DUBLAJ',1850-ctx.measureText('ODIUM / TÜRKÇE DUBLAJ').width,1027,24,'#e0d6b6');
  return canvas;
 }
 const load=(src,required=false)=>new Promise((resolve,reject)=>{if(!src)return required?reject(Error('Karakter görseli bulunamadı')):resolve(null);const im=new Image();const timer=setTimeout(()=>done(null),10000);function done(value){clearTimeout(timer);im.onload=im.onerror=null;if(!value&&required)reject(Error('Görsel yüklenemedi'));else resolve(value)}im.onload=()=>done(im);im.onerror=()=>done(null);im.src=src;});
 async function download(character,data,generatedAt){
  const profile=root.HERO_DESIGN?.[character.name];if(!profile)throw Error('Karakter tasarımı bulunamadı');
  await Promise.all([document.fonts.load('30px RivalsDisplay'),document.fonts.load('20px RivalsBody')]);
  const [portrait,emblem,scene]=await Promise.all([load(profile.portrait,true).catch(()=>load(profile.card,true)),load(profile.emblem),load('assets/design/multiverse.webp')]);
  const canvas=paint(document.createElement('canvas'),{character,data,generatedAt,profile},{portrait,emblem,scene});
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG oluşturulamadı')),'image/png'));
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='odium-'+character.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-dublaj.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 const api={paint,download};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PosterRenderer=api;
})(typeof window!=='undefined'?window:globalThis);
