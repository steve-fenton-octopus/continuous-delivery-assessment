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

Try out the [Continuous Delivery Assessment](https://steve-fenton-octopus.github.io/continuous-delivery-assessment/continuous-delivery.html).

Jump straight to a [pre-filled results page](https://steve-fenton-octopus.github.io/continuous-delivery-assessment/continuous-delivery.html?deployability_1=2&deployability_2=2&deployability_3=2&deployability_4=3&deployability_5=1&deployability_6=3&deployability_7=2&feedback_1=3&feedback_2=3&feedback_3=3&automation_1=1&automation_2=2&automation_3=2&automation_4=2&automation_5=3&automation_6=1&agility_1=1&agility_2=2&agility_3=2&agility_4=3&agility_5=3&agility_6=3&agility_7=3&view=results).

You can also browse a [list of assessments](Try out the [Continuous Delivery Assessment](https://steve-fenton-octopus.github.io/continuous-delivery-assessment/).

## Quick start

```bash
pnpm install
pnpm start
```

Then open [localhost:8080](http://localhost:8080) in your browser.

Or use this [pre-filled results page](http://localhost:8080/continuous-delivery.html?deployability_1=1&deployability_2=1&deployability_3=1&deployability_4=1&deployability_5=1&deployability_6=1&deployability_7=1&feedback_1=2&feedback_2=2&feedback_3=2&automation_1=3&automation_2=3&automation_3=3&automation_4=3&automation_5=3&automation_6=3&agility_1=1&agility_2=2&agility_3=2&agility_4=3&agility_5=3&agility_6=2&agility_7=2&informational_1=jenkins&informational_2=octopus&build_tool=GitLab+CI&deploy_tool=Octopus+Deploy&view=results)

## Project structure

```
index.html          # The assessment app
assets/
  assessment.css   # Styles and design tokens
  maturity-assessment.js    # Assessment logic
data/
  *.json            # Assessment definition files
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
