const express=require('express');
const router=express.Router();
const{analyzeMetrics,METRICS}=require('../../algorithms/metricsAnalyzer');
const db=require('../../database/db');
const WEBHOOK=process.env.GHL_WEBHOOK_METRICS||'METRICS_WEBHOOK_PLACEHOLDER';

router.get('/list',(req,res)=>res.json({metrics:METRICS}));

router.post('/analyze',async(req,res)=>{
    try{
        const{inputs,email,name,company,phone,industry,sessionId}=req.body;
        const results=analyzeMetrics(inputs);
        await db.run(`INSERT INTO tool_assessments(tool_name,session_id,email,name,company,phone,industry,inputs,results,score,rating,disclaimer_accepted_at)VALUES(?,?,?,?,?,?,?,?,?,?,?,datetime('now'))`,['metrics',sessionId,email,name,company,phone,industry,JSON.stringify(inputs),JSON.stringify(results),results.score,results.rating]);
        if(WEBHOOK!=='METRICS_WEBHOOK_PLACEHOLDER')fetch(WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'seg_metrics',email,name,company,metrics_score:results.score,metrics_rating:results.rating,issues:results.issues?.slice(0,3).map(i=>i.msg).join(', ')})}).catch(()=>{});
        res.json({success:true,results});
    }catch(e){console.error('[METRICS]',e.message);res.status(500).json({error:'Failed'})}
});
module.exports=router;
