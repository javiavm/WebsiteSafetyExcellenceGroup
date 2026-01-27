/**
 * PhD-Level Recommendations Engine
 * Generates specific, actionable, citation-backed recommendations
 * PRO feature - transforms generic advice into expert guidance
 */

/**
 * Enhanced recommendations by hazard type
 * Each includes: specific action, regulatory basis, implementation details
 */
const ENHANCED_RECOMMENDATIONS = {
  falls: {
    low: [
      {
        priority: 'critical',
        title: 'Establish Fall Protection Program',
        generic: 'Improve fall protection',
        enhanced: 'Develop written Fall Protection Plan per OSHA 1926.502(k). Must include: identification of all fall hazards, methods to address each hazard (guardrails, safety nets, PFAS), and rescue procedures.',
        citation: 'OSHA 1926.502(k) - Fall Protection Plan',
        implementation: [
          'Conduct fall hazard assessment for all elevated work areas',
          'Document guardrail requirements: 42" ± 3" top rail, mid-rail at 21", 4" toeboard',
          'Specify PFAS anchor points rated for 5,000 lbs per worker',
          'Establish rescue procedures with <6 minute response capability'
        ]
      },
      {
        priority: 'critical',
        title: 'Leading Edge Work Controls',
        generic: 'Address leading edge hazards',
        enhanced: 'For leading edge work at 6ft+, implement PFAS with shock-absorbing lanyards limiting MAF to 1,800 lbs. Alternatively, install warning line systems 6ft from edge with controlled access zones.',
        citation: 'OSHA 1926.501(b)(2), ANSI Z359.1-2020',
        implementation: [
          'Mark leading edges with high-visibility warning lines',
          'Position anchor points to prevent swing fall hazards',
          'Calculate fall clearance: free fall + deceleration + D-ring shift + safety margin',
          'Train workers on competent person identification of leading edges'
        ]
      }
    ],
    medium: [
      {
        priority: 'high',
        title: 'Hole Cover Program',
        generic: 'Cover floor openings',
        enhanced: 'Install covers capable of supporting 2x maximum intended load per OSHA 1926.502(i). Mark covers with "HOLE" or "COVER". Secure covers to prevent displacement.',
        citation: 'OSHA 1926.502(i)(1-4)',
        implementation: [
          'Calculate 2x maximum load for each opening',
          'Use plywood minimum 3/4" or equivalent for pedestrian traffic',
          'Secure with screws/bolts - nails insufficient',
          'Paint covers with "HOLE" in contrasting color'
        ]
      }
    ]
  },
  electrical: {
    low: [
      {
        priority: 'critical',
        title: 'Arc Flash Hazard Analysis',
        generic: 'Address electrical hazards',
        enhanced: 'Conduct arc flash hazard analysis per NFPA 70E Article 130.5. Label all equipment with incident energy levels (cal/cm²), arc flash boundary, and required PPE.',
        citation: 'NFPA 70E-2024 Article 130.5',
        implementation: [
          'Perform short circuit/coordination study',
          'Calculate incident energy at 18" working distance',
          'Label equipment with arc flash boundary and required PPE category',
          'Update labels when system changes occur'
        ]
      },
      {
        priority: 'critical',
        title: 'LOTO Program Enhancement',
        generic: 'Improve lockout/tagout',
        enhanced: 'Develop machine-specific LOTO procedures per OSHA 1910.147(c)(4). Each procedure must identify all energy sources, isolation points, and verification methods.',
        citation: 'OSHA 1910.147(c)(4)(i-ii)',
        implementation: [
          'Inventory all energy sources per machine (electrical, pneumatic, hydraulic, stored)',
          'Document isolation device locations with photos',
          'Specify verification method (try start, meter, bleed)',
          'Annual audit of procedures with employee input'
        ]
      }
    ],
    medium: [
      {
        priority: 'high',
        title: 'Electrical PPE Program',
        generic: 'Provide proper PPE',
        enhanced: 'Select voltage-rated gloves per ASTM D120 for voltage class. Implement glove inspection (air test) before each use and 6-month electrical testing.',
        citation: 'OSHA 1910.137, ASTM D120',
        implementation: [
          'Class 00: up to 500V AC, Class 0: up to 1,000V AC',
          'Air-inflate gloves and hold 10 seconds before each use',
          'Inspect for holes, cuts, embedded objects',
          'Send for lab testing every 6 months max'
        ]
      }
    ]
  },
  confined_space: {
    low: [
      {
        priority: 'critical',
        title: 'Permit-Required Program',
        generic: 'Establish confined space program',
        enhanced: 'Implement permit-required confined space program per OSHA 1910.146. Must include: written program, entry permits, attendant duties, rescue procedures, and atmospheric testing protocols.',
        citation: 'OSHA 1910.146(c)',
        implementation: [
          'Identify and post all permit spaces',
          'Develop entry permits documenting conditions and controls',
          'Ensure continuous atmospheric monitoring: O2 (19.5-23.5%), LEL (<10%), H2S (<10ppm), CO (<25ppm)',
          'Establish rescue capability: on-site team or 911 response <4 min'
        ]
      }
    ],
    medium: [
      {
        priority: 'high',
        title: 'Atmospheric Monitoring Enhancement',
        generic: 'Improve air monitoring',
        enhanced: 'Calibrate monitoring equipment per manufacturer specs (typically daily bump test, monthly span calibration). Test atmosphere at multiple levels: top, middle, bottom of space.',
        citation: 'OSHA 1910.146(c)(5)(ii)',
        implementation: [
          'Bump test before each use with known gas concentration',
          'Full calibration per manufacturer schedule',
          'Monitor continuously during occupancy',
          'Document all readings on entry permit'
        ]
      }
    ]
  },
  hazmat: {
    low: [
      {
        priority: 'critical',
        title: 'Hazard Communication Program',
        generic: 'Implement HazCom',
        enhanced: 'Update HazCom program to GHS alignment per OSHA 1910.1200. Maintain SDS within 15 minutes access, train workers on pictogram meanings and label elements.',
        citation: 'OSHA 1910.1200(e-h)',
        implementation: [
          'Develop written HazCom program',
          'Maintain SDS for all chemicals (physical or electronic, immediate access)',
          'Train on 9 GHS pictograms and their meanings',
          'Ensure all secondary containers labeled with product ID and hazard'
        ]
      }
    ]
  },
  crane_rigging: {
    low: [
      {
        priority: 'critical',
        title: 'Crane Operator Certification',
        generic: 'Ensure operator competency',
        enhanced: 'All crane operators must be certified by type and capacity per OSHA 1926.1427. Maintain certification documentation on-site. Recertify every 5 years.',
        citation: 'OSHA 1926.1427',
        implementation: [
          'Verify operator certification matches crane type/capacity',
          'Conduct equipment-specific orientation even for certified operators',
          'Document annual medical evaluation',
          'Post operator certification at crane'
        ]
      }
    ],
    medium: [
      {
        priority: 'high',
        title: 'Rigging Inspection Program',
        generic: 'Inspect rigging equipment',
        enhanced: 'Implement daily visual inspection of slings, shackles, and hardware per ASME B30.9. Document monthly thorough inspections. Remove from service if defects found.',
        citation: 'ASME B30.9, OSHA 1926.251',
        implementation: [
          'Daily visual: cuts, wear, corrosion, distortion',
          'Monthly documented: measure for capacity reduction',
          'Tag system: Green=OK, Yellow=Inspect, Red=Remove',
          'Maintain sling capacity charts at rigging area'
        ]
      }
    ]
  },
  excavation: {
    low: [
      {
        priority: 'critical',
        title: 'Excavation Competent Person',
        generic: 'Assign competent person',
        enhanced: 'Designate competent person trained in soil classification, protective systems, and hazard recognition per OSHA 1926.650. Must inspect excavations daily and after rain/freeze events.',
        citation: 'OSHA 1926.651(k)',
        implementation: [
          'Train CP in visual/manual soil testing methods',
          'Document daily inspections before worker entry',
          'Reinspect after rain, vibration, or freeze/thaw',
          'Authorize CP to remove workers immediately if hazard identified'
        ]
      }
    ]
  },
  hot_work: {
    low: [
      {
        priority: 'critical',
        title: 'Hot Work Permit System',
        generic: 'Implement hot work permits',
        enhanced: 'Establish hot work permit system per OSHA 1910.252 and NFPA 51B. Permits must document fire watch, sprinkler impairment, and atmospheric testing in confined areas.',
        citation: 'OSHA 1910.252(a), NFPA 51B',
        implementation: [
          'Clear combustibles 35ft radius or protect with fire blankets',
          'Post fire watch during work and 30 min after completion',
          'Test atmosphere if work in confined/enclosed space',
          'Notify fire protection if sprinklers impaired'
        ]
      }
    ]
  }
};

