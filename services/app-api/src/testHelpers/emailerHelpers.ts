import type { EmailConfiguration, EmailData, Emailer } from '../emailer'
import { emailer } from '../emailer'
import type {
    LockedHealthPlanFormDataType,
    ProgramArgType,
    UnlockedHealthPlanFormDataType,
} from '../../../app-web/src/common-code/healthPlanFormDataType'
import type { ContractRevisionWithRatesType, Question } from '../domain-models'
import { SESServiceException } from '@aws-sdk/client-ses'
import { testSendSESEmail } from './awsSESHelpers'
import { testCMSUser, testStateUser } from './userHelpers'
import { v4 as uuidv4 } from 'uuid'

const testEmailConfig = (): EmailConfiguration => ({
    stage: 'LOCAL',
    baseUrl: 'http://localhost',
    emailSource: 'emailSource@example.com',
    devReviewTeamEmails: ['devreview1@example.com', 'devreview2@example.com'],
    cmsReviewHelpEmailAddress: '"MCOG Example" <mcog@example.com>',
    cmsRateHelpEmailAddress: '"Rates Example" <rates@example.com>',
    oactEmails: ['ratesreview@example.com'],
    dmcpReviewEmails: ['policyreview1@example.com'],
    dmcpSubmissionEmails: ['policyreviewsubmission1@example.com'],
    dmcoEmails: ['overallreview@example.com'],
    helpDeskEmail: '"MC-Review Help Desk" <MC_Review_HelpDesk@example.com>',
})

const testDuplicateEmailConfig: EmailConfiguration = {
    stage: 'LOCAL',
    baseUrl: 'http://localhost',
    emailSource: 'emailSource@example.com',
    devReviewTeamEmails: [
        'duplicate@example.com',
        'duplicate@example.com',
        'duplicate@example.com',
    ],
    cmsReviewHelpEmailAddress: 'duplicate@example.com',
    cmsRateHelpEmailAddress: 'duplicate@example.com',
    oactEmails: ['duplicate@example.com', 'duplicate@example.com'],
    dmcpReviewEmails: ['duplicate@example.com', 'duplicate@example.com'],
    dmcpSubmissionEmails: ['duplicate@example.com', 'duplicate@example.com'],
    dmcoEmails: ['duplicate@example.com', 'duplicate@example.com'],
    helpDeskEmail: 'duplicate@example.com',
}

const testStateAnalystsEmails: string[] = [
    '"State Analyst 1" <StateAnalyst1@example.com>',
    '"State Analyst 2" <StateAnalyst2@example.com>',
]

const testDuplicateStateAnalystsEmails: string[] = [
    'duplicate@example.com',
    'duplicate@example.com',
]

const sendTestEmails = async (emailData: EmailData): Promise<void | Error> => {
    try {
        await testSendSESEmail(emailData)
    } catch (err) {
        if (err instanceof SESServiceException) {
            return new Error(
                'SES email send failed. Error is from Amazon SES. Error: ' +
                    JSON.stringify(err)
            )
        }
        return new Error('SES email send failed. Error: ' + err)
    }
}

function testEmailer(customConfig?: EmailConfiguration): Emailer {
    const config = customConfig || testEmailConfig()
    return emailer(config, jest.fn(sendTestEmails))
}

type State = {
    name: string
    programs: ProgramArgType[]
    code: string
}

export function mockMNState(): State {
    return {
        name: 'Minnesota',
        programs: [
            {
                id: 'abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce',
                fullName: 'Special Needs Basic Care',
                name: 'SNBC',
            },
            {
                id: 'd95394e5-44d1-45df-8151-1cc1ee66f100',
                fullName: 'Prepaid Medical Assistance Program',
                name: 'PMAP',
            },
            {
                id: 'ea16a6c0-5fc6-4df8-adac-c627e76660ab',
                fullName: 'Minnesota Senior Care Plus ',
                name: 'MSC+',
            },
            {
                id: '3fd36500-bf2c-47bc-80e8-e7aa417184c5',
                fullName: 'Minnesota Senior Health Options',
                name: 'MSHO',
            },
        ],
        code: 'MN',
    }
}

