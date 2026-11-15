/* GHSS PWA <-> Google Apps Script bridge. */
(() => {
  "use strict";
  const API_URL = "https://script.google.com/macros/s/AKfycbyZb8IlgdLiwEgizJxZQBLLoJoXWR5i7oqtpT2BGkFx_Y0irwaQVwl8d7UV62vv4nIq/exec";
  const FRAME_NAME = "ghss_api_response_frame";
  let sequence = 0;
  const pending = new Map();
  function ensureFrame() {
    let frame = document.querySelector(`iframe[name="${FRAME_NAME}"]`);
    if (!frame) { frame=document.createElement("iframe"); frame.name=FRAME_NAME; frame.title="Background connection"; frame.style.display="none"; document.body.appendChild(frame); }
    return frame;
  }
  function postRequest(method,args) {
    return new Promise((resolve,reject)=>{
      const id="req_"+Date.now()+"_"+(++sequence);
      const timer=setTimeout(()=>{pending.delete(id);reject(new Error("Server response timeout. Internet connection check karein."));},30000);
      pending.set(id,{resolve,reject,timer});
      try {
        ensureFrame(); const form=document.createElement("form"); form.method="POST"; form.action=API_URL; form.target=FRAME_NAME; form.style.display="none";
        const field=document.createElement("input"); field.type="hidden"; field.name="payload"; field.value=JSON.stringify({id,method,args});
        form.appendChild(field); document.body.appendChild(form); form.submit(); form.remove();
      } catch(e) { clearTimeout(timer); pending.delete(id); reject(e); }
    });
  }
  window.addEventListener("message",event=>{
    const data=event.data; if(!data||typeof data!=="object"||!data.id||!pending.has(data.id)) return;
    const item=pending.get(data.id); pending.delete(data.id); clearTimeout(item.timer);
    if(data.ok) item.resolve(data.result); else item.reject(new Error(data.error||"Server request failed."));
  });
  function makeRunner(success,failure) {
    return new Proxy({}, {get(_target,method) {
      if(method==="withSuccessHandler") return fn=>makeRunner(fn,failure);
      if(method==="withFailureHandler") return fn=>makeRunner(success,fn);
      if(method==="withUserObject") return ()=>makeRunner(success,failure);
      return (...args)=>postRequest(String(method),args).then(result=>{
        if(method==="login"&&result&&result.token&&result.user&&window.cachePut) window.cachePut("offlineAuth",{token:result.token,user:result.user,savedAt:Date.now()}).catch(()=>{});
        if(method==="logout"&&window.cachePut) window.cachePut("offlineAuth",null).catch(()=>{});
        if(typeof success==="function") success(result);
      }).catch(err=>{if(typeof failure==="function") failure(err); else console.error(err);});
    }});
  }
  window.google=window.google||{}; window.google.script=window.google.script||{};
  Object.defineProperty(window.google.script,"run",{configurable:true,get(){return makeRunner(null,null);}});
  window.GHSS_API_ENDPOINT=API_URL;
})();