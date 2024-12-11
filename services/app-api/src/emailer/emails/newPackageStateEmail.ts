import type { LockedHealthPlanFormDataType } from '@mc-review/hpp'
import { packageName as generatePackageName } from '@mc-review/hpp'
import { formatCalendarDate } from '@mc-review/dates'
import { formatEmailAddresses, pruneDuplicateEmails } from '../formatters'
import type { EmailConfiguration, EmailData } from '..'
import type { ProgramType } from '../../domain-models'
import {
    stripHTMLFromTemplate,
    SubmissionTypeRecord,
    renderTemplate,
    findPackagePrograms,
} from '../templateHelpers'
import { submissionSummaryURL } from '../generateURLs'

export const newPackageStateEmail = async (
    formData: LockedHealthPlanFormDataType,
    submitterEmails: string[],
    config: EmailConfiguration,
    statePrograms: ProgramType[]
): Promise<EmailData | Error> => {
    const stateContactEmails: string[] = []
    formData.stateContacts.forEach((contact) => {
        if (contact.email) stateContactEmails.push(contact.email)
    })
    const receiverEmails = pruneDuplicateEmails([
        ...stateContactEmails,
        ...submitterEmails,
        ...config.devReviewTeamEmails,
    ])

    //This checks to make sure all programs contained in submission exists for the state.
    const packagePrograms = findPackagePrograms(formData, statePrograms)

    if (packagePrograms instanceof Error) {
        return packagePrograms
    }

    const packageName = generatePackageName(
        formData.stateCode,
        formData.stateNumber,
        formData.programIDs,
        packagePrograms
    )

    const isContractAndRates =
        formData.submissionType === 'CONTRACT_AND_RATES' &&
        Boolean(formData.rateInfos.length)

    const packageURL = submissionSummaryURL(formData.id, config.baseUrl)

    const data = {
        shouldIncludeRates: isContractAndRates,
        cmsReviewHelpEmailAddress: formatEmailAddresses(
            config.cmsReviewHelpEmailAddress
        ),
        cmsRateHelpEmailAddress: formatEmailAddresses(
            config.cmsRateHelpEmailAddress
        ),
        helpDeskEmail: formatEmailAddresses(config.helpDeskEmail),
        packageName,
        submissionType: SubmissionTypeRecord[formData.submissionType],
        submissionDescription: formData.submissionDescription,
        contractType: formData.contractType,
        contractDatesLabel:
            formData.contractType === 'AMENDMENT'
                ? 'Contract amendment effective dates'
                : 'Contract effective dates',
        contractDatesStart: formatCalendarDate(
            formData.contractDateStart,
            'UTC'
        ),
        contractDatesEnd: formatCalendarDate(formData.contractDateEnd, 'UTC'),
        rateInfos:
            isContractAndRates &&
            formData.rateInfos.map((rate) => ({
                rateName: rate.rateCertificationName,
                rateDateLabel:
                    rate.rateType === 'NEW'
                        ? 'Rating period'
                        : 'Rate amendment effective dates',
                rateDatesStart:
                    rate.rateType === 'AMENDMENT' && rate.rateAmendmentInfo
                        ? formatCalendarDate(
                              rate.rateAmendmentInfo.effectiveDateStart,
                              'UTC'
                          )
                        : formatCalendarDate(rate.rateDateStart, 'UTC'),
                rateDatesEnd:
                    rate.rateType === 'AMENDMENT' && rate.rateAmendmentInfo
                        ? formatCalendarDate(
                              rate.rateAmendmentInfo.effectiveDateEnd,
                              'UTC'
                          )
                        : formatCalendarDate(rate.rateDateEnd, 'UTC'),
            })),
        submissionURL: packageURL,
    }

    const result = await renderTemplate<typeof data>(
        'newPackageStateEmail',
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
            }${packageName} was sent to CMS`,
            bodyText: stripHTMLFromTemplate(result),
            bodyHTML: result,
        }
    }
}
