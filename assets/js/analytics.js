/**
 * Analytics and telemetry module.
 */
import { state } from './state.js';
import { getAssessmentType } from './data-service.js';
import { loadStateFromURL } from './url-state.js';

export function anonymousAnalytics() {
    const assessmentType = getAssessmentType();
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('share') === 'yes';

    if (shared) {
        return;
    }

    // Ensure current state is loaded from URL
    const assessmentState = loadStateFromURL();
    const item = {
        assessment: assessmentType,
        ...assessmentState
    };

    window.setTimeout(() => {
        if (typeof plausible !== 'undefined') {
            plausible('Assessment', { props: { assessment: JSON.stringify(item) } });
        } else {
            console.log('Analytics (Plausible not found):', item);
        }
    }, 500);
}
