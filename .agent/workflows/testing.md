---
description: How to test the Continuous Delivery assessment application
---

To test the application efficiently, follow these steps:

1.  **Open the Assessment**:
    - Run `pnpm start` to run the application
    - Navigate to http://127.0.0.1:8080

2.  **Direct Results Testing**:
    - To jump straight to the results page with pre-filled data, append query parameters to the URL.
    - Result page with recommendations: `http://127.0.0.1:8080/?deployability_1=2&deployability_2=2&deployability_3=2&deployability_4=3&deployability_5=1&deployability_6=3&deployability_7=2&feedback_1=3&feedback_2=3&feedback_3=3&automation_1=1&automation_2=2&automation_3=3&automation_4=3&automation_5=3&automation_6=3&agility_1=1&agility_2=2&agility_3=2&agility_4=3&agility_5=3&agility_6=3&agility_7=3&view=results`
    - Result page with congratulations message and confetti: `http://127.0.0.1:8080/?deployability_1=3&deployability_2=3&deployability_3=3&deployability_4=3&deployability_5=3&deployability_6=3&deployability_7=3&feedback_1=3&feedback_2=3&feedback_3=3&automation_1=3&automation_2=3&automation_3=3&automation_4=3&automation_5=3&automation_6=3&agility_1=3&agility_2=3&agility_3=3&agility_4=3&agility_5=3&agility_6=3&agility_7=3&view=results`

3.  **Manual Verification Steps**:
    - **Pagination**: Navigate through the categories using the "Next" and "Previous" buttons.
    - **Form Submission**: Complete all questions in a category and submit to see the results.
    - **Visuals**: Verify the Spider Chart and Maturity Matrix accurately reflect the scores.
    - **Advice**: Check that the generated advice matches the scores (lowest scores should appear first).

4.  **Browser Tools**:
    - Use the `browser_subagent` to perform interactions if the flow is complex.
    - Use `capture_browser_screenshot` to verify UI/UX changes (like the curved lines in the chart).

// turbo
5.  **Console Check**:
    - Always check the browser console for errors after loading the page.