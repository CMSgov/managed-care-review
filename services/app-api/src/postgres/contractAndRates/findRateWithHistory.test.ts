import { sharedTestPrismaClient } from '../../testHelpers/storeHelpers'
import { v4 as uuidv4 } from 'uuid'
import { submitContract } from './submitContract'
import { submitRate } from './submitRate'
import { insertDraftContract } from './insertContract'
import { unlockContract } from './unlockContract'
import { updateDraftContract } from './updateDraftContract'
import { insertDraftRate } from './insertRate'
import { updateDraftRate } from './updateDraftRate'
import { unlockRate } from './unlockRate'
import { findRateWithHistory } from './findRateWithHistory'
import { must, createInsertContractData } from '../../testHelpers'
import { createInsertRateData } from '../../testHelpers/contractAndRates/rateHelpers'
import { findContractWithHistory } from './findContractWithHistory'

describe('findRate', () => {
    it('finds a stripped down rate with history', async () => {
        const client = await sharedTestPrismaClient()

        const stateUser = await client.user.create({
            data: {
                id: uuidv4(),
                givenName: 'Aang',
                familyName: 'Avatar',
                email: 'aang@example.com',
                role: 'STATE_USER',
                stateCode: 'NM',
            },
        })

        const cmsUser = await client.user.create({
            data: {
                id: uuidv4(),
                givenName: 'Zuko',
                familyName: 'Hotman',
                email: 'zuko@example.com',
                role: 'CMS_USER',
            },
        })

        // setup a single test rate
        const draftRateData = createInsertRateData({
            rateCertificationName: 'one contract',
        })
        const rateA = must(
            await insertDraftRate(client, draftRateData)
        )
        must(
            await submitRate(
                client,
                rateA.id,
                stateUser.id,
                'initial submit'
            )
        )

        // Add 3 contracts 1, 2, 3 pointing to rate A
        const contract1 = must(
            await insertDraftContract(client, {
                stateCode: 'MN',
                submissionDescription: 'someurle.en',
                programIDs: ['13221'],
                submissionType: 'CONTRACT_ONLY',
                contractType: 'BASE'
            })
        )
        must(
            await updateDraftContract(client, {
                contractID: contract1.id,
                formData: { submissionDescription: 'someurle.en' },
                rateIDs: [rateA.id],
            })
        )
        must(await submitContract(client, contract1.id, stateUser.id, 'Contract Submit'))

        const contract2 = must(
            await insertDraftContract(client, {
                stateCode: 'MN',
                submissionDescription: 'twopointo',
                programIDs: ['13221'],
                submissionType: 'CONTRACT_ONLY',
                contractType: 'BASE'
            })
        )
        must(
            await updateDraftContract(client, {
                contractID: contract2.id,
                formData: { submissionDescription: 'twopointo' },
                rateIDs: [rateA.id],
            })
        )
        must(await submitContract(client, contract2.id, stateUser.id, 'ContracteSubmit 2'))

        const contract3 = must(
            await insertDraftContract(client, {
                stateCode: 'MN',
                submissionDescription: 'threepointo',
                programIDs: ['13221'],
                submissionType: 'CONTRACT_ONLY',
                contractType: 'BASE'
            })
        )
        must(
            await updateDraftContract(client, {
                contractID: contract3.id,
                formData: { submissionDescription: 'threepointo' },
                rateIDs: [rateA.id],
            })
        )
        must(await submitContract(client, contract3.id, stateUser.id, '3.0 create'))

        // Now, find that rate and assert the history is what we expected
        const threeRate = must(
            await findRateWithHistory(client, rateA.id)
        )
        if (threeRate instanceof Error) {
            throw threeRate
        }
        expect(threeRate.revisions).toHaveLength(4)

        // remove the connection from contract 2
        must(
            await unlockContract(
                client,
                contract2.id,
                cmsUser.id,
                'unlock for 2.1 remove'
            )
        )
        must(
            await updateDraftContract(client, {
                contractID: contract2.id,
                formData: { submissionDescription: 'twopointone' },
                rateIDs: [],
            })
        )
        must(await submitContract(client, contract2.id, stateUser.id, '2.1 remove'))

        // Now, find that contract and assert the history is what we expected
        const twoRate = must(
            await findRateWithHistory(client, rateA.id)
        )
        if (twoRate instanceof Error) {
            throw twoRate
        }
        expect(twoRate.revisions).toHaveLength(5)
        expect(twoRate.revisions[0].contractRevisions).toHaveLength(2)

        // update rate 1 to have a new version, should make one new rev.
        must(await unlockContract(client, contract1.id, cmsUser.id, 'unlock for 1.1'))
        must(
            await updateDraftContract(client, {
                contractID: contract1.id,
                formData: { submissionDescription: 'onepointone' },
                rateIDs: [rateA.id],
            })
        )
        must(await submitContract(client, contract1.id, stateUser.id, '1.1 new name'))

        // Now, find that contract and assert the history is what we expected
        const backAgainRate = must(
            await findRateWithHistory(client, rateA.id)
        )
        if (backAgainRate instanceof Error) {
            throw backAgainRate
        }
        expect(backAgainRate.revisions).toHaveLength(6)

        // Make a new Contract Revision, should show up as a single new rev with all the old info
        must(
            await unlockRate(
                client,
                rateA.id,
                cmsUser.id,
                'unlocking A.0'
            )
        )
        must(
            await submitRate(
                client,
                rateA.id,
                stateUser.id,
                'Submitting A.1'
            )
        )

        // Now, find that contract and assert the history is what we expected
        let testingRate = must(
            await findRateWithHistory(client, rateA.id)
        )
        if (testingRate instanceof Error) {
            throw testingRate
        }
        expect(testingRate.revisions).toHaveLength(7)

        // Make a new Rate Revision, changing the connections should show up as a single new rev.
        must(
            await unlockRate(
                client,
                rateA.id,
                cmsUser.id,
                'unlocking A.1'
            )
        )
        must(
            await updateDraftRate(
                client,{
                rateID: rateA.id,
                formData: {
                    rateType: 'AMENDMENT',
                },
                contractIDs: [contract3.id]}
            )
        )
        must(
            await submitRate(
                client,
                rateA.id,
                stateUser.id,
                'Submitting A.2'
            )
        )

        // Now, find that contract and assert the history is what we expected
        testingRate = must(
            await findRateWithHistory(client, rateA.id)
        )
        if (testingRate instanceof Error) {
            throw testingRate
        }
        expect(testingRate.revisions).toHaveLength(8)

        // Now, find that contract and assert the history is what we expected
        const resultingRate = must(
            await findRateWithHistory(client, rateA.id)
        )
        if (resultingRate instanceof Error) {
            throw resultingRate
        }

        const revisionsInTimeOrder = resultingRate.revisions.reverse()

        console.info(
            'ALL First REvisions: ',
            JSON.stringify(revisionsInTimeOrder, null, '  ')
        )

        // Each Revision needs a Reason, one of the rates or revisions associated with it should have changed and why.

        expect(revisionsInTimeOrder).toHaveLength(8)
        expect(revisionsInTimeOrder[0].contractRevisions).toHaveLength(0)
        expect(revisionsInTimeOrder[0].unlockInfo).toBeUndefined()
        expect(revisionsInTimeOrder[0].submitInfo?.updatedReason).toBe(
            'initial submit'
        )

        expect(revisionsInTimeOrder[1].contractRevisions).toHaveLength(1)
        expect(revisionsInTimeOrder[1].unlockInfo).toBeUndefined()
        expect(revisionsInTimeOrder[1].submitInfo?.updatedReason).toBe(
            'Rate Submit'
        )

        expect(revisionsInTimeOrder[2].contractRevisions).toHaveLength(2)
        expect(revisionsInTimeOrder[2].unlockInfo).toBeUndefined()
        expect(revisionsInTimeOrder[2].submitInfo?.updatedReason).toBe(
            'RateSubmit 2'
        )

        expect(revisionsInTimeOrder[3].contractRevisions).toHaveLength(3)
        expect(revisionsInTimeOrder[3].unlockInfo).toBeUndefined()
        expect(revisionsInTimeOrder[3].submitInfo?.updatedReason).toBe(
            '3.0 create'
        )

        expect(revisionsInTimeOrder[4].contractRevisions).toHaveLength(2)
        expect(revisionsInTimeOrder[4].unlockInfo?.updatedReason).toBe(
            'unlock for 2.1 remove'
        )
        expect(revisionsInTimeOrder[4].unlockInfo?.updatedBy).toBe(
            'zuko@example.com'
        )
        expect(revisionsInTimeOrder[4].submitInfo?.updatedReason).toBe(
            '2.1 remove'
        )

        expect(revisionsInTimeOrder[5].contractRevisions).toHaveLength(2)
        expect(
            revisionsInTimeOrder[5].contractRevisions[1].formData
                .submissionDescription
        ).toBe('onepointone')
        expect(revisionsInTimeOrder[5].unlockInfo?.updatedReason).toBe(
            'unlock for 1.1'
        )
        expect(revisionsInTimeOrder[5].submitInfo?.updatedReason).toBe(
            '1.1 new name'
        )

        expect(revisionsInTimeOrder[6].contractRevisions).toHaveLength(2)
        expect(revisionsInTimeOrder[6].submitInfo?.updatedReason).toBe(
            'Submitting A.1'
        )

        expect(revisionsInTimeOrder[7].contractRevisions).toHaveLength(1)
        expect(revisionsInTimeOrder[7].formData).toEqual(
            expect.objectContaining({
                submissionType: 'CONTRACT_AND_RATES',
                submissionDescription: 'a.2 body',
            })
        )
        expect(revisionsInTimeOrder[7].submitInfo?.updatedReason).toBe(
            'Submitting A.2'
        )

        // check for contract and see if it handles the removed bit right

        const contract1fetched = await findContractWithHistory(client, contract1.id)
        if (contract1fetched instanceof Error) {
            throw contract1fetched
        }

        expect(contract1fetched.revisions).toHaveLength(4)
        expect(contract1fetched.revisions[0].submitInfo?.updatedReason).toBe(
            'Submitting A.2'
        )
    })

    it('finds a full rate', async () => {
        const client = await sharedTestPrismaClient()

        const stateUser = await client.user.create({
            data: {
                id: uuidv4(),
                givenName: 'Aang',
                familyName: 'Avatar',
                email: 'aang@example.com',
                role: 'STATE_USER',
                stateCode: 'NM',
            },
        })

        const cmsUser = await client.user.create({
            data: {
                id: uuidv4(),
                givenName: 'Zuko',
                familyName: 'Hotman',
                email: 'zuko@example.com',
                role: 'CMS_USER',
            },
        })

        // setup a couple test contracts
        const draftContractData = createInsertContractData({
            submissionDescription: 'one contract',
        })
        const contractA = must(
            await insertDraftContract(client, draftContractData)
        )
        must(
            await submitContract(
                client,
                contractA.id,
                stateUser.id,
                'initial submit'
            )
        )

        // Add 3 rates 1, 2, 3 pointing to contract A
        const rate1 = must(
            await insertDraftRate(client, {
                stateCode: 'MN',
                rateCertificationName: 'someurle.en',
            })
        )
        must(
            await updateDraftRate(client, {
                rateID: rate1.id,
                formData: { rateCertificationName: 'someurle.en' },
                contractIDs: [contractA.id],
            })
        )
        must(await submitRate(client, rate1.id, stateUser.id, 'Rate Submit'))

        const rate2 = must(
            await insertDraftRate(client, {
                stateCode: 'MN',
                rateCertificationName: 'twopointo',
            })
        )
        must(
            await updateDraftRate(client, {
                rateID: rate2.id,
                formData: { rateCertificationName: 'twopointo' },
                contractIDs: [contractA.id],
            })
        )
        must(await submitRate(client, rate2.id, stateUser.id, 'RateSubmit 2'))

        const rate3 = must(
            await insertDraftRate(client, {
                stateCode: 'MN',
                rateCertificationName: 'threepointo',
            })
        )
        must(
            await updateDraftRate(client, {
                rateID: rate3.id,
                formData: { rateCertificationName: 'threepointo' },
                contractIDs: [contractA.id],
            })
        )
        must(await submitRate(client, rate3.id, stateUser.id, '3.0 create'))

        // remove the connection from rate 2
        must(
            await unlockRate(
                client,
                rate2.id,
                cmsUser.id,
                'unlock for 2.1 remove'
            )
        )
        must(
            await updateDraftRate(client, {
                rateID: rate2.id,
                formData: { rateCertificationName: 'twopointone' },
                contractIDs: [],
            })
        )
        must(await submitRate(client, rate2.id, stateUser.id, '2.1 remove'))

        // update rate 1 to have a new version, should make one new rev.
        must(await unlockRate(client, rate1.id, cmsUser.id, 'unlock for 1.1'))
        must(
            await updateDraftRate(client, {
                rateID: rate1.id,
                formData: { rateCertificationName: 'onepointone' },
                contractIDs: [contractA.id],
            })
        )
        must(await submitRate(client, rate1.id, stateUser.id, '1.1 new name'))

        // Make a new Contract Revision, should show up as a single new rev with all the old info
        must(
            await unlockContract(
                client,
                contractA.id,
                cmsUser.id,
                'unlocking A.0'
            )
        )
        must(
            await updateDraftContract(
                client,{
                contractID: contractA.id,
                formData: {
                    submissionType: 'CONTRACT_AND_RATES',
                    submissionDescription: 'a.1 body',
                    contractType: 'BASE',
                    programIDs: ['PMAP'],
                    populationCovered: 'MEDICAID',
                    riskBasedContract: false,
                },
                rateIDs: [rate1.id, rate3.id]}
            )
        )
        must(
            await submitContract(
                client,
                contractA.id,
                stateUser.id,
                'Submitting A.1'
            )
        )

        // Make a new Contract Revision, changing the connections should show up as a single new rev.
        must(
            await unlockContract(
                client,
                contractA.id,
                cmsUser.id,
                'unlocking A.1'
            )
        )
        must(
            await updateDraftContract(
                client,{
                contractID: contractA.id,
                formData: {
                    submissionType: 'CONTRACT_AND_RATES',
                    submissionDescription: 'a.2 body',
                    contractType: 'BASE',
                    programIDs: ['PMAP'],
                    populationCovered: 'MEDICAID',
                    riskBasedContract: false,
                },
                rateIDs: [rate3.id]}
            )
        )
        must(
            await submitContract(
                client,
                contractA.id,
                stateUser.id,
                'Submitting A.2'
            )
        )

        // Now, find that contract and assert the history is what we expected
        const resultingRate = await findRateWithHistory(client, rate1.id)
        if (resultingRate instanceof Error) {
            throw resultingRate
        }

        const revisions = resultingRate.revisions.reverse()

        console.info(
            'ALL First REvisions: ',
            JSON.stringify(revisions, null, '  ')
        )

        // Each Revision needs a Reason, one of the contracts or revisions associated with it should have changed and why.

        expect(revisions).toHaveLength(4)
        expect(revisions[0].contractRevisions).toHaveLength(1)
        expect(
            revisions[0].contractRevisions &&
                revisions[0].contractRevisions[0].formData
        ).toEqual(
            expect.objectContaining({
                submissionType: 'CONTRACT_AND_RATES',
                submissionDescription: 'one contract',
                contractType: 'BASE',
                programIDs: ['PMAP'],
                populationCovered: 'MEDICAID',
                riskBasedContract: false,
            })
        )
        expect(revisions[0].submitInfo?.updatedReason).toBe('Rate Submit')
        expect(revisions[0].unlockInfo).toBeUndefined()

        expect(revisions[1].contractRevisions).toHaveLength(1)
        expect(
            revisions[1].contractRevisions &&
                revisions[1].contractRevisions[0].formData
        ).toEqual(
            expect.objectContaining({
                submissionType: 'CONTRACT_AND_RATES',
                submissionDescription: 'one contract',
                contractType: 'BASE',
                programIDs: ['PMAP'],
                populationCovered: 'MEDICAID',
                riskBasedContract: false,
            })
        )
        expect(revisions[1].submitInfo?.updatedReason).toBe('1.1 new name')
        expect(revisions[1].unlockInfo?.updatedReason).toBe('unlock for 1.1')
        expect(revisions[1].unlockInfo?.updatedBy).toBe('zuko@example.com')

        expect(revisions[2].contractRevisions).toHaveLength(1)
        expect(
            revisions[2].contractRevisions &&
                revisions[2].contractRevisions[0].formData
        ).toEqual(
            expect.objectContaining({
                submissionType: 'CONTRACT_AND_RATES',
                submissionDescription: 'a.1 body',
                contractType: 'BASE',
                programIDs: ['PMAP'],
                populationCovered: 'MEDICAID',
                riskBasedContract: false,
            })
        )
        expect(revisions[2].submitInfo?.updatedReason).toBe('Submitting A.1')
        expect(revisions[2].unlockInfo?.updatedReason).toBe('unlocking A.0')
        expect(revisions[2].unlockInfo?.updatedBy).toBe('zuko@example.com')

        expect(revisions[3].contractRevisions).toHaveLength(0)
        expect(revisions[3].submitInfo?.updatedReason).toBe('Submitting A.2')
    })

    // TODO reverse this test.
    it('handles drafts correctly', async () => {
        const client = await sharedTestPrismaClient()

        const stateUser = await client.user.create({
            data: {
                id: uuidv4(),
                givenName: 'Aang',
                familyName: 'Avatar',
                email: 'aang@example.com',
                role: 'STATE_USER',
                stateCode: 'NM',
            },
        })

        const cmsUser = await client.user.create({
            data: {
                id: uuidv4(),
                givenName: 'Zuko',
                familyName: 'Hotman',
                email: 'zuko@example.com',
                role: 'CMS_USER',
            },
        })

        // Add 2 rates 1, 2
        const rate1 = must(
            await insertDraftRate(client, {
                stateCode: 'MN',
                rateCertificationName: 'onepoint0',
            })
        )
        must(
            await updateDraftRate(client, {
                rateID: rate1.id,
                formData: { rateCertificationName: 'onepoint0' },
                contractIDs: [],
            })
        )
        must(await submitRate(client, rate1.id, stateUser.id, 'Rate Submit'))

        const rate2 = must(
            await insertDraftRate(client, {
                stateCode: 'MN',
                rateCertificationName: 'twopoint0',
            })
        )
        must(
            await updateDraftRate(client, {
                rateID: rate2.id,
                formData: { rateCertificationName: 'twopointo' },
                contractIDs: [],
            })
        )
        must(await submitRate(client, rate2.id, stateUser.id, 'Rate Submit 2'))

        // add a contract that has both of them.
        const draftContractData = createInsertContractData({
            submissionDescription: 'one contract',
        })
        const contractA = must(
            await insertDraftContract(client, draftContractData)
        )
        must(
            await updateDraftContract(
                client,
                {
                    contractID: contractA.id,
                formData: {
                    submissionType: 'CONTRACT_AND_RATES',
                    submissionDescription: 'one contract',
                    contractType: 'BASE',
                    programIDs: ['PMAP'],
                    populationCovered: 'MEDICAID',
                    riskBasedContract: false,
                },
                rateIDs: [rate1.id, rate2.id]
            }
        ))
        must(
            await submitContract(
                client,
                contractA.id,
                stateUser.id,
                'initial submit'
            )
        )

        // Unlock contract A, but don't resubmit it yet.
        must(
            await unlockContract(
                client,
                contractA.id,
                cmsUser.id,
                'unlock A Open'
            )
        )

        // Draft should pull revision 2.0 out
        const draftPreRateUnlock = must(
            await findContractWithHistory(client, contractA.id)
        )
        expect(draftPreRateUnlock.draftRevision).toBeDefined()
        expect(
            draftPreRateUnlock.draftRevision?.rateRevisions.map(
                (rr) => rr.formData.rateCertificationName
            )
        ).toEqual(['onepoint0', 'twopointo'])

        // unlock and submit second rate rev
        must(await unlockRate(client, rate2.id, cmsUser.id, 'unlock for 2.1'))
        must(
            await updateDraftRate(client, {
                rateID: rate2.id,
                formData: { rateCertificationName: 'twopointone' },
                contractIDs: [contractA.id],
            })
        )

        // Draft should now pull draft revision 2.1 out, even though its unsubmitted
        const draftPreRateSubmit = must(
            await findContractWithHistory(client, contractA.id)
        )
        expect(draftPreRateSubmit.draftRevision).toBeDefined()
        expect(
            draftPreRateSubmit.draftRevision?.rateRevisions.map(
                (rr) => rr.formData.rateCertificationName
            )
        ).toEqual(['onepoint0', 'twopointone'])

        // Submit Rate 2.1
        must(await submitRate(client, rate2.id, stateUser.id, '2.1 update'))

        // raft should still pull revision 2.1 out
        const draftPostRateSubmit = must(
            await findContractWithHistory(client, contractA.id)
        )
        expect(draftPostRateSubmit.draftRevision).toBeDefined()
        expect(
            draftPostRateSubmit.draftRevision?.rateRevisions.map(
                (rr) => rr.formData.rateCertificationName
            )
        ).toEqual(['onepoint0', 'twopointone'])

        // submit contract A1, now, should show up as a single new rev and have the latest rates
        must(
            await submitContract(
                client,
                contractA.id,
                stateUser.id,
                'third submit'
            )
        )

        // attempt a second submission, should result in an error.
        const contractA_1_Error = await submitContract(
            client,
            contractA.id,
            stateUser.id,
            'third submit'
        )
        if (!(contractA_1_Error instanceof Error)) {
            throw new Error('Should be impossible to submit twice in a row.')
        }

        const res = must(await findContractWithHistory(client, contractA.id))

        const revisions = res.revisions.reverse()

        console.info(
            'ALL First REvisions: ',
            JSON.stringify(revisions, null, '  ')
        )

        expect(revisions).toHaveLength(3)
        expect(revisions[0].rateRevisions).toHaveLength(2)
        expect(revisions[0].submitInfo?.updatedReason).toBe('initial submit')

        expect(revisions[1].rateRevisions).toHaveLength(2)
        expect(revisions[1].submitInfo?.updatedReason).toBe('2.1 update')

        expect(revisions[2].rateRevisions).toHaveLength(2)
        expect(revisions[2].submitInfo?.updatedReason).toBe('third submit')

        // these revisions can be in any order because they were saved at the same time
        const revisionFormDatas = new Set(
            revisions[2].rateRevisions.map(
                (rr) => rr.formData.rateCertificationName
            )
        )
        const expectedFormDatas = new Set(['onepoint0', 'twopointone'])
        expect(revisionFormDatas).toStrictEqual(expectedFormDatas)
    })
})
