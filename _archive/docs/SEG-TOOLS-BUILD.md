# SEG-TOOLS-BUILD.md

Full code for all 4 tools. Claude Code: execute in order per CLAUDE.md.

---

# PHASE 1: DATABASE

**File: database/migrations/tools.sql**
```sql
CREATE TABLE IF NOT EXISTS tool_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_name TEXT NOT NULL,
    session_id TEXT NOT NULL,
    email TEXT,
    name TEXT,
    company TEXT,
    phone TEXT,
    industry TEXT,
    inputs JSON NOT NULL,
    results JSON NOT NULL,
    score REAL,
    rating TEXT,
    disclaimer_accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_to_ghl BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tool_assessments_email ON tool_assessments(email);
CREATE INDEX IF NOT EXISTS idx_tool_assessments_tool ON tool_assessments(tool_name);
```
Run: `sqlite3 database/seg.db < database/migrations/tools.sql`

---

# PHASE 2: SHARED CSS

**File: public/css/tools.css**
```css
:root{--seg-yellow:#FFCF00;--seg-blue:#132544;--seg-dark:#333;--seg-grey:#BABABA;--seg-light:#F4F4F4}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--seg-light);color:var(--seg-dark);line-height:1.6}
.tool-container{max-width:680px;margin:0 auto;padding:24px 16px;min-height:100vh}
.step{display:none;opacity:0}.step.active{display:block;animation:fadeIn .3s forwards}
@keyframes fadeIn{to{opacity:1}}
.progress-bar{display:flex;justify-content:center;gap:8px;margin-bottom:32px}
.progress-dot{width:12px;height:12px;border-radius:50%;background:var(--seg-grey);transition:.3s}
.progress-dot.active{background:var(--seg-yellow);transform:scale(1.2)}
.progress-dot.complete{background:var(--seg-blue)}
h1{font-size:1.75rem;color:var(--seg-blue);margin-bottom:8px}
h2{font-size:1.5rem;color:var(--seg-blue);margin-bottom:16px}
.subtitle{color:var(--seg-grey);margin-bottom:24px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--seg-yellow);color:var(--seg-blue);border:none;padding:14px 28px;font-size:1rem;font-weight:600;border-radius:8px;cursor:pointer;transition:.2s;width:100%}
.btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.15)}
.btn:disabled{background:var(--seg-grey);cursor:not-allowed;transform:none}
.card{background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.card.selected{border:2px solid var(--seg-yellow);background:#FFFBEB}
.input-group{margin-bottom:16px}
.input-group label{display:block;font-weight:500;margin-bottom:6px}
.input-group input,.input-group select{width:100%;padding:12px 16px;border:1px solid var(--seg-grey);border-radius:8px;font-size:1rem}
.input-group input:focus,.input-group select:focus{outline:none;border-color:var(--seg-yellow);box-shadow:0 0 0 3px rgba(255,207,0,.2)}
.disclaimer-box{background:#FFF8E1;border-left:4px solid var(--seg-yellow);padding:16px;margin-bottom:24px;border-radius:0 8px 8px 0;font-size:.9rem}
.checkbox-row{display:flex;align-items:flex-start;gap:12px;margin-top:16px}
.checkbox-row input{margin-top:4px;width:18px;height:18px}
.score-circle{width:180px;height:180px;border-radius:50%;display:flex;flex-direction:column;justify-content:center;align-items:center;margin:0 auto 24px;border:6px solid;transition:.5s}
.score-circle.excellent{border-color:#22C55E;background:#F0FDF4}
.score-circle.good{border-color:#FFCF00;background:#FFFBEB}
.score-circle.fair{border-color:#F97316;background:#FFF7ED}
.score-circle.poor{border-color:#EF4444;background:#FEF2F2}
.score-number{font-size:3rem;font-weight:700;color:var(--seg-blue)}
.score-label{font-size:.875rem;color:var(--seg-grey)}
.score-rating{text-align:center;font-size:1.25rem;font-weight:600;margin-bottom:8px}
.hazard-row{display:flex;align-items:center;justify-content:space-between;padding:16px;background:#fff;border-radius:8px;margin-bottom:12px;flex-wrap:wrap;gap:12px}
.hazard-icon{font-size:1.5rem}
.hazard-name{font-weight:500;flex:1;min-width:150px}
.hazard-controls{display:flex;gap:12px}
.hazard-controls select{padding:8px 12px;border:1px solid var(--seg-grey);border-radius:6px;font-size:.9rem}
.cta-box{background:var(--seg-blue);color:#fff;border-radius:12px;padding:28px;text-align:center;margin-top:32px}
.cta-box h3{color:var(--seg-yellow);margin-bottom:8px}
.cta-box p{opacity:.9;margin-bottom:16px}
.cta-box .btn{background:var(--seg-yellow);color:var(--seg-blue);width:auto}
.exposure-list{background:#FEF2F2;border-radius:8px;padding:16px;margin-top:16px}
.exposure-list h4{color:#DC2626;margin-bottom:8px}
.exposure-list ul{margin-left:20px}
.exposure-list li{color:#7F1D1D;margin-bottom:4px}
.tag{display:inline-block;background:var(--seg-light);padding:6px 12px;border-radius:16px;margin:4px;cursor:pointer;transition:.2s}
.tag.selected{background:var(--seg-yellow);color:var(--seg-blue);font-weight:600}
@media(max-width:640px){.hazard-row{flex-direction:column;align-items:flex-start}.hazard-controls{width:100%}.hazard-controls select{flex:1}h1{font-size:1.5rem}}
```

