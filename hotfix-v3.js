/* ODIUM Marvel Rivals comic runtime v5 — Pages loader */
(async()=>{
  try{
    const url='https://raw.githubusercontent.com/thedrowned925/marvelrivalsodium/main/hotfix-v3.js?v=5.0&ts='+Date.now();
    const response=await fetch(url,{cache:'no-store'});
    if(!response.ok) throw new Error('Runtime fetch failed: '+response.status);
    const code=await response.text();
    (0,eval)(code);
  }catch(error){
    console.error('[ODIUM] Marvel Rivals runtime could not load',error);
    document.body.classList.add('rivals-theme');
  }
})();
