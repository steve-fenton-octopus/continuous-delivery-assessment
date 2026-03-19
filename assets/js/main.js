/**
 * Main entry point for the modular assessment tool.
 */
import { state } from './state.js';
import { nl2br } from './utils.js';
import { loadQuestionsData, initializeMetrics } from './data-service.js';
import { loadStateFromURL, saveStateToURL, getShareableURL } from './url-state.js';
import { updateAllScores } from './scoring.js';
import { drawAll } from './charts.js';
import {
    renderCurrentPage,
    updatePaginationControls,
    showResults,
    returnToAssessment,
    downloadResultsImage,
    injectBaseHTML
} from './ui-renderer.js';

/**
 * DOM Initialization
 */
function initializeDOMElements() {
    injectBaseHTML('[data-assessment-container]');

    state.elements.canvas = document.getElementById('maturity-spider');
    state.elements.ctx = state.elements.canvas?.getContext('2d');
    state.elements.maturityForm = document.getElementById('maturity-form');
    state.elements.matrix = document.getElementById('maturity-matrix');
    state.elements.introSection = document.getElementById("intro-section");
    state.elements.pageIndicator = document.getElementById('page-indicator');
    state.elements.adviceSection = document.getElementById('advice-section');
    state.elements.resultsSection = document.getElementById('results-section');
    state.elements.congratsSection = document.getElementById('congrats-section');

    if (state.elements.canvas) {
        state.elements.canvas.width = 700;
        state.elements.canvas.height = 700;
    }
}

/**
 * Global API for browser Compatibility (e.g. inline onclick if still used)
 * Better to move to event listeners.
 */
function exposeGlobalAPI() {
    window.nextPage = () => {
        if (state.currentPage < state.totalPages - 1) {
            state.currentPage++;
            renderCurrentPage();
            updatePaginationControls();
            saveStateToURL();
            window.scrollTo(0, 0);
        }
    };

    window.previousPage = () => {
        if (state.currentPage > 0) {
            state.currentPage--;
            renderCurrentPage();
            updatePaginationControls();
            saveStateToURL();
            window.scrollTo(0, 0);
        }
    };

    window.submitAssessment = () => {
        showResults();
        saveStateToURL();
        window.scrollTo(0, 0);
    };

    window.returnToAssessment = () => {
        returnToAssessment();
        saveStateToURL();
        window.scrollTo(0, 0);
    };

    window.downloadResultsImage = () => {
        downloadResultsImage();
    };

    window.copyURLToClipboard = async (elem) => {
        const meta = state.loadedData?.metadata;
        const original = elem.innerText;
        try {
            const url = getShareableURL();
            await navigator.clipboard.writeText(url);
            elem.innerText = meta?.copy_success || 'Copied!';
        } catch {
            elem.innerText = meta?.copy_fail || 'Failed!';
        }
        setTimeout(() => elem.innerText = original, 2000);
    };
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
    document.addEventListener('change', (e) => {
        if (e.target.type === 'radio' || (e.target.tagName === 'INPUT' && e.target.type === 'text')) {
            state.answerState[e.target.name] = e.target.value;
            updateAllScores();
            saveStateToURL();
        }
    });

    document.getElementById('prev-btn')?.addEventListener('click', () => window.previousPage());
    document.getElementById('next-btn')?.addEventListener('click', () => window.nextPage());
    document.getElementById('submit-btn')?.addEventListener('click', () => window.submitAssessment());
    document.getElementById('app-return-button')?.addEventListener('click', () => window.returnToAssessment());
    document.getElementById('download-results')?.addEventListener('click', () => window.downloadResultsImage());
    document.getElementById('copy-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.copyURLToClipboard(e.currentTarget);
    });
}

/**
 * Core Initialization Flow
 */
async function init() {
    initializeDOMElements();
    exposeGlobalAPI();
    setupEventListeners();

    const data = await loadQuestionsData();
    if (!data) return;

    state.loadedData = data;

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

    state.categoryPages = [...data.categories].sort((a, b) => a.order - b.order);
    state.totalPages = state.categoryPages.length;

    initializeMetrics(data);
    loadStateFromURL();

    if (new URLSearchParams(window.location.search).get('view') === 'results') {
        showResults();
    } else {
        renderCurrentPage();
        updatePaginationControls();
    }

    drawAll();
}

// Kick off
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
