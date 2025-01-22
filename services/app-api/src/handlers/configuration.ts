import type { PrismaClient } from '@prisma/client'
import { NewPrismaClient, type Store } from '../postgres'
import { FetchSecrets, getConnectionURL } from '../secrets'
import { type EmailParameterStore } from '../parameterStore'
import { type Emailer, newLocalEmailer, newSESEmailer } from '../emailer'
import { type LDService } from '../launchDarkly/launchDarkly'

/*
 * configuration.ts
 * Because we are using lambdas, several lambdas repeat configuration that
 * would otherwise only need to be done once. For convenience's sake, that
 * configuration is captured here.
 */

async function getPostgresURL(
    dbURL: string,
    secretName: string | undefined
): Promise<string | Error> {
    // If AWS_SM we need to query secrets manager to get these secrets
    if (dbURL === 'AWS_SM') {
        if (!secretName) {
            console.info(
                'Init Error: The env var SECRETS_MANAGER_SECRET must be set if DATABASE_URL=AWS_SM'
            )
            return new Error(
                'Init Error: The env var SECRETS_MANAGER_SECRET must be set if DATABASE_URL=AWS_SM'
            )
        }

        // We need to pull the db url out of AWS Secrets Manager
        // if we put more secrets in here, we'll probably need to instantiate it somewhere else
        const secretsResult = await FetchSecrets(secretName)
        if (secretsResult instanceof Error) {
            console.info(
                'Init Error: Failed to fetch secrets from Secrets Manager',
                secretsResult
            )
            return secretsResult
        }

        // assemble the connection URL from the stored secrets
        return getConnectionURL(secretsResult)
    }

    return dbURL
}

// configurePostgres takes our two env vars and attempts to configure postgres correctly
async function configurePostgres(
    dbURL: string,
    secretName: string | undefined
): Promise<PrismaClient | Error> {
    console.info('Getting Postgres Connection')

    const dbConnResult = await getPostgresURL(dbURL, secretName)
    if (dbConnResult instanceof Error) {
        return dbConnResult
    }

    const prismaResult = await NewPrismaClient(dbConnResult)

    if (prismaResult instanceof Error) {
        console.info(
            'Error: attempting to create prisma client: ',
            prismaResult
        )
        return new Error('Failed to create Prisma Client')
    }

    const client: PrismaClient = prismaResult

    return client
}

async function getDBClusterID(secretName: string): Promise<string | Error> {
    const secretsResult = await FetchSecrets(secretName)
    if (secretsResult instanceof Error) {
        console.info(
            'Init Error: Failed to fetch secrets from Secrets Manager',
            secretsResult
        )
        return secretsResult
    }
    const dbID = secretsResult.dbClusterIdentifier.split(':').slice(-1)[0]
    return dbID
}

async function configureEmailer({
    emailParameterStore,
    store,
    ldService,
    stageName,
    emailerMode,
    applicationEndpoint,
}: {
    emailParameterStore: EmailParameterStore
    store: Store
    ldService: LDService
    stageName: string
    emailerMode: string
    applicationEndpoint: string
}): Promise<Emailer | Error> {
    // Configuring emails using emailParameterStore
    // Moving setting these emails down here. We needed to retrieve all emails from parameter store using our
    // emailParameterStore because serverless does not like array of strings as env variables.
    // For more context see this ticket https://qmacbis.atlassian.net/browse/MR-2539.
    const emailSource = await emailParameterStore.getSourceEmail()
    const devReviewTeamEmails =
        await emailParameterStore.getDevReviewTeamEmails()
    const helpDeskEmail = await emailParameterStore.getHelpDeskEmail()
    const cmsReviewHelpEmailAddress =
        await emailParameterStore.getCmsReviewHelpEmail()
    const cmsRateHelpEmailAddress =
        await emailParameterStore.getCmsRateHelpEmail()
    const oactEmails = await emailParameterStore.getOACTEmails()
    const dmcpReviewEmails = await emailParameterStore.getDMCPReviewEmails()
    const dmcpSubmissionEmails =
        await emailParameterStore.getDMCPSubmissionEmails()
    const dmcoEmails = await emailParameterStore.getDMCOEmails()

    if (emailSource instanceof Error) return new Error(emailSource.message)

    if (devReviewTeamEmails instanceof Error)
        return new Error(devReviewTeamEmails.message)

    if (helpDeskEmail instanceof Error) return new Error(helpDeskEmail.message)

    if (cmsReviewHelpEmailAddress instanceof Error)
        return new Error(cmsReviewHelpEmailAddress.message)

    if (cmsRateHelpEmailAddress instanceof Error)
        return new Error(cmsRateHelpEmailAddress.message)

    if (oactEmails instanceof Error) return new Error(oactEmails.message)

    if (dmcpReviewEmails instanceof Error)
        return new Error(dmcpReviewEmails.message)

    if (dmcpSubmissionEmails instanceof Error)
        return new Error(dmcpSubmissionEmails.message)

    if (dmcoEmails instanceof Error) return new Error(dmcoEmails.message)

    return emailerMode == 'LOCAL'
        ? newLocalEmailer({
              emailSource,
              stage: 'local',
              baseUrl: applicationEndpoint,
              devReviewTeamEmails,
              cmsReviewHelpEmailAddress,
              cmsRateHelpEmailAddress,
              oactEmails,
              dmcpReviewEmails,
              dmcpSubmissionEmails,
              dmcoEmails,
              helpDeskEmail,
          })
        : newSESEmailer({
              emailSource,
              stage: stageName,
              baseUrl: applicationEndpoint,
              devReviewTeamEmails,
              cmsReviewHelpEmailAddress,
              cmsRateHelpEmailAddress,
              oactEmails,
              dmcpReviewEmails,
              dmcpSubmissionEmails,
              dmcoEmails,
              helpDeskEmail,
          })
}

export { configurePostgres, getPostgresURL, getDBClusterID, configureEmailer }
