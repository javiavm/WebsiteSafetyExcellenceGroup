// State
let industry = null;
let scenarios = [];
let responses = [];
let currentScenario = 0;
let results = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadIndustries();
    document.getElementById('email-form').addEventListener('submit', submitAssessment);
});

// Load industries
async function loadIndustries() {
    const res = await fetch('/api/sif/industries');
    const data = await res.json();
    renderIndustries(data.industries);
}

// Render industry grid
function renderIndustries(industries) {
    const grid = document.getElementById('industry-grid');
    grid.innerHTML = industries.map(i => `
        <div class="industry-card" onclick="selectIndustry('${i.id}')" data-ind="${i.id}">
            <div class="name">${i.name}</div>
        </div>
    `).join('');
}

// Select industry
async function selectIndustry(id) {
    industry = id;
    document.querySelectorAll('.industry-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`[data-ind="${id}"]`).classList.add('selected');

    // Load scenarios
    const res = await fetch('/api/sif/scenarios');
    const data = await res.json();
    scenarios = data.scenarios;
    responses = [];
    currentScenario = 0;

    await ToolUtils.delay(400);
    ToolUtils.showStep('step-test');
    renderScenario();
}

// Render current scenario
function renderScenario() {
    if (currentScenario >= scenarios.length) {
        showMirror();
        return;
    }

    const s = scenarios[currentScenario];
    const container = document.getElementById('scenario-container');
    container.innerHTML = `
        <div class="scenario-card">
            <div class="scenario-count">Scenario ${currentScenario + 1} of ${scenarios.length}</div>

            <div class="scenario-label">Near-Miss Report</div>
            <p class="scenario-text">"${s.description}"</p>

            <p class="scenario-prompt">How should this be classified?</p>

            <div class="scenario-buttons">
                <button class="btn-routine" onclick="answerScenario(${s.id}, 'routine')">
                    Routine Near-Miss
                </button>
                <button class="btn-sif" onclick="answerScenario(${s.id}, 'sif')">
                    P-SIF Potential
                </button>
            </div>

            <div id="scenario-reveal"></div>
        </div>
    `;
}

// Answer scenario
async function answerScenario(scenarioId, answer) {
    const s = scenarios.find(sc => sc.id === scenarioId);
    const userSaidPSIF = answer === 'sif';
    const isCorrect = userSaidPSIF === s.isPSIF;

    responses.push({ scenarioId, answer });

    // Disable buttons
    document.querySelectorAll('.scenario-buttons button').forEach(b => b.disabled = true);

    // Show reveal
    const reveal = document.getElementById('scenario-reveal');
    reveal.innerHTML = `
        <div class="scenario-reveal ${isCorrect ? 'correct' : 'incorrect'}">
            <h4>${isCorrect ? 'Correct Classification' : 'Incorrect Classification'}</h4>
            <p><strong>${s.isPSIF ? 'This IS a P-SIF' : 'This is NOT a P-SIF'}</strong></p>
            <p>${s.explanation}</p>
            <p class="scenario-stat">${s.missRate}% of safety programs classify this ${s.isPSIF ? 'as routine' : 'incorrectly as P-SIF'}.</p>
        </div>
    `;

    // Next scenario after delay
    await ToolUtils.delay(3000);
    currentScenario++;
    renderScenario();
}

// Show mirror screen
function showMirror() {
    const correct = responses.filter(r => {
        const s = scenarios.find(sc => sc.id === r.scenarioId);
        return (r.answer === 'sif') === s.isPSIF;
    }).length;

    const percentage = Math.round((correct / scenarios.length) * 100);

    let message;
    if (correct === scenarios.length) {
        message = "You identified all P-SIFs correctly. You're in the top 12%.";
    } else if (correct >= scenarios.length - 1) {
        message = "Strong P-SIF recognition. One classification gap identified.";
    } else {
        message = "You classify near-misses the way most safety programs do.";
    }

    document.getElementById('mirror-message').textContent = message;

    // Show blind spots preview
    const missed = responses.filter(r => {
        const s = scenarios.find(sc => sc.id === r.scenarioId);
        return (r.answer === 'sif') !== s.isPSIF && s.isPSIF;
    });

    const blindSpots = [...new Set(missed.map(r => {
        const s = scenarios.find(sc => sc.id === r.scenarioId);
        return s.blindSpot;
    }).filter(Boolean))];

    const bsContainer = document.getElementById('blind-spots');
    if (blindSpots.length > 0) {
        bsContainer.innerHTML = blindSpots.slice(0, 3).map(bs => `
            <div class="blind-spot-item">
                <div class="blind-spot-indicator"></div>
                <div>
                    <h4>${bs}</h4>
                    <p>P-SIF events likely misclassified</p>
                </div>
            </div>
        `).join('');
    } else {
        bsContainer.innerHTML = '<p style="opacity:0.7;text-align:center">No major blind spots detected in this assessment.</p>';
    }

    ToolUtils.showStep('step-mirror');
}

// Show results
function showResults() {
    // Calculate local results for display
    const correct = responses.filter(r => {
        const s = scenarios.find(sc => sc.id === r.scenarioId);
        return (r.answer === 'sif') === s.isPSIF;
    }).length;

    const missed = responses.filter(r => {
        const s = scenarios.find(sc => sc.id === r.scenarioId);
        return (r.answer === 'sif') !== s.isPSIF && s.isPSIF;
    });

    const blindSpots = [...new Set(missed.map(r => {
        const s = scenarios.find(sc => sc.id === r.scenarioId);
        return s.blindSpot;
    }).filter(Boolean))];

    const display = document.getElementById('results-display');
    display.innerHTML = `
        <div class="card" style="margin-bottom:24px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                <h3 style="margin:0">Recognition Score</h3>
                <span style="font-size:2rem;font-weight:800;color:var(--seg-navy)">${correct}/${scenarios.length}</span>
            </div>
            <div style="height:8px;background:var(--gray-200);border-radius:4px;overflow:hidden">
                <div style="height:100%;width:${(correct/scenarios.length)*100}%;background:${correct === scenarios.length ? 'var(--success)' : correct >= scenarios.length - 1 ? 'var(--seg-yellow)' : 'var(--danger)'};transition:width 0.5s"></div>
            </div>
        </div>

        ${blindSpots.length > 0 ? `
            <div class="card">
                <h3 style="color:var(--danger);margin-bottom:16px">Detection Gaps</h3>
                ${blindSpots.map(bs => `
                    <div style="display:flex;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--gray-100)">
                        <span style="font-weight:600">${bs}</span>
                        <span style="color:var(--danger);font-weight:600;font-size:0.875rem">AT RISK</span>
                    </div>
                `).join('')}
                <p style="margin-top:16px;color:var(--gray-500);font-size:0.9rem">
                    These P-SIF categories are likely being logged as routine near-misses in your current system.
                </p>
            </div>
        ` : `
            <div class="card" style="background:var(--success-light);border:1px solid var(--success)">
                <h3 style="color:var(--success);margin-bottom:8px">Strong P-SIF Recognition</h3>
                <p style="color:var(--gray-600)">No significant detection gaps identified in this assessment.</p>
            </div>
        `}
    `;

    ToolUtils.showStep('step-results');

    // Auto-advance to email after delay
    setTimeout(() => ToolUtils.showStep('step-email'), 4000);
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
        const res = await ToolUtils.postJSON('/api/sif/assess', {
            responses,
            industry,
            ...userData
        });

        results = res.results;
        ToolUtils.showStep('step-final');
    } catch (err) {
        alert('Error submitting assessment. Please try again.');
    }
}
