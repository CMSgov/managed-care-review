import { packageName as generatePackageName } from '../../common-code/healthPlanFormDataType'
import { formatCalendarDate } from '../../common-code/dateHelpers/calendarDate'
import { pruneDuplicateEmails } from '../formatters'
import type { EmailConfiguration, EmailData } from '..'
import type { ProgramType, ContractQuestionType } from '../../domain-models'
import {
    stripHTMLFromTemplate,
    renderTemplate,
    findContractPrograms,
} from '../templateHelpers'
import { submissionQuestionResponseURL } from '../generateURLs'
import type { ContractRevisionType } from '../../domain-models'

export const sendQuestionStateEmail = async (
    contractRev: ContractRevisionType,
    submitterEmails: string[],
    config: EmailConfiguration,
    statePrograms: ProgramType[],
    currentQuestion: ContractQuestionType
): Promise<EmailData | Error> => {
    const stateContactEmails: string[] = []

    contractRev.formData.stateContacts.forEach((contact) => {
        if (contact.email) stateContactEmails.push(contact.email)
    })
    const receiverEmails = pruneDuplicateEmails([
        ...stateContactEmails,
        ...submitterEmails,
        ...config.devReviewTeamEmails,
    ])

    //This checks to make sure all programs contained in submission exists for the state.
    const packagePrograms = findContractPrograms(contractRev, statePrograms)
    if (packagePrograms instanceof Error) {
        return packagePrograms
    }

    const packageName = generatePackageName(
        contractRev.contract.stateCode,
        contractRev.contract.stateNumber,
        contractRev.formData.programIDs,
        packagePrograms
    )

    const questionResponseURL = submissionQuestionResponseURL(
        contractRev.contract.id,
        config.baseUrl
    )

    const data = {
        packageName,
        questionResponseURL: questionResponseURL,
        cmsRequestorEmail: currentQuestion.addedBy.email,
        cmsRequestorName: `${currentQuestion.addedBy.givenName} ${currentQuestion.addedBy.familyName}`,
        cmsRequestorDivision: currentQuestion.addedBy.divisionAssignment,
        dateAsked: formatCalendarDate(
            currentQuestion.createdAt,
            'America/New_York'
        ),
    }

    const result = await renderTemplate<typeof data>(
        'sendQuestionStateEmail',
        data
    )

    if (result instanceof Error) {
        return result
    } else {
        return {
            toAddresses: receiverEmails,
            replyToAddresses: [],
            sourceEmail: config.emailSource,
            subject: `${
                config.stage !== 'prod' ? `[${config.stage}] ` : ''
            }New questions about ${packageName}`,
            bodyText: stripHTMLFromTemplate(result),
            bodyHTML: result,
        }
    }
}
