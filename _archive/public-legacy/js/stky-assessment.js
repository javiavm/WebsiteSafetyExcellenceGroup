// State
let industry = null;
let hazards = [];
let responses = [];
let currentHazard = 0;
let results = null;

// Hazard descriptions for assessment context
const HAZARD_CONTEXT = {
    hazardous_energy: {
        category: 'Energy Control',
        question: 'How would you rate your organization\'s control of hazardous energy sources during maintenance and servicing activities?'
    },
    chemical: {
        category: 'Chemical Safety',
        question: 'How confident are you in your team\'s ability to identify and control chemical exposure risks during non-routine tasks?'
    },
    electrical: {
        category: 'Electrical Safety',
        question: 'How would you assess your electrical safety program\'s effectiveness at preventing arc flash and contact incidents?'
    },
    confined_space: {
        category: 'Confined Space',
        question: 'How prepared is your organization to prevent confined space fatalities, including rescue scenarios?'
    },
    fire_explosion: {
        category: 'Fire & Explosion',
        question: 'How effective are your controls at identifying and eliminating unexpected ignition sources?'
    },
    falls: {
        category: 'Fall Protection',
        question: 'How would you rate your fall protection program for tasks at heights, including non-routine activities?'
    },
    struck_falling: {
        category: 'Struck-By Hazards',
        question: 'How effective are your controls at preventing struck-by incidents from dropped objects and overhead hazards?'
    },
    caught_in: {
        category: 'Machine Guarding',
        question: 'How confident are you that machine guards remain in place and interlocks are never bypassed?'
    },
    excavation: {
        category: 'Excavation Safety',
        question: 'How would you assess your excavation program\'s ability to prevent cave-ins and utility strikes?'
    },
    struck_vehicle: {
        category: 'Vehicle Safety',
        question: 'How effective is your program at separating pedestrians from vehicle traffic?'
    },
    mobile_equipment: {
        category: 'Mobile Equipment',
        question: 'How would you rate your controls for preventing mobile equipment incidents, including forklifts?'
    },
    structural: {
        category: 'Structural Integrity',
        question: 'How confident are you in load limit compliance across scaffolds, mezzanines, and storage systems?'
    },
    drowning: {
        category: 'Drowning Prevention',
        question: 'How prepared is your organization to prevent drowning incidents near water hazards?'
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadIndustries();
    document.getElementById('email-form').addEventListener('submit', submitAssessment);
});

// Load industries
async function loadIndustries() {
    const res = await fetch('/api/stky/industries');
    const data = await res.json();
    renderIndustries(data.industries);
}

// Render industry grid
function renderIndustries(industries) {
    const grid = document.getElementById('industry-grid');
    grid.innerHTML = industries.map(i => `
        <div class="industry-card" onclick="selectIndustry('${i.id}', '${i.name}')" data-ind="${i.id}">
            <div class="name">${i.name}</div>
        </div>
    `).join('');
}