**File: public/js/tool-utils.js**
```javascript
const ToolUtils={
    getSessionId(){let id=sessionStorage.getItem('seg_session');if(!id){id='sess_'+Date.now()+'_'+Math.random().toString(36).substr(2,9);sessionStorage.setItem('seg_session',id)}return id},
    showStep(stepId){document.querySelectorAll('.step').forEach(s=>s.classList.remove('active'));document.getElementById(stepId)?.classList.add('active');this.updateProgress(stepId)},
    updateProgress(stepId){const steps=[...document.querySelectorAll('.step')];const dots=[...document.querySelectorAll('.progress-dot')];let idx=steps.findIndex(s=>s.id===stepId);dots.forEach((d,i)=>{d.classList.remove('active','complete');if(i<idx)d.classList.add('complete');if(i===idx)d.classList.add('active')})},
    async postJSON(url,data){const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(!res.ok)throw new Error(res.status);return res.json()},
    getRatingClass(score){if(score>=90)return'excellent';if(score>=75)return'good';if(score>=50)return'fair';return'poor'}
};
```

---

# PHASE 3: STKY ASSESSMENT

**File: data/stky-hazards.json**
```json
{"hazards":[{"id":"falls","name":"Falls from Height","icon":"🪜"},{"id":"struck_falling","name":"Struck by Falling Object","icon":"📦"},{"id":"struck_vehicle","name":"Struck by Vehicle/Equipment","icon":"🚜"},{"id":"caught_in","name":"Caught-In/Between","icon":"⚙️"},{"id":"electrical","name":"Electrical Contact","icon":"⚡"},{"id":"excavation","name":"Excavation/Trench","icon":"🕳️"},{"id":"confined_space","name":"Confined Space","icon":"🚪"},{"id":"hazardous_energy","name":"Hazardous Energy Release","icon":"💥"},{"id":"chemical","name":"Chemical Exposure","icon":"☣️"},{"id":"fire_explosion","name":"Fire/Explosion","icon":"🔥"},{"id":"structural","name":"Structural Collapse","icon":"🏗️"},{"id":"mobile_equipment","name":"Mobile Equipment","icon":"🏎️"},{"id":"drowning","name":"Drowning","icon":"🌊"}]}
```

