# SEG-TOOLS-V3.md
## STKY + SIF Prototype Specs

---

# ARCHITECTURE

```
ENTRY → "What brought you here?" → Path selected → Filtered questions → Results

STKY Score ───┐
              ├──► SIF (skips overlap) ──► Metrics (future)
SIF Score ────┘
```

---

# DATABASE

## database/migrations/tools-v3.sql

```sql
CREATE TABLE IF NOT EXISTS tool_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    stky_score INTEGER,
    stky_completed BOOLEAN DEFAULT FALSE,
    sif_score INTEGER,
    sif_completed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tool_assessments_v3 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    tool TEXT NOT NULL,
    path TEXT NOT NULL,
    context JSON,
    responses JSON,
    scores JSON,
    gaps JSON,
    recommendations JSON,
    email TEXT,
    name TEXT,
    company TEXT,
    industry TEXT,
    disclaimer_accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_to_ghl BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (session_id) REFERENCES tool_sessions(session_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions ON tool_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_assessments_session ON tool_assessments_v3(session_id);
CREATE INDEX IF NOT EXISTS idx_assessments_tool ON tool_assessments_v3(tool);
```

---

# STKY ASSESSMENT (FREE)

## Entry Paths

```javascript
const STKY_PATHS = {
  close_call: {
    id: 'close_call',
    label: 'Close call shook us',
    description: 'Examine one hazard in depth',
    questions: 6,
    time: '90 sec',
    flow: 'single_hazard'
  },
  audit: {
    id: 'audit',
    label: 'Audit coming',
    description: 'Full program review',
    questions: 35,
    time: '5 min',
    flow: 'all_hazards'
  },
  new_project: {
    id: 'new_project',
    label: 'New project starting',
    description: 'Pre-project risk snapshot',
    questions: 20,
    time: '3 min',
    flow: 'top_hazards'
  },
  new_role: {
    id: 'new_role',
    label: 'Took over safety, need a read',
    description: 'Baseline maturity assessment',
    questions: 35,
    time: '5 min',
    flow: 'all_hazards'
  },
  leadership: {
    id: 'leadership',
    label: 'Leadership asking questions I can\'t answer',
    description: 'Exec-ready summary',
    questions: 20,
    time: '3 min',
    flow: 'top_hazards'
  },
  gut: {
    id: 'gut',
    label: 'Gut says something\'s off',
    description: 'Find the blind spot',
    questions: 35,
    time: '5 min',
    flow: 'all_hazards'
  }
};
```

## Context Questions

```javascript
const STKY_CONTEXT = [
  {
    id: 'industry',
    question: 'Industry',
    options: [
      { value: 'semiconductor', label: 'Semiconductor' },
      { value: 'datacenter', label: 'Data Center' },
      { value: 'construction', label: 'Construction' },
      { value: 'manufacturing', label: 'Manufacturing' },
      { value: 'oil_gas', label: 'Oil & Gas' },
      { value: 'utilities', label: 'Utilities' }
    ]
  },
  {
    id: 'phase',
    question: 'Project phase',
    options: [
      { value: 'greenfield', label: 'Greenfield' },
      { value: 'expansion', label: 'Expansion' },
      { value: 'retrofit', label: 'Retrofit' },
      { value: 'steady_state', label: 'Steady-State Operations' }
    ]
  },
  {
    id: 'workforce',
    question: 'Workforce mix',
    options: [
      { value: 'employees', label: '75%+ employees' },
      { value: 'contractors', label: '75%+ contractors' },
      { value: 'mixed', label: 'Mixed' }
    ]
  },
  {
    id: 'regulatory',
    question: 'Primary regulatory frame',
    options: [
      { value: '1910', label: '1910 General Industry' },
      { value: '1926', label: '1926 Construction' },
      { value: 'both', label: 'Both' }
    ]
  },
  {
    id: 'ownership',
    question: 'Who owns site safety?',
    options: [
      { value: 'dedicated_ehs', label: 'Dedicated EHS' },
      { value: 'ops_leader', label: 'Operations leader' },
      { value: 'shared', label: 'Shared' },
      { value: 'unclear', label: 'Unclear' }
    ]
  }
];
```

## Hazard Questions

