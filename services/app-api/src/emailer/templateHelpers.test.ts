import { generateCMSReviewerEmails } from './templateHelpers'
import { UnlockedHealthPlanFormDataType } from 'app-web/src/common-code/healthPlanFormDataType'
import {
    mockUnlockedContractAndRatesFormData,
    mockUnlockedContractOnlyFormData,
    testEmailConfig,
    testStateAnalystsEmails,
} from '../testHelpers/emailerHelpers'
import { EmailConfiguration, StateAnalystsEmails } from './emailer'

describe('templateHelpers', () => {
    const contractOnlyWithValidRateData: {
        submission: UnlockedHealthPlanFormDataType
        emailConfig: EmailConfiguration
        stateAnalystsEmails: StateAnalystsEmails
        testDescription: string
        expectedResult: string[] | Error
    }[] = [
        {
            submission: mockUnlockedContractOnlyFormData(),
            emailConfig: testEmailConfig,
            stateAnalystsEmails: testStateAnalystsEmails,
            testDescription: 'Contract only submission',
            expectedResult: [
                ...testEmailConfig.cmsReviewSharedEmails,
                ...testStateAnalystsEmails,
            ],
        },
        {
            submission: mockUnlockedContractAndRatesFormData(),
            emailConfig: testEmailConfig,
            stateAnalystsEmails: testStateAnalystsEmails,
            testDescription: 'Contract and rates submission',
            expectedResult: [
                ...testEmailConfig.cmsReviewSharedEmails,
                ...testStateAnalystsEmails,
                ...testEmailConfig.ratesReviewSharedEmails,
            ],
        },
        {
            submission: mockUnlockedContractAndRatesFormData({
                stateCode: 'MS',
                programIDs: ['36c54daf-7611-4a15-8c3b-cdeb3fd7e25a'],
            }),
            emailConfig: testEmailConfig,
            stateAnalystsEmails: testStateAnalystsEmails,
            testDescription:
                'Submission with CHIP program specified for contract certification',
            expectedResult: [
                'cmsreview1@example.com',
                'cmsreview2@example.com',
                '"State Analyst 1" <StateAnalyst1@example.com>',
                '"State Analyst 2" <StateAnalyst2@example.com>',
            ],
        },
        {
            submission: mockUnlockedContractAndRatesFormData({
                stateCode: 'MS',
                rateProgramIDs: ['36c54daf-7611-4a15-8c3b-cdeb3fd7e25a'],
            }),
            emailConfig: testEmailConfig,
            stateAnalystsEmails: testStateAnalystsEmails,
            testDescription:
                'Submission with CHIP program specified for rate certification',
            expectedResult: [
                'cmsreview1@example.com',
                'cmsreview2@example.com',
                '"State Analyst 1" <StateAnalyst1@example.com>',
                '"State Analyst 2" <StateAnalyst2@example.com>',
            ],
        },
        {
            submission: mockUnlockedContractAndRatesFormData({
                stateCode: 'PR',
            }),
            emailConfig: testEmailConfig,
            stateAnalystsEmails: testStateAnalystsEmails,
            testDescription: 'Puerto Rico submission',
            expectedResult: [
                'cmsreview1@example.com',
                'cmsreview2@example.com',
                '"State Analyst 1" <StateAnalyst1@example.com>',
                '"State Analyst 2" <StateAnalyst2@example.com>',
            ],
        },
        {
            submission: mockUnlockedContractAndRatesFormData({
                submissionType: undefined,
            }),
            emailConfig: testEmailConfig,
            stateAnalystsEmails: testStateAnalystsEmails,
            testDescription: 'Error result.',
            expectedResult: new Error(
                `generateCMSReviewerEmails does not currently support submission type: undefined.`
            ),
        },
    ]
    test.each(contractOnlyWithValidRateData)(
        'Generate CMS Reviewer email: $testDescription',
        ({ submission, emailConfig, stateAnalystsEmails, expectedResult }) => {
            expect(
                generateCMSReviewerEmails(
                    emailConfig,
                    submission,
                    stateAnalystsEmails
                )
            ).toEqual(expect.objectContaining(expectedResult))
        }
    )
})
