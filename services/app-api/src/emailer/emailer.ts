import { Lambda } from 'aws-sdk'
import {
    getSESEmailParams,
    newPackageCMSEmail,
    newPackageStateEmail,
    unlockPackageCMSEmail,
    unlockPackageStateEmail,
    resubmittedStateEmail,
    resubmittedCMSEmail,
    UpdatedEmailData,
} from './'
import {
    LockedHealthPlanFormDataType,
    UnlockedHealthPlanFormDataType,
} from '../../../app-web/src/common-code/domain-models'
import { CognitoUserType } from '../domain-models'

type EmailConfiguration = {
    stage: string
    baseUrl: string
    emailSource: string // an email address for the generic application-wide sender
    cmsReviewSharedEmails: string[] // list of shared emails that all new managed care packages must be sent to
}
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
        submissionName: string
    ) => Promise<void | Error>
    sendStateNewPackage: (
        submission: LockedHealthPlanFormDataType,
        submissionName: string,
        user: CognitoUserType
    ) => Promise<void | Error>
    sendUnlockPackageCMSEmail: (
        updatedEmailData: UpdatedEmailData
    ) => Promise<void | Error>
    sendUnlockPackageStateEmail: (
        submission: UnlockedHealthPlanFormDataType,
        updatedEmailData: UpdatedEmailData
    ) => Promise<void | Error>
    sendResubmittedStateEmail: (
        submission: LockedHealthPlanFormDataType,
        updatedEmailData: UpdatedEmailData,
        user: CognitoUserType
    ) => Promise<void | Error>
    sendResubmittedCMSEmail: (
        submission: LockedHealthPlanFormDataType,
        updatedEmailData: UpdatedEmailData
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
            submission: LockedHealthPlanFormDataType,
            submissionName: string
        ) {
            const emailData = newPackageCMSEmail(
                submission,
                submissionName,
                config
            )
            return await this.sendEmail(emailData)
        },
        sendStateNewPackage: async function (
            submission: LockedHealthPlanFormDataType,
            submissionName: string,
            user: CognitoUserType
        ) {
            const emailData = newPackageStateEmail(
                submission,
                submissionName,
                user,
                config
            )
            return await this.sendEmail(emailData)
        },
        sendUnlockPackageCMSEmail: async function (updatedEmailData) {
            const emailData = unlockPackageCMSEmail(updatedEmailData, config)
            return await this.sendEmail(emailData)
        },
        sendUnlockPackageStateEmail: async function (
            submission,
            updatedEmailData
        ) {
            const emailData = unlockPackageStateEmail(
                submission,
                updatedEmailData,
                config
            )
            return await this.sendEmail(emailData)
        },
        sendResubmittedStateEmail: async function (
            submission,
            updatedEmailData,
            user: CognitoUserType
        ) {
            const emailData = resubmittedStateEmail(
                submission,
                user,
                updatedEmailData,
                config
            )
            return await this.sendEmail(emailData)
        },
        sendResubmittedCMSEmail: async function (submission, updatedEmailData) {
            const emailData = resubmittedCMSEmail(
                submission,
                updatedEmailData,
                config
            )
            return await this.sendEmail(emailData)
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
        sendCMSNewPackage: async (submission: LockedHealthPlanFormDataType) => {
            const emailData = newPackageCMSEmail(
                submission,
                'some-title',
                config
            )
            localEmailerLogger(emailData)
        },
        sendStateNewPackage: async (
            submission: LockedHealthPlanFormDataType,
            submissionName: string,
            user: CognitoUserType
        ) => {
            const emailData = newPackageStateEmail(
                submission,
                submissionName,
                user,
                config
            )
            localEmailerLogger(emailData)
        },
        sendUnlockPackageCMSEmail: async (
            updatedEmailData: UpdatedEmailData
        ) => {
            const emailData = unlockPackageCMSEmail(updatedEmailData, config)
            localEmailerLogger(emailData)
        },
        sendUnlockPackageStateEmail: async (
            submission: UnlockedHealthPlanFormDataType,
            updatedEmailData: UpdatedEmailData
        ) => {
            const emailData = unlockPackageStateEmail(
                submission,
                updatedEmailData,
                config
            )
            localEmailerLogger(emailData)
        },
        sendResubmittedStateEmail: async (
            submission: LockedHealthPlanFormDataType,
            updatedEmailData: UpdatedEmailData,
            user: CognitoUserType
        ) => {
            const emailData = resubmittedStateEmail(
                submission,
                user,
                updatedEmailData,
                config
            )
            localEmailerLogger(emailData)
        },
        sendResubmittedCMSEmail: async (
            submission: LockedHealthPlanFormDataType,
            updatedEmailData: UpdatedEmailData
        ) => {
            const emailData = resubmittedCMSEmail(
                submission,
                updatedEmailData,
                config
            )
            localEmailerLogger(emailData)
        },
    }
}

export { newLocalEmailer, newSESEmailer }
export type { Emailer, EmailConfiguration, EmailData }
