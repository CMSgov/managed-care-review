import { EmailData } from '../emailer'
import { SESServiceException } from '@aws-sdk/client-ses'

async function testSendSESEmail(
    emailData: EmailData
): Promise<string | SESServiceException> {
    console.info('SendEmailCommand: ')
    return 'Email content' + JSON.stringify(emailData)
}

export { testSendSESEmail }
