// Autogenerated by Nightwatch
// Refer to the online docs for more details: https://nightwatchjs.org/gettingstarted/configuration/
const Services = {};
loadServices();

module.exports = {
    // An array of folders (excluding subfolders) where your tests are located;
    // if this is not specified, the test source must be passed as the second argument to the test runner.
    src_folders: ['tests'],

    // See https://nightwatchjs.org/guide/working-with-page-objects/
    page_objects_path: '',

    // See https://nightwatchjs.org/guide/extending-nightwatch/#writing-custom-commands
    custom_commands_path: '',

    // See https://nightwatchjs.org/guide/extending-nightwatch/#writing-custom-assertions
    custom_assertions_path: '',

    // See https://nightwatchjs.org/guide/#external-globals
    globals_path: '',

    webdriver: {},

    test_settings: {
        default: {
            disable_error_log: false,
            launch_url: 'https://nightwatchjs.org',

            screenshots: {
                enabled: false,
                path: 'screens',
                on_failure: true,
            },

            desiredCapabilities: {
                browserName: 'chrome',
                chromeOptions: {
                    args: [
                        //'-headless',
                    ],
                },
            },
            webdriver: {
                start_process: true,
                port: 9515,
                server_path: Services.chromedriver
                    ? Services.chromedriver.path
                    : '',
                cli_args: [
                    // --verbose
                ],
            },
        },

        firefox: {
            desiredCapabilities: {
                browserName: 'firefox',
                alwaysMatch: {
                    // Enable this if you encounter unexpected SSL certificate errors in Firefox
                    // acceptInsecureCerts: true,
                    'moz:firefoxOptions': {
                        args: [
                            // '-headless',
                            // '-verbose'
                        ],
                    },
                },
            },
            webdriver: {
                start_process: true,
                port: 4444,
                server_path: Services.geckodriver
                    ? Services.geckodriver.path
                    : '',
                cli_args: [
                    // very verbose geckodriver logs
                    // '-vv'
                ],
            },
        },

        chrome: {
            desiredCapabilities: {
                browserName: 'chrome',
                chromeOptions: {
                    args: [
                        //'--no-sandbox',
                        //'--ignore-certificate-errors',
                        //'--allow-insecure-localhost',
                        //'--headless'
                    ],
                },
            },
            webdriver: {
                start_process: true,
                port: 9515,
                server_path: Services.chromedriver
                    ? Services.chromedriver.path
                    : '',
                cli_args: [
                    // --verbose
                ],
            },
        },

        //////////////////////////////////////////////////////////////////////////////////
        // Configuration for when using the Selenium service, either locally or remote,  |
        //  like Selenium Grid                                                           |
        //////////////////////////////////////////////////////////////////////////////////
        selenium: {
            // Selenium Server is running locally and is managed by Nightwatch
            selenium: {
                start_process: true,
                port: 4444,
                server_path: Services.seleniumServer
                    ? Services.seleniumServer.path
                    : '',
                cli_args: {
                    'webdriver.gecko.driver': Services.geckodriver
                        ? Services.geckodriver.path
                        : '',
                    'webdriver.chrome.driver': Services.chromedriver
                        ? Services.chromedriver.path
                        : '',
                },
            },
        },

        'selenium.chrome': {
            extends: 'selenium',
            desiredCapabilities: {
                browserName: 'chrome',
                chromeOptions: {
                    w3c: false,
                },
            },
        },

        'selenium.firefox': {
            extends: 'selenium',
            desiredCapabilities: {
                browserName: 'firefox',
                'moz:firefoxOptions': {
                    args: [
                        // '-headless',
                        // '-verbose'
                    ],
                },
            },
        },
    },
};

function loadServices() {
    try {
        Services.seleniumServer = require('selenium-server');
    } catch (err) {}

    try {
        Services.chromedriver = require('chromedriver');
    } catch (err) {}

    try {
        Services.geckodriver = require('geckodriver');
    } catch (err) {}
}
