/* ODIUM Marvel Rivals — detail artwork only v10 */
(()=>{
const SPECIAL={'The Punisher':'the-punisher','Capt. America':'captain-america','Dr.Strange':'doctor-strange','Mr.Fantastic':'mister-fantastic','Dare Devil':'daredevil','Jeff':'jeff-the-land-shark','Star Lord':'star-lord','Cloak':'cloak-and-dagger','Dagger':'cloak-and-dagger'};
const SPECIAL_DETAIL={'Galacta':'https://cdn2.unrealengine.com/12-marvelrivals-galacta1-3840x2160-82ba52de61fe.png','Jubilee':'https://r.res.easebar.com/pic/20260707/802f69c7-51ce-4b30-b698-ed914603b9ae.png'};
const slug=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const raw=n=>`https://raw.githubusercontent.com/thedrowned925/marvelrivalsodium/main/assets/characters/details/${slug(n)}.webp`;
const prestige=n=>`https://rivalskins.com/wp-content/uploads/marvel-assets/ui/heroes/prestige/${SPECIAL[n]||slug(n)}_prestige.png`;
const fandom=n=>`https://images.weserv.nl/?url=${encodeURIComponent(`https://marvelrivals.fandom.com/wiki/Special:Redirect/file/${n} Prestige Artwork.png`)}&w=1600&h=1600&fit=contain&output=webp&q=92`;
function load(img,list){let i=0;const next=()=>{if(i>=list.length)return;img.onload=()=>{if(img.naturalWidth<80||img.naturalHeight<80)next()};img.onerror=next;img.src=list[i++];};next();}
function decorate(){const h=document.querySelector('#modalContent .vault-head');if(!h)return;const name=h.querySelector('h3')?.textContent?.trim();if(!name||h.dataset.detailV10===name)return;h.dataset.detailV10=name;h.querySelectorAll('.mr-vault-art').forEach(n=>n.remove());const img=document.createElement('img');img.className='mr-vault-art';img.alt='';img.decoding='async';h.appendChild(img);load(img,[raw(name),SPECIAL_DETAIL[name],prestige(name),fandom(name)].filter(Boolean));}
function boot(){decorate();const m=document.querySelector('#modalContent');if(m)new MutationObserver(()=>requestAnimationFrame(decorate)).observe(m,{childList:true,subtree:true});}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