```javascript
const STKY_HAZARDS = {
  hazardous_energy: {
    id: 'hazardous_energy',
    name: 'Hazardous Energy (LOTO)',
    icon: '⚡',
    questions: [
      {
        id: 'he_1',
        question: 'How is "zero energy" verified before work?',
        options: [
          { value: 'try_test', label: 'Try/test required', score: 100 },
          { value: 'visual', label: 'Visual only', score: 40 },
          { value: 'judgment', label: 'Worker judgment', score: 10 }
        ]
      },
      {
        id: 'he_2',
        question: 'Does LOTO apply to ALL energy types?',
        options: [
          { value: 'all', label: 'All (electrical, pneumatic, hydraulic, gravity, thermal)', score: 100 },
          { value: 'electrical', label: 'Electrical only', score: 30 },
          { value: 'varies', label: 'Varies by task', score: 50 }
        ]
      },
      {
        id: 'he_3',
        question: 'Who can authorize LOTO bypass or deviation?',
        options: [
          { value: 'no_one', label: 'No one — never allowed', score: 100 },
          { value: 'documented', label: 'Documented approval chain', score: 70 },
          { value: 'supervisor', label: 'Supervisor discretion', score: 20 }
        ]
      },
      {
        id: 'he_4',
        question: 'Are contractors on YOUR site-specific LOTO?',
        options: [
          { value: 'trained_verified', label: 'Trained + verified', score: 100 },
          { value: 'trained', label: 'Trained only', score: 60 },
          { value: 'own', label: 'Use their own program', score: 30 },
          { value: 'unclear', label: 'Unclear', score: 10 }
        ]
      },
      {
        id: 'he_5',
        question: 'Last third-party LOTO audit?',
        options: [
          { value: 'under_1', label: 'Within 1 year', score: 100 },
          { value: '1_3', label: '1-3 years', score: 70 },
          { value: 'over_3', label: 'Over 3 years', score: 40 },
          { value: 'never', label: 'Never', score: 10 }
        ]
      }
    ]
  },

  falls: {
    id: 'falls',
    name: 'Falls (Working at Heights)',
    icon: '🪜',
    questions: [
      {
        id: 'fa_1',
        question: 'What triggers fall protection?',
        options: [
          { value: 'both', label: 'Height threshold + task-based risk assessment', score: 100 },
          { value: 'height', label: 'Height threshold only', score: 60 },
          { value: 'task', label: 'Task-based only', score: 70 }
        ]
      },
      {
        id: 'fa_2',
        question: 'Control philosophy',
        options: [
          { value: 'hierarchy', label: 'Eliminate → Guardrail → PPE last', score: 100 },
          { value: 'ppe_first', label: 'PPE-first', score: 20 },
          { value: 'task_dependent', label: 'Task-dependent', score: 50 }
        ]
      },
      {
        id: 'fa_3',
        question: 'Who authorizes anchor points?',
        options: [
          { value: 'engineered', label: 'Engineered + inspected only', score: 100 },
          { value: 'competent', label: 'Competent person', score: 70 },
          { value: 'worker', label: 'Worker selects', score: 10 }
        ]
      },
      {
        id: 'fa_4',
        question: 'Rescue capability',
        options: [
          { value: 'team_tested', label: 'On-site team + drill tested', score: 100 },
          { value: 'equipment', label: 'Equipment in place, untested', score: 40 },
          { value: '911', label: 'Call 911', score: 10 }
        ]
      },
      {
        id: 'fa_5',
        question: 'Leading edge work',
        options: [
          { value: 'separate', label: 'Separate procedure + permit', score: 100 },
          { value: 'same', label: 'Same as general fall protection', score: 50 },
          { value: 'not_addressed', label: 'Not addressed', score: 10 }
        ]
      }
    ]
  },

  electrical: {
    id: 'electrical',
    name: 'Electrical',
    icon: '🔌',
    questions: [
      {
        id: 'el_1',
        question: 'Arc flash study status',
        options: [
          { value: 'current', label: 'Current (within 5 years)', score: 100 },
          { value: 'outdated', label: 'Outdated', score: 40 },
          { value: 'none', label: 'None', score: 10 },
          { value: 'unknown', label: 'Unknown', score: 5 }
        ]
      },
      {
        id: 'el_2',
        question: 'How is "dead" verified?',
        options: [
          { value: 'test', label: 'Test for absence of voltage required', score: 100 },
          { value: 'lockout', label: 'Lockout assumed sufficient', score: 30 },
          { value: 'visual', label: 'Visual', score: 10 }
        ]
      },
      {
        id: 'el_3',
        question: 'Who can authorize energized work?',
        options: [
          { value: 'no_one', label: 'No one — always de-energize', score: 100 },
          { value: 'engineering', label: 'Engineering approval required', score: 70 },
          { value: 'supervisor', label: 'Supervisor', score: 20 }
        ]
      },
      {
        id: 'el_4',
        question: 'Approach boundaries established for',
        options: [
          { value: 'all', label: 'All panel work', score: 100 },
          { value: 'high', label: 'Only known high-energy', score: 50 },
          { value: 'none', label: 'Not established', score: 10 }
        ]
      },
      {
        id: 'el_5',
        question: 'PPE selected by',
        options: [
          { value: 'calculation', label: 'Incident energy calculation', score: 100 },
          { value: 'category', label: 'General category', score: 50 },
          { value: 'judgment', label: 'Supervisor judgment', score: 10 }
        ]
      }
    ]
  },

  confined_space: {
    id: 'confined_space',
    name: 'Confined Space',
    icon: '🚪',
    questions: [
      {
        id: 'cs_1',
        question: 'Space classification',
        options: [
          { value: 'tiered', label: 'Risk-tiered (permit vs non-permit)', score: 100 },
          { value: 'all_same', label: 'All treated same', score: 50 },
          { value: 'not_classified', label: 'Not classified', score: 10 }
        ]
      },
      {
        id: 'cs_2',
        question: 'Atmospheric monitoring',
        options: [
          { value: 'continuous', label: 'Continuous during entry', score: 100 },
          { value: 'pre_entry', label: 'Pre-entry only', score: 40 },
          { value: 'judgment', label: 'Entrant judgment', score: 10 }
        ]
      },
      {
        id: 'cs_3',
        question: 'What triggers entry termination?',
        options: [
          { value: 'alarm', label: 'Any alarm + documented threshold', score: 100 },
          { value: 'attendant', label: 'Attendant judgment', score: 40 },
          { value: 'none', label: 'No defined trigger', score: 10 }
        ]
      },
      {
        id: 'cs_4',
        question: 'Rescue method',
        options: [
          { value: 'retrieval_team', label: 'Retrieval system + on-site team', score: 100 },
          { value: 'team_only', label: 'On-site team only', score: 60 },
          { value: 'external', label: 'External rescue (911)', score: 10 }
        ]
      },
      {
        id: 'cs_5',
        question: 'Non-permit space re-evaluation',
        options: [
          { value: 'periodic', label: 'Periodic + documented', score: 100 },
          { value: 'conditions', label: 'When conditions change', score: 60 },
          { value: 'never', label: 'Never', score: 10 }
        ]
      }
    ]
  },

  caught_in: {
    id: 'caught_in',
    name: 'Caught-In/Between',
    icon: '⚙️',
    questions: [
      {
        id: 'ci_1',
        question: 'Machine hazard inventory',
        options: [
          { value: 'complete', label: 'Complete + current', score: 100 },
          { value: 'outdated', label: 'Exists but outdated', score: 50 },
          { value: 'none', label: 'None', score: 10 }
        ]
      },
      {
        id: 'ci_2',
        question: 'Guard removal',
        options: [
          { value: 'permit', label: 'Permit + lockout required', score: 100 },
          { value: 'supervisor', label: 'Supervisor approval', score: 50 },
          { value: 'none', label: 'No protocol', score: 10 }
        ]
      },
      {
        id: 'ci_3',
        question: 'Interlock bypass',
        options: [
          { value: 'prevented', label: 'Physically prevented', score: 100 },
          { value: 'logged', label: 'Logged + time-limited', score: 70 },
          { value: 'available', label: 'Available when needed', score: 10 }
        ]
      },
      {
        id: 'ci_4',
        question: 'Who verifies guards post-maintenance?',
        options: [
          { value: 'independent', label: 'Independent check required', score: 100 },
          { value: 'self', label: 'Maintenance self-verify', score: 40 },
          { value: 'none', label: 'No verification', score: 10 }
        ]
      },
      {
        id: 'ci_5',
        question: 'Pinch point training',
        options: [
          { value: 'task_specific', label: 'Task-specific + hands-on', score: 100 },
          { value: 'general', label: 'General awareness', score: 50 },
          { value: 'hire_only', label: 'At hire only', score: 20 }
        ]
      }
    ]
  },

  chemical: {
    id: 'chemical',
    name: 'Chemical',
    icon: '☣️',
    questions: [
      {
        id: 'ch_1',
        question: 'Can workers name top 3 lethal chemicals on site?',
        options: [
          { value: 'tested', label: 'Yes — tested', score: 100 },
          { value: 'probably', label: 'Probably', score: 60 },
          { value: 'unlikely', label: 'Unlikely', score: 20 },
          { value: 'unknown', label: 'Unknown', score: 10 }
        ]
      },
      {
        id: 'ch_2',
        question: 'Exposure monitoring',
        options: [
          { value: 'routine', label: 'Routine + documented', score: 100 },
          { value: 'event', label: 'Event-triggered', score: 50 },
          { value: 'none', label: 'None', score: 10 }
        ]
      },
      {
        id: 'ch_3',
        question: 'PPE changes when task changes?',
        options: [
          { value: 'reassessment', label: 'Formal reassessment', score: 100 },
          { value: 'judgment', label: 'Worker judgment', score: 40 },
          { value: 'same', label: 'Same PPE all tasks', score: 10 }
        ]
      },
      {
        id: 'ch_4',
        question: 'Emergency response',
        options: [
          { value: 'team_drilled', label: 'On-site team + drilled', score: 100 },
          { value: 'team_not_drilled', label: 'Trained responders, not drilled', score: 50 },
          { value: 'external', label: 'External only', score: 10 }
        ]
      },
      {
        id: 'ch_5',
        question: 'High-hazard chemical authorization',
        options: [
          { value: 'permit', label: 'Permit required', score: 100 },
          { value: 'supervisor', label: 'Supervisor approval', score: 50 },
          { value: 'none', label: 'No restriction', score: 10 }
        ]
      }
    ]
  }
};
```

