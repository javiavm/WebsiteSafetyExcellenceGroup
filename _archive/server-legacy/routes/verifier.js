const express=require('express');
const router=express.Router();
const{verifyConsultant,FRAMEWORK}=require('../../algorithms/consultantVerifier');
const db=require('../../database/db');
const WEBHOOK=process.env.GHL_WEBHOOK_VERIFIER||'VERIFIER_WEBHOOK_PLACEHOLDER';

router.get('/framework',(req,res)=>res.json({framework:FRAMEWORK}));

router.post('/verify',async(req,res)=>{
    try{
        const{inputs,email,name,company,phone,sessionId}=req.body;
        const results=verifyConsultant(inputs);
        await db.run(`INSERT INTO tool_assessments(tool_name,session_id,email,name,company,phone,industry,inputs,results,score,rating,disclaimer_accepted_at)VALUES(?,?,?,?,?,?,?,?,?,?,?,datetime('now'))`,['verifier',sessionId,email,name,company,phone,inputs.consultantIndustry||'',JSON.stringify(inputs),JSON.stringify(results),results.score,results.rating]);
        if(WEBHOOK!=='VERIFIER_WEBHOOK_PLACEHOLDER')fetch(WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'seg_verifier',email,name,company,consultant_name:inputs.consultantName,verification_score:results.score,verification_rating:results.rating})}).catch(()=>{});
        res.json({success:true,results});
    }catch(e){console.error('[VERIFIER]',e.message);res.status(500).json({error:'Failed'})}
});
module.exports=router;
