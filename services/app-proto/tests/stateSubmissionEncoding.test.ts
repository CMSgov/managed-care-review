import { toProtoBuffer } from '../src/stateSubmissionEncoding'
import { statesubmission } from '../gen/stateSubmissionProto'
import { toDomain } from '../src/stateSubmissionEncoding'
import {
    DraftSubmissionType,
    isStateSubmission,
    StateSubmissionType,
} from '../../app-web/src/common-code/domain-models'

const newSubmission: DraftSubmissionType = {
    createdAt: new Date(2021, 4, 10),
    updatedAt: new Date(),
    status: 'DRAFT',
    stateNumber: 5,
    id: 'test-abc-123',
    stateCode: 'MN',
    programID: 'snbc',
    submissionType: 'CONTRACT_AND_RATES',
    submissionDescription: 'A real submission',
    documents: [],
    managedCareEntities: [],
    federalAuthorities: [],
    stateContacts: [],
    actuaryContacts: [],
}

const basicSubmission: DraftSubmissionType = {
    createdAt: new Date(2021, 4, 10),
    updatedAt: new Date(),
    status: 'DRAFT',
    stateNumber: 5,
    id: 'test-abc-123',
    stateCode: 'MN',
    programID: 'snbc',
    submissionType: 'CONTRACT_AND_RATES',
    submissionDescription: 'A real submission',
    documents: [],
    contractType: 'BASE',
    contractDateStart: new Date(2021, 4, 22),
    contractDateEnd: new Date(2022, 4, 21),
    managedCareEntities: [],
    federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
    stateContacts: [],
    actuaryContacts: [],
}

const contractOnly: DraftSubmissionType = {
    createdAt: new Date(2021, 4, 10),
    updatedAt: new Date(),
    status: 'DRAFT',
    stateNumber: 5,
    id: 'test-abc-123',
    stateCode: 'MN',
    programID: 'snbc',
    submissionType: 'CONTRACT_ONLY',
    submissionDescription: 'A real submission',
    documents: [],
    contractType: 'BASE',
    contractDateStart: new Date(2021, 4, 22),
    contractDateEnd: new Date(2022, 4, 21),
    managedCareEntities: [],
    federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
    stateContacts: [],
    actuaryContacts: [],
}

const moreFullSubmission: DraftSubmissionType = {
    createdAt: new Date(2021, 4, 10),
    updatedAt: new Date(),
    status: 'DRAFT',
    stateNumber: 5,
    id: 'test-abc-123',
    stateCode: 'MN',
    programID: 'snbc',
    submissionType: 'CONTRACT_AND_RATES',
    submissionDescription: 'A real submission',
    documents: [],
    contractType: 'BASE',
    contractDateStart: new Date(2021, 4, 22),
    contractDateEnd: new Date(2022, 4, 21),
    managedCareEntities: [],
    federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
    stateContacts: [
        {
            name: 'foo bar',
            titleRole: 'manager',
            email: 'soandso@example.com',
        },
        {
            name: 'Fine Bab',
            titleRole: 'supervisor',
            email: 'lodar@example.com',
        },
    ],
    actuaryContacts: [
        {
            name: 'foo bar',
            titleRole: 'manager',
            email: 'soandso@example.com',
            actuarialFirm: 'OTHER' as const,
            actuarialFirmOther: 'ACME',
        },
        {
            name: 'Fine Bab',
            titleRole: 'supervisor',
            email: 'lodar@example.com',
            actuarialFirm: 'MERCER' as const,
        },
    ],
}

const nowWithDocuments: DraftSubmissionType = {
    createdAt: new Date(2021, 4, 10),
    updatedAt: new Date(),
    status: 'DRAFT',
    stateNumber: 5,
    id: 'test-abc-123',
    stateCode: 'MN',
    programID: 'snbc',
    submissionType: 'CONTRACT_AND_RATES',
    submissionDescription: 'A real submission',
    documents: [
        {
            s3URL: 'www.example.com/foo.png',
            name: 'dummy doc',
        },
        {
            s3URL: 'www.example.com/foo.png',
            name: 'dummy doc2',
        },
    ],
    contractType: 'BASE',
    contractDateStart: new Date(2021, 4, 22),
    contractDateEnd: new Date(2022, 4, 21),
    managedCareEntities: [],
    federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
    stateContacts: [
        {
            name: 'foo bar',
            titleRole: 'manager',
            email: 'soandso@example.com',
        },
        {
            name: 'Fine Bab',
            titleRole: 'supervisor',
            email: 'lodar@example.com',
        },
    ],
    actuaryContacts: [
        {
            name: 'foo bar',
            titleRole: 'manager',
            email: 'soandso@example.com',
            actuarialFirm: 'OTHER' as const,
            actuarialFirmOther: 'ACME',
        },
        {
            name: 'Fine Bab',
            titleRole: 'supervisor',
            email: 'lodar@example.com',
            actuarialFirm: 'MERCER' as const,
        },
    ],
}

