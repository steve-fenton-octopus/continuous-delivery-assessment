const { Given, When, Then, Before, After, BeforeAll, AfterAll, setDefaultTimeout } = require('@cucumber/cucumber');
const { chromium, expect } = require('@playwright/test');
const { spawn } = require('child_process');

setDefaultTimeout(60 * 1000);

let browser;
let page;
let server;

BeforeAll(async function () {
    // Start http-server using spawn
    server = spawn('npx', ['http-server', '-p', '8080'], {
        stdio: 'ignore'
    });

    // Wait a bit for the server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
});

AfterAll(async function () {
    if (server) {
        server.kill();
    }
});

Before(async function () {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    page = await context.newPage();
});

After(async function () {
    if (browser) {
        await browser.close();
    }
});

Given('I open the assessment application', async function () {
    await page.goto('http://localhost:8080');
});

Then('I should see the assessment title {string}', async function (title) {
    const header = await page.locator('h1').filter({ visible: true });
    await expect(header).toHaveText(title);
});

Given('I select value {string} for question {string}', async function (value, question) {
    const radio = await page.locator(`input[name="${question}"][value="${value}"]`);
    await radio.click();
});

const categoryQuestions = {
    'Deployability': ['deployability_1', 'deployability_2', 'deployability_3', 'deployability_4', 'deployability_5', 'deployability_6', 'deployability_7'],
    'Feedback': ['feedback_1', 'feedback_2', 'feedback_3'],
    'Automation': ['automation_1', 'automation_2', 'automation_3', 'automation_4', 'automation_5', 'automation_6'],
    'Agility': ['agility_1', 'agility_2', 'agility_3', 'agility_4', 'agility_5', 'agility_6', 'agility_7']
};

const mixedScores = {
    'Deployability': ['2', '2', '2', '3', '1', '3', '2'],
    'Feedback': ['3', '1', '2'],
    'Automation': ['1', '2', '3', '3', '3', '3'],
    'Agility': ['1', '2', '2', '3', '3', '3', '3']
};

const setCategoryScore = async (category, scoreType) => {
    const questions = categoryQuestions[category];
    let scores;
    if (scoreType === 'best') {
        scores = questions.map(() => '3');
    } else if (scoreType === 'low') {
        scores = questions.map(() => '1');
    } else if (scoreType === 'mixed') {
        scores = mixedScores[category];
    }

    for (let i = 0; i < questions.length; i++) {
        const radio = await page.locator(`input[name="${questions[i]}"][value="${scores[i]}"]`);
        await radio.click();
    }

    if (category === 'Agility') {
        await page.click('#submit-btn');
    } else {
        await page.click('#next-btn');
    }
};

When('I submit a {word} score for {string}', async function (scoreType, category) {
    await setCategoryScore(category, scoreType);
});

When('I submit the {word} score for {string}', async function (scoreType, category) {
    await setCategoryScore(category, scoreType);
});

When('I click the next button', async function () {
    await page.click('#next-btn');
});

When('I submit the assessment', async function () {
    await page.click('#submit-btn');
});

Then('I should see the results page with the spider chart', async function () {
    const spiderChart = await page.locator('#maturity-spider');
    await expect(spiderChart).toBeVisible();
});

Then('I should see advice for {string}', async function (category) {
    const adviceHeader = await page.locator('h3').filter({ hasText: category });
    await expect(adviceHeader).toBeVisible();
});

Then('I should not see advice for {string}', async function (category) {
    const adviceHeader = await page.locator('h3').filter({ hasText: category });
    await expect(adviceHeader).not.toBeVisible();
});

Then('I should see the congratulations message', async function () {
    const congratsSection = await page.locator('#congrats-section');
    await expect(congratsSection).toBeVisible();

    const heading = await congratsSection.locator('h2');
    await expect(heading).toHaveText('Congratulations!');
});
