import yargs from 'yargs'
import * as dotenv from 'dotenv'
import LabeledProcessRunner from './runner.js'
import { spawnSync } from 'child_process'

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

// run_fe_locally runs the frontend and its dependencies locally
async function run_web_locally(runner: LabeledProcessRunner) {

	await runner.run_command_and_output('web deps', ['yarn', 'install'], 'services/app-web')
	await runner.run_command_and_output('web conf', ['./env.sh', 'local'], 'services/app-web')

	runner.run_command_and_output('web', ['yarn', 'start'], 'services/app-web')
	
}

// run_all_locally runs all of our services locally
async function run_all_locally() {
	const runner = new LabeledProcessRunner()

	run_db_locally(runner)
	run_s3_locally(runner)
	run_api_locally(runner)
	run_web_locally(runner)
}

async function run_all_tests() {
	const runner = new LabeledProcessRunner()
	runner.run_command_and_output('web tests', ['yarn', 'testOnce'], 'services/app-web')
}

function main() {
	// load .env
	dotenv.config()

	// add git hash as APP_VERSION
	const appVersion = spawnSync('scripts/app_version.sh')
	process.env.APP_VERSION = appVersion.stdout.toString().trim()

	// The command definitions in yargs
	// All valid arguments to dev should be enumerated here, this is the entrypoint to the script
	yargs(process.argv.slice(2))
		.command('local', 'run system locally', {}, () => {
			run_all_locally()
		})
		.command('test', 'run all tests', () => {}, () => {
			run_all_tests()
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