## Industry-Hazard Mapping

```javascript
const INDUSTRY_HAZARDS = {
  semiconductor: ['hazardous_energy', 'chemical', 'electrical', 'confined_space', 'caught_in'],
  datacenter: ['electrical', 'confined_space', 'hazardous_energy', 'falls', 'chemical'],
  construction: ['falls', 'hazardous_energy', 'caught_in', 'electrical', 'confined_space'],
  manufacturing: ['caught_in', 'hazardous_energy', 'chemical', 'electrical', 'confined_space'],
  oil_gas: ['confined_space', 'chemical', 'hazardous_energy', 'electrical', 'falls'],
  utilities: ['electrical', 'falls', 'confined_space', 'hazardous_energy', 'caught_in']
};

// Top 3 for "top_hazards" flow paths
const INDUSTRY_TOP_HAZARDS = {
  semiconductor: ['hazardous_energy', 'chemical', 'electrical'],
  datacenter: ['electrical', 'confined_space', 'hazardous_energy'],
  construction: ['falls', 'hazardous_energy', 'caught_in'],
  manufacturing: ['caught_in', 'hazardous_energy', 'chemical'],
  oil_gas: ['confined_space', 'chemical', 'hazardous_energy'],
  utilities: ['electrical', 'falls', 'confined_space']
};
```

