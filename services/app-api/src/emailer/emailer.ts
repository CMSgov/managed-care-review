import { Lambda } from 'aws-sdk'
import {
    getSESEmailParams,
    newPackageCMSEmail,
    newPackageStateEmail,
    unlockPackageCMSEmail,
    unlockPackageStateEmail,
    resubmitPackageStateEmail,
    resubmitPackageCMSEmail,
    UpdatedEmailData,
} from './'
import {
    generateRateName,
    LockedHealthPlanFormDataType,
    UnlockedHealthPlanFormDataType,
} from '../../../app-web/src/common-code/healthPlanFormDataType'
import { UserType } from '../domain-models'

type EmailConfiguration = {
    stage: string
    baseUrl: string
    emailSource: string // an email address for the generic application-wide sender
    cmsReviewSharedEmails: string[] // list of shared emails that all new managed care packages must be sent to
    ratesReviewSharedEmails: string[] // list of shared emails that managed care packages with rates must be sent to
    cmsReviewHelpEmailAddress: string // email address for the managed care organization group
    cmsRateHelpEmailAddress: string // email address for rates help
    cmsDevTeamHelpEmailAddress: string // email address for all other help
}

type StateAnalystsEmails = string[]

type EmailData = {
    bodyText: string
    sourceEmail: string
    subject: string
    toAddresses: string[]
    bccAddresses?: string[]
    ccAddresses?: string[]
    replyToAddresses?: string[]
    subjectCharset?: string
    bodyCharset?: string
    bodyHTML?: string
}

type Emailer = {
    sendEmail: (emailData: EmailData) => Promise<void | Error>
    sendCMSNewPackage: (
        submission: LockedHealthPlanFormDataType,
        submissionName: string,
        stateAnalystsEmails: StateAnalystsEmails
    ) => Promise<void | Error>
    sendStateNewPackage: (
        submission: LockedHealthPlanFormDataType,
        submissionName: string,
        user: UserType
    ) => Promise<void | Error>
    sendUnlockPackageCMSEmail: (
        submission: UnlockedHealthPlanFormDataType,
        updatedEmailData: UpdatedEmailData,
        submissionName: string,
        stateAnalystsEmails: StateAnalystsEmails
    ) => Promise<void | Error>
    sendUnlockPackageStateEmail: (
        submission: UnlockedHealthPlanFormDataType,
        updatedEmailData: UpdatedEmailData,
        submissionName: string
    ) => Promise<void | Error>
    sendResubmittedStateEmail: (
        submission: LockedHealthPlanFormDataType,
        updatedEmailData: UpdatedEmailData,
        user: UserType
    ) => Promise<void | Error>
    sendResubmittedCMSEmail: (
        submission: LockedHealthPlanFormDataType,
        updatedEmailData: UpdatedEmailData,
        stateAnalystsEmails: StateAnalystsEmails
    ) => Promise<void | Error>
}

function newSESEmailer(config: EmailConfiguration): Emailer {
    const lambda = new Lambda()
    return {
        sendEmail: async (emailData: EmailData): Promise<void | Error> => {
            const emailRequestParams = getSESEmailParams(emailData)
            const lambdaParams = {
                FunctionName: `app-api-${config.stage}-email_submit`,
                Payload: JSON.stringify({ body: emailRequestParams }),
            }

            try {
                await lambda.invoke(lambdaParams).promise()
                return
            } catch (err) {
                return new Error('SES email send failed. ' + err)
            }
        },
        sendCMSNewPackage: async function (
            submission,
            submissionName,
            stateAnalystsEmails
        ) {
            const emailData = await newPackageCMSEmail(
                submission,
                submissionName,
                config,
                stateAnalystsEmails
            )
            if (emailData instanceof Error) {
                return emailData
            } else {
                return await this.sendEmail(emailData)
            }
        },
        sendStateNewPackage: async function (submission, submissionName, user) {
            const emailData = await newPackageStateEmail(
                submission,
                submissionName,
                user,
                config
            )
            if (emailData instanceof Error) {
                return emailData
            } else {
                return await this.sendEmail(emailData)
            }
        },
        sendUnlockPackageCMSEmail: async function (
            submission,
            updatedEmailData,
            submissionName,
            stateAnalystsEmails
        ) {
            const rateName = generateRateName(submission, submissionName)
            const emailData = await unlockPackageCMSEmail(
                submission,
                updatedEmailData,
                config,
                rateName,
                stateAnalystsEmails
            )
            if (emailData instanceof Error) {
                return emailData
            } else {
                return await this.sendEmail(emailData)
            }
        },
        sendUnlockPackageStateEmail: async function (
            submission,
            updatedEmailData,
            submissionName
        ) {
            const emailData = await unlockPackageStateEmail(
                submission,
                updatedEmailData,
                config,
                submissionName
            )
            if (emailData instanceof Error) {
                return emailData
            } else {
                return await this.sendEmail(emailData)
            }
        },
        sendResubmittedStateEmail: async function (
            submission,
            updatedEmailData,
            user: UserType
        ) {
            const emailData = await resubmitPackageStateEmail(
                submission,
                user,
                updatedEmailData,
                config
            )
            if (emailData instanceof Error) {
                return emailData
            } else {
                return await this.sendEmail(emailData)
            }
        },
        sendResubmittedCMSEmail: async function (
            submission,
            updatedEmailData,
            stateAnalystsEmails
        ) {
            const emailData = await resubmitPackageCMSEmail(
                submission,
                updatedEmailData,
                config,
                stateAnalystsEmails
            )
            if (emailData instanceof Error) {
                return emailData
            } else {
                return await this.sendEmail(emailData)
            }
        },
    }
}

