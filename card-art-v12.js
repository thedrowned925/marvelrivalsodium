/* ODIUM Marvel Rivals — exact Fandom hero-pair artwork v12 */
(()=>{
const VER='12.0';
const CANON={
  'Capt. America':'Captain America','Dr.Strange':'Doctor Strange','Mr.Fantastic':'Mister Fantastic',
  'Dare Devil':'Daredevil','Jeff':'Jeff the Land Shark','Star Lord':'Star-Lord',
  'Cloak':'Cloak & Dagger','Dagger':'Cloak & Dagger','Hulk':'Bruce Banner'
};
const NORMAL={
  'Hulk':'Bruce Banner Default Costume LoC Icon',
  'Gambit':'Gambit Hero Card Icon',
  'Rogue':'Rogue Default Costume LoC'
};
const HOVER={
  'Adam Warlock':'Hero Card Adam Warlock','Angela':'Angela Hero Card','Black Cat':'Hero Card Black Cat',
  'Black Panther':'Hero Card Black Panther','Black Widow':'Hero Card Black Widow','Blade':'Blade Hero Card',
  'Hulk':'Hulk Hero Card','Capt. America':'Hero Card Captain America','Cloak':'Hero Card Cloak & Dagger',
  'Dagger':'Hero Card Cloak & Dagger','Cyclops':'Hero Card Cyclops','Dare Devil':'Daredevil Hero Card',
  'Deadpool':'Hero Card Deadpool','Devil Dinosaur':'Hero Card Devil Dinosaur','Dr.Strange':'Hero Card Doctor Strange',
  'Elsa Bloodstone':'Hero Card Elsa Bloodstone','Emma Frost':'Hero Card Emma Frost','Gambit':'Gambit Hero Card',
  'Groot':'Hero Card Groot','Hawkeye':'Hero Card Hawkeye','Hela':'Hela Prestige Artwork',
  'Human Torch':'Hero Card Human Torch','Invisible Woman':'Hero Card Invisible Woman','Iron Fist':'Prestigeironfist',
  'Iron Man':'Iron man prestige','Jeff':'Hero Card Jeff','Loki':'Hero Card Loki','Luna Snow':'Hero Card Luna Snow',
  'Magik':'Magik marvel rivals prestige art','Magneto':'Magneto prestige','Mantis':'Hero Card Mantis',
  'Mr.Fantastic':'Hero Card Mister Fantastic','Moon Knight':'Moonknight prestige','Namor':'Namor prestige',
  'Peni Parker':'Peni Parker Prestige Artwork','Phoenix':'Phoenix prestige','Psylocke':'Hero Card Psylocke',
  'Rocket Raccoon':'Hero Card Rocket Raccoon','Rogue':'Rogue Hero Card','Scarlet Witch':'Hero Card Scarlet Witch',
  'Spider-Man':'Hero Card Spider-Man','Squirrel Girl':'Prestige squirellgirl','Star Lord':'Hero Card Star-Lord',
  'Storm':'Hero Card Storm','The Punisher':'Punisher prestige','The Thing':'The Thing Prestige art',
  'Thor':'Hero Card Thor','Ultron':'Ultron Prestige art','Venom':'Hero Card Venom','White Fox':'Hero Card White Fox',
  'Winter Soldier':'Winter soldier prestige','Wolverine':'Hero Card Wolverine',
  'Galacta':'Galacta','Jubilee':'Jubilee'
};
const SPECIAL_FOCUS={
  'The Punisher':'50% 4%','Black Panther':'50% 3%','Iron Fist':'50% 2%','Groot':'50% 3%',
  'Spider-Man':'50% 2%','Peni Parker':'50% 2%','Psylocke':'50% 1%','Hulk':'50% 1%',
  'Venom':'50% 1%','Wolverine':'50% 1%','The Thing':'50% 1%','Thor':'50% 1%'
};
const slug=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const canonical=n=>CANON[n]||n;
const fandom=(title,ext='png')=>`https://marvelrivals.fandom.com/wiki/Special:Redirect/file/${encodeURIComponent(title+'.'+ext)}`;
const proxy=u=>`https://images.weserv.nl/?url=${encodeURIComponent(u)}&w=1200&h=1500&fit=contain&output=webp&q=92`;
const local=(n,type)=>`https://raw.githubusercontent.com/thedrowned925/marvelrivalsodium/main/assets/characters/${type}/${slug(n)}.webp`;
const partner=n=>{
  const map={'The Punisher':'punisher','Capt. America':'captain-america','Dr.Strange':'doctor-strange','Mr.Fantastic':'mister-fantastic','Dare Devil':'daredevil','Jeff':'jeff','Star Lord':'star-lord','Cloak':'cloak-dagger','Dagger':'cloak-dagger'};
  return `https://rivals.b-cdn.net/images/heroes/${map[n]||slug(n)}/header.webp`;
};
function fandomCandidates(title){
  return [
    proxy(fandom(title,'png')),fandom(title,'png'),
    proxy(fandom(title,'jpg')),fandom(title,'jpg'),
    proxy(fandom(title,'webp')),fandom(title,'webp')
  ];
}
function normalTitle(name){return NORMAL[name]||`${canonical(name)} Default Costume LoC Icon`;}
function hoverTitle(name){return HOVER[name]||`Hero Card ${canonical(name)}`;}
function normalCandidates(name){return [...fandomCandidates(normalTitle(name)),local(name,'cards'),partner(name)];}
function hoverCandidates(name){return [...fandomCandidates(hoverTitle(name)),local(name,'details'),partner(name)];}
function probe(url,timeout=6500){return new Promise(resolve=>{const im=new Image();let done=false;const finish=v=>{if(done)return;done=true;clearTimeout(t);resolve(v)};const t=setTimeout(()=>finish(null),timeout);im.onload=()=>finish(im.naturalWidth>80&&im.naturalHeight>80?url:null);im.onerror=()=>finish(null);im.src=url;});}
async function firstWorking(list){for(const u of [...new Set(list.filter(Boolean))]){const ok=await probe(u);if(ok)return ok;}return null;}
function actorName(card){return card.querySelector('.voice-credit strong')?.textContent?.trim()||card.querySelector('.char-meta span:first-child b')?.textContent?.trim()||'';}
function ensureCredit(card){if(card.querySelector('.voice-credit'))return;const actor=actorName(card);if(!actor||/atanmadı/i.test(actor))return;const host=card.querySelector('.char-head>div');if(!host)return;const c=document.createElement('div');c.className='voice-credit';c.innerHTML=`<span class="voice-credit-star">✦</span><span><small>TÜRKÇE SESİ</small><strong>${actor.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}</strong></span>`;host.appendChild(c);}
async function upgrade(card){
  if(!card)return;const name=card.dataset.name||card.querySelector('.char-name')?.textContent?.trim();if(!name)return;
  ensureCredit(card);
  if(card.dataset.artV12===VER&&card.querySelector(':scope > .mr-hero-art-base')&&card.querySelector(':scope > .mr-hero-art-hover'))return;
  card.dataset.artV12=VER;card.style.setProperty('--art-focus',SPECIAL_FOCUS[name]||'50% 2%');
  card.querySelectorAll(':scope > .mr-hero-art').forEach(n=>n.remove());
  const base=document.createElement('img');base.className='mr-hero-art mr-hero-art-base';base.alt='';base.decoding='async';base.loading='eager';
  const hover=document.createElement('img');hover.className='mr-hero-art mr-hero-art-hover';hover.alt='';hover.decoding='async';hover.loading='eager';
  card.prepend(base);base.after(hover);
  const hoverPromise=firstWorking(hoverCandidates(name));
  const basePromise=firstWorking(normalCandidates(name));
  const [baseUrl,hoverUrl]=await Promise.all([basePromise,hoverPromise]);
  const finalBase=baseUrl||hoverUrl;const finalHover=hoverUrl||baseUrl;
  if(finalBase){base.src=finalBase;card.dataset.baseArt=baseUrl?'fandom-default':'fallback';}else card.dataset.baseArt='missing';
  if(finalHover){hover.src=finalHover;card.dataset.hoverArt=hoverUrl?'fandom-hover':'fallback';}else card.dataset.hoverArt='missing';
  if(baseUrl)card.title=`${name} · normal: ${normalTitle(name)} · hover: ${hoverTitle(name)}`;
}
function scan(){document.querySelectorAll('#characterGrid .char-card').forEach(upgrade);}
function boot(){scan();const g=document.querySelector('#characterGrid');if(g)new MutationObserver(()=>requestAnimationFrame(scan)).observe(g,{childList:true,subtree:true});setTimeout(scan,300);setTimeout(scan,1100);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