export function mockMSState(): State {
    return {
        name: 'Mississippi',
        programs: [
            {
                id: 'e0819153-5894-4153-937e-aad00ab01a8f',
                fullName: 'Mississippi Coordinated Access Network',
                name: 'MSCAN',
            },
            {
                id: '36c54daf-7611-4a15-8c3b-cdeb3fd7e25a',
                fullName: 'CHIP',
                name: 'CHIP',
            },
        ],
        code: 'MS',
    }
}
const mockContractRev = (
    submissionPartial?: Partial<ContractRevisionWithRatesType>
): ContractRevisionWithRatesType => {
    return {
        createdAt: new Date('01/01/2021'),
        updatedAt: new Date('02/01/2021'),
        contract: {
            stateCode: 'MN',
            stateNumber: 3,
            id: '12345',
        },
        id: 'test-abc-125',
        formData: {
            programIDs: ['abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce'],
            populationCovered: 'CHIP',
            submissionType: 'CONTRACT_AND_RATES',
            riskBasedContract: false,
            submissionDescription: 'A submitted submission',
            stateContacts: [
                {
                    name: 'Test Person',
                    titleRole: 'A Role',
                    email: 'test+state+contact@example.com',
                },
            ],
            supportingDocuments: [
                {
                    s3URL: 'bar',
                    name: 'foo',
                    sha256: 'fakesha',
                },
            ],
            contractType: 'BASE',
            contractExecutionStatus: undefined,
            contractDocuments: [
                {
                    s3URL: 'bar',
                    name: 'foo',
                    sha256: 'fakesha',
                },
            ],
            contractDateStart: new Date('01/01/2024'),
            contractDateEnd: new Date('01/01/2025'),
            managedCareEntities: ['MCO'],
            federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
            inLieuServicesAndSettings: undefined,
            modifiedBenefitsProvided: undefined,
            modifiedGeoAreaServed: undefined,
            modifiedMedicaidBeneficiaries: undefined,
            modifiedRiskSharingStrategy: undefined,
            modifiedIncentiveArrangements: undefined,
            modifiedWitholdAgreements: undefined,
            modifiedStateDirectedPayments: undefined,
            modifiedPassThroughPayments: undefined,
            modifiedPaymentsForMentalDiseaseInstitutions: undefined,
            modifiedMedicalLossRatioStandards: undefined,
            modifiedOtherFinancialPaymentIncentive: undefined,
            modifiedEnrollmentProcess: undefined,
            modifiedGrevienceAndAppeal: undefined,
            modifiedNetworkAdequacyStandards: undefined,
            modifiedLengthOfContract: undefined,
            modifiedNonRiskPaymentArrangements: undefined,
            statutoryRegulatoryAttestation: undefined,
            statutoryRegulatoryAttestationDescription: undefined,
        },
        rateRevisions: [
            {
                id: '12345',
                rate: {
                    id: 'rate-id',
                    stateCode: 'MN',
                    stateNumber: 3,
                    createdAt: new Date(11 / 27 / 2023),
                },
                submitInfo: undefined,
                unlockInfo: undefined,
                createdAt: new Date(11 / 27 / 2023),
                updatedAt: new Date(11 / 27 / 2023),
                formData: {
                    id: 'test-id-1234',
                    rateID: 'test-id-1234',
                    rateType: 'NEW',
                    rateCapitationType: 'RATE_CELL',
                    rateDocuments: [
                        {
                            s3URL: 'bar',
                            name: 'foo',
                            sha256: 'fakesha',
                        },
                    ],
                    supportingDocuments: [],
                    rateDateStart: new Date('01/01/2024'),
                    rateDateEnd: new Date('01/01/2025'),
                    rateDateCertified: new Date('01/01/2024'),
                    amendmentEffectiveDateStart: new Date('01/01/2024'),
                    amendmentEffectiveDateEnd: new Date('01/01/2025'),
                    rateProgramIDs: ['3fd36500-bf2c-47bc-80e8-e7aa417184c5'],
                    rateCertificationName: 'Rate Cert Name',
                    certifyingActuaryContacts: [
                        {
                            actuarialFirm: 'DELOITTE',
                            name: 'Actuary Contact 1',
                            titleRole: 'Test Actuary Contact 1',
                            email: 'actuarycontact1@example.com',
                        },
                    ],
                    addtlActuaryContacts: [],
                    actuaryCommunicationPreference: 'OACT_TO_ACTUARY',
                    packagesWithSharedRateCerts: [
                        {
                            packageName: 'pkgName',
                            packageId: '12345',
                            packageStatus: 'SUBMITTED',
                        },
                    ],
                },
            },
        ],
        ...submissionPartial,
    }
}

