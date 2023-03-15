import {
    EmailConfiguration,
    EmailData,
    Emailer,
    newPackageCMSEmail,
    newPackageStateEmail,
    unlockPackageCMSEmail,
    unlockPackageStateEmail,
    resubmitPackageStateEmail,
    resubmitPackageCMSEmail,
} from '../emailer'
import {
    LockedHealthPlanFormDataType,
    ProgramArgType,
    UnlockedHealthPlanFormDataType,
} from '../../../app-web/src/common-code/healthPlanFormDataType'
import { StateUserType } from '../domain-models'

const testEmailConfig: EmailConfiguration = {
    stage: 'LOCAL',
    baseUrl: 'http://localhost',
    emailSource: 'emailSource@example.com',
    devReviewTeamEmails: ['devreview1@example.com', 'devreview2@example.com'],
    cmsReviewHelpEmailAddress: '"MCOG Example" <mcog@example.com>',
    cmsRateHelpEmailAddress: '"Rates Example" <rates@example.com>',
    cmsDevTeamHelpEmailAddress: '"MC-Review Example" <mc-review@example.com>',
    oactEmails: ['ratesreview@example.com'],
    dmcpEmails: ['policyreview1@example.com'],
    dmcoEmails: ['overallreview@example.com'],
}

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
    cmsDevTeamHelpEmailAddress: 'duplicate@example.com',
    oactEmails: ['duplicate@example.com', 'duplicate@example.com'],
    dmcpEmails: ['duplicate@example.com', 'duplicate@example.com'],
    dmcoEmails: ['duplicate@example.com', 'duplicate@example.com'],
}

const testStateAnalystsEmails: string[] = [
    '"State Analyst 1" <StateAnalyst1@example.com>',
    '"State Analyst 2" <StateAnalyst2@example.com>',
]

const testDuplicateStateAnalystsEmails: string[] = [
    'duplicate@example.com',
    'duplicate@example.com',
]

function testEmailer(customConfig?: EmailConfiguration): Emailer {
    const config = customConfig || testEmailConfig
    return {
        config,
        sendEmail: jest.fn(
            async (emailData: EmailData): Promise<void | Error> => {
                console.info('Email content' + JSON.stringify(emailData))
            }
        ),
        sendCMSNewPackage: async function (
            formData,
            stateAnalystsEmails,
            statePrograms
        ): Promise<void | Error> {
            const emailData = await newPackageCMSEmail(
                formData,
                config,
                stateAnalystsEmails,
                statePrograms
            )
            if (emailData instanceof Error) {
                return emailData
            } else {
                return await this.sendEmail(emailData)
            }
        },
        sendStateNewPackage: async function (
            formData,
            submitterEmails,
            statePrograms
        ): Promise<void | Error> {
            const emailData = await newPackageStateEmail(
                formData,
                submitterEmails,
                config,
                statePrograms
            )
            if (emailData instanceof Error) {
                return emailData
            } else {
                return await this.sendEmail(emailData)
            }
        },
        sendUnlockPackageCMSEmail: async function (
            formData,
            updateInfo,
            stateAnalystsEmails,
            statePrograms
        ): Promise<void | Error> {
            const emailData = await unlockPackageCMSEmail(
                formData,
                updateInfo,
                config,
                stateAnalystsEmails,
                statePrograms
            )

            if (emailData instanceof Error) {
                return emailData
            } else {
                return this.sendEmail(emailData)
            }
        },
        sendUnlockPackageStateEmail: async function (
            formData,
            updateInfo,
            statePrograms,
            submitterEmails
        ): Promise<void | Error> {
            const emailData = await unlockPackageStateEmail(
                formData,
                updateInfo,
                config,
                statePrograms,
                submitterEmails
            )
            if (emailData instanceof Error) {
                return emailData
            } else {
                return this.sendEmail(emailData)
            }
        },
        sendResubmittedStateEmail: async function (
            formData,
            updateInfo,
            submitterEmails,
            statePrograms
        ): Promise<void | Error> {
            const emailData = await resubmitPackageStateEmail(
                formData,
                submitterEmails,
                updateInfo,
                config,
                statePrograms
            )
            if (emailData instanceof Error) {
                return emailData
            } else {
                return this.sendEmail(emailData)
            }
        },
        sendResubmittedCMSEmail: async function (
            formData,
            updateInfo,
            stateAnalystsEmails,
            statePrograms
        ): Promise<void | Error> {
            const emailData = await resubmitPackageCMSEmail(
                formData,
                updateInfo,
                config,
                stateAnalystsEmails,
                statePrograms
            )
            if (emailData instanceof Error) {
                return emailData
            } else {
                return this.sendEmail(emailData)
            }
        },
    }
}

