import { Lambda } from 'aws-sdk'
import { getSESEmailParams, newSubmissionCMSEmailTemplate } from './'
import { StateSubmissionType } from '../../app-web/src/common-code/domain-models'

type EmailConfiguration = {
    stage: string
    emailSource: string
    baseUrl: string
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

function isEmailData(data: EmailData): data is EmailData {
    return Boolean(
        data.bodyText && data.sourceEmail && data.subject && data.toAddresses
    )
}

type Emailer = {
    sendEmail: (emailData: EmailData) => Promise<void | Error>
    generateCMSEmail: (submission: StateSubmissionType) => EmailData
}

function newSESEmailer(config: EmailConfiguration): Emailer {
    console.log('using SES emailer')
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
                console.log('SES email send succeeded!')
                return
            } catch (err) {
                return new Error('SES email send failed. ' + err)
            }
        },
        generateCMSEmail: (submission: StateSubmissionType): EmailData => {
            return newSubmissionCMSEmailTemplate(submission, config)
        },
    }
}

function newLocalEmailer(config: EmailConfiguration): Emailer {
    return {
        sendEmail: async (emailData: EmailData): Promise<void | Error> => {
            const emailRequestParams = getSESEmailParams(emailData)
            console.log(`
            EMAIL SENT
            ${'(¯`·.¸¸.·´¯`·.¸¸.·´¯·.¸¸.·´¯`·.¸¸.·´¯`·.¸¸.·´¯`·.¸¸.·´)'}
            ${JSON.stringify(emailRequestParams)}
            ${'(¯`·.¸¸.·´¯`·.¸¸.·´¯·.¸¸.·´¯`·.¸¸.·´¯`·.¸¸.·´¯`·.¸¸.·´)'}
        `)
        },
        generateCMSEmail: (submission: StateSubmissionType): EmailData => {
            return newSubmissionCMSEmailTemplate(submission, config)
        },
    }
}

export { newLocalEmailer, newSESEmailer, isEmailData }
export type { Emailer, EmailConfiguration, EmailData }