const fullRateAmendment: DraftSubmissionType = {
    createdAt: new Date(2021, 4, 10),
    updatedAt: new Date(),
    status: 'DRAFT',
    stateNumber: 5,
    id: 'test-abc-123',
    stateCode: 'MN',
    programID: 'snbc',
    submissionType: 'CONTRACT_AND_RATES',
    submissionDescription: 'A real submission',
    documents: [
        {
            s3URL: 'www.example.com/foo.png',
            name: 'dummy doc',
        },
        {
            s3URL: 'www.example.com/foo.png',
            name: 'dummy doc2',
        },
    ],
    contractType: 'BASE',
    contractDateStart: new Date(2021, 4, 22),
    contractDateEnd: new Date(2022, 4, 21),
    managedCareEntities: ['PIHP'],
    federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
    rateType: 'AMENDMENT',
    rateDateStart: new Date(2021, 4, 22),
    rateDateEnd: new Date(2022, 3, 29),
    rateDateCertified: new Date(2021, 4, 23),
    rateAmendmentInfo: {
        effectiveDateStart: new Date(2022, 5, 21),
        effectiveDateEnd: new Date(2022, 9, 21),
    },
    stateContacts: [
        {
            name: 'foo bar',
            titleRole: 'manager',
            email: 'soandso@example.com',
        },
        {
            name: 'Fine Bab',
            titleRole: 'supervisor',
            email: 'lodar@example.com',
        },
    ],
    actuaryContacts: [
        {
            name: 'foo bar',
            titleRole: 'manager',
            email: 'soandso@example.com',
            actuarialFirm: 'OTHER' as const,
            actuarialFirmOther: 'ACME',
        },
        {
            name: 'Fine Bab',
            titleRole: 'supervisor',
            email: 'lodar@example.com',
            actuarialFirm: 'MERCER' as const,
        },
    ],
    actuaryCommunicationPreference: 'OACT_TO_ACTUARY',
}

const fullContractInfo: DraftSubmissionType = {
    createdAt: new Date(2021, 4, 10),
    updatedAt: new Date(),
    status: 'DRAFT',
    stateNumber: 5,
    id: 'test-abc-123',
    stateCode: 'MN',
    programID: 'snbc',
    submissionType: 'CONTRACT_AND_RATES',
    submissionDescription: 'A real submission',
    documents: [
        {
            s3URL: 'www.example.com/foo.png',
            name: 'dummy doc',
        },
        {
            s3URL: 'www.example.com/foo.png',
            name: 'dummy doc2',
        },
    ],
    contractType: 'AMENDMENT',
    contractDateStart: new Date(2021, 4, 22),
    contractDateEnd: new Date(2022, 4, 21),
    contractAmendmentInfo: {
        itemsBeingAmended: [
            'ENROLLEE_ACCESS',
            'GEO_AREA_SERVED',
            'CAPITATION_RATES',
            'OTHER',
        ],
        otherItemBeingAmended: 'OTHERAMEND',
        capitationRatesAmendedInfo: {
            reason: 'OTHER',
            otherReason: 'somethingelse',
        },
        relatedToCovid19: true,
        relatedToVaccination: false,
    },
    managedCareEntities: ['PIHP'],
    federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
    rateType: 'AMENDMENT',
    rateDateStart: new Date(2021, 4, 22),
    rateDateEnd: new Date(2022, 3, 29),
    rateDateCertified: new Date(2021, 4, 23),
    rateAmendmentInfo: {
        effectiveDateStart: new Date(2022, 5, 21),
        effectiveDateEnd: new Date(2022, 9, 21),
    },
    stateContacts: [
        {
            name: 'foo bar',
            titleRole: 'manager',
            email: 'soandso@example.com',
        },
        {
            name: 'Fine Bab',
            titleRole: 'supervisor',
            email: 'lodar@example.com',
        },
    ],
    actuaryContacts: [
        {
            name: 'foo bar',
            titleRole: 'manager',
            email: 'soandso@example.com',
            actuarialFirm: 'OTHER' as const,
            actuarialFirmOther: 'ACME',
        },
        {
            name: 'Fine Bab',
            titleRole: 'supervisor',
            email: 'lodar@example.com',
            actuarialFirm: 'MERCER' as const,
        },
    ],
    actuaryCommunicationPreference: 'OACT_TO_ACTUARY',
}

