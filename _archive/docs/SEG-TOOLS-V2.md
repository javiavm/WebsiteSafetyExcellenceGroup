# SEG-TOOLS-V2.md
## STKY + SIF Build Specs (Addictive UX)

---

# WEBHOOKS

```
STKY: https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/4781670c-aa84-46f0-8dfc-f9d4f11d4a4c

SIF_FREE: https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/bc3371cc-84f6-474e-8d88-a4455cc0b9bc

SIF_PAID: https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/ad3d5210-a42a-4d55-a467-ceb8ec5ff2f0
```

---

# STKY ASSESSMENT (FREE)

## Flow

**Screen 1: Hook**
- "Last year, 14 workers in [industry] didn't come home."
- "Same 4 hazards. Every time."
- [See if you're exposed →]

**Screen 2: Industry Select**
- 6 cards, tap to select, auto-advance
- Construction, Manufacturing, Semiconductor, Data Center, Oil & Gas, Utilities

**Screen 3: Swipe Cards**
- Top 5 hazards for their industry (not all 13)
- Tinder-style swipe: Right=Controlled, Left=Exposed, Tap=Uncertain
- Score pulses live in corner
- 10 seconds total

**Screen 4: Dark Reveal**
- Screen goes dark, pause
- Score slams on screen
- "You're in the same range as sites that had fatalities last year." (if <75)
- Or "Solid control. But one gap is all it takes." (if >=75)

**Screen 5: #1 Exposure Deep Dive**
- Their worst exposure zooms in, red glow
- Sharp insight specific to that hazard
- "Sites that say 'uncertain' on [hazard] are 6x more likely to have a SIF than sites that say 'exposed.' Because 'uncertain' means no one's checking."

**Screen 6: The Drop**
- "There's one question that predicts [hazard] failures."
- "Most safety managers get it wrong."
- [What's the question? →]
- Email field appears

**Screen 7: Post-Email Reveal**
- Instant reveal on screen (not just "check your email")
- THE QUESTION displayed
- "Full breakdown + 2 more questions in your inbox."

---

## Industry-Specific Hazards

```javascript
const INDUSTRY_HAZARDS = {
  semiconductor: ['hazardous_energy', 'chemical', 'electrical', 'confined_space', 'fire_explosion'],
  datacenter: ['electrical', 'fire_explosion', 'confined_space', 'struck_falling', 'hazardous_energy'],
  construction: ['falls', 'struck_falling', 'caught_in', 'excavation', 'electrical'],
  manufacturing: ['caught_in', 'hazardous_energy', 'mobile_equipment', 'chemical', 'electrical'],
  oil_gas: ['fire_explosion', 'confined_space', 'chemical', 'hazardous_energy', 'struck_vehicle'],
  utilities: ['electrical', 'falls', 'struck_vehicle', 'confined_space', 'excavation']
};
```

---

## Hazard Insights (for Screen 5)

```javascript
const HAZARD_INSIGHTS = {
  hazardous_energy: "87% of LOTO fatalities occur during tasks workers call 'routine.'",
  chemical: "Most chemical exposures happen during 'non-routine' tasks that become routine.",
  electrical: "Arc flash doesn't warn. The last thing they see is the panel.",
  confined_space: "Rescue attempts kill more than the original entry. Every time.",
  fire_explosion: "The ignition source is never the one they planned for.",
  falls: "6 feet is the rule. 4 feet is where they die.",
  struck_falling: "Dropped objects don't miss twice.",
  caught_in: "Machine guards get removed for 'just a second.' That second kills.",
  excavation: "Soil doesn't crack before it collapses. It just goes.",
  struck_vehicle: "Backup alarms don't work when everyone ignores them.",
  mobile_equipment: "Forklifts kill more than any other equipment. Not close.",
  structural: "The load was fine yesterday. Yesterday doesn't matter.",
  drowning: "4 inches of water. That's all it takes."
};
```

---

## The Questions (for email delivery)

```javascript
const HAZARD_QUESTIONS = {
  hazardous_energy: {
    main: "When was the last time someone was caught skipping a LOTO step on a task they've done 100+ times?",
    follow_up: [
      "Who verifies the verification?",
      "When's the last time 'no incidents' made you more worried, not less?"
    ]
  },
  chemical: {
    main: "Can every worker on your site name the three chemicals most likely to kill them?",
    follow_up: [
      "Where's your nearest SDS? How long to get there?",
      "When did someone last refuse a task because they didn't understand the chemical?"
    ]
  },
  electrical: {
    main: "When's the last time someone worked on 'dead' equipment that wasn't?",
    follow_up: [
      "Who's testing for absence of voltage — and with what?",
      "How many of your panel covers are missing right now?"
    ]
  },
  confined_space: {
    main: "What happens if your rescue plan fails in the first 60 seconds?",
    follow_up: [
      "Who's your backup to the backup?",
      "When's the last time you ran a rescue drill that went wrong?"
    ]
  },
  fire_explosion: {
    main: "What's the ignition source you haven't thought of?",
    follow_up: [
      "Who decided that area wasn't a hot work zone?",
      "When's the last time someone stopped work because 'it didn't smell right'?"
    ]
  },
  falls: {
    main: "What's the shortest fall that sent someone to the hospital?",
    follow_up: [
      "Who's checking tie-off points before each use?",
      "Where's the ladder you know shouldn't be there?"
    ]
  },
  struck_falling: {
    main: "What dropped last month that you never reported?",
    follow_up: [
      "Where's your drop zone that isn't barricaded?",
      "What's overhead right now that isn't secured?"
    ]
  },
  caught_in: {
    main: "Which guard on your floor has been removed 'temporarily' the longest?",
    follow_up: [
      "Who can bypass the safety interlock, and do they?",
      "What's the 'quick task' that skips lockout?"
    ]
  },
  excavation: {
    main: "What's in the ground that isn't on the prints?",
    follow_up: [
      "When's the last time soil conditions changed mid-dig?",
      "Who's entering the trench before the competent person arrives?"
    ]
  },
  struck_vehicle: {
    main: "Where do pedestrians and vehicles share space right now?",
    follow_up: [
      "How many near-misses in the parking lot last month?",
      "Who's walking behind equipment that's about to move?"
    ]
  },
  mobile_equipment: {
    main: "When's the last time an operator moved equipment with someone in the path?",
    follow_up: [
      "Who's riding forklifts that weren't built for passengers?",
      "What's the 'quick move' that skips the spotter?"
    ]
  },
  structural: {
    main: "What's the load limit on that mezzanine — and what's on it right now?",
    follow_up: [
      "When's the last time someone added 'just one more' to a rack?",
      "Who decided that scaffold was good enough?"
    ]
  },
  drowning: {
    main: "What body of water is within 100 feet that isn't on your hazard list?",
    follow_up: [
      "Where's the rescue equipment for that water?",
      "Who's trained to go in after them?"
    ]
  }
};
```

---

## STKY Webhook Payload

```javascript
const stkyPayload = {
  source: "seg_stky_tool",
  email: userData.email,
  name: userData.name,
  company: userData.company,
  industry: userData.industry,
  phone: userData.phone || "",
  score: results.score,
  rating: results.rating,
  top_exposure: results.topExposure,
  exposures: results.exposures.join(", "),
  controlled_count: results.controlled,
  exposed_count: results.exposed,
  uncertain_count: results.uncertain,
  email_subject: "Your STKY result — and the question that matters",
  email_body: generateSTKYEmail(userData, results),
  timestamp: new Date().toISOString()
};
```

---

## STKY Agent Email Generator

```javascript
function generateSTKYEmail(user, results) {
  const q = HAZARD_QUESTIONS[results.topExposure];
  return `${user.name},

You scored ${results.score}%. Your top exposure: ${formatHazardName(results.topExposure)}.

Here's what I'd ask if I walked your site tomorrow:

THE QUESTION: ${q.main}

Two more:

1. ${q.follow_up[0]}
2. ${q.follow_up[1]}

If you hesitated on any of these, that's your signal.

— Safety Excellence Group
469.988.4777`;
}
```

---

# SIF SCORECARD

## Flow

**Screen 1: Hook**
- "You're tracking near-misses."
- "But can you tell which ones had fatality potential?"
- [Find out →]

**Screen 2: The Test**
- 5 scenarios, one at a time
- "Your team logged this as a near-miss. Were they right?"
- Two buttons: [Routine Near-Miss] [SIF Potential]
- After each: Reveal if P-SIF + why
- "82% of sites log this as routine."

**Screen 3: The Mirror**
- "You see near-misses the way most safety managers do."
- "The 12% who catch P-SIFs? They use a different filter."
- Show blind spots based on what they missed

**Screen 4: Results (FREE)**
- Top 3 blind spots
- Industry stat: "These account for X% of SIFs in [industry]"
- "They're in your logs right now. Tagged as routine."

**Screen 5: Email Capture**
- "Want to find them?"
- Email field
- [Send my blind spots →]

**Post-Email (FREE):**
- Shows upgrade path to paid filter tool

**Post-Email (PAID):**
- Direct access to P-SIF Filter tool

---

## SIF Scenarios

```javascript
const SIF_SCENARIOS = [
  {
    id: 1,
    description: "Forklift clips empty pallet. No injury. Driver didn't see pedestrian who stepped back just in time.",
    isPSIF: true,
    precursor: "mobile_equipment",
    explanation: "2,400 lb load. Pedestrian in path 3 seconds prior. Energy + exposure = P-SIF."
  },
  {
    id: 2,
    description: "Worker trips over extension cord, catches themselves on railing. No injury.",
    isPSIF: false,
    precursor: null,
    explanation: "Low energy event. Trip hazard, not SIF potential. Standard near-miss."
  },
  {
    id: 3,
    description: "Breaker thought to be off was actually on. Worker noticed tingling, stopped work.",
    isPSIF: true,
    precursor: "electrical",
    explanation: "Contact with energized equipment. Outcome was luck, not control. P-SIF."
  },
  {
    id: 4,
    description: "Scaffold plank shifted during use. Worker felt it move, stepped to stable section.",
    isPSIF: true,
    precursor: "falls",
    explanation: "6+ feet elevation. Plank failure = fall potential. P-SIF."
  },
  {
    id: 5,
    description: "Chemical splash on floor during transfer. Cleaned up immediately. No contact.",
    isPSIF: false,
    precursor: null,
    explanation: "Contained spill, no exposure pathway. Housekeeping issue, not P-SIF."
  },
  {
    id: 6,
    description: "Worker entered confined space before air monitoring complete. Atmosphere was safe.",
    isPSIF: true,
    precursor: "confined_space",
    explanation: "Safe outcome was luck. No verification = P-SIF. Every time."
  },
  {
    id: 7,
    description: "Load shifted during crane lift. Rigger was outside swing radius.",
    isPSIF: true,
    precursor: "lifting",
    explanation: "Load control failure. Rigger position was coincidence, not control. P-SIF."
  },
  {
    id: 8,
    description: "Worker bumped head on low beam. Minor bruise.",
    isPSIF: false,
    precursor: null,
    explanation: "Low energy. Fixed object, low speed. Not P-SIF."
  }
];

// Randomly select 5 for each assessment
function getScenarios() {
  return SIF_SCENARIOS.sort(() => 0.5 - Math.random()).slice(0, 5);
}
```

---

## SIF Blind Spot Mapping

```javascript
const PRECURSOR_TO_BLINDSPOT = {
  mobile_equipment: "Line of Fire",
  electrical: "Energy Isolation",
  falls: "Working at Heights",
  confined_space: "Confined Space",
  lifting: "Lifting & Rigging"
};

const BLINDSPOT_INDUSTRY_STATS = {
  semiconductor: { "Energy Isolation": 34, "Line of Fire": 22, "Confined Space": 18 },
  construction: { "Working at Heights": 38, "Line of Fire": 24, "Energy Isolation": 15 },
  manufacturing: { "Energy Isolation": 31, "Line of Fire": 26, "Caught-In/Between": 19 },
  datacenter: { "Energy Isolation": 36, "Electrical": 28, "Confined Space": 14 },
  oil_gas: { "Confined Space": 29, "Energy Isolation": 27, "Line of Fire": 21 },
  utilities: { "Energy Isolation": 33, "Working at Heights": 25, "Line of Fire": 18 }
};
```

---

## SIF Free Webhook Payload

```javascript
const sifFreePayload = {
  source: "seg_sif_free",
  email: userData.email,
  name: userData.name,
  company: userData.company,
  industry: userData.industry,
  scenarios_correct: results.correct,
  scenarios_missed: results.missed,
  blind_spot_1: results.blindSpots[0],
  blind_spot_2: results.blindSpots[1],
  blind_spot_3: results.blindSpots[2],
  industry_sif_percentage: calculateIndustryPercentage(results.blindSpots, userData.industry),
  sif_paid_upgrade_link: "https://safety-excellence.com/tools/sif-upgrade",
  timestamp: new Date().toISOString()
};
```

---

## SIF Paid Webhook Payload

```javascript
const sifPaidPayload = {
  source: "seg_sif_paid",
  email: userData.email,
  name: userData.name,
  company: userData.company,
  industry: userData.industry,
  tier: "paid",
  overall_score: results.overallScore,
  risk_level: results.riskLevel,
  top_risk_1: results.topRisks[0].name,
  top_risk_1_score: results.topRisks[0].score,
  top_risk_2: results.topRisks[1].name,
  top_risk_2_score: results.topRisks[1].score,
  top_risk_3: results.topRisks[2].name,
  top_risk_3_score: results.topRisks[2].score,
  benchmark_industry_avg: getBenchmark(userData.industry),
  benchmark_position: results.overallScore < getBenchmark(userData.industry) ? "below" : "above",
  sif_filter_link: `https://safety-excellence.com/tools/sif-filter?token=${userData.sessionId}`,
  timestamp: new Date().toISOString()
};
```

---

# SIF FILTER TOOL (PAID ONLY)

## Page: /tools/sif-filter

**Disclaimer (above input):**
```
Before you paste:

Remove names, company identifiers, locations, and dates.

Example:
❌ "John fell at Acme's Houston plant on Jan 3"
✅ "Worker fell from scaffold during installation"

We analyze the event, not the people. Keep it anonymous.
```

**Input placeholder:**
```
Paste your near-miss here (no names, companies, or locations)...
```

**Agent Prompt:**
```
You are a P-SIF classifier. Nothing else.

User pastes a near-miss or incident description.

FIRST: Check for PII (names, companies, locations, specific dates). If found:
- Respond: "Remove identifying details (names, companies, locations, dates) and paste again. I only need the event."
- Do not process further.

IF CLEAN, evaluate:

1. Energy magnitude — Did it exceed 500 ft-lbs?
   - Falls >6ft
   - Loads >50lbs moving/falling
   - Vehicles >5mph
   - Voltage >50V
   - Pressure systems
   - Chemical IDLH potential

2. Exposure — Was a person in the energy path within 5 seconds or 5 feet?

3. Control type — Did the control rely on human behavior rather than engineering?

RESPOND WITH THIS EXACT FORMAT:

**P-SIF: YES** or **P-SIF: NO**

Energy: [what you identified, or "Below threshold"]
Exposure: [Yes/No — one line why]
Control: [Engineering or Behavior-dependent]

[One sentence: what to do with this]

EXAMPLES:

**P-SIF: YES**
Energy: Fall from 12ft platform (exceeds 6ft threshold)
Exposure: Yes — worker was on platform when board shifted
Control: Behavior-dependent — required worker to check plank stability

Log as potential SIF. Track separately from routine near-misses.

---

**P-SIF: NO**
Energy: Below threshold — trip hazard at ground level
Exposure: Yes — worker tripped
Control: N/A — low energy event

Routine near-miss. Standard logging appropriate.
```

---

# CSS ADDITIONS

```css
/* Swipe Cards */
.swipe-container {
  position: relative;
  width: 100%;
  height: 400px;
  overflow: hidden;
}

.swipe-card {
  position: absolute;
  width: 90%;
  left: 5%;
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  transition: transform 0.3s, opacity 0.3s;
  cursor: grab;
}

.swipe-card.swiping-left {
  transform: translateX(-120%) rotate(-15deg);
  opacity: 0;
}

.swipe-card.swiping-right {
  transform: translateX(120%) rotate(15deg);
  opacity: 0;
}

.swipe-card .hazard-icon {
  font-size: 4rem;
  text-align: center;
  display: block;
  margin-bottom: 16px;
}

.swipe-card .hazard-name {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  color: var(--seg-blue);
}

.swipe-instructions {
  text-align: center;
  margin-top: 24px;
  color: var(--seg-grey);
  font-size: 0.9rem;
}

.swipe-instructions span {
  display: inline-block;
  margin: 0 16px;
}

/* Live Score Pulse */
.live-score {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--seg-blue);
  color: white;
  padding: 12px 20px;
  border-radius: 24px;
  font-weight: 700;
  font-size: 1.25rem;
  z-index: 100;
}

