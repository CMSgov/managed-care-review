import {
    submissionName,
    HealthPlanFormDataType,
    ProgramT,
} from '../common-code/domain-models'
import { base64ToDomain } from '../common-code/proto/stateSubmission'
import {
    HealthPlanRevision,
    HealthPlanPackage,
    Submission as GQLSubmissionUnionType,
} from '../gen/gqlClient'
import { formatGQLDate } from '../dateHelpers'

const isGQLDraftSubmission = (sub: GQLSubmissionUnionType): boolean => {
    return sub.__typename === 'DraftSubmission'
}

const getCurrentRevisionFromHealthPlanPackage = (
    submissionAndRevisions: HealthPlanPackage
): [HealthPlanRevision, HealthPlanFormDataType] | Error => {
    // check that package and valid revisions exist
    if (submissionAndRevisions) {
        if (
            !submissionAndRevisions.revisions ||
            submissionAndRevisions.revisions.length < 1
        ) {
            console.error(
                'ERROR: submission in summary has no submitted revision',
                submissionAndRevisions.revisions
            )
            return new Error(
                'Error fetching the latest revision. Please try again.'
            )
        }

        const newestRev = submissionAndRevisions.revisions.reduce(
            (acc, rev) => {
                if (rev.node.createdAt > acc.node.createdAt) {
                    return rev
                } else {
                    return acc
                }
            }
        ).node

        // Decode form data submitted by the state
        const healthPlanPackageFormDataResult = base64ToDomain(
            newestRev.formDataProto
        )
        if (healthPlanPackageFormDataResult instanceof Error) {
            console.error(
                'ERROR: got a proto decoding error',
                healthPlanPackageFormDataResult
            )
            return new Error('Error decoding the submission. Please try again.')
        } else {
            return [newestRev, healthPlanPackageFormDataResult]
        }
    } else {
        console.error('ERROR: no submission exists')
        return new Error('Error fetching the submission. Please try again.')
    }
}

// This is more code that should go away when we finish the refactor
// Because this sub-object has dates in it, we need to format those dates correctly.
// we don't need to fix contacts or documents in the same way.
function datesFromRateAmendmentInfo(
    rateInfo: HealthPlanFormDataType['rateAmendmentInfo'] | undefined
): GQLSubmissionUnionType['rateAmendmentInfo'] {
    if (!rateInfo) {
        return undefined
    }
    return {
        effectiveDateEnd: formatGQLDate(rateInfo.effectiveDateEnd),
        effectiveDateStart: formatGQLDate(rateInfo.effectiveDateStart),
    }
}

const convertDomainModelFormDataToGQLSubmission = (
    submissionDomainModel: HealthPlanFormDataType,
    statePrograms: ProgramT[]
): GQLSubmissionUnionType => {
    // convert from domain model back into GQL types

    // CalendarDates are Dates in the domain model, but strings in GQL
    const convertedDates = {
        contractDateStart: formatGQLDate(
            submissionDomainModel.contractDateStart
        ),
        contractDateEnd: formatGQLDate(submissionDomainModel.contractDateEnd),
        rateDateStart: formatGQLDate(submissionDomainModel.rateDateStart),
        rateDateEnd: formatGQLDate(submissionDomainModel.rateDateEnd),
        rateDateCertified: formatGQLDate(
            submissionDomainModel.rateDateCertified
        ),
        rateAmendmentInfo: datesFromRateAmendmentInfo(
            submissionDomainModel.rateAmendmentInfo
        ),
    }

    const GQLSubmission: GQLSubmissionUnionType =
        submissionDomainModel.status === 'DRAFT'
            ? {
                  ...submissionDomainModel,
                  ...convertedDates,
                  __typename: 'DraftSubmission' as const,
                  name: submissionName(submissionDomainModel, statePrograms),
              }
            : {
                  ...submissionDomainModel,
                  ...convertedDates,
                  __typename: 'StateSubmission' as const,
                  name: submissionName(submissionDomainModel, statePrograms),
                  submittedAt: submissionDomainModel.submittedAt,
              }

    return GQLSubmission
}

export {
    convertDomainModelFormDataToGQLSubmission,
    getCurrentRevisionFromHealthPlanPackage,
    isGQLDraftSubmission,
}
export type { GQLSubmissionUnionType }
