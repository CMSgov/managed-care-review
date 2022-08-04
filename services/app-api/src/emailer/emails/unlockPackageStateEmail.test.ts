import {
    testEmailConfig,
    mockUnlockedContractAndRatesFormData,
    findProgramsHelper as findPrograms,
} from '../../testHelpers/emailerHelpers'
import { unlockPackageStateEmail } from './index'
import { findAllPackageProgramIds } from '../templateHelpers'
import { packageName } from 'app-web/src/common-code/healthPlanFormDataType'

const unlockData = {
    updatedBy: 'josh@example.com',
    updatedAt: new Date('02/01/2022'),
    updatedReason: 'Adding rate certification.',
}
const sub = {
    ...mockUnlockedContractAndRatesFormData(),
    contractDateStart: new Date('2021-01-01'),
    contractDateEnd: new Date('2021-12-31'),
    rateDateStart: new Date('2021-02-02'),
    rateDateEnd: new Date('2021-11-31'),
    rateDateCertified: new Date('2020-12-01'),
    rateAmendmentInfo: {
        effectiveDateStart: new Date('06/05/2021'),
        effectiveDateEnd: new Date('12/31/2021'),
    },
}

const programs = findPrograms(sub.stateCode, findAllPackageProgramIds(sub))

if (programs instanceof Error) {
    throw new Error(programs.message)
}

test('subject line is correct and clearly states submission is unlocked', async () => {
    const name = packageName(sub, programs)
    const template = await unlockPackageStateEmail(
        sub,
        unlockData,
        testEmailConfig,
        programs
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
        programs
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
        programs
    )

    if (template instanceof Error) {
        console.error(template)
        return
    }

    expect(template.bodyHTML).toMatchSnapshot()
})
