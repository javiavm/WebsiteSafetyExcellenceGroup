const FRAMEWORK=require('../data/competency-framework.json').competencies;
function verifyConsultant(inputs){
    const breakdown=[];let totalScore=0;const flags=[];
    const certComp=FRAMEWORK.find(c=>c.id==='certifications');
    let certPts=0;(inputs.certifications||[]).forEach(cert=>{const item=certComp.items.find(i=>i.code===cert);if(item)certPts+=item.points});
    certPts=Math.min(certPts,certComp.weight);breakdown.push({category:'Certifications',score:certPts,max:certComp.weight});totalScore+=certPts;
    if(certPts===0)flags.push({type:'NO_CERTS',msg:'No recognized certifications'});
    const expComp=FRAMEWORK.find(c=>c.id==='experience');
    const expLevel=expComp.levels.find(l=>l.range===inputs.experience)||{points:0};
    breakdown.push({category:'Experience',score:expLevel.points,max:expComp.weight});totalScore+=expLevel.points;
    if(expLevel.points<=5)flags.push({type:'LOW_EXP',msg:'Limited industry experience'});
    const specComp=FRAMEWORK.find(c=>c.id==='specialization');
    const specMatch=inputs.industries?.some(i=>specComp.industries.includes(i));
    const specPts=specMatch?specComp.weight:0;
    breakdown.push({category:'Specialization',score:specPts,max:specComp.weight});totalScore+=specPts;
    const refComp=FRAMEWORK.find(c=>c.id==='references');
    let refPts=0;if(inputs.hasDirectRefs)refPts+=5;if(inputs.hasProjectRefs)refPts+=5;if(inputs.hasRecentRefs)refPts+=5;
    breakdown.push({category:'References',score:refPts,max:refComp.weight});totalScore+=refPts;
    if(refPts===0)flags.push({type:'NO_REFS',msg:'No verifiable references'});
    const insComp=FRAMEWORK.find(c=>c.id==='insurance');
    let insPts=0;if(inputs.hasEO)insPts+=5;if(inputs.hasGL)insPts+=5;if(inputs.hasWC)insPts+=5;
    breakdown.push({category:'Insurance',score:insPts,max:insComp.weight});totalScore+=insPts;
    if(insPts<10)flags.push({type:'INS_GAP',msg:'Insurance coverage gaps'});
    const rating=totalScore>=85?'Verified':totalScore>=70?'Qualified':totalScore>=50?'Conditional':'Not Recommended';
    return{score:totalScore,rating,breakdown,flags,recommendation:totalScore>=70?'Meets industry standards. Verify references directly.':'Significant gaps. Request additional documentation.'}
}
module.exports={verifyConsultant,FRAMEWORK};