const localEmailerLogger = (emailData: EmailData) =>
    console.log(`
        EMAIL SENT
        ${'(¯`·.¸¸.·´¯`·.¸¸.·´¯·.¸¸.·´¯`·.¸¸.·´¯`·.¸¸.·´¯`·.¸¸.·´)'}
        ${JSON.stringify(getSESEmailParams(emailData))}
        ${'(¯`·.¸¸.·´¯`·.¸¸.·´¯·.¸¸.·´¯`·.¸¸.·´¯`·.¸¸.·´¯`·.¸¸.·´)'}
    `)

function newLocalEmailer(config: EmailConfiguration): Emailer {
    return {
        sendEmail: async (emailData: EmailData): Promise<void | Error> => {
            localEmailerLogger(emailData)
        },
        sendCMSNewPackage: async (
            submission,
            submissionName,
            stateAnalystsEmails
        ) => {
            const result = await newPackageCMSEmail(
                submission,
                'some-title',
                config,
                stateAnalystsEmails
            )
            if (result instanceof Error) {
                console.error(result)
                return result
            } else {
                localEmailerLogger(result)
            }
        },
        sendStateNewPackage: async (submission, submissionName, user) => {
            const result = await newPackageStateEmail(
                submission,
                submissionName,
                user,
                config
            )
            if (result instanceof Error) {
                console.error(result)
                return result
            } else {
                localEmailerLogger(result)
            }
        },
        sendUnlockPackageCMSEmail: async (
            submission,
            updatedEmailData,
            submissionName,
            stateAnalystsEmails
        ) => {
            const rateName = generateRateName(submission, submissionName)
            const emailData = await unlockPackageCMSEmail(
                submission,
                updatedEmailData,
                config,
                rateName,
                stateAnalystsEmails
            )
            if (emailData instanceof Error) {
                return emailData
            } else {
                localEmailerLogger(emailData)
            }
        },
        sendUnlockPackageStateEmail: async (
            submission,
            updatedEmailData,
            submissionName
        ) => {
            const emailData = await unlockPackageStateEmail(
                submission,
                updatedEmailData,
                config,
                submissionName
            )
            if (emailData instanceof Error) {
                return emailData
            } else {
                localEmailerLogger(emailData)
            }
        },
        sendResubmittedStateEmail: async (
            submission,
            updatedEmailData,
            user
        ) => {
            const emailData = await resubmitPackageStateEmail(
                submission,
                user,
                updatedEmailData,
                config
            )
            if (emailData instanceof Error) {
                return emailData
            } else {
                localEmailerLogger(emailData)
            }
        },
        sendResubmittedCMSEmail: async (
            submission,
            updatedEmailData,
            stateAnalystsEmails
        ) => {
            const emailData = await resubmitPackageCMSEmail(
                submission,
                updatedEmailData,
                config,
                stateAnalystsEmails
            )
            if (emailData instanceof Error) {
                return emailData
            } else {
                localEmailerLogger(emailData)
            }
        },
    }
}

export { newLocalEmailer, newSESEmailer }
export type { Emailer, EmailConfiguration, EmailData, StateAnalystsEmails }
