import type { LockedHealthPlanFormDataType } from '@mc-review/hpp'
import { packageName as generatePackageName } from '@mc-review/hpp'
import { formatCalendarDate } from '@mc-review/common-code'
import {
    stripHTMLFromTemplate,
    generateCMSReviewerEmails,
    renderTemplate,
    findPackagePrograms,
} from '../templateHelpers'

import type { EmailData, EmailConfiguration, StateAnalystsEmails } from '../'
import type { ProgramType, UpdateInfoType } from '../../domain-models'
import { submissionSummaryURL } from '../generateURLs'

export const resubmitPackageCMSEmail = async (
    pkg: LockedHealthPlanFormDataType,
    updateInfo: UpdateInfoType,
    config: EmailConfiguration,
    stateAnalystsEmails: StateAnalystsEmails,
    statePrograms: ProgramType[]
): Promise<EmailData | Error> => {
    const isTestEnvironment = config.stage !== 'prod'
    const reviewerEmails = generateCMSReviewerEmails(
        config,
        pkg,
        stateAnalystsEmails
    )

    if (reviewerEmails instanceof Error) {
        return reviewerEmails
    }

    //This checks to make sure all programs contained in submission exists for the state.
    const packagePrograms = findPackagePrograms(pkg, statePrograms)

    if (packagePrograms instanceof Error) {
        return packagePrograms
    }

    const packageName = generatePackageName(
        pkg.stateCode,
        pkg.stateNumber,
        pkg.programIDs,
        packagePrograms
    )

    const isContractAndRates =
        pkg.submissionType === 'CONTRACT_AND_RATES' &&
        Boolean(pkg.rateInfos.length)

    const packageURL = submissionSummaryURL(pkg.id, config.baseUrl)

    const data = {
        packageName: packageName,
        resubmittedBy: updateInfo.updatedBy.email,
        resubmittedOn: formatCalendarDate(
            updateInfo.updatedAt,
            'America/New_York'
        ),
        resubmissionReason: updateInfo.updatedReason,
        shouldIncludeRates: isContractAndRates,
        rateInfos:
            isContractAndRates &&
            pkg.rateInfos.map((rate) => ({
                rateName: rate.rateCertificationName,
            })),
        submissionURL: packageURL,
    }

    const result = await renderTemplate<typeof data>(
        'resubmitPackageCMSEmail',
        data
    )
    if (result instanceof Error) {
        return result
    } else {
        return {
            toAddresses: reviewerEmails,
            replyToAddresses: [],
            sourceEmail: config.emailSource,
            subject: `${
                isTestEnvironment ? `[${config.stage}] ` : ''
            }${packageName} was resubmitted`,
            bodyText: stripHTMLFromTemplate(result),
            bodyHTML: result,
        }
    }
}