## Scoring Logic

```javascript
function scoreSTKY(responses, context) {
  const hazardScores = {};
  let totalScore = 0;
  let hazardCount = 0;

  for (const [hazardId, answers] of Object.entries(responses.hazards)) {
    const hazard = STKY_HAZARDS[hazardId];
    let hazardTotal = 0;

    for (const [qId, value] of Object.entries(answers)) {
      const question = hazard.questions.find(q => q.id === qId);
      const option = question.options.find(o => o.value === value);
      hazardTotal += option.score;
    }

    const hazardScore = Math.round(hazardTotal / hazard.questions.length);
    hazardScores[hazardId] = {
      score: hazardScore,
      rating: getRating(hazardScore),
      gaps: identifyGaps(hazardId, answers)
    };

    totalScore += hazardScore;
    hazardCount++;
  }

  const overallScore = Math.round(totalScore / hazardCount);

  return {
    overall: {
      score: overallScore,
      rating: getRating(overallScore)
    },
    hazards: hazardScores,
    recommendations: generateRecommendations(hazardScores, context)
  };
}

function getRating(score) {
  if (score >= 85) return { label: 'Controlled', color: '#22C55E' };
  if (score >= 70) return { label: 'Managed', color: '#FFCF00' };
  if (score >= 50) return { label: 'Developing', color: '#F97316' };
  return { label: 'Exposed', color: '#EF4444' };
}

function identifyGaps(hazardId, answers) {
  const gaps = [];
  const hazard = STKY_HAZARDS[hazardId];

  for (const [qId, value] of Object.entries(answers)) {
    const question = hazard.questions.find(q => q.id === qId);
    const option = question.options.find(o => o.value === value);
    if (option.score < 60) {
      gaps.push({
        question: question.question,
        current: option.label,
        gap: option.score < 30 ? 'critical' : 'notable'
      });
    }
  }

  return gaps;
}

function generateRecommendations(hazardScores, context) {
  const recs = [];

  for (const [hazardId, data] of Object.entries(hazardScores)) {
    // Third-party audit recommendation
    const auditQ = data.gaps.find(g => g.question.includes('audit'));
    if (data.score < 70 && (!auditQ || auditQ.current === 'Never')) {
      recs.push({
        hazard: STKY_HAZARDS[hazardId].name,
        type: 'third_party_audit',
        message: 'Third-party assessment would surface gaps internal reviews miss.'
      });
    }

    // Critical gaps
    const criticalGaps = data.gaps.filter(g => g.gap === 'critical');
    if (criticalGaps.length > 0) {
      recs.push({
        hazard: STKY_HAZARDS[hazardId].name,
        type: 'critical',
        message: `Critical gaps: ${criticalGaps.map(g => g.question).join(', ')}`
      });
    }
  }

  return recs;
}
```

---

# SIF SCORECARD (FREEMIUM)

## Entry Paths

