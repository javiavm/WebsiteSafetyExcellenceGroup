/**
 * SEG Tools V3 Engine
 * Shared logic for all assessment tools
 */

const ToolEngine = {
  // Session management
  sessionId: null,

  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = localStorage.getItem('seg_session_id');
      if (!this.sessionId) {
        this.sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('seg_session_id', this.sessionId);
      }
    }
    return this.sessionId;
  },

  clearSession() {
    localStorage.removeItem('seg_session_id');
    this.sessionId = null;
  },

  // Step navigation
  currentStep: 0,
  steps: [],

  initSteps(stepIds) {
    this.steps = stepIds;
    this.currentStep = 0;
    this.updateProgress();
    this.showCurrentStep();
  },

  showStep(stepId) {
    const index = this.steps.indexOf(stepId);
    if (index !== -1) {
      this.currentStep = index;
      this.updateProgress();
      this.showCurrentStep();
    }
  },

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.updateProgress();
      this.showCurrentStep();
    }
  },

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateProgress();
      this.showCurrentStep();
    }
  },

  showCurrentStep() {
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    const current = document.getElementById(this.steps[this.currentStep]);
    if (current) {
      current.classList.add('active');
    }
  },

  updateProgress() {
    document.querySelectorAll('.progress-dot').forEach((dot, i) => {
      dot.classList.remove('active', 'completed');
      if (i < this.currentStep) {
        dot.classList.add('completed');
      } else if (i === this.currentStep) {
        dot.classList.add('active');
      }
    });
  },

  // Transitions
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  async fadeOut(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(-8px)';
    await this.delay(300);
  },

  async fadeIn(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(8px)';
    element.style.display = 'block';
    await this.delay(10);
    element.style.transition = 'all 300ms ease';
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
  },

  // API helpers
  async postJSON(url, data) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  },

  async getJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  },

  // Rating logic
  getRating(score) {
    if (score >= 85) return { label: 'Controlled', class: 'rating-controlled', color: '#22C55E' };
    if (score >= 70) return { label: 'Managed', class: 'rating-managed', color: '#FFCF00' };
    if (score >= 50) return { label: 'Developing', class: 'rating-developing', color: '#F97316' };
    return { label: 'Exposed', class: 'rating-exposed', color: '#EF4444' };
  },

  // Render helpers
  renderPathCards(paths, containerId, onSelect) {
    const container = document.getElementById(containerId);
    container.innerHTML = Object.values(paths).map(path => `
      <div class="path-card" data-path="${path.id}">
        <div class="path-label">${path.label}</div>
        <div class="path-desc">${path.description}</div>
        <div class="path-meta">
          <span>${path.questions} questions</span>
          <span>${path.time}</span>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.path-card').forEach(card => {
      card.addEventListener('click', () => {
        container.querySelectorAll('.path-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        onSelect(card.dataset.path);
      });
    });
  },

  renderOptionCards(options, containerId, onSelect) {
    const container = document.getElementById(containerId);
    container.innerHTML = options.map(opt => `
      <div class="option-card" data-value="${opt.value}">
        <div class="option-label">${opt.label}</div>
        ${opt.description ? `<div class="option-desc">${opt.description}</div>` : ''}
      </div>
    `).join('');

    container.querySelectorAll('.option-card').forEach(card => {
      card.addEventListener('click', () => {
        container.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        onSelect(card.dataset.value);
      });
    });
  },

  renderQuestion(question, containerId, onAnswer) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="question-text">${question.question}</div>
      <div class="option-grid" id="question-options"></div>
    `;

    this.renderOptionCards(question.options, 'question-options', (value) => {
      setTimeout(() => onAnswer(question.id, value), 300);
    });
  },

  renderScore(score, containerId) {
    const rating = this.getRating(score);
    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="score-display">
        <div class="score-value">${score}</div>
        <div class="score-label">Overall Score</div>
        <div class="rating-badge ${rating.class}">${rating.label}</div>
      </div>
    `;
  },

  renderGaps(gaps, containerId) {
    const container = document.getElementById(containerId);
    if (!gaps || gaps.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center;padding:24px">
          <p style="color:var(--success);font-weight:600">No critical gaps identified</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="gap-list">
        ${gaps.map(gap => `
          <div class="gap-item">
            <span class="gap-text">${gap.question}</span>
            <span class="gap-status ${gap.gap}">${gap.gap}</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  // Form handling
  getFormData(formId) {
    const form = document.getElementById(formId);
    const data = {};
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (input.name) {
        data[input.name] = input.value;
      }
    });
    return data;
  },

  validateForm(formId, requiredFields) {
    const data = this.getFormData(formId);
    const missing = requiredFields.filter(field => !data[field] || data[field].trim() === '');
    return { valid: missing.length === 0, missing, data };
  },

  // Local storage for assessment state
  saveState(key, state) {
    localStorage.setItem(`seg_${key}_state`, JSON.stringify(state));
  },

  loadState(key) {
    const stored = localStorage.getItem(`seg_${key}_state`);
    return stored ? JSON.parse(stored) : null;
  },

  clearState(key) {
    localStorage.removeItem(`seg_${key}_state`);
  },

  // Check for existing STKY data (for SIF overlap)
  async getSTKYScores() {
    const sessionId = this.getSessionId();
    try {
      const response = await this.getJSON(`/api/stky/session/${sessionId}`);
      if (response.success && response.data && response.data.stky_completed) {
        return response.data.scores;
      }
    } catch (e) {
      // No STKY data available
    }
    return null;
  }
};

// Backwards compatibility alias
const ToolUtils = ToolEngine;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToolEngine;
}
