import {
    testEmailConfig,
    mockContractAmendmentFormData,
    mockContractOnlyFormData,
    mockContractAndRatesFormData,
    mockUser,
    mockMNState,
} from '../../testHelpers/emailerHelpers'
import {
    LockedHealthPlanFormDataType,
    generateRateName,
    packageName,
} from '../../../../app-web/src/common-code/healthPlanFormDataType'
import { newPackageStateEmail } from './index'

test('to addresses list includes current user', async () => {
    const sub = mockContractOnlyFormData()
    const user = mockUser()
    const defaultStatePrograms = mockMNState().programs
    const template = await newPackageStateEmail(
        sub,
        user,
        testEmailConfig,
        defaultStatePrograms
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    expect(template).toEqual(
        expect.objectContaining({
            toAddresses: expect.arrayContaining([user.email]),
        })
    )
})

test('to addresses list includes all state contacts on submission', async () => {
    const sub: LockedHealthPlanFormDataType = {
        ...mockContractOnlyFormData(),
        stateContacts: [
            {
                name: 'test1',
                titleRole: 'Foo1',
                email: 'test1@example.com',
            },
            {
                name: 'test2',
                titleRole: 'Foo2',
                email: 'test2@example.com',
            },
        ],
    }
    const user = mockUser()
    const defaultStatePrograms = mockMNState().programs
    const template = await newPackageStateEmail(
        sub,
        user,
        testEmailConfig,
        defaultStatePrograms
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    sub.stateContacts.forEach((contact) => {
        expect(template).toEqual(
            expect.objectContaining({
                toAddresses: expect.arrayContaining([contact.email]),
            })
        )
    })
})

test('to addresses list does not include duplicate state contacts on submission', async () => {
    const sub: LockedHealthPlanFormDataType = {
        ...mockContractOnlyFormData(),
        stateContacts: [
            {
                name: 'test1',
                titleRole: 'Foo1',
                email: 'test1@example.com',
            },
            {
                name: 'test1',
                titleRole: 'Foo1',
                email: 'test1@example.com',
            },
        ],
    }
    const user = mockUser()
    const defaultStatePrograms = mockMNState().programs
    const template = await newPackageStateEmail(
        sub,
        user,
        testEmailConfig,
        defaultStatePrograms
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    expect(template.toAddresses).toEqual([
        'test+state+user@example.com',
        'test1@example.com',
    ])
})

test('subject line is correct and clearly states submission is complete', async () => {
    const sub = mockContractOnlyFormData()
    const user = mockUser()
    const defaultStatePrograms = mockMNState().programs
    const name = packageName(sub, defaultStatePrograms)

    const template = await newPackageStateEmail(
        sub,
        user,
        testEmailConfig,
        defaultStatePrograms
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    expect(template).toEqual(
        expect.objectContaining({
            subject: expect.stringContaining(`${name} was sent to CMS`),
            bodyText: expect.stringContaining(
                `${name} was successfully submitted.`
            ),
        })
    )
})

test('includes mcog, rate, and team email addresses', async () => {
    const sub = mockContractOnlyFormData()
    const user = mockUser()
    const defaultStatePrograms = mockMNState().programs
    const name = packageName(sub, defaultStatePrograms)

    const template = await newPackageStateEmail(
        sub,
        user,
        testEmailConfig,
        defaultStatePrograms
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    expect(template).toEqual(
        expect.objectContaining({
            subject: expect.stringContaining(`${name} was sent to CMS`),
            bodyText: expect.stringContaining(
                `please reach out to mcog@example.com`
            ),
        })
    )
    expect(template).toEqual(
        expect.objectContaining({
            subject: expect.stringContaining(`${name} was sent to CMS`),
            bodyText: expect.stringContaining(
                `please reach out to rates@example.com`
            ),
        })
    )
    expect(template).toEqual(
        expect.objectContaining({
            subject: expect.stringContaining(`${name} was sent to CMS`),
            bodyText: expect.stringContaining(
                `please reach out to mc-review@example.com`
            ),
        })
    )
})

test('includes link to submission', async () => {
    const sub = mockContractAmendmentFormData()
    const user = mockUser()
    const defaultStatePrograms = mockMNState().programs
    const template = await newPackageStateEmail(
        sub,
        user,
        testEmailConfig,
        defaultStatePrograms
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining(
                `http://localhost/submissions/${sub.id}`
            ),
        })
    )
    expect(template).toEqual(
        expect.objectContaining({
            bodyHTML: expect.stringContaining(
                `href="http://localhost/submissions/${sub.id}"`
            ),
        })
    )
})

test('includes information about what is next', async () => {
    const sub = mockContractAmendmentFormData()
    const user = mockUser()
    const defaultStatePrograms = mockMNState().programs
    const template = await newPackageStateEmail(
        sub,
        user,
        testEmailConfig,
        defaultStatePrograms
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining('What comes next:'),
        })
    )
})

test('includes expected data summary for a contract and rates submission State email', async () => {
    const sub: LockedHealthPlanFormDataType = {
        ...mockContractAndRatesFormData(),
        contractDateStart: new Date('01/01/2021'),
        contractDateEnd: new Date('01/01/2025'),
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
                rateProgramName:
                    'MCR-MN-0003-MSHO-RATE-20210101-20220101-CERTIFICATION-20210102',
                rateAmendmentInfo: undefined,
                rateDateStart: new Date('01/01/2021'),
                rateDateEnd: new Date('01/01/2022'),
            },
        ],
    }
    const user = mockUser()
    const defaultStatePrograms = mockMNState().programs

    const template = await newPackageStateEmail(
        sub,
        user,
        testEmailConfig,
        defaultStatePrograms
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining(
                'Submission type: Contract action and rate certification'
            ),
        })
    )
    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining(
                'Rating period: 01/01/2021 to 01/01/2022'
            ),
        })
    )

    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining(
                'Contract effective dates: 01/01/2021 to 01/01/2025'
            ),
        })
    )
    //Expect only have 1 rate names using regex to match name pattern specific to rate names.
    expect(
        template.bodyText?.match(
            /-RATE-[\d]{8}-[\d]{8}-(?:CERTIFICATION|AMENDMENT)-[\d]{8}/g
        )?.length
    ).toBe(1)
    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining(
                generateRateName(sub, sub.rateInfos[0], defaultStatePrograms)
            ),
        })
    )
})