```javascript
const SIF_PATHS = {
  close_call: {
    id: 'close_call',
    label: 'Had a close call, was it a P-SIF?',
    description: 'Classify a single event',
    questions: 5,
    time: '60 sec',
    flow: 'single_event'
  },
  log_review: {
    id: 'log_review',
    label: 'Near-miss log growing, which ones matter?',
    description: 'Learn to filter P-SIFs',
    questions: 15,
    time: '2 min',
    flow: 'classification'
  },
  building_program: {
    id: 'building_program',
    label: 'Building a SIF prevention program',
    description: 'Precursor baseline',
    questions: 25,
    time: '4 min',
    flow: 'full_precursors'
  },
  leadership: {
    id: 'leadership',
    label: 'Leadership wants SIF metrics',
    description: 'Exec-ready framing',
    questions: 15,
    time: '2 min',
    flow: 'classification'
  },
  predict: {
    id: 'predict',
    label: 'We react, want to predict',
    description: 'Leading indicator focus',
    questions: 25,
    time: '4 min',
    flow: 'full_precursors'
  }
};
```

## Context Questions

```javascript
const SIF_CONTEXT = [
  {
    id: 'industry',
    question: 'Industry',
    options: [
      { value: 'semiconductor', label: 'Semiconductor' },
      { value: 'datacenter', label: 'Data Center' },
      { value: 'construction', label: 'Construction' },
      { value: 'manufacturing', label: 'Manufacturing' },
      { value: 'oil_gas', label: 'Oil & Gas' },
      { value: 'utilities', label: 'Utilities' }
    ]
  },
  {
    id: 'near_miss_volume',
    question: 'Annual near-miss reports (estimate)',
    options: [
      { value: 'under_50', label: 'Under 50' },
      { value: '50_200', label: '50-200' },
      { value: '200_500', label: '200-500' },
      { value: 'over_500', label: 'Over 500' }
    ]
  },
  {
    id: 'classification_method',
    question: 'How do you classify near-misses today?',
    options: [
      { value: 'energy', label: 'Energy-based (SIF potential)' },
      { value: 'severity', label: 'Severity-based (what could have happened)' },
      { value: 'gut', label: 'Gut feel' },
      { value: 'none', label: 'We don\'t classify' }
    ]
  },
  {
    id: 'reviewer',
    question: 'Who reviews near-misses?',
    options: [
      { value: 'committee', label: 'Safety committee' },
      { value: 'ehs', label: 'EHS' },
      { value: 'supervisor', label: 'Supervisor' },
      { value: 'no_one', label: 'No one consistently' }
    ]
  }
];
```

## Precursor Questions (Net-New Only — Others Pulled from STKY)

