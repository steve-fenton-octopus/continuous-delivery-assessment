/**
 * URL state management for persistence.
 */
import { state } from './state.js';
import { updateAllScores } from './scoring.js';

/**
 * Saves current answer state and view to the URL.
 */
export function saveStateToURL() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang');

    const nextParams = new URLSearchParams();
    if (lang) nextParams.set('lang', lang);
    Object.entries(state.answerState).forEach(([k, v]) => nextParams.set(k, v));

    const resultsVisible = state.elements.resultsSection?.style.display === 'block';
    if (resultsVisible) {
        nextParams.set('view', 'results');
    } else {
        nextParams.set('view', state.currentPage + 1);
    }

    window.history.replaceState({}, "", `${window.location.pathname}?${nextParams.toString()}`);
}

/**
 * Loads current answers and view from the URL.
 */
export function loadStateFromURL() {
    const params = new URLSearchParams(window.location.search);
    state.answerState = {};
    for (const [k, v] of params.entries()) {
        if (!['lang', 'view', 'page', 'share'].includes(k)) {
            state.answerState[k] = v;
        }
    }

    const view = params.get('view');
    if (view && view !== 'results') {
        const page = parseInt(view, 10);
        if (!isNaN(page) && page > 0 && page <= state.totalPages) {
            state.currentPage = page - 1;
        }
    }

    updateAllScores();
    return state.answerState;
}

/**
 * Gets shareable URL.
 */
export function getShareableURL() {
    const url = new URL(window.location.href);
    url.searchParams.set('share', 'yes');
    return url.toString();
}