test('includes expected data summary for a multi-rate contract and rates submission State email', async () => {
    const sub: LockedHealthPlanFormDataType = {
        ...mockContractAndRatesFormData(),
        contractDateStart: new Date('01/01/2021'),
        contractDateEnd: new Date('01/01/2025'),
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
                rateProgramName:
                    'MCR-MN-0003-MSHO-RATE-20210101-20220101-CERTIFICATION-20210102',
                rateAmendmentInfo: undefined,
                rateDateStart: new Date('01/01/2021'),
                rateDateEnd: new Date('01/01/2022'),
            },
            {
                rateType: 'NEW',
                rateDocuments: [
                    {
                        s3URL: 'bar',
                        name: 'foo',
                        documentCategories: ['RATES' as const],
                    },
                ],
                rateDateCertified: new Date('02/02/2022'),
                rateProgramIDs: ['abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce'],
                rateProgramName:
                    'MCR-MN-0003-SNBC-RATE-20220201-20230201-CERTIFICATION-20220202',
                rateAmendmentInfo: undefined,
                rateDateStart: new Date('02/01/2022'),
                rateDateEnd: new Date('02/01/2023'),
            },
            {
                rateType: 'AMENDMENT',
                rateDocuments: [
                    {
                        s3URL: 'bar',
                        name: 'foo',
                        documentCategories: ['RATES' as const],
                    },
                ],
                rateDateCertified: new Date('01/02/2021'),
                rateProgramIDs: [
                    'ea16a6c0-5fc6-4df8-adac-c627e76660ab',
                    'd95394e5-44d1-45df-8151-1cc1ee66f100',
                ],
                rateProgramName:
                    'MCR-MN-0003-MSC+-PMAP-RATE-20210605-20211231-AMENDMENT-20210102',
                rateDateStart: new Date('01/01/2022'),
                rateDateEnd: new Date('01/01/2023'),
                rateAmendmentInfo: {
                    effectiveDateStart: new Date('06/05/2021'),
                    effectiveDateEnd: new Date('12/31/2021'),
                },
            },
        ],
    }
    const user = mockUser()
    const defaultStatePrograms = mockMNState().programs

    const template = await newPackageStateEmail(
        sub,
        user,
        testEmailConfig,
        defaultStatePrograms
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining(
                'Submission type: Contract action and rate certification'
            ),
        })
    )
    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining(
                'Rating period: 01/01/2021 to 01/01/2022'
            ),
        })
    )

    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining(
                'Contract effective dates: 01/01/2021 to 01/01/2025'
            ),
        })
    )
    //Expect only have 3 rate names using regex to match name pattern specific to rate names.
    expect(
        template.bodyText?.match(
            /-RATE-[\d]{8}-[\d]{8}-(?:CERTIFICATION|AMENDMENT)-[\d]{8}/g
        )?.length
    ).toBe(3)
    //First Rate certification
    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining(
                generateRateName(sub, sub.rateInfos[0], defaultStatePrograms)
            ),
        })
    )
    //Second Rate certification
    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining(
                generateRateName(sub, sub.rateInfos[1], defaultStatePrograms)
            ),
        })
    )
    //Third Rate certification
    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining(
                generateRateName(sub, sub.rateInfos[2], defaultStatePrograms)
            ),
        })
    )
})