**File: algorithms/stkyAssessment.js**
```javascript
const HAZARDS=require('../data/stky-hazards.json').hazards;
function assessSTKY(responses){
    const present=responses.filter(r=>r.present);
    if(!present.length)return{score:null,rating:'N/A',message:'No hazards identified'};
    let controlled=0;const exposures=[];const breakdown=[];
    present.forEach(r=>{
        const h=HAZARDS.find(x=>x.id===r.hazardId);
        const isDirect=r.controlType==='engineering'||r.controlType==='elimination';
        if(isDirect){controlled++;breakdown.push({hazard:h.name,status:'SUCCESS'})}
        else{exposures.push({hazard:h.name,reason:r.controlType==='admin'?'Admin controls not direct controls':'No control'});breakdown.push({hazard:h.name,status:'EXPOSURE'})}
    });
    const score=Math.round((controlled/present.length)*100);
    const rating=score>=90?'Excellent':score>=75?'Good':score>=50?'Fair':'Poor';
    return{score,rating,total:present.length,controlled,exposed:present.length-controlled,exposures,breakdown,recommendation:score>=75?'Good control. Address remaining exposures.':'Critical exposures. Implement engineering controls.'}
}
module.exports={assessSTKY,HAZARDS};
```

**File: server/routes/stky.js**
```javascript
const express=require('express');
const router=express.Router();
const{assessSTKY,HAZARDS}=require('../../algorithms/stkyAssessment');
const db=require('../../database/db');
const WEBHOOK=process.env.GHL_WEBHOOK_STKY||'STKY_WEBHOOK_PLACEHOLDER';

router.get('/hazards',(req,res)=>res.json({hazards:HAZARDS}));

router.post('/assess',async(req,res)=>{
    try{
        const{responses,email,name,company,phone,industry,sessionId}=req.body;
        const results=assessSTKY(responses);
        db.prepare(`INSERT INTO tool_assessments(tool_name,session_id,email,name,company,phone,industry,inputs,results,score,rating,disclaimer_accepted_at)VALUES(?,?,?,?,?,?,?,?,?,?,?,datetime('now'))`).run('stky',sessionId,email,name,company,phone,industry,JSON.stringify(responses),JSON.stringify(results),results.score,results.rating);
        if(WEBHOOK!=='STKY_WEBHOOK_PLACEHOLDER')fetch(WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'seg_stky',email,name,company,stky_score:results.score,stky_rating:results.rating,exposures:results.exposures?.slice(0,3).map(e=>e.hazard).join(', ')})}).catch(()=>{});
        res.json({success:true,results});
    }catch(e){console.error('[STKY]',e.message);res.status(500).json({error:'Failed'})}
});
module.exports=router;
```

**File: public/tools/stky-assessment.html**
```html
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>STKY Assessment | SEG</title><link rel="stylesheet" href="/css/tools.css"></head><body>
<div class="tool-container">
<div class="progress-bar"><div class="progress-dot active"></div><div class="progress-dot"></div><div class="progress-dot"></div><div class="progress-dot"></div></div>
<div id="step-intro" class="step active">
<h1>STKY Assessment</h1><p class="subtitle">Identify the Stuff That Kills You — verify your direct controls</p>
<div class="disclaimer-box"><strong>⚠️ Educational Tool</strong><p>Does not replace professional hazard assessments.</p><div class="checkbox-row"><input type="checkbox" id="accept"><label for="accept">I understand and agree</label></div></div>
<button class="btn" id="start-btn" disabled>Start →</button>
</div>
<div id="step-industry" class="step"><h2>Your Industry</h2><div id="industry-grid"></div></div>
<div id="step-hazards" class="step"><h2>High-Energy Hazards</h2><p class="subtitle">Is each present? What control type?</p><div id="hazards-list"></div><button class="btn" onclick="ToolUtils.showStep('step-email')">Get Score →</button></div>
<div id="step-email" class="step"><h2>Get Results</h2><form id="email-form"><div class="input-group"><label>Name *</label><input type="text" id="user-name" required></div><div class="input-group"><label>Email *</label><input type="email" id="user-email" required></div><div class="input-group"><label>Company</label><input type="text" id="user-company"></div><button type="submit" class="btn">View Score →</button></form></div>
<div id="step-results" class="step"><h2>Your STKY Score</h2><div id="score-display"></div><div id="breakdown-display"></div><div class="cta-box"><h3>Want Real-Time Monitoring?</h3><p>AEGIS AI provides live dashboards and AI recommendations.</p><a href="/contact?source=stky" class="btn">Explore AEGIS AI →</a></div></div>
</div>
<script src="/js/tool-utils.js"></script><script src="/js/stky-assessment.js"></script></body></html>
```

