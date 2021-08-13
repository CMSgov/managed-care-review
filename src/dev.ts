import yargs from 'yargs'
import request from 'request'
import { commandMustSucceedSync } from './localProcess.js'
import LabeledProcessRunner from './runner.js'

import { parseRunFlags } from './flags.js'

import {
    runDBLocally,
    runAPILocally,
    runWebLocally,
    runStorybookLocally,
    runS3Locally,
    runWebAgainstAWS,
    compileGraphQLTypesOnce,
 } from './local/index.js'

 import {
     runAPITests,
     runAPITestsWatch,
     runWebTests,
     runWebTestsWatch,
     runBrowserTests,
 } from './test/index.js'

async function runAllClean() {
    const runner = new LabeledProcessRunner()
    runner.runCommandAndOutput(
        'web clean',
        ['yarn', 'clean'],
        'services/app-web'
    )
    runner.runCommandAndOutput(
        'api clean',
        ['yarn', 'clean'],
        'services/app-api'
    )
}

async function runAllLint() {
    const runner = new LabeledProcessRunner()
    await runner.runCommandAndOutput(
        'web lint',
        ['yarn', 'lint'],
        'services/app-web'
    )
    await runner.runCommandAndOutput(
        'api lint',
        ['yarn', 'lint'],
        'services/app-api'
    )
}

async function runAllFormat() {
    const runner = new LabeledProcessRunner()
    await runner.runCommandAndOutput(
        'format',
        ['prettier', '.', '-w', '-u', '--ignore-path', '.gitignore'],
        '.'
    )
}

async function runAllGenerate() {
    const runner = new LabeledProcessRunner()
    await compileGraphQLTypesOnce(runner)
}

// runAllLocally runs all of our services locally
type runLocalFlags = {
    runAPI: boolean
    runWeb: boolean
    runDB: boolean
    runS3: boolean
    runStoryBook: boolean
}
async function runAllLocally({
    runAPI,
    runWeb,
    runDB,
    runS3,
    runStoryBook,
}: runLocalFlags) {
    const runner = new LabeledProcessRunner()

    runDB && runDBLocally(runner)
    runS3 && runS3Locally(runner)
    runAPI && runAPILocally(runner)
    runWeb && runWebLocally(runner)
    runStoryBook && runStorybookLocally(runner)
}

function checkURLIsUp(url: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        request(url, {}, (err) => {
            if (err) {
                resolve(false)
            }
            resolve(true)
        })
    })
}

async function runAllTests({
    runUnit,
    runOnline,
    runDBInBackground,
}: {
    runUnit: boolean
    runOnline: boolean
    runDBInBackground: boolean
}) {
    const runner = new LabeledProcessRunner()

    if (runDBInBackground) {
        runDBLocally(runner)
    }

    try {
        if (runUnit) {
            await runUnitTests(runner)
        }

        if (runOnline) {
            await runOnlineTests(runner)
        }
    } catch (e) {
        console.log('Testing Error', e)
        process.exit(1)
    }
    // if the db is running in the background it prevents the process from exiting
    // one day we could have a cancellation to call, but this works just as well
    process.exit(0)
}

// runUnitTests runs the api and web tests once, including coverage.
async function runUnitTests(runner: LabeledProcessRunner) {
    const webCode = await runWebTests(runner)

    if (webCode != 0) {
        throw new Error('web - unit FAILED')
    }

    const apiCode = await runAPITests(runner)

    if (apiCode != 0) {
        throw new Error('api - unit failed')
    }
}

// DEPRECATED runOnlineTests runs nightwatch once.
async function runOnlineTests(runner: LabeledProcessRunner) {
    const baseURL = process.env.APPLICATION_ENDPOINT

    if (baseURL == undefined) {
        console.log('You must set APPLICATION_ENDPOINT to run online tests.')
        return
    }

    const isUp = await checkURLIsUp(baseURL)
    if (!isUp) {
        throw new Error(
            `the URL ${baseURL} does not resolve, make sure the system is running before runnin online tests`
        )
    }

    const nightCode = await runner.runCommandAndOutput(
        'nightwatch',
        ['./test.sh'],
        'tests'
    )
    if (nightCode != 0) {
        throw new Error('nightwatch tests FAILED')
    }
}

