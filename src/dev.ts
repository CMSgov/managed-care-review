import yargs from 'yargs'
import * as dotenv from 'dotenv'
import request from 'request'
import { spawnSync } from 'child_process'
import LabeledProcessRunner from './runner.js'
import { envFileMissingExamples } from './env.js' // What the WHAT? why doesn't this import right without the `.js`??

// run_db_locally runs the local db
async function run_db_locally(runner: LabeledProcessRunner) {

	await runner.run_command_and_output('db yarn', ['yarn', 'install'], 'services/database')
	await runner.run_command_and_output('db svls', ['serverless', 'dynamodb', 'install'], 'services/database')
	runner.run_command_and_output('db', ['serverless', '--stage', 'local', 'dynamodb', 'start', '--migrate'], 'services/database')

}

// run_api_locally uses the serverless-offline plugin to run the api lambdas locally
async function run_api_locally(runner: LabeledProcessRunner) {

	await runner.run_command_and_output('api deps', ['yarn', 'install'], 'services/app-api')
	runner.run_command_and_output('api', ['serverless', '--stage', 'local', '--region', 'us-east-1', 'offline', '--httpPort', '3030', 'start'], 'services/app-api')
	
}

// run_s3_locally runs s3 locally
async function run_s3_locally(runner: LabeledProcessRunner) {

	await runner.run_command_and_output('s3 yarn', ['yarn', 'install'], 'services/uploads')
	runner.run_command_and_output('s3', ['serverless', '--stage', 'local', 's3', 'start'], 'services/uploads')

}

// run_web_locally runs the frontend, storybook locally
async function run_web_locally(runner: LabeledProcessRunner) {

	await runner.run_command_and_output('web deps', ['yarn', 'install'], 'services/app-web')
	runner.run_command_and_output('web', ['yarn', 'start'], 'services/app-web')
	runner.run_command_and_output('storybook', ['yarn', 'storybook'], 'services/app-web')
	
}

async function run_sb_locally() {
	const runner = new LabeledProcessRunner()
	await runner.run_command_and_output('web deps', ['yarn', 'install'], 'services/app-web')
	runner.run_command_and_output('storybook', ['yarn', 'storybook'], 'services/app-web')	
}


async function run_all_clean() {
	const runner = new LabeledProcessRunner()
	runner.run_command_and_output('web deps', ['yarn', 'clean'], 'services/app-web')
}

// run_all_locally runs all of our services locally
async function run_all_locally() {
	const runner = new LabeledProcessRunner()

	run_db_locally(runner)
	run_s3_locally(runner)
	run_api_locally(runner)
	run_web_locally(runner)
}

function check_url_is_up(url: string): Promise<boolean> {
	return new Promise<boolean>( (resolve) =>  {
		request(url, {}, (err) => {
			if (err) { 
				resolve(false)
			}
			resolve(true)
		})
	})
}

async function run_all_tests(run_unit: boolean, run_online: boolean) {
	const runner = new LabeledProcessRunner()

	try {
		if (run_unit) {
			await run_unit_tests(runner)
		}

		if (run_online) {
			await run_online_tests(runner)
		}
	} catch (e) {
		console.log("Testing Error", e)
		process.exit(1)
	}

}

async function run_unit_tests(runner: LabeledProcessRunner) {
	const webCode = await runner.run_command_and_output('web - unit', ['yarn', 'test:unit'], 'services/app-web')
	if (webCode != 0) {
		throw new Error('web - unit FAILED')
	}

	const apiCode = await runner.run_command_and_output('api - unit', ['yarn', 'test'], 'services/app-api')
	if (apiCode != 0) {
		throw new Error('api - unit failed')
	}
}

async function run_online_tests(runner: LabeledProcessRunner) {
	const base_url = process.env.APPLICATION_ENDPOINT

	if (base_url == undefined) {
		console.log('You must set APPLICATION_ENDPOINT to run online tests.')
		return
	}

	const isUp = await check_url_is_up(base_url)
	if (!isUp) {
		throw new Error(`the URL ${base_url} does not resolve, make sure the system is running before runnin online tests`)
	}

	// TODO: Sort out how to use pa11y in CI. 
	// const webCode = await runner.run_command_and_output('web - a11y', ['yarn', 'test:a11y'], 'services/app-web')
	// if (webCode != 0) {
	// 	throw new Error('web - a11y tests FAILED')
	// }

	const nightCode = await runner.run_command_and_output('nightwatch', ['./test.sh'], 'tests')
	if (nightCode != 0) {
		throw new Error('nightwatch tests FAILED')
	}

}


function main() {
	const missingExamples = envFileMissingExamples()
	if (missingExamples.length !== 0) {
		console.log(`ERROR: Your .env file is missing the keys: ${ missingExamples.join(', ') }\nAt least set an empty value before continuing.`)
		process.exit(2)
	}

	// load .env
	dotenv.config()

	// add git hash as APP_VERSION
	const appVersion = spawnSync('scripts/app_version.sh')
	process.env.APP_VERSION = appVersion.stdout.toString().trim()

	// The command definitions in yargs
	// All valid arguments to dev should be enumerated here, this is the entrypoint to the script
	yargs(process.argv.slice(2))
	.command('clean', 'clean node dependencies', {}, () => {
		run_all_clean()
	})
	.command('local', 'run system locally. If no flags are passed, runs all services', (yargs) =>{
		return yargs.boolean('storybook')
	},(args) => {

		if (args.storybook) {
			run_sb_locally()	
		} else {
			run_all_locally()
		}

	})

	.command('test', 'run tests. If no flags are passed, runs both --unit and --online', (yargs) => {
		return yargs.boolean('unit')
							.boolean('online')
	}, (args) => {
		let run_unit = false
		let run_online = false

		// If no test flags are passed, default to running everything.
		if (args.unit == null && args.online == null) {
			run_unit = true
			run_online = true
		} else {
			if (args.unit) {
				run_unit = true
			}
			if (args.online) {
				run_online = true
			}
		}

		run_all_tests(run_unit, run_online)
	})
	.demandCommand(1, '') // this prints out the help if you don't call a subcommand
	.argv
}

// I'd love for there to be a check we can do like you do in python
// so that this is only executed if it's being run top-level, but the ones
// I found didn't work. 
// I still like corralling all the script in main() anyway, b/c that keeps us from 
// scattering running code all over. 
main()

