const METRICS={lagging:[{id:'trir',name:'TRIR',fullName:'Total Recordable Incident Rate',validity:'low',issues:['Lagging indicator','Can be gamed','Doesn\'t predict SIF']},{id:'dart',name:'DART',fullName:'Days Away/Restricted/Transfer',validity:'low',issues:['Lagging indicator','Injury severity varies','Administrative manipulation']},{id:'ltir',name:'LTIR',fullName:'Lost Time Incident Rate',validity:'low',issues:['Lagging indicator','Doesn\'t capture near-misses','Poor SIF predictor']},{id:'emr',name:'EMR',fullName:'Experience Modification Rate',validity:'medium',issues:['Historical data','Insurance-focused','3-year lag']}],leading:[{id:'near_miss',name:'Near-Miss Reports',validity:'high',benefits:['Predictive','Proactive culture','Early warning']},{id:'hazard_id',name:'Hazard Identifications',validity:'high',benefits:['Predictive','Employee engagement','Prevention-focused']},{id:'observations',name:'Safety Observations',validity:'high',benefits:['Behavioral insights','Real-time data','Coaching opportunities']},{id:'training',name:'Training Completion',validity:'medium',benefits:['Compliance tracking','Competency baseline','Leading metric']},{id:'audit_close',name:'Audit Close Rate',validity:'medium',benefits:['System health','Corrective action','Accountability']}]};
function analyzeMetrics(inputs){
    const usedLagging=inputs.metricsUsed?.filter(m=>METRICS.lagging.some(l=>l.id===m))||[];
    const usedLeading=inputs.metricsUsed?.filter(m=>METRICS.leading.some(l=>l.id===m))||[];
    const laggingPct=inputs.metricsUsed?.length?Math.round(usedLagging.length/inputs.metricsUsed.length*100):0;
    const leadingPct=inputs.metricsUsed?.length?Math.round(usedLeading.length/inputs.metricsUsed.length*100):0;
    const issues=[];const recommendations=[];
    if(laggingPct>60){issues.push({type:'LAGGING_HEAVY',msg:'Over-reliance on lagging indicators'});recommendations.push('Add leading indicators like near-miss reporting')}
    if(usedLeading.length===0){issues.push({type:'NO_LEADING',msg:'No leading indicators tracked'});recommendations.push('Implement safety observation program')}
    if(inputs.usedForBonus){issues.push({type:'INCENTIVE_RISK',msg:'Metrics tied to bonuses can suppress reporting'});recommendations.push('Decouple safety metrics from financial incentives')}
    if(inputs.trifocused&&usedLeading.length<2){issues.push({type:'TRI_FOCUS',msg:'TRI-focused programs miss SIF precursors'});recommendations.push('Track SIF-specific precursors separately')}
    let score=50;score+=usedLeading.length*10;score-=usedLagging.length*5;if(inputs.usedForBonus)score-=15;if(inputs.tracksNearMiss)score+=10;if(inputs.tracksPrecursors)score+=15;
    score=Math.max(0,Math.min(100,score));
    const rating=score>=80?'Strong':score>=60?'Adequate':score>=40?'Weak':'At Risk';
    return{score,rating,laggingCount:usedLagging.length,leadingCount:usedLeading.length,laggingPct,leadingPct,issues,recommendations,breakdown:{lagging:usedLagging.map(id=>METRICS.lagging.find(m=>m.id===id)),leading:usedLeading.map(id=>METRICS.leading.find(m=>m.id===id))}}
}
module.exports={analyzeMetrics,METRICS};
