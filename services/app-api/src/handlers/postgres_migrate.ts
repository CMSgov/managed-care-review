import { APIGatewayProxyHandler } from 'aws-lambda'
import { execSync } from 'child_process'
import { getPostgresURL } from './configuration'
import {
    migrate,
    newDBMigrator,
} from '../../../app-proto/protoMigrations/lib/migrator'

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
                code: 'SCHEMA_MIGRATION_FAILED',
                message: 'Could not migrate the database schema ' + err,
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
        }
    }

    try {
        const migrator = newDBMigrator(dbConnectionURL)
        await migrate(migrator, '/opt/nodejs/healthPlanFormDataMigrations')
    } catch (err) {
        console.log(err)
        return {
            statusCode: 400,
            body: JSON.stringify({
                code: 'DATA_MIGRATION_FAILED',
                message: 'Could not migrate the database data ' + err,
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
