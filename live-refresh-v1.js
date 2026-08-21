/* ODIUM Marvel Rivals — revision-aware refresh guard v1.0 */
(()=>{
  const DATA_URL='https://raw.githubusercontent.com/thedrowned925/marvelrivalsodium/main/data/data.json';
  const originalLoad=window.load;
  if(typeof originalLoad!=='function')return;

  let knownRevision=null;
  let lastCheck=Date.now();
  let checking=false;
  const CHECK_MS=5*60*1000;

  async function fetchRevision(){
    const r=await fetch(`${DATA_URL}?rev=${Date.now()}`,{cache:'no-store'});
    if(!r.ok)throw new Error(`revision fetch ${r.status}`);
    const d=await r.json();
    return d?.dataRevision||null;
  }

  setTimeout(()=>fetchRevision().then(r=>{if(r)knownRevision=r}).catch(()=>{}),1500);

  async function guardedLoad(refresh=false){
    if(!refresh)return originalLoad.apply(this,arguments);

    const now=Date.now();
    if(now-lastCheck<CHECK_MS-5000)return Promise.resolve();
    if(checking)return Promise.resolve();
    lastCheck=now;
    checking=true;

    try{
      const nextRevision=await fetchRevision();
      if(nextRevision&&knownRevision&&nextRevision===knownRevision){
        if(typeof window.setSync==='function')window.setSync('online');
        return;
      }
      if(nextRevision)knownRevision=nextRevision;
      const result=await originalLoad.call(this,true);
      document.body.dispatchEvent(new CustomEvent('odium:data-rendered',{detail:{revision:knownRevision}}));
      return result;
    }catch(error){
      console.warn('[ODIUM] revision guard fallback',error);
      return originalLoad.call(this,true);
    }finally{
      checking=false;
    }
  }

  window.load=guardedLoad;
  try{load=guardedLoad}catch{}
})();
