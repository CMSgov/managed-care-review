/* 
    Mock different health plan form data that match frontend types. 
    These helper functions allow us to compose together different proto form data to serialize and then attach in our health plan package GQL queries/ mutations
    See HealthPlanPackageGQLMock` file for usage

    Future refactors - it seems like we are starting to also add these types of mocks in common-code/healthPlanFormDataMocks. 
    We may be able to move these mocks in that file as well.
*/

import dayjs from 'dayjs'
import {
    basicLockedHealthPlanFormData,
    basicHealthPlanFormData,
    unlockedWithALittleBitOfEverything,
} from '@managed-care-review/common-code/src/healthPlanFormDataMocks'

import {
    LockedHealthPlanFormDataType,
    SubmissionDocument,
    UnlockedHealthPlanFormDataType,
} from '@managed-care-review/common-code/src/healthPlanFormDataType'
import {
    domainToBase64,
    protoToBase64,
} from '@managed-care-review/common-code/src/proto/healthPlanFormDataProto'
import { HealthPlanPackage, UpdateInformation } from '../../gen/gqlClient'
import { mockMNState } from './stateMock'

function mockDraft(): UnlockedHealthPlanFormDataType {
    return {
        status: 'DRAFT',
        stateNumber: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        id: 'test-abc-123',
        stateCode: 'MN',
        programIDs: ['abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce'],
        populationCovered: 'MEDICAID',
        submissionType: 'CONTRACT_ONLY',
        riskBasedContract: false,
        submissionDescription: 'A real submission',
        documents: [],
        contractType: 'BASE',
        contractExecutionStatus: 'EXECUTED',
        contractDocuments: [],
        contractDateStart: new Date(),
        contractDateEnd: dayjs().add(2, 'days').toDate(),
        contractAmendmentInfo: undefined,
        managedCareEntities: [],
        federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
        rateInfos: [],
        stateContacts: [],
        addtlActuaryContacts: [],
        addtlActuaryCommunicationPreference: undefined,
    }
}

function mockCompleteDraft(): UnlockedHealthPlanFormDataType {
    return {
        status: 'DRAFT',
        stateNumber: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        id: 'test-abc-123',
        stateCode: 'MN',
        programIDs: ['abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce'],
        populationCovered: 'MEDICAID',
        submissionType: 'CONTRACT_ONLY',
        riskBasedContract: true,
        submissionDescription: 'A real submission',
        documents: [],
        contractType: 'BASE',
        contractExecutionStatus: 'EXECUTED',
        contractDocuments: [],
        contractDateStart: new Date(),
        contractDateEnd: new Date(),
        contractAmendmentInfo: undefined,
        managedCareEntities: [],
        federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
        rateInfos: [
            {
                rateType: 'NEW',
                rateCapitationType: 'RATE_CELL',
                rateDocuments: [],
                rateDateStart: new Date(),
                rateDateEnd: new Date(),
                rateDateCertified: new Date(),
                rateAmendmentInfo: undefined,
                actuaryContacts: [],
                packagesWithSharedRateCerts: [],
            },
        ],
        stateContacts: [
            {
                name: 'Test Person',
                titleRole: 'A Role',
                email: 'test@test.com',
            },
        ],
        addtlActuaryContacts: [],
        addtlActuaryCommunicationPreference: undefined,
    }
}

