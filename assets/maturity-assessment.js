// Pagination variables (global scope)
let currentPage = 0;
let totalPages = 0;
let categoryPages = [];
let loadedData = null;

// Global state to track all answers
let answerState = {};

{
  // YAML data storage
  let questionsData = null;

  // Load JSON data
  async function loadQuestionsData() {
    const scriptTag = document.querySelector('script[data-questions]');
    const jsonPath = scriptTag ? scriptTag.getAttribute('data-questions') : './data/questions-en.json';

    let loadSuccess = false;

    try {
      const response = await fetch(jsonPath);

      if (response.ok) {
        questionsData = await response.json();

        // Update document language if metadata provides it
        if (questionsData.metadata?.language) {
          document.documentElement.lang = questionsData.metadata.language;
        }

        loadSuccess = true;
        return questionsData;
      }
    } catch { }

    if (!loadSuccess) {
      console.warn('Failed to load from:', jsonPath);
    }
  }

  // Update pagination button states (global scope)
  function updatePaginationControls() {
    const previous = document.getElementById('prev-btn');
    const next = document.getElementById('next-btn');
    const submit = document.getElementById('submit-btn');
    const backToAssessment = document.getElementById('app-return-button');
    const pageIndicator = document.getElementById('page-indicator');

    if (previous) {
      previous.innerText = questionsData?.metadata?.previous_button_text || 'Previous';
      previous.disabled = currentPage === 0;
    }

    if (next) {
      next.innerText = questionsData?.metadata?.next_button_text || 'Next';

      if (currentPage === totalPages - 1) {
        next.style.display = 'none';
      } else {
        next.style.display = 'inline-block';
      }
    }

    if (submit) {
      submit.innerText = questionsData?.metadata?.submit_button_text || 'Submit assessment';

      if (currentPage === totalPages - 1) {
        submit.style.display = "inline-block";
      } else {
        submit.style.display = "none";
      }
    }

    if (backToAssessment) {
      backToAssessment.innerText = questionsData?.metadata?.back_to_assessment || 'Return to Assessment';
    }

    // Update page indicator text with translation support
    if (pageIndicator) {
      const template = questionsData?.metadata?.page_indicator_text || 'Page {current} of {total}';
      pageIndicator.textContent = template
        .replace('{current}', String(currentPage + 1))
        .replace('{total}', String(totalPages));
    }
  }

  // Generate form HTML from YAML data with pagination
  async function generateFormFromData(data) {
    if (!data) {
      console.warn('No data provided for form generation');
      return;
    }

    loadedData = data;

    const form = document.getElementById('maturity-form');
    if (!form) {
      console.warn('Form element with id "maturity-form" not found');
      return;
    }

    document.querySelectorAll('[data-text]').forEach(elem => {
      const key = elem.getAttribute('data-text');
      if (data.metadata[key]) {
        // Handle array for intro or other fields if needed
        if (Array.isArray(data.metadata[key])) {
          elem.innerHTML = data.metadata[key].map(p => `<p>${p}</p>`).join('');
        } else {
          elem.innerHTML = data.metadata[key];
        }
      }
    });

    // Special handling for intro-content if it exists
    const introContent = document.getElementById('intro-content');
    if (introContent && Array.isArray(data.metadata.intro)) {
      introContent.innerHTML = data.metadata.intro.map(p => `
        <p>${p}</p>
      `).join('');
    }

    // Store categories for pagination
    categoryPages = data.categories.sort((a, b) => a.order - b.order);
    totalPages = categoryPages.length;
    currentPage = 0;

    // Initialize pagination
    renderCurrentPage();
    updatePaginationControls();

    // Reinitialize after form generation
    initializeAfterFormGeneration();
  }

  // Reinitialize form listeners and data after dynamic generation
  function initializeAfterFormGeneration() {
    // Update categories object from YAML data instead of DOM
    // This ensures all categories are included, not just the current page
    const inputs = document.querySelectorAll("input");

    // Clear existing data
    Object.keys(categories).forEach(key => delete categories[key]);
    Object.keys(scores).forEach(key => delete scores[key]);
    Object.keys(counts).forEach(key => delete counts[key]);

    maxValue = 0;

    // Rebuild categories from YAML data (categoryPages contains all categories)
    if (categoryPages && categoryPages.length > 0) {
      categoryPages.forEach((categoryData) => {
        const categoryId = categoryData.id;
        const categoryName = categoryData.name;

        categories[categoryId] = categoryName;
        scores[categoryId] = 0;
        counts[categoryId] = 0;
      });
    }

    // Check YAML data for maxValue to ensure we get all possible values
    categoryPages?.flatMap(cat => cat.questions ?? [])
      .flatMap(q => q.options ?? [])
      .forEach(opt => {
        const value = parseInt(opt.value);
        if (!isNaN(value)) maxValue = Math.max(maxValue, value);
      });

    // Re-add event listeners for new radio buttons
    document.addEventListener('change', handleRadioChange);

    // Load state from URL and draw charts
    loadStateFromURL();
  }

  // Handle radio button changes
  function handleRadioChange(e) {
    if (e.target.type === 'radio') {
      // Save answer to state
      answerState[e.target.name] = e.target.value;

      // Update scores and chart
      window.updateScores();
      window.saveStateToURL();
    }
  }

  // Get copy messages from current language dynamically
  async function getCurrentLanguageCopyMessages() {
    const defaultCopyText = {
      copySuccess: '📋 Copied!',
      copyFail: 'Failed! Please copy from address bar.'
    };

    if (questionsData && questionsData.metadata) {
      return {
        copySuccess: questionsData.metadata.copy_success || questionsData.metadata.copy_link_text || defaultCopyText.copySuccess,
        copyFail: questionsData.metadata.copy_fail || defaultCopyText.copyFail
      };
    }

    // Fallback messages
    return defaultCopyText;
  }

  // Chart setup
  const canvas = document.getElementById('maturity-spider');
  const ctx = canvas.getContext('2d');

  // Elements
  const maturityForm = document.getElementById('maturity-form');
  const legends = maturityForm ? maturityForm.querySelectorAll('legend[data-category]') : [];
  const inputs = maturityForm ? maturityForm.querySelectorAll('input') : [];
  const matrix = document.getElementById('maturity-matrix');
  const scoreList = document.getElementById('maturity-scores');

  // Categories are used to drive the app
  const categories = {};
  const scores = {};
  const counts = {};
  let maxValue = 0;

  // Initialize categories from existing HTML (fallback)
  legends.forEach((legend) => {
    const category = legend.dataset.category;
    const text = legend.innerText;

    categories[category] = text;
    scores[category] = 0;
    counts[category] = 0;
  });

  inputs.forEach((input) => {
    const value = parseInt(input.value);

    if (!isNaN(value)) {
      maxValue = Math.max(maxValue, value);
    }
  });

  // Set canvas size
  canvas.width = 700;
  canvas.height = 700;

  // Helper: draw label with simple two-line wrap if text exceeds maxWidth
  function drawWrappedText(ctx, text, x, y, maxWidth) {
    const fullWidth = ctx.measureText(text).width;
    if (fullWidth <= maxWidth) {
      ctx.fillText(text, x, y + 5);
      return;
    }

    const words = String(text).split(' ');
    let line1 = '';
    let line2 = '';

    if (words.length > 1) {
      for (let i = 0; i < words.length; i++) {
        const candidate = line1 ? line1 + ' ' + words[i] : words[i];
        if (ctx.measureText(candidate).width <= maxWidth) {
          line1 = candidate;
        } else {
          line2 = words.slice(i).join(' ');
          break;
        }
      }
      if (!line1) {
        // Edge case: first word already exceeds; split word in half
        const w0 = words[0];
        const mid = Math.floor(w0.length / 2);
        line1 = w0.slice(0, mid);
        line2 = w0.slice(mid) + (words.length > 1 ? ' ' + words.slice(1).join(' ') : '');
      }
    } else {
      // No spaces, split approximately in half
      const mid = Math.max(1, Math.floor(String(text).length / 2));
      line1 = String(text).slice(0, mid);
      line2 = String(text).slice(mid);
    }

    // Draw the two lines centered near the intended label point
    ctx.fillText(line1, x, y - 2);
    ctx.fillText(line2, x, y + 10);
  }

  function drawSpiderChart() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 240;

    // Draw grid circles
    ctx.strokeStyle = '#c4c4c4';
    ctx.lineWidth = 1;
    for (let i = 1; i <= maxValue; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / maxValue) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw grid lines and labels
    ctx.strokeStyle = '#c4c4c4';
    ctx.fillStyle = '#4a5568';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';

    const displayNames = Object.values(categories);
    const entries = Object.entries(categories);


    for (let i = 0; i < entries.length; i++) {
      const [categoryId, categoryName] = entries[i];
      const angle = (i * 2 * Math.PI) / entries.length - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Draw grid line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Draw label with simple two-line wrap for long text
      const labelX = centerX + Math.cos(angle) * (radius + 40);
      const labelY = centerY + Math.sin(angle) * (radius + 40);
      drawWrappedText(ctx, categoryName, labelX, labelY, 150);
    }

    // Draw level numbers
    ctx.fillStyle = '#c4c4c4';
    ctx.font = '12px Arial';
    for (let i = 1; i <= maxValue; i++) {
      ctx.fillText(i.toString(), centerX + 5, centerY - (radius / maxValue) * i + 3);
    }

    // Draw data polygon
    if (Object.values(scores).some((score) => score > 0)) {
      ctx.strokeStyle = '#0E83C6';
      ctx.fillStyle = 'rgba(120, 120, 120, 0.2)';
      ctx.lineWidth = 3;

      ctx.beginPath();
      for (let i = 0; i < entries.length; i++) {
        const [categoryId, categoryName] = entries[i];
        const score = scores[categoryId] || 0;
        const angle = (i * 2 * Math.PI) / entries.length - Math.PI / 2;
        const distance = (score / 100) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw data points
      ctx.fillStyle = "#0E83C6";
      for (let i = 0; i < entries.length; i++) {
        const [categoryId, categoryName] = entries[i];
        const score = scores[categoryId] || 0;
        const angle = (i * 2 * Math.PI) / entries.length - Math.PI / 2;
        const distance = (score / 100) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  function drawRow(category, categoryId, values) {
    let row = `<tr><td>${category}</td>`;

    // Total counts for this category to calculate percentages
    let totalAnswers = 0;
    for (let i = 1; i <= maxValue; i++) {
      totalAnswers += values[i.toString()] || 0;
    }

    for (let i = 1; i <= maxValue; i++) {
      const count = values[i.toString()] || 0;
      let heatLevel = 0;
      if (count > 0 && totalAnswers > 0) {
        const percentage = count / totalAnswers;
        // Map percentage to 1-5 scale
        // Ensure even very low percentages (like 1/7) get at least level 1
        heatLevel = Math.ceil(percentage * 5);
      }
      row += `<td class="heat_${heatLevel}"> </td>`;
    }

    const score = scores[categoryId] || 0;
    row += `<td class="score-cell">${score}</td>`;
    row += "</tr>";

    return row;
  }

  function drawMatrix() {
    let table = `<thead><th></th>`;

    for (let i = 1; i <= maxValue; i++) {
      table += `<th width="40">${i}</th>`;
    }

    table += `<th width="80" class="score-header">%</th>`;
    table += `</thead><tbody>`;

    for (let category in categories) {
      table += drawRow(categories[category], category, counts[category]);
    }

    table += `</tbody>`;

    matrix.innerHTML = table;
  }

  function draw() {
    drawSpiderChart();
    drawMatrix();
  }

  function calculateCategoryScore(category) {
    // Read answers from answerState
    const answeredQuestions = [];
    let total = 0;

    // Check answerState for all questions in this category
    for (const key in answerState) {
      if (key.startsWith(`${category}_`)) {
        const value = answerState[key];
        if (value !== null && value !== undefined) {
          answeredQuestions.push(key);
          total += parseInt(value);
        }
      }
    }

    if (answeredQuestions.length === 0) return 0;
    const average = total / answeredQuestions.length;
    return Math.round((average / maxValue) * 100);
  }

  function calculateCategoryCount(category) {
    // Read answers from answerState
    const count = {};

    // Initialize count object
    for (let i = 1; i <= maxValue; i++) {
      count[i] = 0;
    }

    // Check answerState for all questions in this category
    let hasAnswers = false;
    for (const key in answerState) {
      if (key.startsWith(`${category}_`)) {
        const value = answerState[key];
        if (value !== null && value !== undefined) {
          hasAnswers = true;
          const intValue = parseInt(value ?? 0).toString();
          if (count[intValue] !== undefined) {
            count[intValue]++;
          }
        }
      }
    }

    return hasAnswers ? count : 0;
  }

  function updateScores() {
    for (var name in categories) {
      scores[name] = calculateCategoryScore(name);
      counts[name] = calculateCategoryCount(name);
    }

    // Redraw charts
    draw();
  }

  function updateLanguageSwitcher() {
    // Update all language switcher links to include current answer state
    const languageLinks = document.querySelectorAll('.languages a');

    if (!languageLinks.length) return; // No language switcher found

    languageLinks.forEach(link => {
      const linkURL = new URL(link.href, window.location.origin);
      const linkParams = new URLSearchParams(linkURL.search);
      const targetLang = linkParams.get('lang'); // Get the target language from the link

      // Build new params with all answers
      const newParams = new URLSearchParams();

      // Set language (or omit if it's the default/English)
      if (targetLang) {
        newParams.set('lang', targetLang);
      }

      // Add all current answers
      for (const key in answerState) {
        newParams.set(key, answerState[key]);
      }

      // Preserve current view if results are visible (so switching language stays on results)
      const resultsSection = document.getElementById('results-section');
      const isResultsVisible = resultsSection && resultsSection.style.display === 'block';
      // Also check URL param as a fallback
      const currentParams = new URLSearchParams(window.location.search);
      const urlView = currentParams.get('view');
      if (isResultsVisible || urlView === 'results') {
        newParams.set('view', 'results');
      }

      // Update the link
      const queryString = newParams.toString();
      link.href = window.location.pathname + (queryString ? '?' + queryString : '');
    });
  }

  function saveStateToURL() {
    const params = new URLSearchParams();

    // Preserve language parameter
    const currentParams = new URLSearchParams(window.location.search);
    const langParam = currentParams.get('lang');
    if (langParam) {
      params.set('lang', langParam);
    }

    // Add all answers from answerState
    for (const key in answerState) {
      params.set(key, answerState[key]);
    }

    // Preserve current view state (results vs assessment)
    const resultsSection = document.getElementById('results-section');
    const isResultsVisible = resultsSection && resultsSection.style.display === 'block';
    if (isResultsVisible) {
      params.set('view', 'results');
    }

    const newURL = window.location.pathname + "?" + params.toString();
    window.history.replaceState({}, "", newURL);

    updateLanguageSwitcher();
  }

  function loadStateFromURL() {
    const params = new URLSearchParams(window.location.search);

    // Clear existing state
    answerState = {};

    // Load all parameters into answerState (except 'lang')
    for (const [key, value] of params.entries()) {
      if (key !== 'lang' && key !== 'view') {
        answerState[key] = value;
      }
    }

    // Apply loaded state to visible form elements
    for (const [key, value] of Object.entries(answerState)) {
      const radio = maturityForm.querySelector(
        `input[name="${key}"][value="${value}"]`
      );

      if (radio) {
        radio.checked = true;
      }
    }

    updateScores();
  }

  // Make these functions globally accessible for pagination
  window.saveStateToURL = saveStateToURL;
  window.updateScores = updateScores;
  window.draw = draw;
  window.updatePaginationControls = updatePaginationControls;

  function getShareableURL() {
    return window.location.href;
  }

  function revert(elem, text) {
    elem.innerText = text;
  }

  async function copyURLToClipboard(elem) {
    const copyMessages = await getCurrentLanguageCopyMessages();
    const originalText = elem.innerText;

    const shareableURL = getShareableURL();;

    navigator.clipboard
      .writeText(shareableURL)
      .then(function () {
        elem.innerText = copyMessages.copySuccess;
        console.log('copied');
        window.setTimeout(() => revert(elem, originalText), 2000);
      })
      .catch(function (err) {
        elem.innerText = copyMessages.copyFail;
        console.log('copy failed:', err);
        window.setTimeout(() => revert(elem, originalText), 2000);
      });
  }

  // Make copyURLToClipboard globally accessible
  window.copyURLToClipboard = copyURLToClipboard;

  document.addEventListener("DOMContentLoaded", async function () {
    // Try to load data first
    const data = await loadQuestionsData();

    if (data) {
      // Generate form from data
      await generateFormFromData(data);
    } else {
      // Fallback to existing HTML structure
      loadStateFromURL();
    }

    // If URL indicates results view, show results immediately
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'results') {
      showResults();
      // Ensure URL reflects current state (including view)
      saveStateToURL();
    }
    draw();
  });

  // Initial chart draw
  draw();

  /**
   * Render targeted advice based on categories with < 100% score
   */
  function renderAdvice() {
    const adviceSection = document.getElementById('advice-section');
    if (!adviceSection || !categoryPages.length) return;

    // 1. Clean start: empty the advice section
    adviceSection.innerHTML = '';

    // 2. Check for max score (entire assessment)
    const allMaxScore = categoryPages.every(cat => {
      const score = parseFloat(calculateCategoryScore(cat.id));
      return score === 100;
    });

    const congratsSection = document.getElementById('congrats-section');
    if (allMaxScore) {
      if (congratsSection) {
        congratsSection.style.display = 'block';
        const congratsMsg = loadedData.metadata.congrats_message;
        const congratsTitle = loadedData.metadata.congrats_title;
        congratsSection.querySelector('p').innerHTML = congratsMsg;
        congratsSection.querySelector('h2').innerHTML = congratsTitle;
      }
      adviceSection.style.display = 'none';
      triggerConfetti(5000);
      return;
    } else {
      if (congratsSection) congratsSection.style.display = 'none';
    }

    // 3. Filter and sort categories that need advice (score < 100%)
    const categoriesToImprove = categoryPages
      .map(cat => ({
        ...cat,
        score: parseFloat(calculateCategoryScore(cat.id))
      }))
      .filter(cat => cat.score < 100);

    // Sort by score ascending (lowest score first)
    categoriesToImprove.sort((a, b) => a.score - b.score);

    if (categoriesToImprove.length === 0) {
      adviceSection.style.display = 'none';
      return;
    }

    // 4. Render main advice title (Targeted Recommendations)
    const mainAdviceTitle = loadedData.metadata.advice_title || "Targeted Recommendations";
    const mainHeader = document.createElement('h2');
    mainHeader.textContent = mainAdviceTitle;
    adviceSection.appendChild(mainHeader);

    // 5. Render advice for each category
    const categoryTitleLabel = loadedData.metadata.advice_category_title;
    const questionsTitleLabel = loadedData.metadata.advice_questions_title;

    categoriesToImprove.forEach(cat => {
      const adviceGroup = document.createElement('div');
      adviceGroup.className = 'advice-group';

      // Get filtered and sorted questions for this category (exclude max score)
      const qScores = cat.questions
        .map(q => {
          const val = answerState[q.field_name];
          return {
            question: q,
            score: val ? parseInt(val) : 0
          };
        })
        .filter(item => item.score < maxValue);

      qScores.sort((a, b) => a.score - b.score);
      const lowestQuestions = qScores.slice(0, 3);

      let questionsHtml = '';
      lowestQuestions.forEach(item => {
        questionsHtml += `
          <div class="advice-card question-card">
            <h5>${item.question.text}</h5>
            <p>${item.question.advice}</p>
          </div>
        `;
      });

      adviceGroup.innerHTML = `
        <div class="category-advice">
          <h3>${categoryTitleLabel}: ${cat.name}</h3>
          <p>${cat.advice}</p>
          <h4>${questionsTitleLabel}</h4>
        </div>
        <div class="question-advice-grid">
          ${questionsHtml}
        </div>
      `;

      adviceSection.appendChild(adviceGroup);
    });

    adviceSection.style.display = 'block';
  }

  /**
   * Trigger a simple confetti effect for a specified duration
   */
  function triggerConfetti(duration) {
    const colors = ['#0E83C6', '#274B66', '#FFD700', '#FF6347', '#32CD32', '#9370DB'];
    const container = document.body;
    const startTime = Date.now();

    function createParticle() {
      if (Date.now() - startTime > duration) return;

      const particle = document.createElement('div');
      particle.className = 'confetti-particle';

      const size = Math.random() * 10 + 5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const rotation = Math.random() * 360;

      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.backgroundColor = color;
      particle.style.left = `${left}vw`;
      particle.style.transform = `rotate(${rotation}deg)`;

      container.appendChild(particle);

      const animationDuration = Math.random() * 4 + 4;
      const horizontalShift = (Math.random() - 0.5) * 20;

      particle.animate([
        { transform: `translateY(0) rotate(${rotation}deg)`, opacity: 1 },
        { transform: `translateY(110vh) translateX(${horizontalShift}vw) rotate(${rotation + 360}deg)`, opacity: 0 }
      ], {
        duration: animationDuration * 1000,
        easing: 'cubic-bezier(0, .9, .57, 1)'
      }).onfinish = () => particle.remove();

      setTimeout(createParticle, 200);
    }

    for (let i = 0; i < 10; i++) {
      setTimeout(createParticle, Math.random() * 1000);
    }
  }

  /**
   * Show results section
   */
  function showResults() {
    const formSection = document.querySelector('.form-section');
    const resultsSection = document.getElementById('results-section');

    if (formSection) {
      formSection.style.display = 'none';
    }

    if (resultsSection) {
      resultsSection.style.display = 'block';
    }

    // Trigger the existing chart and scores calculation
    window.draw();
    window.updateScores();

    // Render targeted advice
    renderAdvice();
  }

  // Make functions accessible outside
  window.renderAdvice = renderAdvice;
  window.showResults = showResults;
}



// Render the current page content (global scope for access from pagination functions)
function renderCurrentPage() {
  const form = document.getElementById("maturity-form");
  const pageIndicator = document.getElementById("page-indicator");
  const introSection = document.getElementById("intro-section");

  if (!form || !categoryPages.length) return;

  // Show/hide intro based on page
  if (introSection) {
    introSection.style.display = currentPage === 0 ? "block" : "none";
  }

  // Get current category
  const category = categoryPages[currentPage];

  // Generate HTML for current page
  let formHTML = `
    <fieldset>
      <legend data-category="${category.id}">${category.name}</legend>
  `;

  category.questions.forEach((question) => {
    formHTML += `
      <div class="question-group">
        <div class="question">${question.text}</div>
        <div class="options">
    `;

    question.options.forEach((option) => {
      formHTML += `
        <label class="option">
          <input type="radio" name="${question.field_name}" value="${option.value}" />
          <div class="option-text">
            <span class="option-level">${option.level}</span><br />
            <span class="option-description">${option.description}</span>
          </div>
        </label>
      `;
    });

    formHTML += `
        </div>
      </div>
    `;
  });

  formHTML += `</fieldset>`;
  form.innerHTML = formHTML;

  // Restore answers for current page
  restoreCurrentPageAnswers();
}

// Save answers for current page to answerState
function saveCurrentPageAnswers() {
  const form = document.getElementById("maturity-form");
  if (!form) return;

  const inputs = form.querySelectorAll('input[type="radio"]:checked');
  inputs.forEach((input) => {
    answerState[input.name] = input.value;
  });

  // Update URL with all state
  window.saveStateToURL();
}

// Restore answers for current page from answerState
function restoreCurrentPageAnswers() {
  const form = document.getElementById("maturity-form");
  if (!form) return;

  const inputs = form.querySelectorAll('input[type="radio"]');
  inputs.forEach((input) => {
    const savedValue = answerState[input.name];
    if (savedValue && input.value === savedValue) {
      input.checked = true;
    }
  });
}

// Global pagination functions (accessible from HTML)
window.nextPage = function () {
  if (currentPage < totalPages - 1) {
    saveCurrentPageAnswers();
    currentPage++;
    renderCurrentPage();
    window.updatePaginationControls();
    // Scroll to top of page for better UX
    window.scrollTo(0, 0);
  }
};

window.previousPage = function () {
  if (currentPage > 0) {
    saveCurrentPageAnswers();
    currentPage--;
    renderCurrentPage();
    window.updatePaginationControls();
    // Scroll to top of page for better UX
    window.scrollTo(0, 0);
  }
};

window.submitAssessment = function () {
  saveCurrentPageAnswers();
  showResults();
  // Persist results view in the URL so it can be restored or preserved when changing language
  window.saveStateToURL();
  // Scroll to top to show results section
  window.scrollTo(0, 0);
};

window.returnToAssessment = function () {
  const formSection = document.querySelector('.form-section');
  const resultsSection = document.getElementById('results-section');

  if (resultsSection) resultsSection.style.display = 'none';
  if (formSection) {
    formSection.style.display = 'block';
    // Restore the current page and answers
    renderCurrentPage();
    window.updatePaginationControls();
    restoreCurrentPageAnswers();
  }
  // Remove results view from the URL
  window.saveStateToURL();
};



