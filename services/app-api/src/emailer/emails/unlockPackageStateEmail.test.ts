import { testEmailConfig, mockMNState } from '../../testHelpers/emailerHelpers'
import { unlockPackageStateEmail } from './index'
import { findPackagePrograms } from '../templateHelpers'
import { packageName } from 'app-web/src/common-code/healthPlanFormDataType'
import { unlockedWithFullContracts } from '../../../../app-web/src/common-code/healthPlanFormDataMocks'
import { UnlockedHealthPlanFormDataType } from '../../../../app-web/src/common-code/healthPlanFormDataType'

const unlockData = {
    updatedBy: 'josh@example.com',
    updatedAt: new Date('02/01/2022'),
    updatedReason: 'Adding rate certification.',
}
const sub: UnlockedHealthPlanFormDataType = {
    ...unlockedWithFullContracts(),
    contractDateStart: '2021-01-01',
    contractDateEnd: '2021-12-31',
    rateDateStart: '2021-02-02',
    rateDateEnd: '2021-11-31',
    rateDateCertified: '2020-12-01',
    rateAmendmentInfo: {
        effectiveDateStart: '2021-06-05',
        effectiveDateEnd: '2021-12-31',
    },
}
const defaultStatePrograms = mockMNState().programs
const packagePrograms = findPackagePrograms(sub, defaultStatePrograms)

if (packagePrograms instanceof Error) {
    throw new Error(packagePrograms.message)
}

test('subject line is correct and clearly states submission is unlocked', async () => {
    const name = packageName(sub, packagePrograms)
    const template = await unlockPackageStateEmail(
        sub,
        unlockData,
        testEmailConfig,
        defaultStatePrograms
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    expect(template).toEqual(
        expect.objectContaining({
            subject: expect.stringContaining(`${name} was unlocked by CMS`),
        })
    )
})

test('body content is correct', async () => {
    const template = await unlockPackageStateEmail(
        sub,
        unlockData,
        testEmailConfig,
        defaultStatePrograms
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringMatching(/Unlocked by: josh/),
        })
    )
    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringMatching(/Unlocked on: 02/),
        })
    )
    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringMatching(
                /Reason for unlock: Adding rate certification./
            ),
        })
    )
    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringMatching(/Rate name:/),
        })
    )
    expect(template).toEqual(
        expect.objectContaining({
            bodyText: expect.stringMatching(
                /You must revise the submission before CMS can continue reviewing it/
            ),
        })
    )
})

test('renders overall email as expected', async () => {
    const template = await unlockPackageStateEmail(
        sub,
        unlockData,
        testEmailConfig,
        defaultStatePrograms
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    expect(template.bodyHTML).toMatchSnapshot()
})
