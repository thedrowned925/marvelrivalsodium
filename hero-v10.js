/* ODIUM Marvel Rivals — fixed hero v10 */
(()=>{
function setup(){
  const hero=document.querySelector('.hero-copy');
  const h1=hero?.querySelector('h1');
  if(!hero||!h1||hero.dataset.fixedHeroV10==='1')return;
  hero.dataset.fixedHeroV10='1';
  h1.className='hero-fixed-title';
  h1.innerHTML='<span>ODIUM</span><strong>MARVEL RIVALS</strong><em>TAKİP</em>';
  const lead=hero.querySelector('.hero-lead');
  if(lead)lead.innerHTML='Marvel Rivals Türkçe dublaj projesindeki tüm karakterlerin kayıt, kontrol ve oyun entegrasyonu durumunu canlı takip et. <b>Bir karaktere tıklayarak tüm replik ve teknik verilerini görüntüle.</b>';
  const actions=hero.querySelector('.hero-actions');
  if(actions)actions.innerHTML='<a class="hero-track-cta-v10" href="#characters"><span><b>KARAKTER TAKİBİNE GİT</b><small>54 karakter · canlı durum · tüm replik verileri</small></span><i aria-hidden="true">↓</i></a>';
  hero.querySelector('.update-line')?.classList.add('hero-secondary-hidden');
  hero.querySelector('.hero-digest')?.classList.add('hero-secondary-hidden');
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',setup,{once:true}):setup();
setTimeout(setup,350);
})();
