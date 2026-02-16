const { Given, Then, Before, After, BeforeAll, AfterAll, setDefaultTimeout } = require('@cucumber/cucumber');
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
    const header = await page.locator('h1');
    await expect(header).toHaveText(title);
});
