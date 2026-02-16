module.exports = {
    default: {
        require: ['features/step-definitions/**/*.js'],
        format: ['progress-bar', 'summary', 'html:cucumber-report.html'],
        publishQuiet: true
    }
}
