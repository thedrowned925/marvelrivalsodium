/* ODIUM Marvel Rivals — hover/detail voice playback v10 */
(()=>{
const RAW='https://raw.githubusercontent.com/thedrowned925/marvelrivalsodium/main/assets/audio/';
const slug=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const hoverAudio=new Audio();
const detailAudio=new Audio();
hoverAudio.preload='none';detailAudio.preload='none';
hoverAudio.volume=.9;detailAudio.volume=.95;
let hoverCard=null;
function stopHover(){hoverAudio.pause();try{hoverAudio.currentTime=0}catch{}hoverCard=null;}
function stopDetail(){detailAudio.pause();try{detailAudio.currentTime=0}catch{}}
function playHover(card){const name=card?.dataset?.name||card?.querySelector('.char-name')?.textContent?.trim();if(!name)return;stopHover();hoverCard=card;hoverAudio.src=`${RAW}hover/${slug(name)}.mp3?v=1`;hoverAudio.play().catch(()=>{});}
function playDetail(card){const name=card?.dataset?.name||card?.querySelector('.char-name')?.textContent?.trim();if(!name)return;stopHover();stopDetail();detailAudio.src=`${RAW}detail/${slug(name)}.mp3?v=1`;detailAudio.play().catch(()=>{});}
function bind(card){if(!card||card.dataset.audioV10==='1')return;card.dataset.audioV10='1';card.addEventListener('mouseenter',()=>playHover(card));card.addEventListener('mouseleave',()=>{if(hoverCard===card)stopHover()});card.addEventListener('click',()=>playDetail(card),{capture:true});}
function scan(){document.querySelectorAll('#characterGrid .char-card').forEach(bind);}
function boot(){scan();const grid=document.querySelector('#characterGrid');if(grid)new MutationObserver(()=>requestAnimationFrame(scan)).observe(grid,{childList:true,subtree:true});const modal=document.querySelector('#characterModal');if(modal)modal.addEventListener('close',stopDetail);document.addEventListener('visibilitychange',()=>{if(document.hidden){stopHover();stopDetail();}});window.addEventListener('blur',stopHover);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
