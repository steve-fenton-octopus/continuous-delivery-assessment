# Continuous Delivery Assessment

A self-hosted, browser-based questionnaire that helps teams evaluate and improve their Continuous Delivery maturity across four key areas: **Deployability**, **Feedback**, **Automation**, and **Agility**.

## Quick start

```bash
pnpm install
pnpm start
```

Then open **http://localhost:8080** in your browser.

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

| Key | Description |
|-----|-------------|
| `metadata` | Titles, button labels, intro text, congratulations message |
| `categories[]` | Ordered list of question categories |
| `categories[].questions[]` | Questions, each with options and advice |

### Field types

| `field_type` | Behaviour |
|---|---|
| *(omitted)* or `radio` | Standard multiple-choice radio buttons |
| `suggest` | Free-text input with datalist autocomplete suggestions |

## Editor

The `edit/` folder contains a human-friendly visual editor for the JSON data files.

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

```bash
pnpm test
```

End-to-end tests use [Cucumber](https://cucumber.io/) and [Playwright](https://playwright.dev/). Results are saved to `.test-results/cucumber.html`.
