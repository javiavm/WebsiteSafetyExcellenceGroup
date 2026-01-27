const ToolUtils={
    getSessionId(){let id=sessionStorage.getItem('seg_session');if(!id){id='sess_'+Date.now()+'_'+Math.random().toString(36).substr(2,9);sessionStorage.setItem('seg_session',id)}return id},
    showStep(stepId){document.querySelectorAll('.step').forEach(s=>s.classList.remove('active'));const step=document.getElementById(stepId);if(step){step.classList.add('active');step.scrollIntoView({behavior:'smooth',block:'start'})}},
    async postJSON(url,data){const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(!res.ok)throw new Error(res.status);return res.json()},
    pulseScore(el){el.classList.add('pulse');setTimeout(()=>el.classList.remove('pulse'),300)},
    formatHazardName(id){return id.split('_').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ')},
    shuffle(arr){return[...arr].sort(()=>Math.random()-.5)},
    delay(ms){return new Promise(r=>setTimeout(r,ms))}
};
