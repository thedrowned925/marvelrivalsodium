/* ODIUM Marvel Rivals — robust roster artwork v11 */
(()=>{
const VER='11.0';
const TITLES={'Adam Warlock':'Hero Card Adam Warlock','Angela':'Angela Hero Card','Black Cat':'Hero Card Black Cat','Black Panther':'Hero Card Black Panther','Black Widow':'Hero Card Black Widow','Blade':'Blade Hero Card','Cyclops':'Hero Card Cyclops','Dare Devil':'Daredevil Hero Card','Deadpool':'Hero Card Deadpool','Devil Dinosaur':'Hero Card Devil Dinosaur','Elsa Bloodstone':'Hero Card Elsa Bloodstone','Emma Frost':'Hero Card Emma Frost','Galacta':'Galacta','Gambit':'Gambit Hero Card','Groot':'Hero Card Groot','Hawkeye':'Hero Card Hawkeye','Hela':'Hero Card Hela','Human Torch':'Hero Card Human Torch','Invisible Woman':'Hero Card Invisible Woman','Iron Fist':'Hero Card Iron Fist','Iron Man':'Hero Card Iron Man','Jeff':'Hero Card Jeff','Jubilee':'Hero Card Jubilee','Luna Snow':'Hero Card Luna Snow','Magneto':'Hero Card Magneto','Mantis':'Hero Card Mantis','Moon Knight':'Hero Card Moon Knight','Mr.Fantastic':'Hero Card Mister Fantastic','Namor':'Hero Card Namor','Peni Parker':'Hero Card Peni Parker','Phoenix':'Hero Card Phoenix','Psylocke':'Hero Card Psylocke','Rocket Raccoon':'Hero Card Rocket Raccoon','Rogue':'Rogue Hero Card','Scarlet Witch':'Hero Card Scarlet Witch','Spider-Man':'Hero Card Spider-Man','Squirrel Girl':'Hero Card Squirrel Girl','Storm':'Hero Card Storm','The Punisher':'Hero Card The Punisher','The Thing':'Hero Card The Thing','Thor':'Hero Card Thor','Ultron':'Hero Card Ultron','Venom':'Hero Card Venom','White Fox':'Hero Card White Fox','Winter Soldier':'Hero Card Winter Soldier','Wolverine':'Hero Card Wolverine','Capt. America':'Hero Card Captain America','Dr.Strange':'Hero Card Doctor Strange','Hulk':'Hulk Hero Card','Loki':'Hero Card Loki','Magik':'Hero Card Magik','Star Lord':'Hero Card Star-Lord','Cloak':'Hero Card Cloak & Dagger','Dagger':'Hero Card Cloak & Dagger'};
const SPECIAL={'The Punisher':'the-punisher','Capt. America':'captain-america','Dr.Strange':'doctor-strange','Mr.Fantastic':'mister-fantastic','Dare Devil':'daredevil','Jeff':'jeff-the-land-shark','Star Lord':'star-lord','Cloak':'cloak-and-dagger','Dagger':'cloak-and-dagger'};
const PARTNER={'The Punisher':'punisher','Capt. America':'captain-america','Dr.Strange':'doctor-strange','Mr.Fantastic':'mister-fantastic','Dare Devil':'daredevil','Jeff':'jeff','Star Lord':'star-lord','Cloak':'cloak-dagger','Dagger':'cloak-dagger'};
const SPECIAL_DETAIL={'Galacta':'https://cdn2.unrealengine.com/12-marvelrivals-galacta1-3840x2160-82ba52de61fe.png','Jubilee':'https://r.res.easebar.com/pic/20260707/802f69c7-51ce-4b30-b698-ed914603b9ae.png'};
const FOCUS={'Black Panther':'50% 5%','Iron Fist':'50% 2%','Groot':'50% 3%','Spider-Man':'50% 4%','Peni Parker':'50% 3%','Psylocke':'50% 2%','Magneto':'50% 2%','Moon Knight':'50% 1%','Venom':'50% 1%','Hulk':'50% 2%','The Punisher':'50% 2%','Wolverine':'50% 2%'};
const slug=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const assetSlug=n=>SPECIAL[n]||slug(n);
const raw=(n,type)=>`https://raw.githubusercontent.com/thedrowned925/marvelrivalsodium/main/assets/characters/${type}/${slug(n)}.webp`;
const partner=n=>`https://rivals.b-cdn.net/images/heroes/${PARTNER[n]||slug(n)}/header.webp`;
const prestige=n=>`https://rivalskins.com/wp-content/uploads/marvel-assets/ui/heroes/prestige/${assetSlug(n)}_prestige.png`;
const fandom=(title,ext='png')=>`https://marvelrivals.fandom.com/wiki/Special:Redirect/file/${encodeURIComponent(title+'.'+ext)}`;
const proxy=u=>`https://images.weserv.nl/?url=${encodeURIComponent(u)}&w=1600&h=1800&fit=contain&output=webp&q=91`;
function baseCandidates(name){const t=TITLES[name]||`Hero Card ${name}`;return [...new Set([raw(name,'cards'),partner(name),proxy(fandom(t)),proxy(fandom(t,'jpg')),fandom(t)])];}
function hoverCandidates(name){return [...new Set([raw(name,'details'),SPECIAL_DETAIL[name],prestige(name),proxy(fandom(`${name} Prestige Artwork`)),proxy(fandom(`${name} Artwork`)),proxy(fandom(`${name} character art`)),partner(name)].filter(Boolean))];}
function load(img,list){return new Promise(resolve=>{let i=0;const next=()=>{if(i>=list.length){resolve(null);return;}const u=list[i++];img.onload=()=>{if(img.naturalWidth<80||img.naturalHeight<80){next();return;}img.dataset.source=u;resolve(u);};img.onerror=next;img.src=u;};next();});}
function actorName(card){return card.querySelector('.char-meta span:first-child b')?.textContent?.trim()||card.querySelector('.voice-credit strong')?.textContent?.trim()||'';}
function addCredit(card){if(card.querySelector('.voice-credit'))return;const actor=actorName(card);if(!actor||/atanmadı/i.test(actor))return;const host=card.querySelector('.char-head>div');if(!host)return;const credit=document.createElement('div');credit.className='voice-credit';credit.innerHTML=`<span class="voice-credit-star">✦</span><span><small>TÜRKÇE SESİ</small><strong>${actor.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}</strong></span>`;host.appendChild(credit);}
async function upgrade(card){if(!card)return;const name=card.dataset.name||card.querySelector('.char-name')?.textContent?.trim();if(!name)return;addCredit(card);if(card.dataset.artV11===VER&&card.querySelector(':scope > .mr-hero-art-base')&&card.querySelector(':scope > .mr-hero-art-hover'))return;card.dataset.artV11=VER;card.style.setProperty('--art-focus',FOCUS[name]||'50% 3%');card.querySelectorAll(':scope > .mr-hero-art').forEach(n=>n.remove());
 const base=document.createElement('img');base.className='mr-hero-art mr-hero-art-base';base.alt='';base.decoding='async';base.loading='eager';
 const hover=document.createElement('img');hover.className='mr-hero-art mr-hero-art-hover';hover.alt='';hover.decoding='async';hover.loading='eager';
 card.prepend(base);base.after(hover);
 const [baseUrl,hoverUrl]=await Promise.all([load(base,baseCandidates(name)),load(hover,hoverCandidates(name))]);
 if(!baseUrl&&hoverUrl){base.src=hoverUrl;card.dataset.baseArt='hover-fallback';card.dataset.baseContain='true';}
 else card.dataset.baseArt=baseUrl?'ready':'missing';
 if(!hoverUrl&&baseUrl){hover.src=baseUrl;card.dataset.hoverArt='base-fallback';}
 else card.dataset.hoverArt=hoverUrl?'ready':'missing';
 if(!baseUrl&&!hoverUrl){card.dataset.artMissing='true';}
}
function scan(){document.querySelectorAll('#characterGrid .char-card').forEach(upgrade);}
function boot(){scan();const g=document.querySelector('#characterGrid');if(g)new MutationObserver(()=>requestAnimationFrame(scan)).observe(g,{childList:true,subtree:true});setTimeout(scan,250);setTimeout(scan,900);setTimeout(scan,1800);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