```javascript
const SIF_PRECURSORS = {
  line_of_fire: {
    id: 'line_of_fire',
    name: 'Line of Fire',
    weight: 12,
    questions: [
      {
        id: 'lof_1',
        question: 'Exclusion zones defined before energy release?',
        options: [
          { value: 'always', label: 'Always — verified', score: 100 },
          { value: 'usually', label: 'Usually', score: 60 },
          { value: 'rarely', label: 'Rarely', score: 20 }
        ]
      },
      {
        id: 'lof_2',
        question: 'Workers positioned by',
        options: [
          { value: 'procedure', label: 'Procedure', score: 100 },
          { value: 'habit', label: 'Habit', score: 30 },
          { value: 'convenience', label: 'Convenience', score: 10 }
        ]
      },
      {
        id: 'lof_3',
        question: 'Who can enter an active energy zone?',
        options: [
          { value: 'no_one', label: 'No one — physically prevented', score: 100 },
          { value: 'authorized', label: 'Authorized personnel', score: 60 },
          { value: 'anyone', label: 'Anyone aware of hazard', score: 20 }
        ]
      }
    ]
  },

  mobile_equipment: {
    id: 'mobile_equipment',
    name: 'Mobile Equipment',
    weight: 10,
    questions: [
      {
        id: 'me_1',
        question: 'Pedestrian/equipment separation',
        options: [
          { value: 'physical', label: 'Physical barriers', score: 100 },
          { value: 'procedural', label: 'Procedural only', score: 40 },
          { value: 'none', label: 'Not separated', score: 10 }
        ]
      },
      {
        id: 'me_2',
        question: 'Spotter required when?',
        options: [
          { value: 'always', label: 'Always for reverse/blind spots', score: 100 },
          { value: 'sometimes', label: 'High-traffic areas only', score: 50 },
          { value: 'never', label: 'Not required', score: 10 }
        ]
      },
      {
        id: 'me_3',
        question: 'Blind spot technology',
        options: [
          { value: 'cameras_alarms', label: 'Cameras + alarms', score: 100 },
          { value: 'alarms', label: 'Alarms only', score: 50 },
          { value: 'none', label: 'None', score: 20 }
        ]
      }
    ]
  },

  lifting: {
    id: 'lifting',
    name: 'Lifting & Rigging',
    weight: 8,
    questions: [
      {
        id: 'li_1',
        question: 'Lift plan required at what threshold?',
        options: [
          { value: 'all', label: 'All lifts documented', score: 100 },
          { value: 'critical', label: 'Critical lifts only', score: 60 },
          { value: 'none', label: 'No threshold defined', score: 10 }
        ]
      },
      {
        id: 'li_2',
        question: 'Who determines "critical lift"?',
        options: [
          { value: 'engineering', label: 'Engineering criteria', score: 100 },
          { value: 'competent', label: 'Competent person', score: 70 },
          { value: 'operator', label: 'Operator', score: 20 }
        ]
      },
      {
        id: 'li_3',
        question: 'Load chart verification',
        options: [
          { value: 'independent', label: 'Independent check', score: 100 },
          { value: 'operator', label: 'Operator self-verify', score: 40 },
          { value: 'none', label: 'Not verified', score: 10 }
        ]
      }
    ]
  },

  excavation: {
    id: 'excavation',
    name: 'Excavation',
    weight: 6,
    questions: [
      {
        id: 'ex_1',
        question: 'Competent person on every dig?',
        options: [
          { value: 'always', label: 'Always — documented', score: 100 },
          { value: 'usually', label: 'Usually', score: 50 },
          { value: 'not_defined', label: 'Not defined', score: 10 }
        ]
      },
      {
        id: 'ex_2',
        question: 'Utility locate verification',
        options: [
          { value: 'pothole', label: 'Pothole/hand dig required', score: 100 },
          { value: 'marks', label: 'Rely on locate marks', score: 40 },
          { value: 'assumed', label: 'Assumed from prints', score: 10 }
        ]
      },
      {
        id: 'ex_3',
        question: 'Entry protocol begins at',
        options: [
          { value: '4ft', label: '4 feet', score: 100 },
          { value: '5ft', label: '5 feet', score: 80 },
          { value: 'varies', label: 'Varies', score: 40 }
        ]
      }
    ]
  },

  hot_work: {
    id: 'hot_work',
    name: 'Hot Work',
    weight: 6,
    questions: [
      {
        id: 'hw_1',
        question: 'Permit scope',
        options: [
          { value: 'all', label: 'All hot work, all areas', score: 100 },
          { value: 'non_designated', label: 'Non-designated areas only', score: 50 },
          { value: 'none', label: 'No permit system', score: 10 }
        ]
      },
      {
        id: 'hw_2',
        question: 'Fire watch duration post-work',
        options: [
          { value: '60_min', label: '60+ minutes', score: 100 },
          { value: '30_min', label: '30 minutes', score: 70 },
          { value: 'none', label: 'No fire watch', score: 10 }
        ]
      },
      {
        id: 'hw_3',
        question: 'Who authorizes hot work in non-designated areas?',
        options: [
          { value: 'ehs', label: 'EHS approval required', score: 100 },
          { value: 'supervisor', label: 'Supervisor', score: 50 },
          { value: 'worker', label: 'Worker discretion', score: 10 }
        ]
      }
    ]
  },

  structural: {
    id: 'structural',
    name: 'Structural Integrity',
    weight: 5,
    questions: [
      {
        id: 'st_1',
        question: 'Load limits posted + enforced?',
        options: [
          { value: 'both', label: 'Posted + enforced', score: 100 },
          { value: 'posted', label: 'Posted only', score: 40 },
          { value: 'neither', label: 'Neither', score: 10 }
        ]
      },
      {
        id: 'st_2',
        question: 'Structural inspection frequency',
        options: [
          { value: 'scheduled', label: 'Scheduled + documented', score: 100 },
          { value: 'annual', label: 'Annual', score: 60 },
          { value: 'none', label: 'None', score: 10 }
        ]
      },
      {
        id: 'st_3',
        question: 'Temporary load authorization',
        options: [
          { value: 'engineering', label: 'Engineering approval', score: 100 },
          { value: 'supervisor', label: 'Supervisor', score: 40 },
          { value: 'none', label: 'No authorization needed', score: 10 }
        ]
      }
    ]
  },

  fatigue: {
    id: 'fatigue',
    name: 'Fatigue & Impairment',
    weight: 5,
    questions: [
      {
        id: 'ft_1',
        question: 'Hours tracked?',
        options: [
          { value: 'system', label: 'Automated system', score: 100 },
          { value: 'manual', label: 'Manual tracking', score: 60 },
          { value: 'none', label: 'Not tracked', score: 10 }
        ]
      },
      {
        id: 'ft_2',
        question: 'Fitness for duty program',
        options: [
          { value: 'comprehensive', label: 'Comprehensive (fatigue + substances)', score: 100 },
          { value: 'substances', label: 'Substances only', score: 50 },
          { value: 'none', label: 'None', score: 10 }
        ]
      },
      {
        id: 'ft_3',
        question: 'Who can stop work for fatigue?',
        options: [
          { value: 'anyone', label: 'Anyone — no questions', score: 100 },
          { value: 'supervisor', label: 'Supervisor approval needed', score: 40 },
          { value: 'no_one', label: 'Not addressed', score: 10 }
        ]
      }
    ]
  },

  communication: {
    id: 'communication',
    name: 'Communication',
    weight: 4,
    questions: [
      {
        id: 'co_1',
        question: 'Shift handoff',
        options: [
          { value: 'documented', label: 'Documented + face-to-face', score: 100 },
          { value: 'verbal', label: 'Verbal only', score: 40 },
          { value: 'none', label: 'No formal handoff', score: 10 }
        ]
      },
      {
        id: 'co_2',
        question: 'Multi-crew coordination',
        options: [
          { value: 'permit', label: 'Permit/SIMOPS system', score: 100 },
          { value: 'radio', label: 'Radio communication', score: 60 },
          { value: 'assumed', label: 'Assumed awareness', score: 10 }
        ]
      },
      {
        id: 'co_3',
        question: 'Stop work authority clear to all?',
        options: [
          { value: 'trained', label: 'Trained + exercised', score: 100 },
          { value: 'policy', label: 'Policy exists', score: 50 },
          { value: 'unclear', label: 'Unclear', score: 10 }
        ]
      }
    ]
  }
};

// Precursors covered by STKY (pull scores instead of re-asking)
const STKY_OVERLAP = ['hazardous_energy', 'falls', 'electrical', 'confined_space', 'chemical', 'caught_in'];
```

