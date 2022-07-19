import {
    testEmailConfig,
    mockContractAmendmentFormData,
    mockContractOnlyFormData,
    mockContractAndRatesFormData,
    mockUser,
} from '../../testHelpers/emailerHelpers'
import {
    LockedHealthPlanFormDataType,
    CalendarDate,
} from '../../../../app-web/src/common-code/healthPlanFormDataType'
import { newPackageStateEmail } from './index'
import { formatRateNameDate } from '../../../../app-web/src/common-code/dateHelpers'

test('to addresses list includes current user', async () => {
    const sub = mockContractOnlyFormData()
    const user = mockUser()
    const template = await newPackageStateEmail(
        sub,
        'some-title',
        user,
        testEmailConfig
    )
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
    const template = await newPackageStateEmail(
        sub,
        'some-title',
        user,
        testEmailConfig
    )
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
    const template = await newPackageStateEmail(
        sub,
        'some-title',
        user,
        testEmailConfig
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
    const name = 'FL-MMA-001'
    const user = mockUser()
    const template = await newPackageStateEmail(
        sub,
        name,
        user,
        testEmailConfig
    )

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
    const name = 'FL-MMA-001'
    const user = mockUser()
    const template = await newPackageStateEmail(
        sub,
        name,
        user,
        testEmailConfig
    )

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
    const template = await newPackageStateEmail(
        sub,
        'some-title',
        user,
        testEmailConfig
    )
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
    const template = await newPackageStateEmail(
        sub,
        'some-title',
        user,
        testEmailConfig
    )
    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining('What comes next:'),
        })
    )
})

test('includes expected data summary for a contract and rates submission State email', async () => {
    const sub: LockedHealthPlanFormDataType = {
        ...mockContractAndRatesFormData(),
        contractDateStart: '2021-01-01' as CalendarDate,
        contractDateEnd: '2025-01-01' as CalendarDate,
        rateDateStart: '2021-01-01' as CalendarDate,
        rateDateEnd: '2022-01-01' as CalendarDate,
    }
    const user = mockUser()
    const template = await newPackageStateEmail(
        sub,
        'some-title',
        user,
        testEmailConfig
    )
    const rateName = `some-title-RATE-20210101-20220101-CERTIFICATION-${formatRateNameDate(
        '2021-12-31'
    )}`

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
    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining(rateName),
        })
    )
})

test('includes expected data summary for a rate amendment submission State email', async () => {
    const sub: LockedHealthPlanFormDataType = {
        ...mockContractAndRatesFormData(),
        rateType: 'AMENDMENT',
        contractDateStart: '2021-01-01' as CalendarDate,
        contractDateEnd: '2025-01-01' as CalendarDate,
        rateDateStart: '2021-01-01' as CalendarDate,
        rateDateEnd: '2022-01-01' as CalendarDate,
        rateAmendmentInfo: {
            effectiveDateStart: '2021-06-05' as CalendarDate,
            effectiveDateEnd: '2021-12-31' as CalendarDate,
        },
    }
    const user = mockUser()
    const template = await newPackageStateEmail(
        sub,
        'some-title',
        user,
        testEmailConfig
    )
    const rateName = `some-title-RATE-20210605-20211231-AMENDMENT-${formatRateNameDate(
        '2021-12-31'
    )}`

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
    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringContaining(rateName),
        })
    )
})

test('renders overall email as expected', async () => {
    const sub: LockedHealthPlanFormDataType = {
        ...mockContractAndRatesFormData(),
        rateType: 'AMENDMENT',
        contractDateStart: '2021-01-01' as CalendarDate,
        contractDateEnd: '2021-12-31' as CalendarDate,
        rateDateStart: '2021-02-02' as CalendarDate,
        rateDateEnd: '2021-11-31' as CalendarDate,
        rateDateCertified: '2020-12-01' as CalendarDate,
        rateAmendmentInfo: {
            effectiveDateStart: '2021-06-05' as CalendarDate,
            effectiveDateEnd: '2021-12-31' as CalendarDate,
        },
    }
    const user = mockUser()
    const result = await newPackageStateEmail(
        sub,
        'MN-new-submission-snapshot',
        user,
        testEmailConfig
    )
    if (result instanceof Error) {
        console.error(result)
        return
    }

    expect(result.bodyHTML).toMatchSnapshot()
})
