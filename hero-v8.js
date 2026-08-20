/* ODIUM Marvel Rivals — hero typewriter v8 */
(()=>{
const LINES=[
  'Bir kahramanı kostümü değil, yaptığı seçimler tanımlar.',
  'Evren kırıldığında bile biri ayağa kalkar.',
  'Her savaşın ortasında yeni bir umut doğar.',
  'Bazen dünyayı kurtarmak, tek bir doğru seçimle başlar.',
  'Güç tek başına yetmez; onu nasıl kullandığın önemlidir.',
  'Kahramanlık, korkmadığın an değil; yine de ilerlediğin andır.',
  'Çoklu evrende her karar başka bir hikâyeyi uyandırır.',
  'En karanlık gecede bile bir kahraman ışığı bulur.',
  'Takım olduğunda imkânsız yalnızca bir başlangıçtır.',
  'Bir evren düşebilir; umut düşmek zorunda değildir.',
  'Gerçek güç, başkaları için ayağa kalkabilmektir.',
  'Her maskenin arkasında verilmiş zor bir karar vardır.',
  'Bazen en büyük savaş, insanın kendi içinde başlar.',
  'Efsaneler güçleriyle değil, bıraktıkları izlerle yaşar.',
  'Kader yazılmış olabilir; kahramanlar yine de onu değiştirir.',
  'Evren sonsuz olabilir ama doğru an yalnızca bir kez gelir.',
  'Bir kahramanın sesi, sessiz kalan binlercesine umut olur.',
  'Düştüğün yer hikâyenin sonu değil, yeni panelin başlangıcıdır.',
  'Kaos büyüdükçe cesaretin sesi daha yüksek çıkar.',
  'Bir ekip, ayrı güçlerin tek bir amaca dönüşmesidir.',
  'Hiçbir portal, eve dönme umudundan daha güçlü değildir.',
  'Bir dünyayı korumak bazen kendi dünyandan vazgeçmektir.',
  'Kahramanlar kusursuz değildir; vazgeçmemeyi seçerler.',
  'Her evrende umut başka bir yüzle geri döner.',
  'Gücün sınırı olabilir; iradenin olmak zorunda değil.',
  'Bugünün seçimi, yarının evrenini şekillendirir.',
  'Bir kıvılcım, bütün bir direnişi başlatabilir.',
  'Karanlık ne kadar büyükse, ışık o kadar görünür olur.',
  'Dostların yanındaysa hiçbir savaş gerçekten tek başına değildir.',
  'Kahraman olmak, sonucu bilmeden doğru olana yürümektir.',
  'Evren değişir. Takımlar değişir. Mücadele devam eder.',
  'Bazı hikâyeler bir patlamayla değil, bir seçimle başlar.',
  'Bir kahraman geç kalabilir; umut asla pes etmemelidir.',
  'Çizgiler değişir, zaman kırılır, ama cesaret yerinde kalır.',
  'Her yeni tehdit, yeni bir kahramanın doğuşunu hızlandırır.',
  'Bir evreni kurtarmanın ilk adımı, onun için savaşmaya karar vermektir.',
  'Kaybetmek son değildir; yeniden ayağa kalkmamak sondur.',
  'Gerçek efsaneler yalnız kazanmaz, başkalarını da ayağa kaldırır.',
  'Zaman çizgileri ayrılır; cesaret her birinde aynı yankılanır.',
  'Savaş alanında herkes bir rol oynar; bazıları tarihi değiştirir.'
];

function setup(){
  const hero=document.querySelector('.hero-copy');
  const h1=hero?.querySelector('h1');
  if(!hero||!h1||hero.dataset.typewriterV8==='1') return;
  hero.dataset.typewriterV8='1';

  h1.classList.add('hero-typewriter-title');
  h1.innerHTML='<span class="type-prefix">EVREN SANA ŞUNU SÖYLÜYOR:</span><span class="type-line" id="odiumTypeLine"></span><span class="type-cursor" aria-hidden="true"></span>';

  const lead=hero.querySelector('.hero-lead');
  if(lead) lead.innerHTML='ODIUM Marvel Rivals Türkçe dublaj projesinin canlı durumunu takip et. <b>Karaktere tıkla; replik, kayıt, kontrol ve tüm teknik verileri tek ekranda gör.</b>';

  const actions=hero.querySelector('.hero-actions');
  if(actions){
    actions.innerHTML='<a class="btn hero-track-cta" href="#characters"><span>KARAKTER TAKİBİNE GİT</span><b>↓</b><small>Canlı roster ve tüm replik verileri</small></a>';
  }

  hero.querySelector('.update-line')?.classList.add('hero-secondary-hidden');
  hero.querySelector('.hero-digest')?.classList.add('hero-secondary-hidden');

  const target=document.getElementById('odiumTypeLine');
  if(!target) return;
  let lineIndex=Math.floor(Math.random()*LINES.length), charIndex=0, deleting=false;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(reduced){target.textContent=LINES[lineIndex];return;}

  function tick(){
    const full=LINES[lineIndex];
    if(!deleting){
      charIndex++;
      target.textContent=full.slice(0,charIndex);
      if(charIndex>=full.length){deleting=true;setTimeout(tick,2400);return;}
      setTimeout(tick,22+Math.random()*34);
    }else{
      charIndex--;
      target.textContent=full.slice(0,Math.max(0,charIndex));
      if(charIndex<=0){deleting=false;lineIndex=(lineIndex+1)%LINES.length;setTimeout(tick,420);return;}
      setTimeout(tick,10+Math.random()*15);
    }
  }
  tick();
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',setup,{once:true}):setup();
setTimeout(setup,500);
})();