function mockContractAndRatesDraft(): UnlockedHealthPlanFormDataType {
    return {
        status: 'DRAFT',
        stateNumber: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        id: 'test-abc-123',
        stateCode: 'MN',
        programIDs: ['pmap'],
        populationCovered: 'MEDICAID',
        submissionType: 'CONTRACT_AND_RATES',
        riskBasedContract: true,
        submissionDescription: 'A real submission',
        documents: [],
        contractType: 'AMENDMENT',
        contractExecutionStatus: 'EXECUTED',
        contractDocuments: [],
        contractDateStart: new Date(),
        contractDateEnd: new Date(),
        contractAmendmentInfo: {
            modifiedProvisions: {
                modifiedBenefitsProvided: true,
                modifiedGeoAreaServed: false,
                modifiedMedicaidBeneficiaries: true,
                modifiedRiskSharingStrategy: true,
                modifiedIncentiveArrangements: false,
                modifiedWitholdAgreements: false,
                modifiedStateDirectedPayments: true,
                modifiedPassThroughPayments: true,
                modifiedPaymentsForMentalDiseaseInstitutions: false,
                modifiedMedicalLossRatioStandards: true,
                modifiedOtherFinancialPaymentIncentive: false,
                modifiedEnrollmentProcess: true,
                modifiedGrevienceAndAppeal: false,
                modifiedNetworkAdequacyStandards: true,
                modifiedLengthOfContract: false,
                modifiedNonRiskPaymentArrangements: true,
            },
        },
        managedCareEntities: ['MCO'],
        federalAuthorities: ['STATE_PLAN'],
        rateInfos: [
            {
                rateType: 'AMENDMENT',
                rateCapitationType: 'RATE_CELL',
                rateDocuments: [],
                rateDateStart: new Date(),
                rateDateEnd: new Date(),
                rateDateCertified: new Date(),
                rateAmendmentInfo: {
                    effectiveDateStart: new Date(),
                    effectiveDateEnd: new Date(),
                },
                rateProgramIDs: ['abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce'],
                actuaryContacts: [
                    {
                        actuarialFirm: 'DELOITTE',
                        name: 'Actuary Contact 1',
                        titleRole: 'Test Actuary Contact 1',
                        email: 'actuarycontact1@test.com',
                    },
                ],
                actuaryCommunicationPreference: 'OACT_TO_ACTUARY',
                packagesWithSharedRateCerts: [],
            },
        ],
        stateContacts: [
            {
                name: 'State Contact 1',
                titleRole: 'Test State Contact 1',
                email: 'statecontact1@test.com',
            },
            {
                name: 'State Contact 2',
                titleRole: 'Test State Contact 2',
                email: 'statecontact2@test.com',
            },
        ],
        addtlActuaryContacts: [
            {
                actuarialFirm: 'DELOITTE',
                name: 'Additional Actuary Contact',
                titleRole: 'Test Actuary Contact',
                email: 'additionalactuarycontact1@test.com',
            },
        ],
        addtlActuaryCommunicationPreference: 'OACT_TO_ACTUARY',
    }
}

