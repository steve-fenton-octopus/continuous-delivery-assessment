/**
 * Data service for loading and processing assessment data.
 */
import { state, resetMetrics } from './state.js';

export function getAssessmentType() {
    const scriptTag = document.querySelector('script[data-questions]');
    return scriptTag
        ? scriptTag.getAttribute('data-questions')
        : './data/continuous-delivery-assessment.json';
}

/**
 * Loads the assessment data from the JSON file.
 */
export async function loadQuestionsData() {
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
        console.warn('Failed to load assessment data:', error);
    }
}

/**
 * Initializes metrics based on loaded data.
 */
export function initializeMetrics(data) {
    resetMetrics();

    data.categories.forEach(cat => {
        if (cat.informational) return;
        state.categories[cat.id] = cat.name;
        state.scores[cat.id] = 0;
        state.counts[cat.id] = 0;

        cat.questions.forEach(q => {
            q.options.forEach(opt => {
                const val = parseInt(opt.value);
                if (!isNaN(val)) state.maxValue = Math.max(state.maxValue, val);
            });
        });
    });
}