const mockContractAndRatesFormData = (
    submissionPartial?: Partial<LockedHealthPlanFormDataType>
): LockedHealthPlanFormDataType => {
    return {
        createdAt: new Date('01/01/2021'),
        updatedAt: new Date('02/01/2021'),
        status: 'SUBMITTED',
        stateNumber: 3,
        id: 'test-abc-125',
        stateCode: 'MN',
        programIDs: ['abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce'],
        submissionType: 'CONTRACT_AND_RATES',
        riskBasedContract: false,
        submissionDescription: 'A submitted submission',
        submittedAt: new Date('02/01/2021'),
        documents: [
            {
                s3URL: 'bar',
                name: 'foo',
                sha256: 'fakesha',
                documentCategories: ['RATES_RELATED' as const],
            },
        ],
        contractType: 'BASE',
        contractExecutionStatus: 'EXECUTED',
        contractDocuments: [
            {
                s3URL: 'bar',
                name: 'foo',
                sha256: 'fakesha',
                documentCategories: ['CONTRACT' as const],
            },
        ],
        contractDateStart: new Date('01/01/2021'),
        contractDateEnd: new Date('01/01/2022'),
        managedCareEntities: ['PCCM'],
        federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
        rateInfos: [
            {
                rateType: 'NEW',
                rateDocuments: [
                    {
                        s3URL: 'bar',
                        name: 'foo',
                        sha256: 'fakesha',
                        documentCategories: ['RATES' as const],
                    },
                ],
                supportingDocuments: [],
                rateDateCertified: new Date('01/02/2021'),
                rateProgramIDs: ['3fd36500-bf2c-47bc-80e8-e7aa417184c5'],
                rateAmendmentInfo: undefined,
                rateDateStart: new Date('01/01/2021'),
                rateDateEnd: new Date('01/01/2022'),
                actuaryContacts: [
                    {
                        actuarialFirm: 'DELOITTE',
                        name: 'Actuary Contact 1',
                        titleRole: 'Test Actuary Contact 1',
                        email: 'actuarycontact1@example.com',
                    },
                ],
                actuaryCommunicationPreference: 'OACT_TO_ACTUARY',
                packagesWithSharedRateCerts: [],
            },
        ],
        stateContacts: [
            {
                name: 'Test Person',
                titleRole: 'A Role',
                email: 'test+state+contact@example.com',
            },
        ],
        addtlActuaryContacts: [
            {
                actuarialFirm: 'DELOITTE',
                name: 'Additional Contact 1',
                titleRole: 'Test Actuary Contact 1',
                email: 'actuarycontact1@example.com',
            },
        ],
        addtlActuaryCommunicationPreference: 'OACT_TO_ACTUARY',
        ...submissionPartial,
        statutoryRegulatoryAttestation: false,
        statutoryRegulatoryAttestationDescription: 'No compliance',
    }
}

const mockUnlockedContractAndRatesFormData = (
    submissionPartial?: Partial<UnlockedHealthPlanFormDataType>
): UnlockedHealthPlanFormDataType => {
    return {
        createdAt: new Date('01/01/2021'),
        updatedAt: new Date('02/01/2021'),
        status: 'DRAFT',
        stateNumber: 3,
        id: 'test-abc-125',
        stateCode: 'MN',
        programIDs: ['abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce'],
        submissionType: 'CONTRACT_AND_RATES',
        riskBasedContract: false,
        submissionDescription: 'A submitted submission',
        documents: [
            {
                s3URL: 'bar',
                name: 'foo',
                sha256: 'fakesha',
                documentCategories: ['RATES_RELATED' as const],
            },
        ],
        contractType: 'BASE',
        contractExecutionStatus: 'EXECUTED',
        contractDocuments: [
            {
                s3URL: 'bar',
                name: 'foo',
                sha256: 'fakesha',
                documentCategories: ['CONTRACT' as const],
            },
        ],
        contractDateStart: new Date('01/01/2021'),
        contractDateEnd: new Date('01/01/2022'),
        managedCareEntities: ['PCCM'],
        federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
        rateInfos: [
            {
                rateType: 'NEW',
                rateDocuments: [
                    {
                        s3URL: 'bar',
                        name: 'foo',
                        sha256: 'fakesha',
                        documentCategories: ['RATES' as const],
                    },
                ],
                supportingDocuments: [],
                rateDateStart: new Date('01/01/2021'),
                rateDateEnd: new Date('01/01/2022'),
                rateDateCertified: new Date('01/02/2021'),
                rateProgramIDs: ['3fd36500-bf2c-47bc-80e8-e7aa417184c5'],
                rateAmendmentInfo: undefined,
                actuaryContacts: [
                    {
                        actuarialFirm: 'DELOITTE',
                        name: 'Actuary Contact 1',
                        titleRole: 'Test Actuary Contact 1',
                        email: 'actuarycontact1@example.com',
                    },
                ],
                actuaryCommunicationPreference: 'OACT_TO_ACTUARY',
                packagesWithSharedRateCerts: [],
            },
        ],
        stateContacts: [
            {
                name: 'Test Person',
                titleRole: 'A Role',
                email: 'test+state+contact@example.com',
            },
        ],
        addtlActuaryContacts: [
            {
                actuarialFirm: 'DELOITTE',
                name: 'Additional Contact 1',
                titleRole: 'Test Actuary Contact 1',
                email: 'actuarycontact1@example.com',
            },
        ],
        addtlActuaryCommunicationPreference: 'OACT_TO_ACTUARY',
        statutoryRegulatoryAttestation: false,
        statutoryRegulatoryAttestationDescription: 'No compliance',
        ...submissionPartial,
    }
}

