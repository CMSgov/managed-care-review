import { APIGatewayProxyHandler } from 'aws-lambda'
import { execSync } from 'child_process'
import { getPostgresURL } from './configuration'

export const main: APIGatewayProxyHandler = async () => {
    const dbURL = process.env.DATABASE_URL
    const secretsManagerSecret = process.env.SECRETS_MANAGER_SECRET

    if (!dbURL) {
        throw new Error('Init Error: DATABASE_URL is required to run app-api')
    }

    const dbConnResult = await getPostgresURL(dbURL, secretsManagerSecret)
    if (dbConnResult instanceof Error) {
        console.error('Init Error: failed to get pg URL', dbConnResult)
        throw dbConnResult
    }

    const dbConnectionURL: string = dbConnResult

    // first, run prisma db migrations
    try {
        // Aurora can have long cold starts, so we extend connection timeout on migrates
        execSync(
            `${process.execPath} /opt/nodejs/node_modules/prisma/build/index.js migrate deploy --schema=/opt/nodejs/prisma/schema.prisma`,
            {
                env: {
                    DATABASE_URL: dbConnectionURL + '&connect_timeout=60',
                },
            }
        )
    } catch (err) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                code: 'MIGRATION_FAILED',
                message: 'Could not migrate the database ' + err,
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
        }
    }

    // and now, build and run our proto migrations
    try {
        console.log('DEBUG WD', process.cwd)
        // Build the script
        process.chdir('services/app-api/protoMigrations')
        execSync(`../node_modules/.bin/tsc`)

        // Run the script
        execSync(`${process.execPath} build/migrate_protos.js db`, {
            env: {
                DATABASE_URL: dbConnectionURL,
            },
        })
    } catch (err) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                code: 'MIGRATION_FAILED',
                message: 'Could not migrate the protos ' + err,
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify('successfully migrated'),
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        },
    }
}
