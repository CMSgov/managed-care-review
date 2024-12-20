import { ContractReviewStatus } from './gen/gqlClient'

const SubmissionReviewStatusRecord: Record<ContractReviewStatus, string> = {
    APPROVED: 'Approved',
    UNDER_REVIEW: 'Under review',
}

export { SubmissionReviewStatusRecord }