/**
 * Get enhanced recommendations based on assessment results
 * @param {object} results - Assessment results with gaps
 * @param {string} tool - 'stky' or 'sif'
 * @param {boolean} isPro - Whether user is Pro tier
 * @returns {array} Recommendations (enhanced for Pro)
 */
function getEnhancedRecommendations(results, tool, isPro = false) {
  const recommendations = [];

  if (!results.gaps || results.gaps.length === 0) {
    return recommendations;
  }

  for (const gap of results.gaps) {
    const hazardId = gap.hazardId || gap.hazard?.toLowerCase().replace(/\s+/g, '_');
    const severity = gap.gap === 'critical' ? 'low' : 'medium';

    // Get enhanced recommendations for this hazard
    const hazardRecs = ENHANCED_RECOMMENDATIONS[hazardId];
    if (!hazardRecs) continue;

    const severityRecs = hazardRecs[severity] || hazardRecs.low || [];

    for (const rec of severityRecs) {
      if (isPro) {
        // PRO gets full PhD-level recommendation
        recommendations.push({
          hazard: gap.hazard || hazardId,
          question: gap.question,
          priority: rec.priority,
          title: rec.title,
          recommendation: rec.enhanced,
          citation: rec.citation,
          implementation: rec.implementation,
          isPro: true
        });
      } else {
        // FREE gets generic recommendation with upgrade prompt
        recommendations.push({
          hazard: gap.hazard || hazardId,
          question: gap.question,
          priority: rec.priority,
          title: rec.title,
          recommendation: rec.generic,
          citation: null,
          implementation: null,
          isPro: false,
          upgradePrompt: 'Upgrade to Pro for specific implementation steps and regulatory citations'
        });
      }
    }
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations.slice(0, 10); // Top 10 recommendations
}

/**
 * Generate executive summary based on results
 * @param {object} results - Assessment results
 * @param {object} benchmark - Benchmark comparison (Pro only)
 * @returns {string} Executive summary
 */
function generateExecutiveSummary(results, benchmark = null) {
  const score = results.overall?.score || 0;
  const rating = results.overall?.rating?.label || 'Unknown';
  const criticalGaps = results.gaps?.filter(g => g.gap === 'critical')?.length || 0;

  let summary = `Assessment Score: ${score}/100 (${rating})\n`;

  if (benchmark) {
    summary += `Industry Ranking: ${benchmark.overall.percentileLabel} (${benchmark.overall.percentile}th percentile)\n`;
    summary += `vs. Industry Average: ${benchmark.overall.difference >= 0 ? '+' : ''}${benchmark.overall.difference} points\n`;
  }

  if (criticalGaps > 0) {
    summary += `\nCritical Gaps Identified: ${criticalGaps}`;
    summary += `\nPriority Action: Address critical gaps to reduce SIF exposure.`;
  }

  return summary;
}

module.exports = {
  getEnhancedRecommendations,
  generateExecutiveSummary,
  ENHANCED_RECOMMENDATIONS
};
