# Assessment tool

The tool runs from a data file and this can be changed by setting the `data-questions` attribute on the script tag.

```html
<script
  src="./assets/maturity-assessment.js"
  data-questions="./data/continuous-delivery-assessment.json"
></script>
```

TODO:

1. Remove the placeholder HTML and inject it from the JS app

## Continuous Delivery Assessment

A self-hosted, browser-based questionnaire that helps teams evaluate and improve their Continuous Delivery maturity across four key areas: **Deployability**, **Feedback**, **Automation**, and **Agility**.

## Try it out

Try out the [Continuous Delivery Assessment](https://steve-fenton-octopus.github.io/continuous-delivery-assessment/).

Jump straight to a [pre-filled results page](https://steve-fenton-octopus.github.io/continuous-delivery-assessment/?deployability_1=1&deployability_2=2&deployability_3=2&deployability_4=1&deployability_5=1&deployability_6=1&deployability_7=1&feedback_1=1&feedback_2=2&feedback_3=2&automation_1=1&automation_2=1&automation_3=3&automation_4=1&automation_5=3&automation_6=3&agility_1=1&agility_2=2&agility_3=3&agility_4=3&agility_5=3&agility_6=2&agility_7=3&build_tool=GitHub+Actions&deploy_tool=Octopus+Deploy&view=results&share=yes).

## Quick start

```bash
pnpm install
pnpm start
```

Then open [localhost:8080](http://localhost:8080) in your browser.

Or use this [pre-filled results page](http://localhost:8080/?deployability_1=1&deployability_2=1&deployability_3=1&deployability_4=1&deployability_5=1&deployability_6=1&deployability_7=1&feedback_1=2&feedback_2=2&feedback_3=2&automation_1=3&automation_2=3&automation_3=3&automation_4=3&automation_5=3&automation_6=3&agility_1=1&agility_2=2&agility_3=2&agility_4=3&agility_5=3&agility_6=2&agility_7=2&informational_1=jenkins&informational_2=octopus&build_tool=GitLab+CI&deploy_tool=Octopus+Deploy&view=results)

There's an editor for the JSON files at [localhost:8080/edit](http://localhost:8080/edit/).

## Project structure

```
index.html          # The assessment app
assets/
  maturity-assessment.css   # Styles and design tokens
  maturity-assessment.js    # Assessment logic
data/
  *.json            # Assessment definition files
edit/               # JSON editor mini app (see below)
features/           # Cucumber end-to-end tests
```

## Assessment data files

Assessment content lives in `data/*.json`. Each file defines:

| Key                        | Description                                                |
| -------------------------- | ---------------------------------------------------------- |
| `metadata`                 | Titles, button labels, intro text, congratulations message |
| `categories[]`             | Ordered list of question categories                        |
| `categories[].questions[]` | Questions, each with options and advice                    |

### Field types

| `field_type`           | Behavior                                               |
| ---------------------- | ------------------------------------------------------ |
| *(omitted)* or `radio` | Standard multiple-choice radio buttons                 |
| `suggest`              | Free-text input with datalist autocomplete suggestions |

## Editor

There's a human-friendly visual editor for the JSON data files at [localhost:8080/edit](http://localhost:8080/edit/).

### Starting the editor

The editor is served alongside the assessment app — just navigate to **/edit/** in the same browser tab:

```
http://localhost:8080/edit/
```

### Using the editor

1. **Select a file** — choose a JSON file from the dropdown at the top. The full list of questions loads into the table.

2. **Edit a question** — click **✏️ Edit** on any row to open the edit panel.

   - **Question text** — supports line breaks; press Enter freely. Line breaks are preserved correctly in the saved JSON.
   - **Advice** — text shown on the results page for low-scoring questions.
   - **Field name** — the unique key used in URL sharing (e.g. `deployability_1`).
   - **Field type** — leave blank or `radio` for standard questions; use `suggest` for a text-input with autocomplete.
   - **Options** — edit the value (numeric score or text key), display label, and optional description for each option. Use **+ Add option** / **✕** to add or remove options.

3. **Save the question** — click **💾 Save question**. Changes are held in memory.

4. **Edit metadata** — scroll below the table to find the Metadata section. Edit top-level fields (title, button labels, intro paragraphs, etc.) and click **💾 Save metadata**.

5. **Download** — click **⬇ Download JSON** to save the updated file to your computer. Replace the file in `data/` to publish your changes.

> **Note:** the editor runs entirely in the browser; there is no auto-save. Always download before closing the tab.

## Running tests

To set up the browser used by Playwright (the browser automation test tool), run:

```bash
pnpm prepare
```

Then run the tests:

```bash
pnpm test
```

End-to-end tests use [Cucumber](https://cucumber.io/) and [Playwright](https://playwright.dev/). Results are saved to `.test-results/cucumber.html`.