const mockUnlockedContractOnlyFormData = (
    submissionPartial?: Partial<UnlockedHealthPlanFormDataType>
): UnlockedHealthPlanFormDataType => {
    return {
        createdAt: new Date('01/01/2021'),
        updatedAt: new Date('02/01/2021'),
        status: 'DRAFT',
        stateNumber: 3,
        id: 'test-abc-125',
        stateCode: 'MN',
        programIDs: ['abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce'],
        submissionType: 'CONTRACT_ONLY',
        riskBasedContract: false,
        submissionDescription: 'A submitted submission',
        documents: [
            {
                s3URL: 'bar',
                name: 'foo',
                sha256: 'fakesha',
                documentCategories: ['CONTRACT_RELATED' as const],
            },
        ],
        contractType: 'BASE',
        contractExecutionStatus: 'EXECUTED',
        contractDocuments: [
            {
                s3URL: 'bar',
                name: 'foo',
                sha256: 'fakesha',
                documentCategories: ['CONTRACT' as const],
            },
        ],
        contractDateStart: new Date('01/01/2021'),
        contractDateEnd: new Date('01/01/2022'),
        managedCareEntities: ['PCCM'],
        federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
        rateInfos: [],
        stateContacts: [
            {
                name: 'Test Person',
                titleRole: 'A Role',
                email: 'test+state+contact@example.com',
            },
        ],
        addtlActuaryContacts: [],
        statutoryRegulatoryAttestation: false,
        statutoryRegulatoryAttestationDescription: 'No compliance',
        ...submissionPartial,
    }
}

const mockContractOnlyFormData = (
    submissionPartial?: Partial<LockedHealthPlanFormDataType>
): LockedHealthPlanFormDataType => {
    return {
        createdAt: new Date('01/01/2021'),
        updatedAt: new Date('02/01/2021'),
        status: 'SUBMITTED',
        stateNumber: 3,
        id: 'test-abc-125',
        stateCode: 'MN',
        programIDs: ['abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce'],
        submissionType: 'CONTRACT_ONLY',
        riskBasedContract: false,
        submissionDescription: 'A submitted submission',
        submittedAt: new Date('02/01/2021'),
        documents: [
            {
                s3URL: 'bar',
                name: 'foo',
                sha256: 'fakesha',
                documentCategories: ['RATES_RELATED' as const],
            },
        ],
        contractType: 'BASE',
        contractExecutionStatus: 'EXECUTED',
        contractDocuments: [
            {
                s3URL: 'bar',
                name: 'foo',
                sha256: 'fakesha',
                documentCategories: ['CONTRACT' as const],
            },
        ],
        contractDateStart: new Date('01/01/2021'),
        contractDateEnd: new Date('01/01/2022'),
        managedCareEntities: ['PCCM'],
        federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
        rateInfos: [],
        stateContacts: [
            {
                name: 'Test Person',
                titleRole: 'A Role',
                email: 'test+state+contact@example.com',
            },
        ],
        addtlActuaryContacts: [],
        statutoryRegulatoryAttestation: false,
        statutoryRegulatoryAttestationDescription: 'No compliance',
        ...submissionPartial,
    }
}

