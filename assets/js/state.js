/**
 * Centralized state management for the assessment.
 */

export const state = {
    currentPage: 0,
    totalPages: 0,
    categoryPages: [],
    loadedData: null,
    answerState: {},
    categories: {},
    scores: {},
    counts: {},
    maxValue: 0,
    totalScore: 0,

    // DOM Elements (initialized in main.js)
    elements: {
        canvas: null,
        ctx: null,
        maturityForm: null,
        matrix: null,
        introSection: null,
        pageIndicator: null,
        adviceSection: null,
        congratsSection: null
    }
};

/**
 * Resets metrics state.
 */
export function resetMetrics() {
    state.categories = {};
    state.scores = {};
    state.counts = {};
    state.maxValue = 0;
    state.totalScore = 0;
}