## P-SIF Filter Tool (PAID)

### Page Disclaimer
```
Before you paste:

Remove names, company identifiers, locations, and dates.

Example:
❌ "John fell at Acme's Houston plant on Jan 3"
✅ "Worker fell from scaffold during installation"

We analyze the event, not the people. Keep it anonymous.
```

### Agent Prompt
```
You are a P-SIF classifier. Nothing else.

User pastes a near-miss or incident description.

FIRST: Check for PII (names, companies, locations, specific dates). If found:
- Respond: "Remove identifying details and paste again. I only need the event."
- Do not process.

IF CLEAN, evaluate three criteria:

1. ENERGY: Did it exceed the SIF threshold?
   - Falls >6ft
   - Loads >50lbs moving/falling
   - Vehicles >5mph
   - Voltage >50V
   - Pressure release
   - Chemical IDLH potential

2. EXPOSURE: Was a person in the energy path within 5 seconds or 5 feet?

3. CONTROL: Did the control rely on human behavior rather than engineering?

RESPOND:

**P-SIF: YES** or **P-SIF: NO**

Energy: [finding]
Exposure: [Yes/No — why]
Control: [Engineering or Behavior-dependent]

[One sentence guidance]

Keep response under 75 words. No preamble.
```

---

# WEBHOOKS

```javascript
const WEBHOOKS = {
  stky: 'https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/4781670c-aa84-46f0-8dfc-f9d4f11d4a4c',
  sif_free: 'https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/bc3371cc-84f6-474e-8d88-a4455cc0b9bc',
  sif_paid: 'https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/ad3d5210-a42a-4d55-a467-ceb8ec5ff2f0'
};
```

---

# UX SPECIFICATIONS

## Apple-Clean Aesthetic

```css
:root {
  --yellow: #FFCF00;
  --blue: #132544;
  --text: #333333;
  --bg: #F4F4F4;
  --white: #FFFFFF;
  --success: #22C55E;
  --warning: #F97316;
  --danger: #EF4444;
}

/* One question at a time */
/* Smooth 300ms transitions */
/* Tappable cards, not dropdowns */
/* Progress: subtle dots */
/* White space is intentional */
```

## Flow Pattern

1. Path selection (6 cards, full-width tap)
2. Context questions (one per screen, card options)
3. Hazard/Precursor questions (grouped by category, expandable)
4. Results (score + rating + gaps)
5. Email gate (unlocks full breakdown)

## Mobile-First

- Touch targets: 48px minimum
- Font: 16px minimum (no zoom on iOS)
- Cards stack vertically
- Swipe disabled (intentional — not a game)

---

# DISCLAIMERS

## Results Screen
```
This assessment provides general guidance only. It does not constitute professional safety consulting or site-specific advice. Verify all findings against applicable local, state, and federal requirements. Consult qualified safety professionals before implementation.
```

## P-SIF Filter
```
This tool provides classification guidance only. It does not replace professional incident investigation or root cause analysis. All classifications should be verified by qualified safety professionals.
```

---

# FILE OUTPUTS

## Routes to create:
- server/routes/stky.js
- server/routes/sif.js
- server/routes/sif-filter.js
- server/routes/dashboard.js

