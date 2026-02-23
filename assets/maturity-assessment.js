/**
 * Continuous Delivery Maturity Assessment
 * Core logic for rendering, scoring, and visualizing the assessment.
 */

// ============================================================================
// State & Constants
// ============================================================================

let currentPage = 0;
let totalPages = 0;
let categoryPages = [];
let loadedData = null;
let answerState = {};

// Chart and Matrix State
const categories = {};
const scores = {};
const counts = {};
let maxValue = 0;

// DOM Elements
let canvas, ctx, maturityForm, matrix;

/**
 * Initialize core DOM references
 */
function initializeDOMElements() {
  canvas = document.getElementById('maturity-spider');
  ctx = canvas?.getContext('2d');
  maturityForm = document.getElementById('maturity-form');
  matrix = document.getElementById('maturity-matrix');

  if (canvas) {
    canvas.width = 700;
    canvas.height = 700;
  }
}

// ============================================================================
// Core Logic & Data Loading
// ============================================================================

function getAssessmentType() {
  const scriptTag = document.querySelector('script[data-questions]');
  return scriptTag
    ? scriptTag.getAttribute('data-questions')
    : './data/continuous-delivery-assessment.json';
}

/**
 * Loads the assessment data from the JSON file specified in the script tag.
 * @returns {Promise<Object|undefined>} The loaded assessment data.
 */
async function loadQuestionsData() {
  const assessmentType = getAssessmentType();

  try {
    const response = await fetch(assessmentType);
    if (response.ok) {
      const data = await response.json();
      if (data.metadata?.language) {
        document.documentElement.lang = data.metadata.language;
      }
      return data;
    }
  } catch (error) {
    console.warn('Failed to load from:', jsonPath, error);
  }
}

/**
 * Generates the form structure based on the loaded data.
 * @param {Object} data The loaded assessment data.
 */
async function generateFormFromData(data) {
  if (!data) return;
  loadedData = data;

  // Metadata translation
  document.querySelectorAll('[data-text]').forEach(elem => {
    const key = elem.getAttribute('data-text');
    if (data.metadata[key]) {
      elem.innerHTML = nl2br(data.metadata[key]);
    }
  });

  // Intro content
  const introContent = document.getElementById('intro-content');
  if (introContent && data.metadata.intro) {
    introContent.innerHTML = nl2br(data.metadata.intro);
  }

  categoryPages = data.categories.sort((a, b) => a.order - b.order);
  totalPages = categoryPages.length;
  currentPage = 0;

  initializeMetrics(data);
  loadStateFromURL();
  renderCurrentPage();
  updatePaginationControls();

  document.addEventListener('change', handleInputChange);
}

/**
 * Initializes scoring and metric tracking objects.
 * @param {Object} data The assessment data.
 */
function initializeMetrics(data) {
  Object.keys(categories).forEach(k => delete categories[k]);
  Object.keys(scores).forEach(k => delete scores[k]);
  Object.keys(counts).forEach(k => delete counts[k]);
  maxValue = 0;

  data.categories.forEach(cat => {
    if (cat.informational) return;
    categories[cat.id] = cat.name;
    scores[cat.id] = 0;
    counts[cat.id] = 0;

    cat.questions.forEach(q => {
      q.options.forEach(opt => {
        const val = parseInt(opt.value);
        if (!isNaN(val)) maxValue = Math.max(maxValue, val);
      });
    });
  });
}

// ============================================================================
// Scoring & Calculation
// ============================================================================

/**
 * Gets all answers belonging to a specific category from the state.
 * @param {string} categoryId 
 * @returns {Array<number>}
 */
function _getCategoryAnswers(categoryId) {
  return Object.keys(answerState)
    .filter(key => key.startsWith(`${categoryId}_`))
    .map(key => parseInt(answerState[key]))
    .filter(val => !isNaN(val));
}

/**
 * Calculates the percentage score for a category.
 * @param {string} categoryId 
 * @returns {number}
 */
function calculateCategoryScore(categoryId) {
  const answers = _getCategoryAnswers(categoryId);
  if (answers.length === 0) return 0;
  const average = answers.reduce((a, b) => a + b, 0) / answers.length;
  return Math.round((average / maxValue) * 100);
}

/**
 * Calculates the distribution of answer levels for a category.
 * @param {string} categoryId 
 * @returns {Object|number} Map of level counts or 0 if no answers.
 */
