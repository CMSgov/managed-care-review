import {
    testEmailConfig,
    testStateAnalystsEmails,
    mockUnlockedContractAndRatesFormData,
    mockUnlockedContractOnlyFormData,
} from '../../testHelpers/emailerHelpers'
import { unlockPackageCMSEmail } from './index'
import { findAllPackageProgramIds } from '../templateHelpers'
import { packageName } from 'app-web/src/common-code/healthPlanFormDataType'
import { findPrograms } from '../../postgres'

const unlockData = {
    updatedBy: 'leslie@example.com',
    updatedAt: new Date('01/01/2022'),
    updatedReason: 'Adding rate development guide.',
}
const submission = {
    ...mockUnlockedContractAndRatesFormData(),
    contractDateStart: new Date('2021-01-01'),
    contractDateEnd: new Date('2021-12-31'),
    rateDateStart: new Date('2021-02-02'),
    rateDateEnd: new Date('2021-11-31'),
    rateDateCertified: new Date('2020-12-01'),
}
const testStateAnalystEmails = testStateAnalystsEmails
const programs = findPrograms(
    submission.stateCode,
    findAllPackageProgramIds(submission)
)

if (programs instanceof Error) {
    throw new Error(programs.message)
}

test('subject line is correct and clearly states submission is unlocked', async () => {
    const name = packageName(submission, programs)
    const template = await unlockPackageCMSEmail(
        submission,
        unlockData,
        testEmailConfig,
        testStateAnalystEmails
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    expect(template).toEqual(
        expect.objectContaining({
            subject: expect.stringContaining(`${name} was unlocked`),
        })
    )
})
test('email body contains correct information', async () => {
    const template = await unlockPackageCMSEmail(
        submission,
        unlockData,
        testEmailConfig,
        testStateAnalystEmails
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringMatching(/Unlocked by: leslie/),
        })
    )

    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringMatching(/Unlocked on: 01/),
        })
    )

    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringMatching(
                /Reason for unlock: Adding rate development guide/
            ),
        })
    )
    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringMatching(/Rate name:/),
        })
    )
})
test('includes state specific analysts emails on contract and rate submission unlock', async () => {
    const template = await unlockPackageCMSEmail(
        submission,
        unlockData,
        testEmailConfig,
        testStateAnalystEmails
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    testStateAnalystEmails.forEach((emailAddress) => {
        expect(template).toEqual(
            expect.objectContaining({
                toAddresses: expect.arrayContaining([emailAddress]),
            })
        )
    })
})
test('includes ratesReviewSharedEmails on contract and rate submission unlock', async () => {
    const template = await unlockPackageCMSEmail(
        submission,
        unlockData,
        testEmailConfig,
        testStateAnalystEmails
    )

    const reviewerEmails = [
        ...testEmailConfig.cmsReviewSharedEmails,
        ...testEmailConfig.ratesReviewSharedEmails,
    ]

    if (template instanceof Error) {
        console.error(template)
        return
    }

    reviewerEmails.forEach((emailAddress) => {
        expect(template).toEqual(
            expect.objectContaining({
                toAddresses: expect.arrayContaining([emailAddress]),
            })
        )
    })
})
test('does include state specific analysts emails on contract only submission unlock', async () => {
    const sub = mockUnlockedContractOnlyFormData()
    const template = await unlockPackageCMSEmail(
        sub,
        unlockData,
        testEmailConfig,
        testStateAnalystEmails
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    testStateAnalystEmails.forEach((emailAddress) => {
        expect(template).toEqual(
            expect.objectContaining({
                toAddresses: expect.arrayContaining([emailAddress]),
            })
        )
    })
})
test('does not include ratesReviewSharedEmails on contract only submission unlock', async () => {
    const sub = mockUnlockedContractOnlyFormData()
    const template = await unlockPackageCMSEmail(
        sub,
        unlockData,
        testEmailConfig,
        []
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    const ratesReviewerEmails = [...testEmailConfig.ratesReviewSharedEmails]
    ratesReviewerEmails.forEach((emailAddress) => {
        expect(template).toEqual(
            expect.objectContaining({
                toAddresses: expect.not.arrayContaining([emailAddress]),
            })
        )
    })
})
test('does not include state specific analysts emails on contract only submission unlock', async () => {
    const sub = mockUnlockedContractOnlyFormData()
    const template = await unlockPackageCMSEmail(
        sub,
        unlockData,
        testEmailConfig,
        []
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    testStateAnalystEmails.forEach((emailAddress) => {
        expect(template).toEqual(
            expect.objectContaining({
                toAddresses: expect.not.arrayContaining([emailAddress]),
            })
        )
    })
})
test('CHIP contract only unlock email does include state specific analysts emails', async () => {
    const sub = mockUnlockedContractOnlyFormData()
    //Set CHIP program for rate certification programs
    sub.stateCode = 'MS'
    sub.programIDs = ['e0819153-5894-4153-937e-aad00ab01a8f']
    sub.rateProgramIDs = ['36c54daf-7611-4a15-8c3b-cdeb3fd7e25a']
    const template = await unlockPackageCMSEmail(
        sub,
        unlockData,
        testEmailConfig,
        testStateAnalystEmails
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    testStateAnalystEmails.forEach((emailAddress) => {
        expect(template).toEqual(
            expect.objectContaining({
                toAddresses: expect.arrayContaining([emailAddress]),
            })
        )
    })
})
test('CHIP contract only unlock email does not include ratesReviewSharedEmails, cmsRateHelpEmailAddress or state specific analysts emails', async () => {
    const sub = mockUnlockedContractOnlyFormData()
    //Set CHIP program for rate certification programs
    sub.stateCode = 'MS'
    sub.programIDs = ['e0819153-5894-4153-937e-aad00ab01a8f']
    sub.rateProgramIDs = ['36c54daf-7611-4a15-8c3b-cdeb3fd7e25a']
    const template = await unlockPackageCMSEmail(
        sub,
        unlockData,
        testEmailConfig,
        []
    )
    const excludedEmails = [...testEmailConfig.ratesReviewSharedEmails]

    if (template instanceof Error) {
        console.error(template)
        return
    }

    excludedEmails.forEach((emailAddress) => {
        expect(template).toEqual(
            expect.objectContaining({
                toAddresses: expect.not.arrayContaining([emailAddress]),
            })
        )
    })
    testStateAnalystEmails.forEach((emailAddress) => {
        expect(template).toEqual(
            expect.objectContaining({
                toAddresses: expect.not.arrayContaining([emailAddress]),
            })
        )
    })
})
test('CHIP contract and rate unlock email does include state specific analysts emails', async () => {
    const sub = mockUnlockedContractAndRatesFormData()
    //Set CHIP program for rate certification programs
    sub.stateCode = 'MS'
    sub.programIDs = ['e0819153-5894-4153-937e-aad00ab01a8f']
    sub.rateProgramIDs = ['36c54daf-7611-4a15-8c3b-cdeb3fd7e25a']
    const template = await unlockPackageCMSEmail(
        sub,
        unlockData,
        testEmailConfig,
        testStateAnalystEmails
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    testStateAnalystEmails.forEach((emailAddress) => {
        expect(template).toEqual(
            expect.objectContaining({
                toAddresses: expect.arrayContaining([emailAddress]),
            })
        )
    })
})
test('CHIP contract and rate unlock email does not include ratesReviewSharedEmails, cmsRateHelpEmailAddress or state specific analysts emails', async () => {
    const sub = mockUnlockedContractAndRatesFormData()
    //Set CHIP program for rate certification programs
    sub.stateCode = 'MS'
    sub.programIDs = ['e0819153-5894-4153-937e-aad00ab01a8f']
    sub.rateProgramIDs = ['36c54daf-7611-4a15-8c3b-cdeb3fd7e25a']
    const template = await unlockPackageCMSEmail(
        sub,
        unlockData,
        testEmailConfig,
        []
    )
    const excludedEmails = [...testEmailConfig.ratesReviewSharedEmails]

    if (template instanceof Error) {
        console.error(template)
        return
    }

    excludedEmails.forEach((emailAddress) => {
        expect(template).toEqual(
            expect.objectContaining({
                toAddresses: expect.not.arrayContaining([emailAddress]),
            })
        )
    })
    testStateAnalystEmails.forEach((emailAddress) => {
        expect(template).toEqual(
            expect.objectContaining({
                toAddresses: expect.not.arrayContaining([emailAddress]),
            })
        )
    })
})
test('does not include rate name on contract only submission unlock', async () => {
    const sub = mockUnlockedContractOnlyFormData()
    const template = await unlockPackageCMSEmail(
        sub,
        unlockData,
        testEmailConfig,
        []
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    expect(template).toEqual(
        expect.not.objectContaining({
            bodyText: expect.stringMatching(/Rate name:/),
        })
    )
})

test('renders overall email as expected', async () => {
    const sub = mockUnlockedContractOnlyFormData()
    const template = await unlockPackageCMSEmail(
        sub,
        unlockData,
        testEmailConfig,
        []
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    expect(template.bodyHTML).toMatchSnapshot()
})
