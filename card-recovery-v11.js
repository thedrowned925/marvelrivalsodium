/* ODIUM Marvel Rivals — stable card artwork recovery v11.4 */
(()=>{
const VER='11.4';
const SPECIAL={'The Punisher':'the-punisher','Capt. America':'captain-america','Dr.Strange':'doctor-strange','Mr.Fantastic':'mister-fantastic','Dare Devil':'daredevil','Jeff':'jeff-the-land-shark','Star Lord':'star-lord','Cloak':'cloak-and-dagger','Dagger':'cloak-and-dagger'};
const PARTNER={'The Punisher':'punisher','Capt. America':'captain-america','Dr.Strange':'doctor-strange','Mr.Fantastic':'mister-fantastic','Dare Devil':'daredevil','Jeff':'jeff','Star Lord':'star-lord','Cloak':'cloak-dagger','Dagger':'cloak-dagger'};
const SPECIAL_DETAIL={'Galacta':'https://cdn2.unrealengine.com/12-marvelrivals-galacta1-3840x2160-82ba52de61fe.png','Jubilee':'https://r.res.easebar.com/pic/20260707/802f69c7-51ce-4b30-b698-ed914603b9ae.png'};
const slug=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const assetSlug=n=>SPECIAL[n]||slug(n);
const raw=(n,type)=>`https://raw.githubusercontent.com/thedrowned925/marvelrivalsodium/main/assets/characters/${type}/${slug(n)}.webp`;
const partner=n=>`https://rivals.b-cdn.net/images/heroes/${PARTNER[n]||slug(n)}/header.webp`;
const prestige=n=>`https://rivalskins.com/wp-content/uploads/marvel-assets/ui/heroes/prestige/${assetSlug(n)}_prestige.png`;
function tryList(img,urls,onDone){let i=0,finished=false;const next=()=>{if(finished)return;if(i>=urls.length){finished=true;onDone?.(false);return;}const url=urls[i++],probe=new Image(),timer=setTimeout(()=>{probe.onload=probe.onerror=null;next();},3200);probe.onload=()=>{clearTimeout(timer);if(probe.naturalWidth<120||probe.naturalHeight<120){next();return;}finished=true;img.src=url;img.hidden=false;onDone?.(true,url);};probe.onerror=()=>{clearTimeout(timer);next();};probe.src=url;};next();}
function suspicious(img){const s=img?.currentSrc||img?.src||'';return !s||img.hidden||s.includes('images.weserv.nl')||s.includes('Special:Redirect/file')||img.naturalWidth<80||img.naturalHeight<80;}
function recover(card){if(!card||card.dataset.recoveryV11===VER)return;const name=card.dataset.name||card.querySelector('.char-name')?.textContent?.trim();if(!name)return;const base=card.querySelector(':scope > .mr-hero-art-base'),hover=card.querySelector(':scope > .mr-hero-art-hover');if(!base||!hover)return;card.dataset.recoveryV11=VER;
 const baseUrls=[raw(name,'cards'),partner(name),raw(name,'details'),SPECIAL_DETAIL[name],prestige(name)].filter(Boolean);
 const hoverUrls=[raw(name,'details'),SPECIAL_DETAIL[name],prestige(name),partner(name),raw(name,'cards')].filter(Boolean);
 if(suspicious(base))tryList(base,baseUrls,(ok)=>{card.dataset.baseRecovery=ok?'ready':'missing';if(!ok&&!suspicious(hover)){base.src=hover.src;base.hidden=false;card.dataset.baseRecovery='hover-copy';card.dataset.baseContain='true';}});
 if(suspicious(hover))tryList(hover,hoverUrls,(ok)=>{card.dataset.hoverRecovery=ok?'ready':'missing';if(!ok&&!suspicious(base)){hover.src=base.src;hover.hidden=false;card.dataset.hoverArt='base-fallback';}});
 const metaActor=card.querySelector('.char-meta span:first-child');if(metaActor)metaActor.setAttribute('aria-hidden','true');
}
function scan(){document.querySelectorAll('#characterGrid .char-card').forEach(recover);}
function boot(){scan();const grid=document.querySelector('#characterGrid');if(grid)new MutationObserver(()=>requestAnimationFrame(scan)).observe(grid,{childList:true,subtree:true});setTimeout(scan,500);setTimeout(scan,1500);setTimeout(()=>{document.querySelectorAll('#characterGrid .char-card').forEach(c=>{delete c.dataset.recoveryV11;recover(c);});},3500);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