function main() {
    // check to see if local direnv vars have loaded
    if (!process.env.REACT_APP_AUTH_MODE) {
        console.log(
            `ERROR: Could not find REACT_APP_AUTH_MODE environment variable.\n
            Did you set your env vars locally? Hint: try running 'direnv allow'.`
        )
        process.exit(2)
    }

    // add git hash as APP_VERSION
    const appVersion = commandMustSucceedSync('scripts/app_version.sh')
    process.env.APP_VERSION = appVersion

    /* AVAILABLE COMMANDS
      The command definitions in yargs
      All valid arguments to dev should be enumerated here, this is the entrypoint to the script
    */

    yargs(process.argv.slice(2))
        .scriptName('dev')
        .command('clean', 'clean node dependencies', {}, () => {
            runAllClean()
        })

        .command(
            'local',
            'run system locally. If no flags are passed, runs all services',
            (yargs) => {
                return yargs
                    .option('storybook', {
                        type: 'boolean',
                        describe: 'run storybook locally',
                    })
                    .option('web', {
                        type: 'boolean',
                        describe: 'run web locally',
                    })
                    .option('api', {
                        type: 'boolean',
                        describe: 'run api locally',
                    })
                    .option('s3', {
                        type: 'boolean',
                        describe: 'run s3 locally',
                    })
                    .option('db', {
                        type: 'boolean',
                        describe: 'run database locally',
                    })
            },
            (args) => {
                const inputFlags = {
                    runAPI: args.api,
                    runWeb: args.web,
                    runDB: args.db,
                    runS3: args.s3,
                    runStoryBook: args.storybook,
                }

                const parsedFlags = parseRunFlags(inputFlags)

                if (parsedFlags === undefined) {
                    console.log(
                        "Error: Don't mix and match positive and negative boolean flags"
                    )
                    process.exit(1)
                }

                runAllLocally(parsedFlags)
            }
        )
        .command(
            'hybrid',
            'run app-web locally connected to the review app deployed for this branch',
            (yargs) => {
                return yargs.option('stage', {
                    type: 'string',
                    describe:
                        'an alternative Serverless stage in your AWS account to run against',
                })
            },
            (args) => {
                runWebAgainstAWS(args.stage)
            }
        )
        .command(
            'test',
            'run tests. If no flags are passed runs both --unit and --online',
            (yargs) => {
                return yargs
                    .option('run-db', {
                        type: 'boolean',
                        default: false,
                        describe:
                            'runs the ./dev local --db command before starting testing',
                    })
                    .command(
                        ['check', '*'], // adding '*' here makes this subcommand the default command
                        'run all tests once, exiting non-zero on failure and generating coverage data. These are all the tests run by CI',
                        (yargs) => {
                            return yargs
                                .option('unit', {
                                    type: 'boolean',
                                    describe: 'run all unit tests',
                                })
                                .option('online', {
                                    type: 'boolean',
                                    describe:
                                        'run run all tests that run against a live instance. Configure with APPLICATION_ENDPOINT',
                                })
                        },
                        (args) => {
                            // all args that come after a `--` hang out in args._, along with the command name(s)
                            // they can be strings or numbers so we map them before passing them on
                            // If no test flags are passed, default to running everything.
                            const inputRunFlags = {
                                runUnit: args.unit,
                                runOnline: args.online,
                            }

                            const runFlags = parseRunFlags(inputRunFlags)

                            if (runFlags === undefined) {
                                console.log(
                                    "Error: Don't mix and match positive and negative boolean flags"
                                )
                                process.exit(1)
                            }

                            const testingFlags = {
                                ...runFlags,
                                runDBInBackground: args['run-db'],
                            }

                            runAllTests(testingFlags)
                        }
                    )
                    .command(
                        'api',
                        'run & watch api jest tests. Any args passed after a -- will be passed directly to jest',
                        (yargs) => {
                            return yargs.example([
                                [
                                    '$0 test api',
                                    'run the api jest tests, rerunning on save',
                                ],
                                [
                                    '$0 test api -- -t submit',
                                    'run tests that match the pattern /submit/',
                                ],
                                [
                                    '$0 test api -- --watchAll=false',
                                    'run the tests once and exit',
                                ],
                            ])
                        },
                        (args) => {
                            // all args that come after a `--` hang out in args._, along with the command name(s)
                            // they can be strings or numbers so we map them before passing them on
                            const unparsedJestArgs = args._.slice(2).map(
                                (intOrString) => {
                                    return intOrString.toString()
                                }
                            )
                            runAPITestsWatch(unparsedJestArgs, args['run-db'])
                        }
                    )
                    .command(
                        'web',
                        'run & watch web jest tests. Any args passed after a -- will be passed directly to jest',
                        (yargs) => {
                            return yargs.example([
                                [
                                    '$0 test web',
                                    'run the web jest tests, rerunning on save',
                                ],
                                [
                                    '$0 test web -- -t submit',
                                    'run tests that match the pattern /submit/',
                                ],
                                [
                                    '$0 test web -- --watchAll=false',
                                    'run the tests once and exit',
                                ],
                            ])
                        },
                        (args) => {
                            // all args that come after a `--` hang out in args._, along with the command name(s)
                            // they can be strings or numbers so we map them before passing them on
                            const unparsedJestArgs = args._.slice(2).map(
                                (intOrString) => {
                                    return intOrString.toString()
                                }
                            )
                            runWebTestsWatch(unparsedJestArgs)
                        }
                    )
                    .command(
                        'browser',
                        'run & watch cypress browser tests. Default command is `cypress open`. Any args passed after a -- will be passed to cypress instead. This requires a URL to run against, configured with APPLICATION_ENDPOINT',
                        (yargs) => {
                            return yargs.example([
                                [
                                    '$0 test browser',
                                    'launch the cypress test runner',
                                ],
                                [
                                    '$0 test browser -- run',
                                    'run all the cypress tests once from the CLI',
                                ],
                            ])
                        },
                        (args) => {
                            // all args that come after a `--` hang out in args._, along with the command name(s)
                            // they can be strings or numbers so we map them before passing them on
                            const unparsedCypressArgs = args._.slice(2).map(
                                (intOrString) => {
                                    return intOrString.toString()
                                }
                            )
                            runBrowserTests(unparsedCypressArgs)
                        }
                    )
            },
            () => {
                console.log(
                    "with a default subcommand, I don't think this code can be reached"
                )
            }
        )
        .command(
            'format',
            'run format. This will be replaced by pre-commit',
            {},
            () => {
                runAllFormat()
            }
        )
        .command(
            'lint',
            'run all linters. This will be replaced by pre-commit.',
            {},
            () => {
                runAllLint()
            }
        )
        .command(
            'generate',
            'generate any code required for building. For now thats just GraphQL types.',
            {},
            () => {
                runAllGenerate()
            }
        )
        .demandCommand(1, '')
        .help()
        .strict().argv // this prints out the help if you don't call a subcommand
}

// I'd love for there to be a check we can do like you do in python
// so that this is only executed if it's being run top-level, but the ones
// I found didn't work.
// I still like corralling all the script in main() anyway, b/c that keeps us from
// scattering running code all over.
main()
