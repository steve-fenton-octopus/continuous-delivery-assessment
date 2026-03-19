/**
 * UI rendering and advice logic.
 */
import { state } from './state.js';
import { nl2br, getCSSVariable } from './utils.js';
import { calculateCategoryScore, updateAllScores } from './scoring.js';
import { drawAll } from './charts.js';
import { anonymousAnalytics } from './analytics.js';

/**
 * Base template for the assessment UI.
 */
const BASE_HTML = `
    <article class="assessment-form-section">
      <div class="progress-indicator">
        <span id="page-indicator">Page 1 of 5</span>
      </div>
      <div class="hint">
        <h2 data-text="introTitle"></h2>
        <div data-text="intro"></div>
      </div>

      <form id="maturity-form">
      </form>

      <div class="pagination-controls">
        <button type="button" id="prev-btn" data-text="previous_button_text">←</button>
        <button type="button" id="next-btn" data-text="next_button_text">→</button>
        <button type="button" id="submit-btn" data-text="submit-button-text" style="display: none;">Submit</button>
      </div>
    </article>

    <article class="assessment-chart-section" id="results-section" style="display: none;">
      <header>
        <h2 data-text="results_title">Results</h2>
      </header>

      <div class="charts">
        <div class="assessment-meter">
          <div style="width: 0%" id="assessment-score"></div>
        </div>
        <canvas id="maturity-spider"></canvas>
        <table id="maturity-matrix" class="scores"></table>
      </div>

      <div id="congrats-section" style="display: none;">
        <h2 data-text="congrats_title">Congratulations!</h2>
        <p data-text="congrats_message"></p>
      </div>

      <div id="advice-section" class="advice-container" style="display: none;"></div>

      <div class="action-buttons">
        <a id="app-return-button" data-text="back_to_assessment">←</a>
        <a id="copy-link" data-text="copy_link_text">Share</a>
        <a id="download-results" data-text="download_results">Download</a>
      </div>
    </article>
`;

/**
 * Injects the base HTML structure into a container.
 */
export function injectBaseHTML(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (container) {
    container.innerHTML = BASE_HTML;
  }
}

/**
 * Renders the current assessment page.
 */
export function renderCurrentPage() {
  const { maturityForm } = state.elements;
  if (!maturityForm || !state.categoryPages.length) return;

  const introSection = document.querySelector('[data-text=intro')?.parentNode;
  if (introSection) {
    introSection.style.display = state.currentPage === 0 ? "block" : "none";
  }

  const category = state.categoryPages[state.currentPage];
  let html = `<fieldset><legend data-category="${category.id}">${category.name}</legend>`;

  category.questions.forEach(q => {
    let inputHtml = '';
    if (q.field_type === 'suggest') {
      const listId = `list-${q.field_name}`;
      inputHtml = `
        <div class="suggest-wrapper">
          <input type="text" name="${q.field_name}" list="${listId}" value="${state.answerState[q.field_name] || ''}" class="suggest-input" placeholder="Type or select an option..." />
          <datalist id="${listId}">
            ${q.options.map(opt => `<option value="${opt.value}">${opt.value}</option>`).join('')}
          </datalist>
        </div>
      `;
    } else {
      inputHtml = `
        <div class="options">
          ${q.options.map(opt => `
            <label class="option">
              <input type="radio" name="${q.field_name}" value="${opt.value}" ${state.answerState[q.field_name] == opt.value ? 'checked' : ''} />
              <div class="option-text">
                <span class="option-level">${opt.level}</span><br />
                <span class="option-description">${opt.description}</span>
              </div>
            </label>
          `).join('')}
        </div>
      `;
    }

    html += `
      <div class="question-group">
        <div class="question-text">${nl2br(q.text)}</div>
        ${q.description ? `<div class="question-description">${nl2br(q.description)}</div>` : ''}
        ${inputHtml}
      </div>
    `;
  });

  maturityForm.innerHTML = html + `</fieldset>`;

  // Trigger fade-in animation
  maturityForm.classList.remove('fade-in');
  void maturityForm.offsetWidth; // Trigger reflow
  maturityForm.classList.add('fade-in');
}

/**
 * Updates navigation button states and page indicator.
 */
export function updatePaginationControls() {
  const meta = state.loadedData?.metadata;

  const updateBtn = (id, text, visible, disabled) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    if (text) btn.innerText = text;
    btn.style.display = visible ? 'inline-block' : 'none';
    if (disabled !== undefined) btn.disabled = disabled;
  };

  updateBtn('prev-btn', meta?.previous_button_text, true, state.currentPage === 0);
  updateBtn('next-btn', meta?.next_button_text, state.currentPage < state.totalPages - 1);
  updateBtn('submit-btn', meta?.submit_button_text, state.currentPage === state.totalPages - 1);

  const { pageIndicator } = state.elements;
  if (pageIndicator) {
    const template = meta?.page_indicator_text || 'Page {current} of {total}';
    pageIndicator.textContent = template
      .replace('{current}', String(state.currentPage + 1))
      .replace('{total}', String(state.totalPages));
  }
}

/**
 * Triggers the confetti effect.
 */