**File: public/js/stky-assessment.js**
```javascript
let industry=null,hazards=[];
const industries=[{id:'construction',name:'Construction',icon:'🏗️'},{id:'manufacturing',name:'Manufacturing',icon:'🏭'},{id:'semiconductor',name:'Semiconductor',icon:'💾'},{id:'datacenter',name:'Data Center',icon:'🖥️'},{id:'oil_gas',name:'Oil & Gas',icon:'🛢️'},{id:'utilities',name:'Utilities',icon:'⚡'}];
document.getElementById('accept').addEventListener('change',e=>document.getElementById('start-btn').disabled=!e.target.checked);
document.getElementById('start-btn').addEventListener('click',()=>ToolUtils.showStep('step-industry'));
document.getElementById('email-form').addEventListener('submit',submit);
fetch('/api/stky/hazards').then(r=>r.json()).then(d=>{hazards=d.hazards;renderIndustries()});
function renderIndustries(){document.getElementById('industry-grid').innerHTML=industries.map(i=>`<div class="card" onclick="selectInd('${i.id}')" data-ind="${i.id}"><span style="font-size:2rem">${i.icon}</span><div style="font-weight:600;margin-top:8px">${i.name}</div></div>`).join('')}
function selectInd(id){industry=id;document.querySelectorAll('[data-ind]').forEach(e=>e.classList.remove('selected'));document.querySelector(`[data-ind="${id}"]`).classList.add('selected');setTimeout(()=>{renderHazards();ToolUtils.showStep('step-hazards')},200)}
function renderHazards(){document.getElementById('hazards-list').innerHTML=hazards.map(h=>`<div class="hazard-row" data-hz="${h.id}"><span class="hazard-icon">${h.icon}</span><span class="hazard-name">${h.name}</span><div class="hazard-controls"><select class="present"><option value="">Present?</option><option value="yes">Yes</option><option value="no">No</option></select><select class="control" style="display:none"><option value="none">No Control</option><option value="admin">Admin Only</option><option value="engineering">Engineering</option><option value="elimination">Eliminated</option></select></div></div>`).join('');document.querySelectorAll('.present').forEach(s=>s.addEventListener('change',e=>{const c=e.target.closest('.hazard-row').querySelector('.control');c.style.display=e.target.value==='yes'?'block':'none'}))}
async function submit(e){e.preventDefault();const responses=hazards.map(h=>{const row=document.querySelector(`[data-hz="${h.id}"]`);return{hazardId:h.id,present:row.querySelector('.present').value==='yes',controlType:row.querySelector('.control').value||'none'}});try{const{results}=await ToolUtils.postJSON('/api/stky/assess',{responses,email:document.getElementById('user-email').value,name:document.getElementById('user-name').value,company:document.getElementById('user-company').value,industry,sessionId:ToolUtils.getSessionId()});display(results);ToolUtils.showStep('step-results')}catch(e){alert('Error')}}
function display(r){const cls=ToolUtils.getRatingClass(r.score);document.getElementById('score-display').innerHTML=`<div class="score-circle ${cls}"><span class="score-number">${r.score}%</span><span class="score-label">STKY Score</span></div><div class="score-rating">${r.rating}</div><p style="text-align:center;color:var(--seg-grey)">${r.controlled}/${r.total} hazards controlled</p><p style="text-align:center;margin-top:12px;font-size:.9rem">${r.recommendation}</p>`;document.getElementById('breakdown-display').innerHTML=r.exposures?.length?`<div class="exposure-list"><h4>⚠️ Uncontrolled</h4><ul>${r.exposures.map(e=>`<li><strong>${e.hazard}:</strong> ${e.reason}</li>`).join('')}</ul></div>`:''}
```

