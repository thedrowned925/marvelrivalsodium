/* ODIUM Marvel Rivals — stable exact Fandom artwork pairs v11.3 */
(()=>{
const VER='11.3';
const SECOND={
'Adam Warlock':'Hero Card Adam Warlock','Angela':'Angela Hero Card','Black Cat':'Hero Card Black Cat','Black Panther':'Hero Card Black Panther','Black Widow':'Hero Card Black Widow','Blade':'Blade Hero Card','Cyclops':'Hero Card Cyclops','Dare Devil':'Daredevil Hero Card','Deadpool':'Hero Card Deadpool','Devil Dinosaur':'Hero Card Devil Dinosaur','Elsa Bloodstone':'Hero Card Elsa Bloodstone','Emma Frost':'Hero Card Emma Frost','Galacta':'Galacta','Gambit':'Gambit Hero Card','Groot':'Hero Card Groot','Hawkeye':'Hero Card Hawkeye','Hela':'Hela Prestige Artwork','Human Torch':'Hero Card Human Torch','Invisible Woman':'Hero Card Invisible Woman','Iron Fist':'Prestigeironfist','Iron Man':'Iron man prestige','Jeff':'Hero Card Jeff','Jubilee':'Hero Card Jubilee','Luna Snow':'Hero Card Luna Snow','Magneto':'Magneto prestige','Mantis':'Hero Card Mantis','Moon Knight':'Moonknight prestige','Mr.Fantastic':'Hero Card Mister Fantastic','Namor':'Namor prestige','Peni Parker':'Peni Parker Prestige Artwork','Phoenix':'Phoenix prestige','Psylocke':'Hero Card Psylocke','Rocket Raccoon':'Hero Card Rocket Raccoon','Rogue':'Rogue Hero Card','Scarlet Witch':'Hero Card Scarlet Witch','Spider-Man':'Hero Card Spider-Man','Squirrel Girl':'Prestige squirellgirl','Storm':'Hero Card Storm','The Punisher':'Punisher prestige','The Thing':'The Thing Prestige art','Thor':'Hero Card Thor','Ultron':'Ultron Prestige art','Venom':'Hero Card Venom','White Fox':'Hero Card White Fox','Winter Soldier':'Winter soldier prestige','Wolverine':'Hero Card Wolverine','Capt. America':'Hero Card Captain America','Dr.Strange':'Hero Card Doctor Strange','Hulk':'Hulk Hero Card','Loki':'Hero Card Loki','Magik':'Magik marvel rivals prestige art','Star Lord':'Hero Card Star-Lord','Cloak':'Hero Card Cloak & Dagger','Dagger':'Hero Card Cloak & Dagger'};
const FIRST_SPECIAL={
'Hulk':'Bruce Banner Default Costume LoC Icon','Capt. America':'Captain America Default Costume LoC Icon','Dr.Strange':'Doctor Strange Default Costume LoC Icon','Mr.Fantastic':'Mister Fantastic Default Costume LoC Icon','Dare Devil':'Daredevil Default Costume LoC Icon','Jeff':'Jeff the Land Shark Default Costume LoC Icon','Star Lord':'Star-Lord Default Costume LoC Icon','Cloak':'Cloak & Dagger Default Costume LoC Icon','Dagger':'Cloak & Dagger Default Costume LoC Icon','Rogue':'Rogue Default Costume LoC','Gambit':'Gambit Hero Card Icon'};
const SPECIAL={'The Punisher':'the-punisher','Capt. America':'captain-america','Dr.Strange':'doctor-strange','Mr.Fantastic':'mister-fantastic','Dare Devil':'daredevil','Jeff':'jeff-the-land-shark','Star Lord':'star-lord','Cloak':'cloak-and-dagger','Dagger':'cloak-and-dagger'};
const PARTNER={'The Punisher':'punisher','Capt. America':'captain-america','Dr.Strange':'doctor-strange','Mr.Fantastic':'mister-fantastic','Dare Devil':'daredevil','Jeff':'jeff','Star Lord':'star-lord','Cloak':'cloak-dagger','Dagger':'cloak-dagger'};
const SPECIAL_DETAIL={'Galacta':'https://cdn2.unrealengine.com/12-marvelrivals-galacta1-3840x2160-82ba52de61fe.png','Jubilee':'https://r.res.easebar.com/pic/20260707/802f69c7-51ce-4b30-b698-ed914603b9ae.png'};
const FOCUS={'Black Panther':'50% 2%','Iron Fist':'50% 1%','Groot':'50% 1%','Spider-Man':'50% 2%','Peni Parker':'50% 1%','Psylocke':'50% 1%','Magneto':'50% 1%','Moon Knight':'50% 0%','Venom':'50% 0%','Hulk':'50% 0%','The Punisher':'50% 1%','Wolverine':'50% 1%','Jubilee':'50% 1%','Luna Snow':'50% 1%'};
const slug=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const canon=n=>({'Capt. America':'Captain America','Dr.Strange':'Doctor Strange','Mr.Fantastic':'Mister Fantastic','Dare Devil':'Daredevil','Jeff':'Jeff the Land Shark','Star Lord':'Star-Lord','Cloak':'Cloak & Dagger','Dagger':'Cloak & Dagger'}[n]||n);
const assetSlug=n=>SPECIAL[n]||slug(n);
const raw=(n,type)=>`https://raw.githubusercontent.com/thedrowned925/marvelrivalsodium/main/assets/characters/${type}/${slug(n)}.webp`;
const partner=n=>`https://rivals.b-cdn.net/images/heroes/${PARTNER[n]||slug(n)}/header.webp`;
const prestige=n=>`https://rivalskins.com/wp-content/uploads/marvel-assets/ui/heroes/prestige/${assetSlug(n)}_prestige.png`;
const fandom=(title,ext='png')=>`https://marvelrivals.fandom.com/wiki/Special:Redirect/file/${encodeURIComponent(title+'.'+ext)}`;
const proxy=u=>`https://images.weserv.nl/?url=${encodeURIComponent(u)}&w=1500&h=1800&fit=contain&output=webp&q=91`;
function firstTitle(name){if(FIRST_SPECIAL[name])return FIRST_SPECIAL[name];if(name==='Galacta'||name==='Jubilee')return null;return `${canon(name)} Default Costume LoC Icon`;}
function baseCandidates(name){const t=firstTitle(name),second=SECOND[name];return [...new Set([raw(name,'cards'),t&&proxy(fandom(t)),t&&proxy(fandom(t,'webp')),t&&fandom(t),partner(name),second&&proxy(fandom(second))].filter(Boolean))];}
function hoverCandidates(name){const t=SECOND[name];return [...new Set([raw(name,'details'),SPECIAL_DETAIL[name],t&&proxy(fandom(t)),t&&proxy(fandom(t,'webp')),t&&fandom(t),prestige(name),partner(name)].filter(Boolean))];}
function resolveUrl(list){return new Promise(resolve=>{let i=0;const next=()=>{if(i>=list.length){resolve(null);return;}const u=list[i++],probe=new Image();probe.onload=()=>{if(probe.naturalWidth<80||probe.naturalHeight<80){next();return;}resolve(u);};probe.onerror=next;probe.src=u;};next();});}
function actorName(card){return card.querySelector('.char-meta span:first-child b')?.textContent?.trim()||card.querySelector('.voice-credit strong')?.textContent?.trim()||'';}
function addCredit(card){if(card.querySelector('.voice-credit'))return;const actor=actorName(card);if(!actor||/atanmadı/i.test(actor))return;const host=card.querySelector('.char-head>div');if(!host)return;const credit=document.createElement('div');credit.className='voice-credit';credit.innerHTML=`<span class="voice-credit-star">✦</span><span><small>TÜRKÇE SESİ</small><strong>${actor.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}</strong></span>`;host.appendChild(credit);}
async function upgrade(card){if(!card)return;const name=card.dataset.name||card.querySelector('.char-name')?.textContent?.trim();if(!name)return;addCredit(card);if(card.dataset.artV11===VER&&card.querySelector(':scope > .mr-hero-art-base')&&card.querySelector(':scope > .mr-hero-art-hover'))return;card.dataset.artV11=VER;card.style.setProperty('--art-focus',FOCUS[name]||'50% 1%');card.querySelectorAll(':scope > .mr-hero-art').forEach(n=>n.remove());
 const base=document.createElement('img');base.className='mr-hero-art mr-hero-art-base';base.alt='';base.decoding='async';base.loading='eager';base.hidden=true;
 const hover=document.createElement('img');hover.className='mr-hero-art mr-hero-art-hover';hover.alt='';hover.decoding='async';hover.loading='eager';hover.hidden=true;
 card.prepend(base);base.after(hover);
 const basePromise=resolveUrl(baseCandidates(name));const hoverPromise=resolveUrl(hoverCandidates(name));
 const hoverUrl=await hoverPromise;if(hoverUrl){hover.src=hoverUrl;hover.hidden=false;card.dataset.hoverArt='ready';}
 const quickBase=await Promise.race([basePromise,new Promise(r=>setTimeout(()=>r(null),850))]);
 if(quickBase){base.src=quickBase;base.hidden=false;card.dataset.baseArt='ready';}
 else if(hoverUrl){base.src=hoverUrl;base.hidden=false;card.dataset.baseArt='hover-fallback';card.dataset.baseContain='true';}
 const finalBase=await basePromise;
 if(finalBase&&finalBase!==quickBase){base.src=finalBase;base.hidden=false;card.dataset.baseArt='ready';delete card.dataset.baseContain;}
 if(!hoverUrl&&finalBase){hover.src=finalBase;hover.hidden=false;card.dataset.hoverArt='base-fallback';}
 if(!hoverUrl&&!finalBase){card.dataset.artMissing='true';base.hidden=true;hover.hidden=true;}
}
function scan(){document.querySelectorAll('#characterGrid .char-card').forEach(upgrade);}
function boot(){scan();const g=document.querySelector('#characterGrid');if(g)new MutationObserver(()=>requestAnimationFrame(scan)).observe(g,{childList:true,subtree:true});setTimeout(scan,250);setTimeout(scan,900);setTimeout(scan,1800);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