.live-score.pulse {
  animation: scorePulse 0.3s ease-out;
}

@keyframes scorePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); background: var(--seg-yellow); color: var(--seg-blue); }
  100% { transform: scale(1); }
}

/* Dark Reveal */
.dark-reveal {
  background: var(--seg-blue);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
}

.score-slam {
  font-size: 8rem;
  font-weight: 800;
  color: var(--seg-yellow);
  animation: slamIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes slamIn {
  0% { transform: scale(3); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.reveal-message {
  margin-top: 24px;
  font-size: 1.25rem;
  opacity: 0;
  animation: fadeInUp 0.5s ease-out 0.5s forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Exposure Glow */
.exposure-spotlight {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  min-height: 100vh;
  padding: 40px 20px;
}

.exposure-card-glow {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  margin: 0 auto;
  box-shadow: 0 0 60px rgba(239, 68, 68, 0.4);
  animation: glowPulse 2s infinite;
}

@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 60px rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 80px rgba(239, 68, 68, 0.6); }
}

/* Scenario Cards */
.scenario-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}

.scenario-text {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 24px;
  color: var(--seg-dark);
}

.scenario-buttons {
  display: flex;
  gap: 12px;
}

.scenario-buttons button {
  flex: 1;
  padding: 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-routine {
  background: var(--seg-light);
  border: 2px solid var(--seg-grey);
  color: var(--seg-dark);
}

.btn-sif {
  background: #FEF2F2;
  border: 2px solid #EF4444;
  color: #DC2626;
}

.scenario-reveal {
  margin-top: 20px;
  padding: 20px;
  border-radius: 8px;
  animation: fadeIn 0.3s ease-out;
}

.scenario-reveal.correct {
  background: #F0FDF4;
  border-left: 4px solid #22C55E;
}

.scenario-reveal.incorrect {
  background: #FEF2F2;
  border-left: 4px solid #EF4444;
}

/* Filter Tool */
.filter-disclaimer {
  background: #FFF8E1;
  border-left: 4px solid var(--seg-yellow);
  padding: 16px;
  margin-bottom: 24px;
  border-radius: 0 8px 8px 0;
  font-size: 0.9rem;
}

.filter-input {
  width: 100%;
  min-height: 150px;
  padding: 16px;
  border: 2px solid var(--seg-grey);
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
}

.filter-input:focus {
  outline: none;
  border-color: var(--seg-yellow);
}

.filter-result {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-top: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}

.filter-result.psif-yes {
  border-left: 4px solid #EF4444;
}

.filter-result.psif-no {
  border-left: 4px solid #22C55E;
}
```

---

# INTEGRATION

Add to server/index.js:
```javascript
const stkyRoutes = require('./routes/stky');
const sifRoutes = require('./routes/sif');
const sifFilterRoutes = require('./routes/sif-filter');

app.use('/api/stky', stkyRoutes);
app.use('/api/sif', sifRoutes);
app.use('/api/sif-filter', sifFilterRoutes);
app.use('/tools', express.static(path.join(__dirname, '../public/tools')));
```

---

# VERIFICATION

```bash
cd server && node index.js
# http://localhost:3001/tools/stky-assessment.html
# http://localhost:3001/tools/sif-scorecard.html
# http://localhost:3001/tools/sif-filter.html
```