const someOthers: DraftSubmissionType = {
    id: 'test-abc-123',
    createdAt: new Date(2021, 4, 10),
    updatedAt: new Date(),
    status: 'DRAFT',
    stateCode: 'MN',
    stateNumber: 5,
    programID: 'snbc',
    submissionType: 'CONTRACT_AND_RATES',
    submissionDescription: 'A real submission',
    documents: [
        {
            s3URL: 'www.example.com/foo.png',
            name: 'dummy doc',
        },
        {
            s3URL: 'www.example.com/foo.png',
            name: 'dummy doc2',
        },
    ],
    contractType: 'AMENDMENT',
    contractDateStart: new Date(2021, 4, 22),
    contractDateEnd: new Date(2022, 4, 21),
    contractAmendmentInfo: {
        itemsBeingAmended: [
            'ENROLLEE_ACCESS',
            'GEO_AREA_SERVED',
            'CAPITATION_RATES',
            'OTHER',
        ],
        otherItemBeingAmended: 'OTHERAMEND',
        capitationRatesAmendedInfo: {
            reason: 'OTHER',
            otherReason: 'somethingelse',
        },
        relatedToCovid19: true,
        relatedToVaccination: false,
    },
    managedCareEntities: ['PIHP', 'PCCM'],
    federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
    rateType: 'AMENDMENT',
    rateDateStart: new Date(2021, 4, 22),
    rateDateEnd: new Date(2022, 3, 29),
    rateDateCertified: new Date(2021, 4, 23),
    rateAmendmentInfo: {
        effectiveDateStart: new Date(2022, 5, 21),
        effectiveDateEnd: new Date(2022, 9, 21),
    },
    stateContacts: [
        {
            name: 'foo bar',
            titleRole: 'manager',
            email: 'soandso@example.com',
        },
        {
            name: 'Fine Bab',
            titleRole: 'supervisor',
            email: 'lodar@example.com',
        },
    ],
    actuaryContacts: [
        {
            name: 'foo bar',
            titleRole: 'manager',
            email: 'soandso@example.com',
            actuarialFirm: 'OTHER' as const,
            actuarialFirmOther: 'ACME',
        },
        {
            name: 'Fine Bab',
            titleRole: 'supervisor',
            email: 'lodar@example.com',
            actuarialFirm: 'MERCER' as const,
        },
    ],
    actuaryCommunicationPreference: 'OACT_TO_ACTUARY',
}

const basicCompleteLiteral: StateSubmissionType = {
    createdAt: new Date(2021, 4, 10),
    updatedAt: new Date(),
    submittedAt: new Date(),
    status: 'SUBMITTED',
    stateNumber: 5,
    id: 'test-abc-123',
    stateCode: 'MN',
    programID: 'snbc',
    submissionType: 'CONTRACT_ONLY',
    submissionDescription: 'A real submission',
    documents: [
        {
            name: 'dummy doc',
            s3URL: 'https://s3.com/dummy',
        },
    ],
    contractType: 'BASE',
    contractDateStart: new Date(2021, 4, 22),
    contractDateEnd: new Date(2022, 4, 21),
    managedCareEntities: ['PIHP'],
    federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
    stateContacts: [
        {
            name: 'Some Body',
            email: 's@example.com',
            titleRole: 'Manager',
        },
    ],
    actuaryContacts: [
        {
            name: 'Anne Acturay',
            email: 'aa@example.com',
            titleRole: 'Deputy',
            actuarialFirm: 'STATE_IN_HOUSE',
        },
    ],
}

describe('toProtoBuffer', () => {
    if (!isStateSubmission(basicCompleteLiteral)) {
        throw new Error(
            'Bad test, the state submission is not a state submission'
        )
    }

    test.each([
        newSubmission,
        basicSubmission,
        contractOnly,
        moreFullSubmission,
        nowWithDocuments,
        fullRateAmendment,
        fullContractInfo,
        someOthers,
        basicCompleteLiteral,
    ])(
        'given valid domain model %j expect protobufs to be symmetric)',
        (domainObject: DraftSubmissionType | StateSubmissionType) => {
            expect(toDomain(toProtoBuffer(domainObject))).toEqual(domainObject)
        }
    )

    // test.each([[invalidDomain1]])(
    //     'given invalid object %o expect error)',
    //     (invalidDomainObject) => {
    //         expect(toProtoBuffer(invalidDomainObject)).toThrowError()
    //     }
    // )
})

