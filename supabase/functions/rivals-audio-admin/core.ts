export const REPO='thedrowned925/marvelrivalsodium';
export const MAX_FILE=10*1024*1024;
export class Fault extends Error {constructor(public status:number,message:string){super(message)}}
export async function sha256(bytes:Uint8Array){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('')}
export function fileType(bytes:Uint8Array){
 const text=(a:number,b:number)=>String.fromCharCode(...bytes.slice(a,b));
 if(bytes.length>=44&&text(0,4)==='RIFF'&&text(8,12)==='WAVE')return {extension:'wav',mime:'audio/wav'};
 if(bytes.length>=16&&(text(0,3)==='ID3'||(bytes[0]===255&&(bytes[1]&224)===224)))return {extension:'mp3',mime:'audio/mpeg'};
 if(bytes.length>=32&&text(0,4)==='OggS')return {extension:'ogg',mime:'audio/ogg'};
 throw new Fault(400,'Geçerli bir WAV, MP3 veya OGG ses dosyası seç.');
}
export function base64(bytes:Uint8Array){const parts=[];for(let i=0;i<bytes.length;i+=8192)parts.push(String.fromCharCode(...bytes.subarray(i,i+8192)));return btoa(parts.join(''))}
export function username(value:unknown){const s=String(value||'').toLowerCase().trim();if(!/^[a-z0-9_]{3,32}$/.test(s))throw new Fault(400,'Kullanıcı adı 3–32 küçük harf, rakam veya alt çizgi içermeli.');return s}
export function password(value:unknown){if(typeof value!=='string'||value.length<12||value.length>128)throw new Fault(400,'Şifre 12–128 karakter olmalı.');return value}
export function safeTrackURL(url:unknown,origin:string){return typeof url==='string'&&url.startsWith(origin+'/storage/v1/object/public/rivals-audio/')}
export async function github(token:string,path:string,body?:unknown,method?:string){
 const r=await fetch('https://api.github.com/repos/'+REPO+path,{method:method||(body?'POST':'GET'),headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(25000)});
 if(!r.ok){if(r.status===409||r.status===422)throw new Fault(409,'GitHub dalı değişti; yeniden dene.');throw new Fault(502,'GitHub bağlantısı başarısız. Anahtarın depo yazma yetkisini kontrol et.')}return r.status===204?{}:await r.json();
}
