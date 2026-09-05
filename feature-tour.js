/* User-requested persistent opt-out; completing/closing alone never opts out. */
(()=>{
 const key='odium-feature-tour-hidden';
 const steps=[
  {title:'ODIUM Stüdyo’ya hoş geldin',tag:'YENİ SÜRÜM / GELİŞTİRME NOTLARI',target:'#overview',body:'Marvel Rivals Türkçe dublaj takibi yenilendi. Bu turda yeni özellikleri ve sitede neler yapabileceğini birlikte gezeceğiz.',items:['Karaktere özel dosyalar ve indirilebilir afişler','Daha sağlam görsel yükleme ve hızlı veri kontrolü','Sesler, tüm replikler ve mevcut takip araçları']},
  {title:'Her kahramanın kendi dosyası',tag:'01 / KARAKTER GÖRÜNÜMÜ',target:'#spotlight',body:'Karakterler kendi portreleri, renkleri ve mevcut amblemleriyle gösteriliyor. Üstteki oklarla kahramanlar arasında gezebilirsin.',items:['Türkçe seslendiren kişi ve üretim yüzdesi','Kayıt, kontrol, oyun entegrasyonu ve bekleyen replik sayıları','Portreler siteden yüklenir; sorun olursa aynı karakterin yedek görseli denenir.']},
  {title:'Kahramanını bul',tag:'02 / ARAMA VE SIRALAMA',target:'#characters .controls',body:'Karakterin veya seslendiren kişinin adını yaz. Durum düğmeleriyle listeyi daralt; ilerleme, replik sayısı veya isme göre sırala.',items:['Başlamadı, Devam Ediyor ve Tamamlandı filtreleri','Kartlarda toplam ve işlenen replikler','Bir karta tıklayarak tam karakter dosyasını aç.']},
  {title:'Repliklerin tamamı elinin altında',tag:'03 / DETAYLI KARAKTER DOSYASI',target:'#characterGrid',body:'Karakter detayında yalnızca bir özet yok: kaynaktaki tüm repliklere ve teknik alanlara ulaşabilirsin.',items:['İngilizce, Türkçe, durum, seslendiren, tarih ve not','Sıra, WAV dosyası, WEM ID ve Internal Name','Tüm alanlarda arama, durum filtresi ve 25 / 50 / 100 satırlık sayfalar']},
  {title:'Karakterini duy, afişini indir',tag:'04 / SESLER VE PAYLAŞILABİLİR AFİŞ',target:'#spotlight',body:'Ses kaydı eklenmiş karakterlerin kartlarında ve detaylarında ses klipleri bulunur. Afişi indir düğmesi seçili karakterin güncel verileriyle bir görsel hazırlar.',items:['Mevcut beş karakterin kart ve detay sesleri korunuyor.','1920 × 1080 PNG: karakter, seslendiren, üretim durumu ve veri tarihi','Afiş oluşturulurken portreler ve Türkçe destekli fontlar siteden yüklenir.']},
  {title:'Sayfayı yenilemeden takip et',tag:'05 / VERİ GÜNCELLEMELERİ',target:'#syncPill',body:'Sayfa açıkken yayımlanan veriler 10 saniyede bir kontrol edilir. Sekmeye geri döndüğünde veya bağlantı geldiğinde kontrol hemen yapılır.',items:['Açık karakterin replikleri de yeni veriyle yenilenir; arama ve sayfan korunur.','Veri değişmediyse kartlar ve resimler yeniden oluşturulmaz.','Bağlantı yoksa kayıtlı veri gösterilir. Excel’in kaynağa aktarılması ayrıca zaman alabilir.']},
  {title:'Yüzdelerin arkasındaki süreç',tag:'06 / İSTATİSTİKLER VE REHBER',target:'#pipeline',body:'Genel istatistikler ve üretim aşamaları projenin bütününü gösterir. Nasıl Okunur bölümünde sayıların ne anlama geldiğini bulabilirsin.',items:['İşlenen = kayıt alınan + kontrol edilen + oyuna eklenen','İlerleme = işlenen / toplam replik × 100','Mobil gezinme, klavyeyle kullanım ve azaltılmış hareket desteği']},
  {title:'Proje duyurusu',tag:'07 / TÜRKÇE DUBLAJ EKİBİ',target:null,body:'Cast’ı belirlenmiş tüm seslendirme sanatçılarımızın kayıtlarını en geç 6 Eylül 2026 tarihine kadar tamamlamaları önemle rica olunur.',items:['Kayıt, kontrol ve düzenlemenin planlanan takvimde ilerlemesi için eksiksiz teslim önemlidir.','Özeniniz ve emeğiniz için teşekkür ederiz. — ODIUM Stüdyo','Bu turu alt bölümdeki Yenilikler · Site turu düğmesinden her zaman açabilirsin.']}
 ];
 const dialog=document.createElement('dialog');dialog.className='feature-tour';dialog.setAttribute('aria-labelledby','tourTitle');dialog.setAttribute('aria-describedby','tourBody');
 dialog.innerHTML='<div class="tour-highlight" aria-hidden="true" hidden></div><section class="tour-panel"><div class="tour-top"><span id="tourTag"></span><button class="tour-close" aria-label="Turu kapat" type="button">×</button></div><div class="tour-progress" aria-hidden="true"><i></i></div><p class="tour-count" aria-live="polite"></p><h2 id="tourTitle"></h2><p id="tourBody"></p><ul class="tour-items"></ul><div class="tour-controls"><button type="button" data-prev>← Geri</button><button type="button" class="tour-next" data-next>Devam →</button></div><div class="tour-preference"><button type="button" data-dismiss>Bir daha gösterme</button><small id="tourPreference">Bu düğmeye basmazsan tur her sayfa yenilemesinde tekrar açılır.</small></div><p class="tour-storage-error" role="status" hidden></p></section>';
 document.body.append(dialog);let index=0,previous=null,scroll=0,automaticStarted=false,layoutFrame=0;
 const $=s=>dialog.querySelector(s);const hideBox=()=>{$('.tour-highlight').hidden=true};
 function place(){
  if(!dialog.open)return;const target=steps[index].target&&document.querySelector(steps[index].target),box=$('.tour-highlight');
  if(!target){hideBox();return}const r=target.getBoundingClientRect();
  if(r.bottom<0||r.top>innerHeight){hideBox();return}
  box.hidden=false;box.style.left=Math.max(5,r.left-6)+'px';box.style.top=Math.max(5,r.top-6)+'px';box.style.width=Math.min(innerWidth-10,r.width+12)+'px';box.style.height=Math.min(innerHeight-10,Math.min(innerHeight,r.bottom+6)-Math.max(5,r.top-6))+'px';
 }
 function render(){const s=steps[index];$('#tourTag').textContent=s.tag;$('#tourTitle').textContent=s.title;$('#tourBody').textContent=s.body;$('.tour-items').replaceChildren(...s.items.map(text=>{const li=document.createElement('li');li.textContent=text;return li}));$('.tour-count').textContent=`${index+1} / ${steps.length}`;$('.tour-progress i').style.width=((index+1)/steps.length*100)+'%';$('[data-prev]').disabled=index===0;$('[data-next]').textContent=index===steps.length-1?'Turu bitir ✓':'Devam →';
  const target=s.target&&document.querySelector(s.target);target?.scrollIntoView({behavior:'instant',block:'center'});cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(place);
 }
 function hidden(){try{return localStorage.getItem(key)==='1'}catch{return false}}
 function start(manual=false){if(dialog.open||(!manual&&hidden()))return;previous=document.activeElement;scroll=window.scrollY;index=0;$('.tour-storage-error').hidden=true;dialog.showModal();document.body.classList.add('tour-open');render();$('[data-next]').focus({preventScroll:true})}
 function close(){dialog.close()}
 dialog.addEventListener('close',()=>{document.body.classList.remove('tour-open');hideBox();window.scrollTo({top:scroll,behavior:'instant'});previous?.focus?.({preventScroll:true})});
 $('.tour-close').onclick=close;$('[data-prev]').onclick=()=>{if(index>0){index--;render()}};$('[data-next]').onclick=()=>{if(index===steps.length-1)close();else{index++;render()}};
 $('[data-dismiss]').onclick=()=>{try{localStorage.setItem(key,'1');if(localStorage.getItem(key)!=='1')throw Error();close()}catch{const e=$('.tour-storage-error');e.hidden=false;e.textContent='Tarayıcı tercihi kaydedemedi. Kalıcı olarak gizlemek için site depolamasına izin ver; şimdi × ile kapatabilirsin.'}};
 const reposition=()=>{cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(place)};window.addEventListener('resize',reposition);window.addEventListener('scroll',reposition,{passive:true});
 document.getElementById('tourLaunch')?.addEventListener('click',()=>start(true));
 function autoStart(){if(automaticStarted)return;automaticStarted=true;start()}
 document.addEventListener('odium:data-ready',autoStart,{once:true});setTimeout(autoStart,1500);
 window.OdiumTour={start:()=>start(true)};
})();
