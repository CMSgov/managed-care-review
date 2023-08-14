import { sharedTestPrismaClient } from '../../testHelpers/storeHelpers'
import { insertDraftRate } from './insertRate'
import { updateDraftRate } from './updateDraftRate'
import { must } from '../../testHelpers'
import { findDraftRate } from './findDraftRate'

describe('findDraftRate', () => {
    it('handles drafts correctly', async () => {
        const client = await sharedTestPrismaClient()

        // Add 2 rates 1, 2
        const draftRateForm = { rateCertificationName: 'draftData' }
        const rate1 = must(
            await insertDraftRate(client, {
                stateCode: 'MN',
                ...draftRateForm,
            })
        )
        must(
            await updateDraftRate(client, {
                rateID: rate1.id,
                formData: draftRateForm,
                contractIDs: [],
            })
        )

        const draft = await findDraftRate(client, rate1.id)

        if (draft instanceof Error) {
            throw draft
        }

        expect(draft?.formData.rateCertificationName).toBe('draftData')
    })
})
