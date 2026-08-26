/* ODIUM Marvel Rivals every-visit cast notice */
(()=>{
  const backdrop=document.createElement('div');
  backdrop.className='mr-notice-backdrop';
  backdrop.setAttribute('role','presentation');
  backdrop.innerHTML=`
    <section class="mr-notice" role="dialog" aria-modal="true" aria-labelledby="mrNoticeTitle" aria-describedby="mrNoticeText">
      <div class="mr-notice-topline" aria-hidden="true"></div>
      <span class="mr-notice-corner" aria-hidden="true">// 06</span>
      <div class="mr-notice-inner">
        <div class="mr-notice-eyebrow">Marvel Rivals // Proje Duyurusu</div>
        <h2 id="mrNoticeTitle"><span>Önemli</span>Bilgilendirme</h2>
        <div class="mr-notice-copy" id="mrNoticeText">
          <p>Cast'ı belirlenmiş olan <strong>tüm seslendirme sanatçılarımızın</strong>, kendilerine ait kayıtları <span class="mr-notice-deadline">en geç 6 Eylül 2026</span> tarihine kadar tamamlamaları önemle rica olunur.</p>
          <p>Projenin kayıt, kontrol ve düzenleme sürecinin planlanan takvim doğrultusunda ilerleyebilmesi için belirtilen tarihe kadar kayıtların eksiksiz şekilde teslim edilmesi büyük önem taşımaktadır.</p>
          <p>Gösterdiğiniz özen ve emeğiniz için teşekkür ederiz.</p>
        </div>
        <p class="mr-notice-signature"><strong>Odium Stüdyo</strong> // Türkçe Dublaj Ekibi</p>
        <div class="mr-notice-actions">
          <span class="mr-notice-tag"><i aria-hidden="true"></i>Bu duyuru site her açıldığında gösterilir</span>
          <button class="mr-notice-accept" type="button">Anladım <span aria-hidden="true">↘</span></button>
        </div>
      </div>
    </section>`;

  document.body.appendChild(backdrop);
  document.body.classList.add('mr-notice-lock');
  const button=backdrop.querySelector('.mr-notice-accept');

  const close=()=>{
    backdrop.classList.remove('is-open');
    document.body.classList.remove('mr-notice-lock');
    window.setTimeout(()=>backdrop.remove(),320);
  };

  button.addEventListener('click',close);
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&backdrop.isConnected)close();
  },{once:true});

  requestAnimationFrame(()=>{
    backdrop.classList.add('is-open');
    button.focus({preventScroll:true});
  });
})();