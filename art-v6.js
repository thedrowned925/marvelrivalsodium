/* ODIUM Marvel Rivals — dual character art loader v6.7 */
(()=>{
const VER='6.7';
const TITLES={'Adam Warlock':'Hero Card Adam Warlock','Angela':'Angela Hero Card','Black Cat':'Hero Card Black Cat','Black Panther':'Hero Card Black Panther','Black Widow':'Hero Card Black Widow','Blade':'Blade Hero Card','Cyclops':'Hero Card Cyclops','Dare Devil':'Daredevil Hero Card','Deadpool':'Hero Card Deadpool','Devil Dinosaur':'Hero Card Devil Dinosaur','Elsa Bloodstone':'Hero Card Elsa Bloodstone','Emma Frost':'Hero Card Emma Frost','Galacta':'Galacta','Gambit':'Gambit Hero Card','Groot':'Hero Card Groot','Hawkeye':'Hero Card Hawkeye','Hela':'Hela Prestige Artwork','Human Torch':'Hero Card Human Torch','Invisible Woman':'Hero Card Invisible Woman','Iron Fist':'Prestigeironfist','Iron Man':'Iron man prestige','Jeff':'Hero Card Jeff','Jubilee':'Hero Card Jubilee','Luna Snow':'Hero Card Luna Snow','Magneto':'Magneto prestige','Mantis':'Hero Card Mantis','Moon Knight':'Moonknight prestige','Mr.Fantastic':'Hero Card Mister Fantastic','Namor':'Namor prestige','Peni Parker':'Peni Parker Prestige Artwork','Phoenix':'Phoenix prestige','Psylocke':'Hero Card Psylocke','Rocket Raccoon':'Hero Card Rocket Raccoon','Rogue':'Rogue Hero Card','Scarlet Witch':'Hero Card Scarlet Witch','Spider-Man':'Hero Card Spider-Man','Squirrel Girl':'Prestige squirellgirl','Storm':'Hero Card Storm','The Punisher':'Punisher prestige','The Thing':'The Thing Prestige art','Thor':'Hero Card Thor','Ultron':'Ultron Prestige art','Venom':'Hero Card Venom','White Fox':'Hero Card White Fox','Winter Soldier':'Winter soldier prestige','Wolverine':'Hero Card Wolverine','Capt. America':'Hero Card Captain America','Dr.Strange':'Hero Card Doctor Strange','Hulk':'Hulk Hero Card','Loki':'Hero Card Loki','Magik':'Magik marvel rivals prestige art','Star Lord':'Hero Card Star-Lord','Cloak':'Hero Card Cloak & Dagger','Dagger':'Hero Card Cloak & Dagger'};
const SPECIAL={'The Punisher':'the-punisher','Capt. America':'captain-america','Dr.Strange':'doctor-strange','Mr.Fantastic':'mister-fantastic','Dare Devil':'daredevil','Jeff':'jeff-the-land-shark','Star Lord':'star-lord','Cloak':'cloak-and-dagger','Dagger':'cloak-and-dagger'};
const PARTNER_SLUG={'The Punisher':'punisher','Capt. America':'captain-america','Dr.Strange':'doctor-strange','Mr.Fantastic':'mister-fantastic','Dare Devil':'daredevil','Jeff':'jeff','Star Lord':'star-lord','Cloak':'cloak-dagger','Dagger':'cloak-dagger'};
const SPECIAL_DETAIL={
'Galacta':'https://cdn2.unrealengine.com/12-marvelrivals-galacta1-3840x2160-82ba52de61fe.png',
'Jubilee':'https://r.res.easebar.com/pic/20260707/802f69c7-51ce-4b30-b698-ed914603b9ae.png'
};
const slug=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const assetSlug=n=>SPECIAL[n]||slug(n),cache=new Map();
const raw=(n,type)=>`https://raw.githubusercontent.com/thedrowned925/marvelrivalsodium/main/assets/characters/${type}/${slug(n)}.webp`;
const legacy=n=>`https://raw.githubusercontent.com/thedrowned925/marvelrivalsodium/main/assets/characters/${slug(n)}.webp`;
const fandom=(title,ext)=>`https://marvelrivals.fandom.com/wiki/Special:Redirect/file/${encodeURIComponent(title+'.'+ext)}`;
const proxy=u=>`https://images.weserv.nl/?url=${encodeURIComponent(u)}&w=1600&h=1600&fit=cover&output=webp&q=91`;
const prestige=n=>`https://rivalskins.com/wp-content/uploads/marvel-assets/ui/heroes/prestige/${assetSlug(n)}_prestige.png`;
const prestigeAlt=n=>n==='Angela'?'https://rivalskins.com/wp-content/uploads/marvel-assets/ui/heroes/prestige/angela_restige.png':prestige(n);
const partner=n=>`https://rivals.b-cdn.net/images/heroes/${PARTNER_SLUG[n]||slug(n)}/header.webp`;
function candidates(name,type){
  const title=TITLES[name]||('Hero Card '+name);
  if(type==='detail')return [raw(name,'details'),SPECIAL_DETAIL[name],prestigeAlt(name),prestige(name),partner(name),proxy(fandom(name+' Prestige Artwork','png')),proxy(fandom(name+' Artwork','png')),raw(name,'cards'),legacy(name),proxy(fandom(title,'png'))].filter(Boolean);
  return [raw(name,'cards'),legacy(name),partner(name),prestigeAlt(name),prestige(name),SPECIAL_DETAIL[name],proxy(fandom(title,'png')),proxy(fandom(title,'jpg')),proxy(fandom(title,'webp')),fandom(title,'png')].filter(Boolean);
}
function apply(img,name,type='card',done){
  const key=type+':'+name,list=[...new Set(candidates(name,type))];let i=0,token=0;
  const next=()=>{
    if(i>=list.length){img.dataset.failed='true';done&&done(false);return;}
    const url=list[i++],my=++token;
    const timer=setTimeout(()=>{if(my===token){img.onload=img.onerror=null;next();}},4500);
    img.onload=()=>{if(my!==token)return;clearTimeout(timer);if(img.naturalWidth<64||img.naturalHeight<64){next();return;}cache.set(key,url);img.dataset.failed='false';img.dataset.source=url.includes('/details/')?'github-detail':url.includes('/cards/')?'github-card':SPECIAL_DETAIL[name]===url?'special-detail':url.includes('rivalskins.com')?'prestige':url.includes('rivals.b-cdn.net')?'rivals-splash':url.includes('weserv')?'fandom-proxy':url.includes('fandom.com')?'fandom-direct':'fallback';done&&done(true);};
    img.onerror=()=>{if(my!==token)return;clearTimeout(timer);next();};
    img.src=url;
  };
  const cached=cache.get(key);if(cached){img.onload=()=>done&&done(true);img.onerror=next;img.src=cached;}else next();
}
function cardName(card){return card?.dataset?.name||card?.querySelector('.char-name')?.textContent?.trim()||'';}
function stack(card){if(!card||card.querySelector(':scope > .mr-card-ui'))return;const parts=['.char-meta','.char-mini','.char-progress-row','.char-bar','.char-head'].map(s=>card.querySelector(':scope > '+s)).filter(Boolean);if(!parts.length)return;const ui=document.createElement('div');ui.className='mr-card-ui';parts.forEach(el=>ui.appendChild(el));card.appendChild(ui);}
function decorate(card){if(!card)return;stack(card);if(card.dataset.artV6===VER)return;const name=cardName(card);if(!name)return;card.dataset.artV6=VER;card.querySelectorAll(':scope > .mr-hero-art').forEach(n=>n.remove());const img=document.createElement('img');img.className='mr-hero-art';img.alt='';img.loading='eager';img.fetchPriority='low';img.decoding='async';card.prepend(img);apply(img,name,'card',ok=>card.dataset.artState=ok?img.dataset.source:'missing');}
function decorateCards(){document.querySelectorAll('#characterGrid .char-card').forEach(decorate);}
function decorateVault(){const root=document.querySelector('#modalContent');if(!root)return;const h=root.querySelector('.vault-head');if(!h||h.dataset.artV6===VER)return;const name=h.querySelector('h3')?.textContent?.trim();if(!name)return;h.dataset.artV6=VER;h.querySelectorAll('.mr-vault-art').forEach(n=>n.remove());const img=document.createElement('img');img.className='mr-vault-art';img.alt='';img.loading='eager';img.fetchPriority='high';img.decoding='async';h.appendChild(img);apply(img,name,'detail',ok=>h.dataset.detailArt=ok?img.dataset.source:'missing');}
function boot(){decorateCards();decorateVault();const grid=document.querySelector('#characterGrid'),modal=document.querySelector('#modalContent');if(grid)new MutationObserver(()=>requestAnimationFrame(decorateCards)).observe(grid,{childList:true,subtree:true});if(modal)new MutationObserver(()=>requestAnimationFrame(decorateVault)).observe(modal,{childList:true,subtree:true});setTimeout(decorateCards,120);setTimeout(decorateCards,500);setTimeout(decorateCards,1200);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