const mockContractAmendmentFormData = (
    submissionPartial?: Partial<LockedHealthPlanFormDataType>
): LockedHealthPlanFormDataType => {
    return {
        createdAt: new Date('01/01/2021'),
        updatedAt: new Date('02/01/2021'),
        status: 'SUBMITTED',
        stateNumber: 3,
        id: 'test-abc-125',
        stateCode: 'MN',
        programIDs: ['abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce'],
        riskBasedContract: false,
        submissionType: 'CONTRACT_AND_RATES',
        submissionDescription: 'A submitted submission',
        submittedAt: new Date('02/01/2021'),
        documents: [
            {
                s3URL: 'bar',
                name: 'foo',
                sha256: 'fakesha',
                documentCategories: ['RATES_RELATED' as const],
            },
        ],
        contractType: 'AMENDMENT',
        contractExecutionStatus: 'UNEXECUTED',
        contractDocuments: [
            {
                s3URL: 'bar',
                name: 'foo',
                sha256: 'fakesha',
                documentCategories: ['CONTRACT' as const],
            },
        ],
        contractDateStart: new Date('01/01/2021'),
        contractDateEnd: new Date('01/01/2022'),
        managedCareEntities: ['PCCM'],
        federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
        rateInfos: [
            {
                rateType: 'NEW',
                rateDocuments: [
                    {
                        s3URL: 'bar',
                        name: 'foo',
                        sha256: 'fakesha',
                        documentCategories: ['RATES' as const],
                    },
                ],
                supportingDocuments: [],
                rateDateStart: new Date('01/01/2021'),
                rateDateEnd: new Date('01/01/2022'),
                rateDateCertified: new Date('01/02/2021'),
                rateAmendmentInfo: undefined,
                rateProgramIDs: ['3fd36500-bf2c-47bc-80e8-e7aa417184c5'],
                actuaryContacts: [
                    {
                        actuarialFirm: 'DELOITTE',
                        name: 'Actuary Contact 1',
                        titleRole: 'Test Actuary Contact 1',
                        email: 'actuarycontact1@example.com',
                    },
                ],
                actuaryCommunicationPreference: 'OACT_TO_ACTUARY',
                packagesWithSharedRateCerts: [],
            },
        ],
        stateContacts: [
            {
                name: 'Test Person',
                titleRole: 'A Role',
                email: 'test+state+contact@example.com',
            },
        ],
        addtlActuaryContacts: [
            {
                actuarialFirm: 'DELOITTE',
                name: 'Additional Contact 1',
                titleRole: 'Test Actuary Contact 1',
                email: 'actuarycontact1@example.com',
            },
        ],
        addtlActuaryCommunicationPreference: 'OACT_TO_ACTUARY',
        statutoryRegulatoryAttestation: false,
        statutoryRegulatoryAttestationDescription: 'No compliance',
        ...submissionPartial,
    }
}

const mockQuestionAndResponses = (
    questionData?: Partial<Question>
): Question => {
    const question: Question = {
        id: `test-question-id-1`,
        contractID: 'contract-id-test',
        createdAt: new Date('01/01/2024'),
        addedBy: testCMSUser(),
        documents: [
            {
                name: 'Test Question',
                s3URL: 'testS3Url',
            },
        ],
        division: 'DMCO',
        responses: [],
        ...questionData,
    }

    const defaultResponses = [
        {
            id: uuidv4(),
            questionID: question.id,
            //Add 1 day to date, to make sure this date is always after question.createdAt
            createdAt: ((): Date => {
                const responseDate = new Date(question.createdAt)
                return new Date(
                    responseDate.setDate(responseDate.getDate() + 1)
                )
            })(),
            addedBy: testStateUser(),
            documents: [
                {
                    name: 'Test Question Response',
                    s3URL: 'testS3Url',
                },
            ],
        },
    ]

    // If responses are passed in, use that and replace questionIDs, so they match the question.
    question.responses = questionData?.responses
        ? questionData.responses.map((response) => ({
              ...response,
              questionID: question.id,
          }))
        : defaultResponses

    return question
}

export {
    testEmailConfig,
    testStateAnalystsEmails,
    testDuplicateEmailConfig,
    testDuplicateStateAnalystsEmails,
    mockContractAmendmentFormData,
    mockContractOnlyFormData,
    mockContractRev,
    mockContractAndRatesFormData,
    mockUnlockedContractAndRatesFormData,
    mockUnlockedContractOnlyFormData,
    testEmailer,
    mockQuestionAndResponses,
}