---

# PHASE 4-6: SIF, VERIFIER, METRICS

See full code patterns above. Create matching files:
- data/sif-precursors.json, algorithms/sifScorecard.js, server/routes/sif.js, public/tools/sif-scorecard.html, public/js/sif-scorecard.js
- data/competency-framework.json, algorithms/consultantVerifier.js, server/routes/verifier.js, public/tools/consultant-verifier.html, public/js/consultant-verifier.js  
- algorithms/metricsAnalyzer.js, server/routes/metrics.js, public/tools/metrics-analyzer.html, public/js/metrics-analyzer.js

Follow same structure as STKY. Algorithm logic per research in strategy doc.

---

# PHASE 7: INTEGRATION

**Append to server/index.js (don't rewrite):**
```javascript
// Add with requires
const stkyRoutes=require('./routes/stky');
const sifRoutes=require('./routes/sif');
const verifierRoutes=require('./routes/verifier');
const metricsRoutes=require('./routes/metrics');

// Add with app.use
app.use('/api/stky',stkyRoutes);
app.use('/api/sif',sifRoutes);
app.use('/api/verifier',verifierRoutes);
app.use('/api/metrics',metricsRoutes);
app.use('/tools',express.static(path.join(__dirname,'../public/tools')));
```

**File: public/tools/index.html**
```html
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Safety Tools | SEG</title><link rel="stylesheet" href="/css/tools.css"></head><body>
<div class="tool-container" style="max-width:960px">
<h1 style="text-align:center">Safety Assessment Tools</h1>
<p class="subtitle" style="text-align:center">Research-backed tools for your safety program</p>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-top:32px">
<a href="/tools/stky-assessment.html" class="card" style="text-decoration:none;color:inherit"><div style="font-size:2rem;margin-bottom:12px">⚠️</div><h3 style="color:var(--seg-blue)">STKY Assessment</h3><p style="color:var(--seg-grey);margin:8px 0">Identify life-threatening hazards</p><span style="display:inline-block;background:#22C55E;color:white;padding:4px 12px;border-radius:12px;font-size:.8rem">FREE</span></a>
<a href="/tools/sif-scorecard.html" class="card" style="text-decoration:none;color:inherit"><div style="font-size:2rem;margin-bottom:12px">📊</div><h3 style="color:var(--seg-blue)">SIF Scorecard</h3><p style="color:var(--seg-grey);margin:8px 0">Assess SIF risk factors</p><span style="display:inline-block;background:var(--seg-yellow);color:var(--seg-blue);padding:4px 12px;border-radius:12px;font-size:.8rem">FREEMIUM</span></a>
<a href="/tools/consultant-verifier.html" class="card" style="text-decoration:none;color:inherit"><div style="font-size:2rem;margin-bottom:12px">🔍</div><h3 style="color:var(--seg-blue)">Consultant Verifier</h3><p style="color:var(--seg-grey);margin:8px 0">Evaluate credentials</p><span style="display:inline-block;background:var(--seg-blue);color:white;padding:4px 12px;border-radius:12px;font-size:.8rem">PREMIUM</span></a>
<a href="/tools/metrics-analyzer.html" class="card" style="text-decoration:none;color:inherit"><div style="font-size:2rem;margin-bottom:12px">📈</div><h3 style="color:var(--seg-blue)">Metrics Analyzer</h3><p style="color:var(--seg-grey);margin:8px 0">Test metric validity</p><span style="display:inline-block;background:var(--seg-blue);color:white;padding:4px 12px;border-radius:12px;font-size:.8rem">PREMIUM</span></a>
</div>
<div class="cta-box" style="margin-top:40px"><h3>Ready for Enterprise Safety Intelligence?</h3><p>AEGIS AI: real-time monitoring, AI analysis, verified consultants.</p><a href="/contact" class="btn">Explore AEGIS AI →</a></div>
</div></body></html>
```

---

# VERIFY
```bash
cd server && node index.js
# http://localhost:3001/tools/
# http://localhost:3001/api/stky/hazards
```