// Select industry
async function selectIndustry(id, name) {
    industry = id;
    document.querySelectorAll('.industry-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`[data-ind="${id}"]`).classList.add('selected');

    // Update hook stat
    const res = await fetch(`/api/stky/hazards/${id}`);
    const data = await res.json();
    hazards = data.hazards;

    document.getElementById('hook-stat').textContent = data.industryStat;
    document.getElementById('hook-industry').textContent = name.toLowerCase();

    // Reset state
    responses = [];
    currentHazard = 0;

    await ToolUtils.delay(400);
    ToolUtils.showStep('step-assess');

    // Show live score
    document.getElementById('live-score').style.display = 'flex';
    updateLiveScore();

    renderHazardCard();
}

// Render current hazard card
function renderHazardCard() {
    if (currentHazard >= hazards.length) {
        finishAssessment();
        return;
    }

    const h = hazards[currentHazard];
    const context = HAZARD_CONTEXT[h.id] || { category: 'Safety', question: 'How would you rate your control of this hazard?' };

    // Update progress
    document.getElementById('progress-text').textContent = `${currentHazard + 1} of ${hazards.length}`;
    document.getElementById('progress-fill').style.width = `${((currentHazard + 1) / hazards.length) * 100}%`;

    const container = document.getElementById('hazard-container');
    container.innerHTML = `
        <div class="hazard-card">
            <div class="hazard-card-header">
                <div class="hazard-info">
                    <span class="hazard-category">${context.category}</span>
                    <h3>${h.name}</h3>
                </div>
            </div>

            <p class="hazard-question">${context.question}</p>

            <div class="response-buttons">
                <button class="response-btn" data-status="controlled" onclick="selectResponse('${h.id}', 'controlled')">
                    <div class="response-indicator"></div>
                    <div class="response-content">
                        <div class="response-label">Controlled</div>
                        <div class="response-desc">Engineering controls in place, consistently followed</div>
                    </div>
                </button>

                <button class="response-btn" data-status="uncertain" onclick="selectResponse('${h.id}', 'uncertain')">
                    <div class="response-indicator"></div>
                    <div class="response-content">
                        <div class="response-label">Uncertain</div>
                        <div class="response-desc">Controls exist but compliance is inconsistent</div>
                    </div>
                </button>

                <button class="response-btn" data-status="exposed" onclick="selectResponse('${h.id}', 'exposed')">
                    <div class="response-indicator"></div>
                    <div class="response-content">
                        <div class="response-label">Exposed</div>
                        <div class="response-desc">Known gap or reliance on behavioral controls</div>
                    </div>
                </button>
            </div>
        </div>
    `;
}

// Select response
function selectResponse(hazardId, status) {
    // Visual feedback
    document.querySelectorAll('.response-btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.style.pointerEvents = 'none';
    });

    const selectedBtn = document.querySelector(`.response-btn[data-status="${status}"]`);
    selectedBtn.classList.add('selected');

    // Record response
    responses.push({ hazardId, status });
    updateLiveScore();

    // Next hazard after brief delay
    setTimeout(() => {
        currentHazard++;
        renderHazardCard();
    }, 600);
}

// Update live score
function updateLiveScore() {
    const controlled = responses.filter(r => r.status === 'controlled').length;
    const total = hazards.length;
    const score = Math.round((controlled / total) * 100);
    const el = document.getElementById('live-score');
    el.textContent = score + '%';
    ToolUtils.pulseScore(el);
}

// Finish assessment
async function finishAssessment() {
    document.getElementById('live-score').style.display = 'none';
    await ToolUtils.delay(300);

    // Calculate results
    const controlled = responses.filter(r => r.status === 'controlled').length;
    const score = Math.round((controlled / hazards.length) * 100);
    const exposures = responses.filter(r => r.status !== 'controlled').map(r => r.hazardId);
    const topExposure = exposures[0] || hazards[0].id;

    results = {
        score,
        topExposure,
        exposures,
        controlled,
        exposed: responses.filter(r => r.status === 'exposed').length,
        uncertain: responses.filter(r => r.status === 'uncertain').length
    };

    // Update reveal screen
    document.getElementById('score-slam').textContent = score + '%';

    const messageEl = document.getElementById('reveal-message');
    if (score < 60) {
        messageEl.textContent = "Your control score indicates significant exposure. Sites in this range experience 3x the SIF rate.";
        messageEl.classList.add('warning');
    } else if (score < 80) {
        messageEl.textContent = "Moderate control coverage. However, the gaps identified are where most serious incidents occur.";
        messageEl.classList.remove('warning');
    } else {
        messageEl.textContent = "Strong control indicators. But one uncontrolled exposure is all it takes.";
        messageEl.classList.remove('warning');
    }

    ToolUtils.showStep('step-reveal');

    // Prepare exposure screen
    const hazardData = hazards.find(h => h.id === topExposure);
    document.getElementById('exposure-name').textContent = hazardData?.name || 'Unknown Hazard';
    document.getElementById('drop-hazard').textContent = hazardData?.name?.toLowerCase() || 'this hazard';
}

// Show email field
function showEmailField() {
    document.getElementById('drop-cta').style.display = 'none';
    document.getElementById('drop-form').style.display = 'block';
}

// Submit assessment
async function submitAssessment(e) {
    e.preventDefault();

    const userData = {
        name: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value,
        company: document.getElementById('user-company').value,
        sessionId: ToolUtils.getSessionId()
    };

    try {
        const res = await ToolUtils.postJSON('/api/stky/assess', {
            responses,
            industry,
            ...userData
        });

        results = res.results;

        // Show the question
        document.getElementById('the-question-text').textContent = results.question?.main || '';

        // Update insight
        document.getElementById('exposure-insight').textContent = results.insight || '';

        ToolUtils.showStep('step-final');
    } catch (err) {
        alert('Error submitting assessment. Please try again.');
    }
}