const mockUser = (): StateUserType => {
    return {
        id: '6ec0e9a7-b5fc-44c2-a049-2d60ac37c6ee',
        role: 'STATE_USER',
        email: 'test+state+user@example.com',
        stateCode: 'MN',
        familyName: 'State',
        givenName: 'User',
    }
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
                documentCategories: ['RATES_RELATED' as const],
            },
        ],
        contractType: 'BASE',
        contractExecutionStatus: 'EXECUTED',
        contractDocuments: [
            {
                s3URL: 'bar',
                name: 'foo',
                documentCategories: ['CONTRACT' as const],
            },
        ],
        contractDateStart: new Date('01/01/2021'),
        contractDateEnd: new Date('01/01/2022'),
        managedCareEntities: ['ENROLLMENT_PROCESS'],
        federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
        rateInfos: [
            {
                rateType: 'NEW',
                rateDocuments: [
                    {
                        s3URL: 'bar',
                        name: 'foo',
                        documentCategories: ['RATES' as const],
                    },
                ],
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
                documentCategories: ['RATES_RELATED' as const],
            },
        ],
        contractType: 'BASE',
        contractExecutionStatus: 'EXECUTED',
        contractDocuments: [
            {
                s3URL: 'bar',
                name: 'foo',
                documentCategories: ['CONTRACT' as const],
            },
        ],
        contractDateStart: new Date('01/01/2021'),
        contractDateEnd: new Date('01/01/2022'),
        managedCareEntities: ['ENROLLMENT_PROCESS'],
        federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
        rateInfos: [
            {
                rateType: 'NEW',
                rateDocuments: [
                    {
                        s3URL: 'bar',
                        name: 'foo',
                        documentCategories: ['RATES' as const],
                    },
                ],
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
                documentCategories: ['CONTRACT_RELATED' as const],
            },
        ],
        contractType: 'BASE',
        contractExecutionStatus: 'EXECUTED',
        contractDocuments: [
            {
                s3URL: 'bar',
                name: 'foo',
                documentCategories: ['CONTRACT' as const],
            },
        ],
        contractDateStart: new Date('01/01/2021'),
        contractDateEnd: new Date('01/01/2022'),
        managedCareEntities: ['ENROLLMENT_PROCESS'],
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
                documentCategories: ['RATES_RELATED' as const],
            },
        ],
        contractType: 'BASE',
        contractExecutionStatus: 'EXECUTED',
        contractDocuments: [
            {
                s3URL: 'bar',
                name: 'foo',
                documentCategories: ['CONTRACT' as const],
            },
        ],
        contractDateStart: new Date('01/01/2021'),
        contractDateEnd: new Date('01/01/2022'),
        managedCareEntities: ['ENROLLMENT_PROCESS'],
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
                documentCategories: ['RATES_RELATED' as const],
            },
        ],
        contractType: 'AMENDMENT',
        contractExecutionStatus: 'UNEXECUTED',
        contractDocuments: [
            {
                s3URL: 'bar',
                name: 'foo',
                documentCategories: ['CONTRACT' as const],
            },
        ],
        contractDateStart: new Date('01/01/2021'),
        contractDateEnd: new Date('01/01/2022'),
        managedCareEntities: ['ENROLLMENT_PROCESS'],
        federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
        rateInfos: [
            {
                rateType: 'NEW',
                rateDocuments: [
                    {
                        s3URL: 'bar',
                        name: 'foo',
                        documentCategories: ['RATES' as const],
                    },
                ],
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
        ...submissionPartial,
    }
}

export {
    testEmailConfig,
    testStateAnalystsEmails,
    testDuplicateEmailConfig,
    testDuplicateStateAnalystsEmails,
    mockContractAmendmentFormData,
    mockContractOnlyFormData,
    mockContractAndRatesFormData,
    mockUnlockedContractAndRatesFormData,
    mockUnlockedContractOnlyFormData,
    mockUser,
    testEmailer,
}