export function triggerConfetti(duration) {
  const colors = [
    getCSSVariable('confetti-1'),
    getCSSVariable('confetti-2'),
    getCSSVariable('confetti-3'),
    getCSSVariable('confetti-4'),
    getCSSVariable('confetti-5'),
    getCSSVariable('confetti-6')
  ];
  const startTime = Date.now();

  const create = () => {
    if (Date.now() - startTime > duration) return;
    const p = document.createElement('div');
    p.className = 'confetti-particle';
    const size = Math.random() * 10 + 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const rot = Math.random() * 360;

    Object.assign(p.style, {
      width: `${size}px`, height: `${size}px`, backgroundColor: color,
      left: `${left}vw`, transform: `rotate(${rot}deg)`,
      borderRadius: '50%', opacity: '0.8', boxShadow: '0 0 10px rgba(255,255,255,0.5)'
    });

    document.body.appendChild(p);

    p.animate([
      { transform: `translateY(0) rotate(${rot}deg)`, opacity: 1 },
      { transform: `translateY(110vh) translateX(${(Math.random() - 0.5) * 20}vw) rotate(${rot + 360}deg)`, opacity: 0 }
    ], {
      duration: (Math.random() * 4 + 4) * 1000,
      easing: 'cubic-bezier(0, .9, .57, 1)'
    }).onfinish = () => p.remove();

    setTimeout(create, 200);
  };

  for (let i = 0; i < 10; i++) setTimeout(create, Math.random() * 1000);
}

/**
 * Renders the advice section on the results page.
 */
export function renderAdvice() {
  const section = state.elements.adviceSection;
  const congrats = state.elements.congratsSection;
  if (!section || !state.categoryPages.length) return;

  section.innerHTML = '';
  const catScores = state.categoryPages
    .filter(cat => !cat.informational)
    .map(cat => ({ ...cat, score: calculateCategoryScore(cat.id) }));

  // Handle Congratulations
  const allMax = catScores.every(c => c.score === 100);

  if (allMax) {
    if (congrats) {
      congrats.style.display = 'block';
      congrats.querySelector('p').innerHTML = nl2br(state.loadedData.metadata.congrats_message);
      congrats.querySelector('h2').innerHTML = nl2br(state.loadedData.metadata.congrats_title);
    }
    section.style.display = 'none';
    triggerConfetti(5000);
    return;
  }

  if (congrats) congrats.style.display = 'none';

  // Filter and sort advice
  const items = catScores.filter(c => c.score < 100).sort((a, b) => a.score - b.score);
  if (items.length === 0) {
    section.style.display = 'none';
    return;
  }

  const h2 = document.createElement('h2');
  h2.textContent = state.loadedData.metadata.advice_title || "Targeted Recommendations";
  section.appendChild(h2);

  if (state.loadedData.metadata.advice_intro) {
    const p = document.createElement('p');
    p.innerHTML = nl2br(state.loadedData.metadata.advice_intro);
    section.appendChild(p);
  }

  items.forEach(cat => {
    const group = document.createElement('div');
    group.className = 'advice-group';

    const filteredQuestions = cat.questions
      .map(q => ({ q, score: parseInt(state.answerState[q.field_name] || 0) }))
      .filter(item => item.score < state.maxValue)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    group.innerHTML = `
      <div class="category-advice">
        <h3>${nl2br(state.loadedData.metadata.advice_category_title)}: ${cat.name} (${cat.score}%)</h3>
        <p>${nl2br(cat.advice)}</p>
      </div>
      <div class="question-advice-grid">
        ${filteredQuestions.map(item => `
          <div class="advice-card question-card">
            <h4>${nl2br(item.q.text)}</h4>
            <p>${nl2br(item.q.advice)}</p>
          </div>
        `).join('')}
      </div>
    `;
    section.appendChild(group);
  });

  section.style.display = 'block';
}

/**
 * Shows the results section and hides the form.
 */
export function showResults() {
  const formSection = document.querySelector('.assessment-form-section');
  const resultsSection = state.elements.resultsSection;

  if (formSection) formSection.style.display = 'none';
  if (resultsSection) resultsSection.style.display = 'block';

  updateAllScores();

  const scoreMeter = document.getElementById('assessment-score');
  if (scoreMeter) {
    scoreMeter.style.width = `${state.totalScore}%`;

    const scoreText = document.createElement('span');
    scoreText.innerText = `${state.totalScore}%`;

    scoreMeter.innerHTML = "";
    scoreMeter.appendChild(scoreText);
  }

  drawAll();
  renderAdvice();
  anonymousAnalytics();
}

/**
 * Returns to the assessment form from results.
 */
export function returnToAssessment() {
  const formSection = document.querySelector('.assessment-form-section');
  const resultsSection = state.elements.resultsSection;

  if (resultsSection) resultsSection.style.display = 'none';
  if (formSection) {
    formSection.style.display = 'block';
    renderCurrentPage();
    updatePaginationControls();
  }
}

/**
 * Dynamically loads html2canvas and triggers an image download of the results.
 */
export async function downloadResultsImage() {
  const resultsSection = state.elements.resultsSection;
  if (!resultsSection) return;

  const btn = document.getElementById('download-results');
  const originalText = btn ? btn.innerText : '';
  if (btn) btn.innerText = 'Downloading...';

  try {
    // Load html2canvas if not already loaded
    if (!window.html2canvas) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load html2canvas'));
        document.head.appendChild(script);
      });
    }

    // Hide action buttons during capture
    const actionButtons = resultsSection.querySelector('.action-buttons');
    if (actionButtons) actionButtons.style.display = 'none';

    try {
      const canvas = await window.html2canvas(resultsSection, {
        scale: 2, // better resolution
        backgroundColor: getCSSVariable('body-bg') || '#ffffff',
        logging: false
      });

      // Trigger download
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assessment-results.png';
      a.click();
    } finally {
      // Restore action buttons
      if (actionButtons) actionButtons.style.display = '';
    }
  } catch (e) {
    console.error('Failed to capture results image:', e);
    alert('Failed to generate the image. Please try again.');
  } finally {
    if (btn) btn.innerText = originalText;
  }
}
