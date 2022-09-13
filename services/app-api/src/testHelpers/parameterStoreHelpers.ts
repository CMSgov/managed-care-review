import { EmailParameterStore } from '../parameterStore'

function mockEmailParameterStoreError(error?: string): EmailParameterStore {
    const message = error || 'No store found'
    return {
        getStateAnalystsEmails: async (stateCode: string): Promise<Error> => {
            return new Error(message)
        },
        getCmsReviewSharedEmails: async (): Promise<Error> => {
            return new Error(message)
        },
        getRatesReviewSharedEmails: async (): Promise<Error> => {
            return new Error(message)
        },
        getCmsReviewHelpEmail: async (): Promise<Error> => {
            return new Error(message)
        },
        getCmsRateHelpEmail: async (): Promise<Error> => {
            return new Error(message)
        },
        getCmsDevTeamHelpEmail: async (): Promise<Error> => {
            return new Error(message)
        },
        getSourceEmail: async (): Promise<Error> => {
            return new Error(message)
        },
    }
}

const getTestStateAnalystsEmails = (stateCode: string): string[] => [
    `"${stateCode} State Analyst 1" <${stateCode}StateAnalyst1@example.com>`,
    `"${stateCode} State Analyst 2" <${stateCode}StateAnalyst2@example.com>`,
]

const getTestCmsReviewSharedEmails = (): string[] => [
    `"CMS Reviewer 1" <CMS.reviewer.1@example.com>`,
    `"CMS Reviewer 2" <CMS.reviewer.2@example.com>`,
    `"CMS Reviewer 3" <CMS.reviewer.3@example.com>`,
]

const getTestRatesReviewSharedEmails = (): string[] => [
    `"Rate Submission Reviewer 1" <rate.reviewer.1@example.com>`,
    `"Rate Submission Reviewer 2" <rate.reviewer.2@example.com>`,
    `"Rate Submission Reviewer 3" <rate.reviewer.3@example.com>`,
]

export {
    mockEmailParameterStoreError,
    getTestStateAnalystsEmails,
    getTestCmsReviewSharedEmails,
    getTestRatesReviewSharedEmails,
}