describe('bad Proto', () => {
    it('empty Proto', () => {
        const protoMessage = new statesubmission.StateSubmissionInfo({})
        const encodedEmpty =
            statesubmission.StateSubmissionInfo.encode(protoMessage).finish()

        const maybeError = toDomain(encodedEmpty)

        expect(maybeError).toBeInstanceOf(Error)
        expect(maybeError.toString()).toEqual(
            'Error: Unknown or missing status on this proto. Cannot decode.'
        )
    })
})

// DRAFT SUBMISSIONS

// const draftSubmission = {
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     id: 'test-abc-123',
//     stateCode: 'MN',
//     programID: 'snbc',
//     program: {
//         id: 'snbc',
//         name: 'SNBC',
//     },
//     name: 'MN-MSHO-0001',
//     submissionType: 'CONTRACT_ONLY',
//     submissionDescription: 'A real submission',
//     documents: [],
//     contractType: 'BASE',
//     contractDateStart: new Date(),
//     contractDateEnd: new Date(),
//     contractAmendmentInfo: null,
//     managedCareEntities: [],
//     federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
//     rateType: null,
//     rateDateStart: null,
//     rateDateEnd: null,
//     rateDateCertified: null,
//     rateAmendmentInfo: null,
//     stateContacts: [],
//     actuaryContacts: [],
//     actuaryCommunicationPreference: null,
// }

// export function mockContactAndRatesDraft(): DraftSubmission {
//     return {
//         __typename: 'DraftSubmission',
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         id: 'test-abc-123',
//         stateCode: 'MN',
//         programID: 'snbc',
//         program: {
//             id: 'snbc',
//             name: 'SNBC',
//         },
//         name: 'MN-MSHO-0001',
//         submissionType: 'CONTRACT_AND_RATES',
//         submissionDescription: 'A real submission',
//         documents: [],
//         contractType: 'BASE',
//         contractDateStart: new Date(),
//         contractDateEnd: dayjs().add(2, 'days').toDate(),
//         contractAmendmentInfo: null,
//         managedCareEntities: [],
//         federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
//         rateType: null,
//         rateDateStart: null,
//         rateDateEnd: null,
//         rateDateCertified: null,
//         rateAmendmentInfo: null,
//         stateContacts: [],
//         actuaryContacts: [],
//         actuaryCommunicationPreference: null,
//     }
// }

// export function mockCompleteDraft(): DraftSubmission {
//     return {
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         id: 'test-abc-123',
//         stateCode: 'MN',
//         programID: 'snbc',
//         program: {
//             id: 'snbc',
//             name: 'SNBC',
//         },
//         name: 'MN-MSHO-0001',
//         submissionType: 'CONTRACT_ONLY',
//         submissionDescription: 'A real submission',
//         documents: [],
//         contractType: 'BASE',
//         contractDateStart: new Date(),
//         contractDateEnd: new Date(),
//         contractAmendmentInfo: null,
//         managedCareEntities: [],
//         federalAuthorities: ['VOLUNTARY', 'BENCHMARK'],
//         rateType: 'NEW',
//         rateDateStart: new Date(),
//         rateDateEnd: new Date(),
//         rateDateCertified: new Date(),
//         rateAmendmentInfo: null,
//         stateContacts: [
//             {
//                 name: 'Test Person',
//                 titleRole: 'A Role',
//                 email: 'test@test.com',
//             },
//         ],
//         actuaryContacts: [],
//         actuaryCommunicationPreference: null,
//     }
// }

// function mockNewDraft(): DraftSubmission {
//     return {
//         __typename: 'DraftSubmission',
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         id: 'test-abc-124',
//         stateCode: 'MN',
//         programID: 'snbc',
//         program: {
//             id: 'snbc',
//             name: 'SNBC',
//         },
//         name: 'MN-MSHO-0002',
//         submissionType: 'CONTRACT_ONLY',
//         submissionDescription: 'A real submission',
//         documents: [],
//         contractType: null,
//         contractDateStart: null,
//         contractDateEnd: null,
//         contractAmendmentInfo: null,
//         managedCareEntities: [],
//         federalAuthorities: [],
//         rateType: null,
//         rateDateStart: null,
//         rateDateEnd: null,
//         rateDateCertified: null,
//         stateContacts: [],
//         actuaryContacts: [],
//         actuaryCommunicationPreference: null,
//     }
// }
