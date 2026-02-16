module.exports = {
    default: {
        require: ['features/step-definitions/**/*.js'],
        format: ['progress-bar', 'summary', 'html:.tests-results/cucumber.html'],
        publishQuiet: true
    }
}