function calculateCategoryCount(categoryId) {
  const answers = _getCategoryAnswers(categoryId);
  if (answers.length === 0) return 0;

  const distribution = {};
  for (let i = 1; i <= maxValue; i++) distribution[i] = 0;
  answers.forEach(val => distribution[val]++);
  return distribution;
}

/**
 * Updates all category scores and triggers re-renders.
 */
function updateScores() {
  for (const id in categories) {
    scores[id] = calculateCategoryScore(id);
    counts[id] = calculateCategoryCount(id);
  }
  draw();
}

// ============================================================================
// Chart & Matrix Rendering
// ============================================================================

/**
 * Helper to draw wrapped text labels on canvas.
 */
function drawWrappedText(ctx, text, x, y, maxWidth) {
  const fullWidth = ctx.measureText(text).width;
  if (fullWidth <= maxWidth) {
    ctx.fillText(text, x, y + 5);
    return;
  }

  const words = String(text).split(' ');
  let line1 = '', line2 = '';

  for (let i = 0; i < words.length; i++) {
    const candidate = line1 ? line1 + ' ' + words[i] : words[i];
    if (ctx.measureText(candidate).width <= maxWidth) {
      line1 = candidate;
    } else {
      line2 = words.slice(i).join(' ');
      break;
    }
  }

  ctx.fillText(line1, x, y - 2);
  ctx.fillText(line2, x, y + 10);
}

/**
 * Renders the radar/spider chart.
 */
