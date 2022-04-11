import {
    mockDraft,
    mockStateSubmission,
    mockContractAndRatesDraft,
    mockMNState,
} from '../../testHelpers/apolloHelpers'
import {
    generateRateName,
    hasValidSupportingDocumentCategories,
    StateSubmissionType,
    submissionName,
    RateDataType,
} from '.'
import {
    hasValidContract,
    hasValidDocuments,
    hasValidRates,
    isContractOnly,
    isContractAndRates,
    isStateSubmission,
    isDraftSubmission,
} from './'
import { basicSubmission } from '../domain-mocks'

describe('submission type assertions', () => {
    test.each([
        [mockStateSubmission(), true],
        [{ ...mockStateSubmission(), contractType: undefined }, false],
        [
            { ...mockStateSubmission(), contractExecutionStatus: undefined },
            false,
        ],
        [{ ...mockStateSubmission(), contractDateStart: undefined }, false],
        [{ ...mockStateSubmission(), contractDateEnd: undefined }, false],
        [{ ...mockStateSubmission(), managedCareEntities: [] }, false],
        [{ ...mockStateSubmission(), federalAuthorities: [] }, false],
    ])(
        'hasValidContract evaluates as expected',
        (submission, expectedResponse) => {
            // type coercion to allow us to test
            expect(
                hasValidContract(submission as unknown as StateSubmissionType)
            ).toEqual(expectedResponse)
        }
    )

    test.each([
        [mockStateSubmission(), true],
        [
            {
                ...mockStateSubmission(),
                documents: [
                    {
                        name: 'A.pdf',
                        s3URL: 's3://local-uploads/1644167870842-A.pdf/A.pdf',
                        documentCategories: [],
                    },
                ],
            },
            false,
        ],
        [
            {
                ...mockStateSubmission(),
                documents: [
                    {
                        name: 'A.pdf',
                        s3URL: 's3://local-uploads/1644167870842-A.pdf/A.pdf',
                        documentCategories: ['RATES_RELATED'],
                    },
                ],
                submissionType: 'CONTRACT_ONLY',
            },
            false,
        ],
        [
            {
                ...mockStateSubmission(),
                documents: [
                    {
                        name: 'A.pdf',
                        s3URL: 's3://local-uploads/1644167870842-A.pdf/A.pdf',
                        documentCategories: ['CONTRACT_RELATED'],
                    },
                ],
                submissionType: 'CONTRACT_ONLY',
            },
            true,
        ],
        [
            {
                ...mockStateSubmission(),
                documents: [
                    {
                        name: 'A.pdf',
                        s3URL: 's3://local-uploads/1644167870842-A.pdf/A.pdf',
                        documentCategories: ['RATES_RELATED'],
                    },
                ],
                submissionType: 'CONTRACT_AND_RATES',
            },
            true,
        ],
        [
            {
                ...mockStateSubmission(),
                documents: [
                    {
                        name: 'A.pdf',
                        s3URL: 's3://local-uploads/1644167870842-A.pdf/A.pdf',
                        documentCategories: ['RATES_RELATED'],
                    },
                    {
                        name: 'B.pdf',
                        s3URL: 's3://local-uploads/1644167870842-B.pdf/B.pdf',
                        documentCategories: ['CONTRACT_RELATED'],
                    },
                ],
                submissionType: 'CONTRACT_ONLY',
            },
            false,
        ],
        [
            {
                ...mockStateSubmission(),
                documents: [
                    {
                        name: 'A.pdf',
                        s3URL: 's3://local-uploads/1644167870842-A.pdf/A.pdf',
                        documentCategories: ['CONTRACT_RELATED'],
                    },
                    {
                        name: 'B.pdf',
                        s3URL: 's3://local-uploads/1644167870842-B.pdf/B.pdf',
                        documentCategories: ['CONTRACT_RELATED'],
                    },
                ],
                submissionType: 'CONTRACT_ONLY',
            },
            true,
        ],
    ])(
        'hasValidSupportingDocumentCategories evaluates as expected',
        (submission, expectedResponse) => {
            // type coercion to allow us to test
            expect(
                hasValidSupportingDocumentCategories(
                    submission as unknown as StateSubmissionType
                )
            ).toEqual(expectedResponse)
        }
    )

    test.each([
        [mockStateSubmission(), true],
        [{ ...mockStateSubmission(), documents: [] }, true],
        [
            {
                ...mockStateSubmission(),
                submissionType: 'CONTRACT_ONLY',
                rateDocuments: [],
            },
            true,
        ],
        [{ ...mockStateSubmission(), contractDocuments: [] }, false],
        [
            {
                ...mockStateSubmission(),
                submissionType: 'CONTRACT_AND_RATES',
                rateDocuments: [],
            },
            false,
        ],
    ])(
        'hasValidDocuments evaluates as expected',
        (submission, expectedResponse) => {
            // type coercion to allow us to test
            expect(
                hasValidDocuments(submission as unknown as StateSubmissionType)
            ).toEqual(expectedResponse)
        }
    )

    test.each([
        [mockStateSubmission(), true],
        [mockContractAndRatesDraft(), true],
        [
            {
                ...mockStateSubmission(),
                rateType: undefined,
            },
            false,
        ],
        [
            {
                ...mockStateSubmission(),
                rateDateStart: undefined,
            },
            false,
        ],
        [
            {
                ...mockStateSubmission(),
                rateDateEnd: undefined,
            },
            false,
        ],
        [
            {
                ...mockStateSubmission(),
                rateDateCertified: undefined,
            },
            false,
        ],
        [
            {
                ...mockStateSubmission(),
                submissionType: 'CONTRACT_ONLY',
                rateDocuments: [],
            },
            false,
        ],
        [
            {
                ...mockStateSubmission(),
                rateType: 'AMENDMENT',
                rateAmendmentInfo: undefined,
            },
            false,
        ],
    ])(
        'hasValidRates evaluates as expected',
        (submission, expectedResponse) => {
            // type coercion to allow us to test
            expect(
                hasValidRates(submission as unknown as StateSubmissionType)
            ).toEqual(expectedResponse)
        }
    )

    test.each([
        [{ ...mockStateSubmission(), submissionType: 'CONTRACT_ONLY' }, true],
        [
            {
                ...mockStateSubmission(),
                submissionType: 'CONTRACT_AND_RATES',
            },
            false,
        ],
    ])(
        'isContractOnly evaluates as expected',
        (submission, expectedResponse) => {
            // type coercion to allow us to test
            expect(
                isContractOnly(submission as unknown as StateSubmissionType)
            ).toEqual(expectedResponse)
        }
    )

    test.each([
        [
            { ...mockStateSubmission(), submissionType: 'CONTRACT_AND_RATES' },
            true,
        ],
        [
            {
                ...mockStateSubmission(),
                submissionType: 'CONTRACT_ONLY',
            },
            false,
        ],
    ])(
        'isContractAndRates evaluates as expected',
        (submission, expectedResponse) => {
            // type coercion to allow us to test
            expect(
                isContractAndRates(submission as unknown as StateSubmissionType)
            ).toEqual(expectedResponse)
        }
    )

    test.each([
        [{ ...mockDraft(), status: 'DRAFT' }, true],
        [{ ...mockContractAndRatesDraft(), status: 'DRAFT' }, true],
        [mockStateSubmission(), false],
    ])(
        'isDraftSubmission evaluates as expected',
        (submission, expectedResponse) => {
            // type coercion to allow us to test
            expect(isDraftSubmission(submission)).toEqual(expectedResponse)
        }
    )

    test.each([
        [{ ...mockStateSubmission(), status: 'SUBMITTED' }, true],
        [
            {
                ...mockStateSubmission(),
                status: 'SUBMITTED',
                contractDocuments: [],
            },
            false,
        ],
        [
            {
                ...mockStateSubmission(),
                status: 'SUBMITTED',
                submissionType: 'CONTRACT_ONLY',
                rateDocuments: [],
            },
            false,
        ],
        [{ ...mockStateSubmission(), contractType: undefined }, false],
        [
            { ...mockStateSubmission(), contractExecutionStatus: undefined },
            false,
        ],
        [mockDraft(), false],
        [mockContractAndRatesDraft(), false],
    ])(
        'isStateSubmission evaluates as expected',
        (submission, expectedResponse) => {
            // type coercion to allow us to test
            expect(isStateSubmission(submission)).toEqual(expectedResponse)
        }
    )

    test.each([
        [['foo-bar', 'baz-bin'], 'MCR-MN-UNKNOWNPROGRAM-UNKNOWNPROGRAM-0005'],
        [['abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce'], 'MCR-MN-SNBC-0005'],
        [
            [
                'd95394e5-44d1-45df-8151-1cc1ee66f100',
                'ea16a6c0-5fc6-4df8-adac-c627e76660ab',
            ],
            'MCR-MN-MSC+-PMAP-0005',
        ],
        [
            [
                'ea16a6c0-5fc6-4df8-adac-c627e76660ab',
                'd95394e5-44d1-45df-8151-1cc1ee66f100',
            ],
            'MCR-MN-MSC+-PMAP-0005',
        ],
        [
            ['3fd36500-bf2c-47bc-80e8-e7aa417184c5', 'baz-bin'],
            'MCR-MN-MSHO-UNKNOWNPROGRAM-0005',
        ],
        [
            [
                'abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce',
                'd95394e5-44d1-45df-8151-1cc1ee66f100',
                'ea16a6c0-5fc6-4df8-adac-c627e76660ab',
            ],
            'MCR-MN-MSC+-PMAP-SNBC-0005',
        ],
    ])('submission name is correct', (programIDs, expectedName) => {
        const programs = mockMNState().programs
        const sub = basicSubmission()
        sub.programIDs = programIDs

        expect(submissionName(sub, programs)).toBe(expectedName)
    })

    const rateNameTestArray: {
        rateData: RateDataType
        submissionName: string
        expectedName: string
    }[] = [
        {
            rateData: {
                rateType: 'AMENDMENT',
                rateDateStart: new Date('2021/05/21'),
                rateDateEnd: new Date('2022/03/21'),
                rateDateCertified: new Date('2021/04/23'),
                rateAmendmentInfo: {
                    effectiveDateStart: new Date('2022/05/21'),
                    effectiveDateEnd: new Date('2022/09/21'),
                },
            },
            submissionName: 'MN-TEST-AMENDMENT',
            expectedName:
                'MN-TEST-AMENDMENT-RATE-20220521-20220921-AMENDMENT-20210423',
        },
        {
            rateData: {
                rateType: 'AMENDMENT',
                rateDateStart: new Date('2021/05/21'),
                rateDateEnd: new Date('2022/03/21'),
                rateDateCertified: new Date('2021/04/23'),
                rateAmendmentInfo: {},
            },
            submissionName: 'MN-NO-AMENDMENT-DATE',
            expectedName:
                'MN-NO-AMENDMENT-DATE-RATE-20210521-20220321-AMENDMENT-20210423',
        },
        {
            rateData: {
                rateType: 'AMENDMENT',
                rateAmendmentInfo: {},
            },
            submissionName: 'MN-AMENDMENT-NO-DATES',
            expectedName: 'MN-AMENDMENT-NO-DATES-RATE-AMENDMENT',
        },
        {
            rateData: {
                rateType: 'NEW',
                rateDateStart: new Date('2021/04/22'),
                rateDateEnd: new Date('2022/03/29'),
                rateDateCertified: new Date('2021/05/23'),
            },
            submissionName: 'OH-TEST-NAME',
            expectedName:
                'OH-TEST-NAME-RATE-20210422-20220329-CERTIFICATION-20210523',
        },
        {
            rateData: {
                rateType: 'NEW',
                rateDateStart: new Date('2021/04/22'),
                rateDateEnd: new Date('2022/03/29'),
                rateDateCertified: new Date('2021/05/23'),
                rateAmendmentInfo: {
                    effectiveDateStart: new Date('2022/05/21'),
                    effectiveDateEnd: new Date('2022/09/21'),
                },
            },
            submissionName: 'OH-NEW-WITH-AMENDMENT-DATE',
            expectedName:
                'OH-NEW-WITH-AMENDMENT-DATE-RATE-20210422-20220329-CERTIFICATION-20210523',
        },
        {
            rateData: {
                rateType: 'NEW',
            },
            submissionName: 'OH-NEW-NO-DATES',
            expectedName: 'OH-NEW-NO-DATES-RATE-CERTIFICATION',
        },
        {
            rateData: {
                rateDateStart: new Date('2021/04/22'),
                rateDateEnd: new Date('2022/03/29'),
                rateDateCertified: new Date('2021/05/23'),
                rateAmendmentInfo: {
                    effectiveDateStart: new Date('2022/05/21'),
                    effectiveDateEnd: new Date('2022/09/21'),
                },
            },
            submissionName: 'OH-NO-TYPE',
            expectedName: 'OH-NO-TYPE-RATE-20210422-20220329-20210523',
        },
    ]
    test.each(rateNameTestArray)(
        'submission rate name is correct',
        ({ rateData, submissionName, expectedName }) => {
            expect(generateRateName(rateData, submissionName)).toMatch(
                expectedName
            )
        }
    )
})