test('includes expected data summary for a rate amendment submission State email', async () => {
    const sub: LockedHealthPlanFormDataType = {
        ...mockContractAndRatesFormData(),
        contractDateStart: new Date('01/01/2021'),
        contractDateEnd: new Date('01/01/2025'),
        rateInfos: [
            {
                rateType: 'AMENDMENT',

                rateDocuments: [
                    {
                        s3URL: 'bar',
                        name: 'foo',
                        documentCategories: ['RATES' as const],
                    },
                ],
                rateDateCertified: new Date('10/19/2022'),
                rateProgramIDs: ['abbdf9b0-c49e-4c4c-bb6f-040cb7b51cce'],
                rateProgramName:
                    'MCR-MN-0003-SNBC-RATE-20210605-20211231-AMENDMENT-20221019',
                rateDateStart: new Date('01/01/2021'),
                rateDateEnd: new Date('01/01/2022'),
                rateAmendmentInfo: {
                    effectiveDateStart: new Date('06/05/2021'),
                    effectiveDateEnd: new Date('12/31/2021'),
                },
            },
        ],
    }
    const user = mockUser()
    const statePrograms = mockMNState().programs

    const template = await newPackageStateEmail(
        sub,
        user,
        testEmailConfig,
        statePrograms
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining(
                'Submission type: Contract action and rate certification'
            ),
        })
    )
    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining(
                'Rate amendment effective dates: 06/05/2021 to 12/31/2021'
            ),
        })
    )
    //Expect only have 1 rate names using regex to match name pattern specific to rate names.
    expect(
        template.bodyText?.match(
            /-RATE-[\d]{8}-[\d]{8}-(?:CERTIFICATION|AMENDMENT)-[\d]{8}/g
        )?.length
    ).toBe(1)
    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining(
                generateRateName(sub, sub.rateInfos[0], statePrograms)
            ),
        })
    )
})

test('renders overall email for a new package with a rate amendment as expected', async () => {
    const sub: LockedHealthPlanFormDataType = {
        ...mockContractAndRatesFormData(),
        contractDateStart: new Date('01/01/2021'),
        contractDateEnd: new Date('01/01/2022'),
        rateInfos: [
            {
                rateType: 'AMENDMENT',
                rateDocuments: [
                    {
                        s3URL: 'bar',
                        name: 'foo',
                        documentCategories: ['RATES' as const],
                    },
                ],
                rateDateCertified: new Date('01/02/2021'),
                rateProgramIDs: ['3fd36500-bf2c-47bc-80e8-e7aa417184c5'],
                rateProgramName:
                    'MCR-MN-0003-MSHO-RATE-20210605-20211231-AMENDMENT-20210102',
                rateAmendmentInfo: {
                    effectiveDateStart: new Date('06/05/2021'),
                    effectiveDateEnd: new Date('12/31/2021'),
                },
                rateDateStart: new Date('01/01/2021'),
                rateDateEnd: new Date('01/01/2022'),
            },
        ],
    }
    const user = mockUser()
    const defaultStatePrograms = mockMNState().programs
    const result = await newPackageStateEmail(
        sub,
        user,
        testEmailConfig,
        defaultStatePrograms
    )
    if (result instanceof Error) {
        console.error(result)
        return
    }

    expect(result.bodyHTML).toMatchSnapshot()
})
