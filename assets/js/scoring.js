/**
 * Scoring logic for the assessment.
 */
import { state } from './state.js';

/**
 * Gets all answers belonging to a specific category from the state.
 */
export function getCategoryAnswers(categoryId) {
    return Object.keys(state.answerState)
        .filter(key => key.startsWith(`${categoryId}_`))
        .map(key => parseInt(state.answerState[key]))
        .filter(val => !isNaN(val));
}

/**
 * Calculates the percentage score for a category.
 */
export function calculateCategoryScore(categoryId) {
    const answers = getCategoryAnswers(categoryId);
    if (answers.length === 0) return 0;
    const average = answers.reduce((a, b) => a + b, 0) / answers.length;
    return Math.round((average / state.maxValue) * 100);
}

/**
 * Calculates the distribution of answer levels for a category.
 */
export function calculateCategoryCount(categoryId) {
    const answers = getCategoryAnswers(categoryId);
    if (answers.length === 0) return 0;

    const distribution = {};
    for (let i = 1; i <= state.maxValue; i++) distribution[i] = 0;
    answers.forEach(val => distribution[val]++);
    return distribution;
}

/**
 * Updates all category scores.
 */
export function updateAllScores() {
    for (const id in state.categories) {
        state.scores[id] = calculateCategoryScore(id);
        state.counts[id] = calculateCategoryCount(id);
    }
}