## Frontend to create:
- public/tools/stky.html
- public/tools/sif.html
- public/tools/sif-filter.html
- public/tools/dashboard.html
- public/tools/index.html

## Add to server/index.js:
```javascript
const stkyRoutes = require('./routes/stky');
const sifRoutes = require('./routes/sif');
const sifFilterRoutes = require('./routes/sif-filter');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/stky', stkyRoutes);
app.use('/api/sif', sifRoutes);
app.use('/api/sif-filter', sifFilterRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/tools', express.static(path.join(__dirname, '../public/tools')));
```

## Update main site (public/index.html):
Add to navigation:
```html
<a href="/tools/">Safety Tools</a>
```

---

# DASHBOARD

## Purpose
- View past assessments
- Return to results without re-taking
- Access P-SIF Filter tool
- See STKY + SIF scores together

## Route: /api/dashboard

```javascript
// GET /api/dashboard?email=user@email.com
// Returns all assessments for that email

router.get('/', async (req, res) => {
  const { email, session_id } = req.query;
  
  let assessments;
  if (email) {
    assessments = db.prepare(`
      SELECT * FROM tool_assessments_v3 
      WHERE email = ? 
      ORDER BY created_at DESC
    `).all(email);
  } else if (session_id) {
    assessments = db.prepare(`
      SELECT * FROM tool_assessments_v3 
      WHERE session_id = ? 
      ORDER BY created_at DESC
    `).all(session_id);
  }
  
  // Get session scores
  const session = db.prepare(`
    SELECT * FROM tool_sessions WHERE session_id = ?
  `).get(session_id);
  
  res.json({ assessments, session });
});
```

## Page: /tools/dashboard.html

```
┌─────────────────────────────────────────┐
│  Your Safety Assessments                │
├─────────────────────────────────────────┤
│                                         │
│  STKY Score: 72 (Managed)    [View]     │
│  Completed Jan 14, 2026                 │
│                                         │
│  SIF Score: 68 (Managed)     [View]     │
│  Completed Jan 14, 2026                 │
│                                         │
├─────────────────────────────────────────┤
│  Tools                                  │
│                                         │
│  [P-SIF Filter] - Classify any event    │
│  [Retake STKY]                          │
│  [Retake SIF]                           │
│                                         │
└─────────────────────────────────────────┘
```

## Access Methods:
1. Link in results email
2. Bookmark dashboard URL with session_id
3. Enter email to retrieve past results

---

# STRIPE PLACEHOLDER

## Database table (for future use):

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    plan TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);
```

## Placeholder in routes:

```javascript
// STRIPE PLACEHOLDER - implement payment check here
function checkPaidAccess(email) {
  // TODO: Implement Stripe subscription check
  // For now, return true to allow full access
  return true;
}

// Usage in routes:
router.get('/premium-feature', (req, res) => {
  const { email } = req.query;
  
  if (!checkPaidAccess(email)) {
    return res.status(402).json({ 
      error: 'Subscription required',
      upgrade_url: '/tools/pricing'
    });
  }
  
  // Continue with feature...
});
```

## Pricing page placeholder:

```html
<!-- public/tools/pricing.html -->
<!-- TODO: Implement with Stripe checkout -->
<div class="pricing-card">
  <h3>SIF Premium</h3>
  <p>$99/mo</p>
  <ul>
    <li>Full precursor breakdown</li>
    <li>P-SIF Filter unlimited</li>
    <li>Benchmark comparisons</li>
  </ul>
  <button disabled>Coming Soon</button>
</div>
```

---

# NAVIGATION

## Main site header (add to existing nav):

```html
<nav>
  <!-- existing links -->
  <a href="/tools/" class="nav-link">Safety Tools</a>
</nav>
```

## Tools landing page (/tools/index.html):

```
┌─────────────────────────────────────────┐
│  Safety Assessment Tools                │
│  Research-backed. Built by EHS pros.    │
├─────────────────────────────────────────┤
│                                         │
│  [STKY Assessment]                      │
│  High-energy hazard controls            │
│  FREE                                   │
│                                         │
│  [SIF Scorecard]                        │
│  Precursor exposure analysis            │
│  FREE                                   │
│                                         │
│  [P-SIF Filter]                         │
│  Classify any near-miss                 │
│  FREE                                   │
│                                         │
│  [Metrics Analyzer]                     │
│  Coming Soon                            │
│                                         │
├─────────────────────────────────────────┤
│  Have an account?                       │
│  [View My Dashboard]                    │
└─────────────────────────────────────────┘
```

## Return navigation (on all tool pages):

```html
<header class="tool-header">
  <a href="/tools/" class="back-link">← All Tools</a>
  <a href="/tools/dashboard.html" class="dashboard-link">My Dashboard</a>
</header>
```
