/* One active poll per visible tab. Refocus and reconnect check immediately. */
(()=>{
 const interval=10000;let timer=null,running=false,pending=false,stopped=false;
 const visible=()=>!document.hidden&&navigator.onLine!==false&&!stopped;
 function schedule(){clearTimeout(timer);if(visible())timer=setTimeout(check,interval)}
 async function check(){
  clearTimeout(timer);if(!visible())return;
  if(running){pending=true;return}running=true;
  try{await window.OdiumLive?.refresh()}finally{running=false;if(pending){pending=false;check()}else schedule()}
 }
 document.addEventListener('visibilitychange',()=>document.hidden?clearTimeout(timer):check());
 window.addEventListener('focus',check);window.addEventListener('online',check);
 window.addEventListener('offline',()=>clearTimeout(timer));
 window.addEventListener('pagehide',()=>{stopped=true;clearTimeout(timer)});
 window.addEventListener('pageshow',()=>{if(stopped){stopped=false;check()}});
 schedule();
})();