function mockStateSubmission(): LockedHealthPlanFormDataType {
    return {
        status: 'SUBMITTED',
        stateNumber: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        id: 'test-abc-125',
        stateCode: 'MN',
        programIDs: ['abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce'],
        populationCovered: 'MEDICAID',
        submissionType: 'CONTRACT_AND_RATES',
        riskBasedContract: true,
        submissionDescription: 'A submitted submission',
        submittedAt: new Date(),
        documents: [
            {
                s3URL: 's3://bucketname/key/supporting-documents',
                name: 'supporting documents',
                documentCategories: ['RATES_RELATED' as const],
            },
        ],
        contractType: 'BASE',
        contractExecutionStatus: 'EXECUTED',
        contractDocuments: [
            {
                s3URL: 's3://bucketname/key/contract',
                name: 'contract',
                documentCategories: ['CONTRACT' as const],
            },
        ],
        contractDateStart: new Date(),
        contractDateEnd: new Date(),
        contractAmendmentInfo: undefined,
        managedCareEntities: ['ENROLLMENT_PROCESS'],
        federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
        rateInfos: [
            {
                rateType: 'NEW',
                rateCapitationType: 'RATE_CELL',
                rateDocuments: [
                    {
                        s3URL: 's3://bucketname/key/rate',
                        name: 'rate',
                        documentCategories: ['RATES' as const],
                    },
                ],
                rateDateStart: new Date(),
                rateDateEnd: new Date(),
                rateDateCertified: new Date(),
                rateAmendmentInfo: undefined,
                rateProgramIDs: ['abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce'],
                actuaryContacts: [
                    {
                        actuarialFirm: 'DELOITTE',
                        name: 'Actuary Contact 1',
                        titleRole: 'Test Actuary Contact 1',
                        email: 'actuarycontact1@test.com',
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
                email: 'test@test.com',
            },
        ],
        addtlActuaryContacts: [],
        addtlActuaryCommunicationPreference: undefined,
    }
}

function mockStateSubmissionContractAmendment(): LockedHealthPlanFormDataType {
    return {
        status: 'SUBMITTED',
        stateNumber: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        id: 'test-abc-125',
        stateCode: 'MN',
        programIDs: ['abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce'],
        populationCovered: 'MEDICAID',
        submissionType: 'CONTRACT_AND_RATES',
        riskBasedContract: true,
        submissionDescription: 'A submitted submission',
        submittedAt: new Date(),
        documents: [
            {
                s3URL: 's3://bucketname/key/supporting-documents',
                name: 'supporting documents',
                documentCategories: ['RATES_RELATED' as const],
            },
        ],
        contractType: 'AMENDMENT',
        contractExecutionStatus: 'EXECUTED',
        contractDocuments: [
            {
                s3URL: 's3://bucketname/key/contract',
                name: 'contract',
                documentCategories: ['CONTRACT' as const],
            },
        ],
        contractDateStart: new Date(),
        contractDateEnd: new Date(),
        contractAmendmentInfo: {
            modifiedProvisions: {
                modifiedBenefitsProvided: true,
                modifiedGeoAreaServed: false,
                modifiedMedicaidBeneficiaries: true,
                modifiedRiskSharingStrategy: true,
                modifiedIncentiveArrangements: true,
                modifiedWitholdAgreements: false,
                modifiedStateDirectedPayments: false,
                modifiedPassThroughPayments: true,
                modifiedPaymentsForMentalDiseaseInstitutions: true,
                modifiedMedicalLossRatioStandards: true,
                modifiedOtherFinancialPaymentIncentive: false,
                modifiedEnrollmentProcess: true,
                modifiedGrevienceAndAppeal: false,
                modifiedNetworkAdequacyStandards: true,
                modifiedLengthOfContract: false,
                modifiedNonRiskPaymentArrangements: true,
            },
        },
        managedCareEntities: ['ENROLLMENT_PROCESS'],
        federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
        rateInfos: [
            {
                rateType: 'NEW',
                rateCapitationType: 'RATE_CELL',
                rateDocuments: [
                    {
                        s3URL: 's3://bucketname/key/rate',
                        name: 'rate',
                        documentCategories: ['RATES' as const],
                    },
                ],
                rateDateStart: new Date(),
                rateDateEnd: new Date(),
                rateDateCertified: new Date(),
                rateAmendmentInfo: undefined,
                rateProgramIDs: ['abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce'],
                actuaryContacts: [
                    {
                        actuarialFirm: 'DELOITTE',
                        name: 'Actuary Contact 1',
                        titleRole: 'Test Actuary Contact 1',
                        email: 'actuarycontact1@test.com',
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
                email: 'test@test.com',
            },
        ],
        addtlActuaryContacts: [],
        addtlActuaryCommunicationPreference: undefined,
    }
}

function mockDraftHealthPlanPackage(
    submissionData?: Partial<UnlockedHealthPlanFormDataType>
): HealthPlanPackage {
    const submission = { ...basicHealthPlanFormData(), ...submissionData }
    const b64 = domainToBase64(submission)

    return {
        __typename: 'HealthPlanPackage',
        id: 'test-id-123',
        status: 'DRAFT',
        initiallySubmittedAt: '2022-01-01',
        stateCode: 'MN',
        state: mockMNState(),
        revisions: [
            {
                node: {
                    id: 'revision1',
                    unlockInfo: null,
                    createdAt: '2019-01-01',
                    submitInfo: null,
                    formDataProto: b64,
                },
            },
        ],
    }
}

function mockSubmittedHealthPlanPackage(
    submissionData?: Partial<UnlockedHealthPlanFormDataType>,
    submitInfo?: Partial<UpdateInformation>
): HealthPlanPackage {
    // get a submitted DomainModel submission
    // turn it into proto
    const submission = { ...basicLockedHealthPlanFormData(), ...submissionData }
    const b64 = domainToBase64(submission)

    return {
        id: 'test-id-123',
        status: 'SUBMITTED',
        initiallySubmittedAt: '2022-01-02',
        stateCode: 'MN',
        state: mockMNState(),
        revisions: [
            {
                node: {
                    id: 'revision1',
                    createdAt: new Date('2021-01-01'),
                    unlockInfo: null,
                    submitInfo: {
                        updatedAt: new Date('2021-01-02'),
                        updatedBy: 'test@example.com',
                        updatedReason: 'Initial submit',
                        ...submitInfo,
                    },
                    formDataProto: b64,
                },
            },
        ],
    }
}

function mockSubmittedHealthPlanPackageWithRevisions(): HealthPlanPackage {
    // get a submitted DomainModel submission
    // turn it into proto
    const submission = basicLockedHealthPlanFormData()
    const b64 = domainToBase64(submission)

    return {
        id: 'test-id-123',
        status: 'RESUBMITTED',
        initiallySubmittedAt: '2022-01-01',
        stateCode: 'MN',
        state: mockMNState(),
        revisions: [
            {
                node: {
                    id: 'sd596de8-852d-4e42-ab0a-c9c9bf78c3c1',
                    unlockInfo: {
                        updatedAt: '2022-03-25T01:18:44.663Z',
                        updatedBy: 'zuko@example.com',
                        updatedReason: 'Latest unlock',
                    },
                    submitInfo: {
                        updatedAt: '2022-03-25T01:19:46.154Z',
                        updatedBy: 'aang@example.com',
                        updatedReason: 'Should be latest resubmission',
                        __typename: 'UpdateInformation',
                    },
                    createdAt: '2022-03-25T01:18:44.665Z',
                    formDataProto: b64,
                },
            },
            {
                node: {
                    id: '26596de8-852d-4e42-bb0a-c9c9bf78c3de',
                    unlockInfo: {
                        updatedAt: '2022-03-24T01:18:44.663Z',
                        updatedBy: 'zuko@example.com',
                        updatedReason: 'testing stuff',
                    },
                    submitInfo: {
                        updatedAt: '2022-03-24T01:19:46.154Z',
                        updatedBy: 'aang@example.com',
                        updatedReason: 'Placeholder resubmission reason',
                    },
                    createdAt: '2022-03-24T01:18:44.665Z',
                    formDataProto: b64,
                },
            },
            {
                node: {
                    id: 'e048cdcf-5b19-4acb-8ead-d7dc2fd6cd30',
                    unlockInfo: null,
                    submitInfo: {
                        updatedAt: '2022-03-23T02:08:52.259Z',
                        updatedBy: 'aang@example.com',
                        updatedReason: 'Initial submission',
                    },
                    createdAt: '2022-03-23T02:08:14.241Z',
                    formDataProto: b64,
                },
            },
        ],
    }
}

function mockUnlockedHealthPlanPackage(
    submissionData?: Partial<UnlockedHealthPlanFormDataType>,
    unlockInfo?: Partial<UpdateInformation>
): HealthPlanPackage {
    const submission = {
        ...unlockedWithALittleBitOfEverything(),
        ...submissionData,
    }
    const b64 = domainToBase64(submission)
    const b64Previous = domainToBase64({
        ...unlockedWithALittleBitOfEverything(),
    })

    return {
        id: 'test-id-123',
        status: 'UNLOCKED',
        initiallySubmittedAt: '2020-01-01',
        stateCode: 'MN',
        state: mockMNState(),
        revisions: [
            {
                node: {
                    id: 'revision3',
                    createdAt: new Date(),
                    unlockInfo: {
                        updatedAt: new Date(),
                        updatedBy: 'bob@dmas.mn.gov',
                        updatedReason: 'Test unlock reason',
                        ...unlockInfo,
                    },
                    submitInfo: null,
                    formDataProto: b64,
                },
            },
            {
                node: {
                    id: 'revision2',
                    createdAt: new Date('2020-07-01'),
                    unlockInfo: {
                        updatedAt: new Date('2020-08-01'),
                        updatedBy: 'bob@dmas.mn.gov',
                        updatedReason: 'Test unlock reason',
                        ...unlockInfo,
                    },
                    submitInfo: {
                        updatedAt: new Date('2020-07-15'),
                        updatedBy: 'bob@dmas.mn.gov',
                        updatedReason: 'Second Submit',
                    },
                    formDataProto: b64Previous,
                },
            },
            {
                node: {
                    id: 'revision1',
                    createdAt: new Date('2020-01-01'),
                    unlockInfo: null,
                    submitInfo: {
                        updatedAt: new Date('2021-01-02'),
                        updatedBy: 'test@example.com',
                        updatedReason: 'Initial submit',
                    },
                    formDataProto: b64Previous,
                },
            },
        ],
    }
}

function mockUnlockedHealthPlanPackageWithOldProtos(
    unlockedWithOldProto: Buffer
): HealthPlanPackage {
    // other mocks take a submission and convert it to a proto, but here we pass in a proto
    const b64 = protoToBase64(unlockedWithOldProto)

    return {
        id: 'test-id-123',
        status: 'UNLOCKED',
        initiallySubmittedAt: '2020-01-01',
        stateCode: 'MN',
        state: mockMNState(),
        revisions: [
            {
                node: {
                    id: 'revision3',
                    createdAt: new Date('2020-09-01'),
                    unlockInfo: {
                        updatedAt: new Date('2020-09-02'),
                        updatedBy: 'bob@dmas.mn.gov',
                        updatedReason: 'Test unlock reason',
                    },
                    submitInfo: null,
                    formDataProto: b64,
                },
            },
            {
                node: {
                    id: 'revision2',
                    createdAt: new Date('2020-07-01'),
                    unlockInfo: {
                        updatedAt: new Date('2020-08-01'),
                        updatedBy: 'bob@dmas.mn.gov',
                        updatedReason: 'Test unlock reason',
                    },
                    submitInfo: {
                        updatedAt: new Date('2020-07-15'),
                        updatedBy: 'bob@dmas.mn.gov',
                        updatedReason: 'Second Submit',
                    },
                    formDataProto: b64,
                },
            },
            {
                node: {
                    id: 'revision1',
                    createdAt: new Date('2020-01-01'),
                    unlockInfo: null,
                    submitInfo: {
                        updatedAt: new Date('2021-01-02'),
                        updatedBy: 'test@example.com',
                        updatedReason: 'Initial submit',
                    },
                    formDataProto: b64,
                },
            },
        ],
    }
}

function mockUnlockedHealthPlanPackageWithDocuments(): HealthPlanPackage {
    // SETUP
    // for this test we want to have a package with a few different revisions
    // with different documents setup.
    const docs1: SubmissionDocument[] = [
        {
            s3URL: 's3://bucketname/one-one/one-one.png',
            name: 'one one',
            documentCategories: ['CONTRACT_RELATED'],
        },
        {
            s3URL: 's3://bucketname/one-two/one-two.png',
            name: 'one two',
            documentCategories: ['CONTRACT_RELATED'],
        },
        {
            s3URL: 's3://bucketname/one-three/one-three.png',
            name: 'one three',
            documentCategories: ['CONTRACT_RELATED'],
        },
    ]
    const docs2: SubmissionDocument[] = [
        {
            s3URL: 's3://bucketname/one-two/one-two.png',
            name: 'one two',
            documentCategories: ['CONTRACT_RELATED'],
        },
        {
            s3URL: 's3://bucketname/one-three/one-three.png',
            name: 'one three',
            documentCategories: ['CONTRACT_RELATED'],
        },
        {
            s3URL: 's3://bucketname/two-one/two-one.png',
            name: 'two one',
            documentCategories: ['CONTRACT_RELATED'],
        },
    ]
    const docs3: SubmissionDocument[] = [
        {
            s3URL: 's3://bucketname/one-two/one-two.png',
            name: 'one two',
            documentCategories: ['CONTRACT_RELATED'],
        },
        {
            s3URL: 's3://bucketname/two-one/two-one.png',
            name: 'two one',
            documentCategories: ['CONTRACT_RELATED'],
        },
        {
            s3URL: 's3://bucketname/three-one/three-one.png',
            name: 'three one',
            documentCategories: ['CONTRACT_RELATED'],
        },
    ]

    const baseFormData = basicLockedHealthPlanFormData()
    baseFormData.documents = docs1
    const b64one = domainToBase64(baseFormData)

    baseFormData.documents = docs2
    const b64two = domainToBase64(baseFormData)

    const unlockedFormData = basicHealthPlanFormData()
    unlockedFormData.documents = docs3
    const b64three = domainToBase64(unlockedFormData)

    // set our form data for each of these revisions.
    const testPackage = mockUnlockedHealthPlanPackage()
    testPackage.revisions[2].node.formDataProto = b64one
    testPackage.revisions[1].node.formDataProto = b64two
    testPackage.revisions[0].node.formDataProto = b64three

    return testPackage
}

export {
    mockContractAndRatesDraft,
    mockStateSubmission,
    mockCompleteDraft,
    mockDraft,
    mockStateSubmissionContractAmendment,
    mockDraftHealthPlanPackage,
    mockSubmittedHealthPlanPackage,
    mockUnlockedHealthPlanPackageWithDocuments,
    mockUnlockedHealthPlanPackageWithOldProtos,
    mockSubmittedHealthPlanPackageWithRevisions,
    mockUnlockedHealthPlanPackage,
}
