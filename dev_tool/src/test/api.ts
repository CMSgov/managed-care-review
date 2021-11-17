import LabeledProcessRunner from '../runner.js'
import { spawn } from 'child_process'

import {
    compileGraphQLTypesWatchOnce,
    compileGraphQLTypesOnce,
    runDBLocally,
    installAPIDeps,
} from '../local/index.js'

export async function runAPITestsWatch(jestArgs: string[], runDB: boolean) {
    const runner = new LabeledProcessRunner()

    compileGraphQLTypesWatchOnce(runner)

    if (runDB) {
        runDBLocally(runner)
    }

    await installAPIDeps(runner)

    // because we are inheriting stdio for this process,
    // we need to not run spawnSync or else all the output
    // for the graphql compiler & db will be swallowed.
    const proc = spawn('yarn', ['test'].concat(jestArgs), {
        cwd: 'services/app-api',
        stdio: 'inherit',
    })

    proc.on('close', (code) => {
        process.exit(code ? code : 0)
    })
}

// Runs the API jest tests for CI. Save coverage information, resets the database.
export async function runAPITests(
    runner: LabeledProcessRunner
): Promise<number> {
    await compileGraphQLTypesOnce(runner)
    await installAPIDeps(runner)

    // reset the db, wiping it and running all the migrations files that exist
    await runner.runCommandAndOutput(
        'prisma reset',
        ['npx', 'prisma', 'migrate', 'reset', '--force'],
        'services/app-api'
    )

    return await runner.runCommandAndOutput(
        'api - unit',
        ['yarn', 'test:once', '--coverage'],
        'services/app-api'
    )
}
