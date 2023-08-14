import { sharedTestPrismaClient } from '../../testHelpers/storeHelpers'
import { must, getStateRecord } from '../../testHelpers'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { createInsertRateData } from '../../testHelpers/contractAndRates/rateHelpers'
import { insertDraftRate } from './insertRate'
import { StateCodeType } from 'app-web/src/common-code/healthPlanFormDataType'

describe('insertRate', () => {
    it('creates a new draft rate', async () => {
        const client = await sharedTestPrismaClient()

        // create a draft rate
        const draftRateData = createInsertRateData({ rateType: 'NEW' })
        const draftRate = must(await insertDraftRate(client, draftRateData))

        // Expect a single rate revision
        expect(draftRate.revisions).toHaveLength(1)

        // Expect draft rate to contain expected data.
        expect(draftRate).toEqual(
            expect.objectContaining({
                id: expect.any(String),
                stateCode: 'MN',
                status: 'DRAFT',
                stateNumber: expect.any(Number),
                revisions: expect.arrayContaining([
                    expect.objectContaining({
                        formData: expect.objectContaining({
                            rateDocuments: [],
                            rateProgramIDs: [],
                            rateType: 'NEW',
                            supportingDocuments: [],
                        }),
                    }),
                ]),
            })
        )
    })
    it('increments state number count', async () => {
        const client = await sharedTestPrismaClient()
        const stateCode = 'OH'
        const initialState = await getStateRecord(client, stateCode)
        const rateA = createInsertRateData({
            stateCode,
        })
        const rateB = createInsertRateData({
            stateCode,
        })

        const submittedContractA = must(await insertDraftRate(client, rateA))

        // Expect state record count to be incremented by 1
        expect(submittedContractA.stateNumber).toEqual(
            initialState.latestStateSubmissionNumber + 1
        )

        const submittedContractB = must(await insertDraftRate(client, rateB))

        // Expect state record count to be incremented by 2
        expect(submittedContractB.stateNumber).toEqual(
            initialState.latestStateSubmissionNumber + 2
        )
    })
    it('returns an error when invalid state code is provided', async () => {
        const client = await sharedTestPrismaClient()

        const draftRateData = createInsertRateData({
            stateCode: 'CANADA' as StateCodeType,
        })
        const draftRate = await insertDraftRate(client, draftRateData)

        // Expect a prisma error
        expect(draftRate).toBeInstanceOf(PrismaClientKnownRequestError)
    })
})