function drawSpiderChart() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 240;

  // Grid Circles
  ctx.strokeStyle = getCSSVariable('chart-grid');
  ctx.lineWidth = 1;
  for (let i = 1; i <= maxValue; i++) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, (radius / maxValue) * i, 0, 2 * Math.PI);
    ctx.stroke();
  }

  // Grid Lines & Labels
  const entries = Object.entries(categories);
  ctx.fillStyle = getCSSVariable('chart-label');
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';

  entries.forEach(([id, name], i) => {
    const angle = (i * 2 * Math.PI) / entries.length - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();

    const labelX = centerX + Math.cos(angle) * (radius + 40);
    const labelY = centerY + Math.sin(angle) * (radius + 40);
    drawWrappedText(ctx, name, labelX, labelY, 150);
  });

  // Data Polygon
  if (Object.values(scores).some(s => s > 0)) {
    ctx.strokeStyle = getCSSVariable('chart-line');
    ctx.fillStyle = getCSSVariable('chart-fill');
    ctx.lineWidth = 3;
    ctx.beginPath();

    const points = entries.map(([id], i) => {
      const angle = (i * 2 * Math.PI) / entries.length - Math.PI / 2;
      const distance = ((scores[id] || 0) / 100) * radius;
      return {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance
      };
    });

    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length; i++) {
        const p0 = points[(i - 1 + points.length) % points.length];
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        const p3 = points[(i + 2) % points.length];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;

        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Points
    ctx.fillStyle = getCSSVariable('chart-point');
    entries.forEach(([id], i) => {
      const angle = (i * 2 * Math.PI) / entries.length - Math.PI / 2;
      const distance = ((scores[id] || 0) / 100) * radius;
      ctx.beginPath();
      ctx.arc(centerX + Math.cos(angle) * distance, centerY + Math.sin(angle) * distance, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
  }
}

/**
 * Renders the maturity matrix table.
 */
function drawMatrix() {
  if (!matrix) return;
  let html = `<thead><th></th>${Array.from({ length: maxValue }, (_, i) => `<th width="40">${i + 1}</th>`).join('')}<th width="80" class="score-header">%</th></thead><tbody>`;

  for (const [id, name] of Object.entries(categories)) {
    const valMap = counts[id] || {};
    let total = 0;
    for (let i = 1; i <= maxValue; i++) total += (valMap[i] || 0);

    html += `<tr><td>${name}</td>`;
    for (let i = 1; i <= maxValue; i++) {
      const percentage = total > 0 ? (valMap[i] || 0) / total : 0;
      const heatLevel = percentage > 0 ? Math.ceil(percentage * 5) : 0;
      html += `<td class="heat_${heatLevel}"> </td>`;
    }
    html += `<td class="score-cell">${scores[id] || 0}</td></tr>`;
  }

  matrix.innerHTML = html + '</tbody>';
}

/**
 * Triggers all chart re-renders.
 */
function draw() {
  drawSpiderChart();
  drawMatrix();
}

/**
 * Helper to fetch CSS variables from the :root.
 * @param {string} name Variable name without -- prefix.
 */
function getCSSVariable(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

/**
 * Converts newline characters (\r\n or \n) in a string to HTML <br> elements.
 * @param {string} str
 * @returns {string}
 */
function nl2br(str) {
  return String(str ?? '').replace(/\r\n|\n/g, '<br>');
}

// ============================================================================
// UI Rendering & Management
// ============================================================================

/**
 * Renders the current assessment page.
 */
function renderCurrentPage() {
  if (!maturityForm || !categoryPages.length) {
    return;
  }

  const introSection = document.getElementById("intro-section");
  introSection.style.display = introSection && currentPage === 0 ? "block" : "none";

  const category = categoryPages[currentPage];
  let html = `<fieldset><legend data-category="${category.id}">${category.name}</legend>`;

  category.questions.forEach(q => {
    let inputHtml = '';
    if (q.field_type === 'suggest') {
      const listId = `list-${q.field_name}`;
      inputHtml = `
        <div class="suggest-wrapper">
          <input type="text" name="${q.field_name}" list="${listId}" value="${answerState[q.field_name] || ''}" class="suggest-input" placeholder="Type or select an option..." />
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
              <input type="radio" name="${q.field_name}" value="${opt.value}" ${answerState[q.field_name] == opt.value ? 'checked' : ''} />
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
        <div class="question">${nl2br(q.text)}</div>
        ${inputHtml}
      </div>
    `;
  });

  maturityForm.innerHTML = html + `</fieldset>`;
}

/**
 * Updates navigation button states and page indicator.
 */
function updatePaginationControls() {
  const meta = loadedData?.metadata;
  const updateBtn = (id, text, visible, disabled) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    if (text) btn.innerText = text;
    btn.style.display = visible ? 'inline-block' : 'none';
    if (disabled !== undefined) btn.disabled = disabled;
  };

  updateBtn('prev-btn', meta?.previous_button_text, true, currentPage === 0);
  updateBtn('next-btn', meta?.next_button_text, currentPage < totalPages - 1);
  updateBtn('submit-btn', meta?.submit_button_text, currentPage === totalPages - 1);

  const pageIndicator = document.getElementById('page-indicator');
  if (pageIndicator) {
    const template = meta?.page_indicator_text || 'Page {current} of {total}';
    pageIndicator.textContent = template.replace('{current}', String(currentPage + 1)).replace('{total}', String(totalPages));
  }
}

/**
 * Renders the advice section on the results page.
 */
function renderAdvice() {
  const section = document.getElementById('advice-section');
  if (!section || !categoryPages.length) return;

  section.innerHTML = '';
  const catScores = categoryPages
    .filter(cat => !cat.informational)
    .map(cat => ({ ...cat, score: calculateCategoryScore(cat.id) }));

  // Handle Congratulations
  const allMax = catScores.every(c => c.score === 100);
  const congrats = document.getElementById('congrats-section');

  if (allMax) {
    if (congrats) {
      congrats.style.display = 'block';
      congrats.querySelector('p').innerHTML = nl2br(loadedData.metadata.congrats_message);
      congrats.querySelector('h2').innerHTML = nl2br(loadedData.metadata.congrats_title);
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
  h2.textContent = loadedData.metadata.advice_title || "Targeted Recommendations";
  section.appendChild(h2);

  if (loadedData.metadata.advice_intro) {
    const p = document.createElement('p');
    p.innerHTML = nl2br(loadedData.metadata.advice_intro);
    section.appendChild(p);
  }

  items.forEach(cat => {
    const group = document.createElement('div');
    group.className = 'advice-group';

    const filteredQuestions = cat.questions
      .map(q => ({ q, score: parseInt(answerState[q.field_name] || 0) }))
      .filter(item => item.score < maxValue)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    group.innerHTML = `
      <div class="category-advice">
        <h3>${nl2br(loadedData.metadata.advice_category_title)}: ${cat.name} (${cat.score}%)</h3>
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
function showResults() {
  const form = document.querySelector('.form-section');
  const res = document.getElementById('results-section');
  if (form) form.style.display = 'none';
  if (res) res.style.display = 'block';
  updateScores();
  renderAdvice();
  anonymousAnalytics();
}

/**
 * Triggers the confetti effect.
 */
function triggerConfetti(duration) {
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
      left: `${left}vw`, transform: `rotate(${rot}deg)`
    });

    document.body.appendChild(p);

    p.animate([
      { transform: `translateY(0) rotate(${rot}deg)`, opacity: 1 },
      { transform: `translateY(110vh) translateX(${(Math.random() - 0.5) * 20}vw) rotate(${rot + 360}deg)`, opacity: 0 }
    ], { duration: (Math.random() * 4 + 4) * 1000, easing: 'cubic-bezier(0, .9, .57, 1)' }).onfinish = () => p.remove();
    setTimeout(create, 200);
  };

  for (let i = 0; i < 10; i++) setTimeout(create, Math.random() * 1000);
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Saves current answer state and view to the URL.
 */
function saveStateToURL() {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang');

  const nextParams = new URLSearchParams();
  if (lang) nextParams.set('lang', lang);
  Object.entries(answerState).forEach(([k, v]) => nextParams.set(k, v));

  const results = document.getElementById('results-section');
  if (results?.style.display === 'block') {
    nextParams.set('view', 'results');
  } else {
    nextParams.set('view', currentPage + 1);
  }

  window.history.replaceState({}, "", `${window.location.pathname}?${nextParams.toString()}`);
}

/**
 * Loads current answers and view from the URL.
 */
function loadStateFromURL() {
  const params = new URLSearchParams(window.location.search);
  answerState = {};
  for (const [k, v] of params.entries()) {
    if (!['lang', 'view', 'page'].includes(k)) answerState[k] = v;
  }

  const view = params.get('view');
  if (view && view !== 'results') {
    const page = parseInt(view, 10);
    if (!isNaN(page) && page > 0 && page <= totalPages) {
      currentPage = page - 1;
    }
  }

  updateScores();
  return answerState;
}

function anonymousAnalytics() {
  const assessmentType = getAssessmentType();
  const params = new URLSearchParams(window.location.search);
  const shared = params.get('share') ?? '';
  if (shared == 'yes') {
    return;
  }

  const assessmentState = loadStateFromURL();
  const item = {
    assessment: assessmentType
  };

  for (let key in assessmentState) {
    item[key] = assessmentState[key];
  }

  window.setTimeout(() => {
    if (typeof plausible != 'undefined') {
      plausible('Assessment', { props: { assessment: JSON.stringify(item) } });
    } else {
      console.log(JSON.stringify(item, null, 2));
    }
  }, 500);
}


// ============================================================================
// Event Handlers & Initialization
// ============================================================================

function handleInputChange(e) {
  if (e.target.type === 'radio' || (e.target.tagName === 'INPUT' && e.target.type === 'text')) {
    answerState[e.target.name] = e.target.value;
    updateScores();
    saveStateToURL();
  }
}

/**
 * Copies the shareable URL to the clipboard.
 */
async function copyURLToClipboard(elem) {
  const meta = loadedData?.metadata;
  const original = elem.innerText;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('share', 'yes');
    await navigator.clipboard.writeText(url.toString());
    elem.innerText = meta?.copy_success || 'Copied!';
  } catch {
    elem.innerText = meta?.copy_fail || 'Failed!';
  }
  setTimeout(() => elem.innerText = original, 2000);
}

// Expose public API
window.nextPage = () => { if (currentPage < totalPages - 1) { currentPage++; renderCurrentPage(); updatePaginationControls(); saveStateToURL(); window.scrollTo(0, 0); } };
window.previousPage = () => { if (currentPage > 0) { currentPage--; renderCurrentPage(); updatePaginationControls(); saveStateToURL(); window.scrollTo(0, 0); } };
window.submitAssessment = () => { showResults(); saveStateToURL(); window.scrollTo(0, 0); };
window.returnToAssessment = () => {
  const form = document.querySelector('.form-section'), res = document.getElementById('results-section');
  if (res) res.style.display = 'none';
  if (form) { form.style.display = 'block'; renderCurrentPage(); updatePaginationControls(); }
  saveStateToURL();
};
window.copyURLToClipboard = copyURLToClipboard;
window.updateScores = updateScores;
window.draw = draw;

// Initialization
document.addEventListener("DOMContentLoaded", async () => {
  initializeDOMElements();
  const data = await loadQuestionsData();
  if (data) await generateFormFromData(data);

  if (new URLSearchParams(window.location.search).get('view') === 'results') {
    showResults();
  }
  draw();
});
