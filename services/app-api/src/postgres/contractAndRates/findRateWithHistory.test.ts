import { sharedTestPrismaClient } from '../../testHelpers/storeHelpers'
import { v4 as uuidv4 } from 'uuid'
import { submitContract } from './submitContract'
import { submitRate } from './submitRate'
import { insertDraftContract } from './insertContract'
import { unlockContract } from './unlockContract'
import { updateDraftContractWithRates } from './updateDraftContractWithRates'
import { insertDraftRate } from './insertRate'
import { updateDraftRate } from './updateDraftRate'
import { unlockRate } from './unlockRate'
import { findRateWithHistory } from './findRateWithHistory'
import { must, createInsertContractData } from '../../testHelpers'
import { createInsertRateData } from '../../testHelpers/contractAndRates/rateHelpers'
import { findContractWithHistory } from './findContractWithHistory'
import type { DraftContractType } from '../../domain-models/contractAndRates/contractTypes'

describe('findRate', () => {
    // TODO: Enable this tests again after reimplementing rate change history that was in contractWithHistoryToDomainModel
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('finds a stripped down rate with history', async () => {
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
        const rateA = must(await insertDraftRate(client, draftRateData))

        if (!rateA.draftRevision) {
            throw new Error(
                'Unexpected error: draft rate is missing a draftRevision.'
            )
        }

        // Add 3 contracts 1, 2, 3 pointing to rate A
        const contract1 = must(
            await insertDraftContract(client, {
                stateCode: 'MN',
                submissionDescription: 'someurle.en',
                programIDs: ['13221'],
                submissionType: 'CONTRACT_ONLY',
                contractType: 'BASE',
            })
        )
        must(
            await updateDraftContractWithRates(client, {
                contractID: contract1.id,
                formData: { submissionDescription: 'someurle.en' },
                rateFormDatas: [rateA.draftRevision.formData],
            })
        )

        const contract2 = must(
            await insertDraftContract(client, {
                stateCode: 'MN',
                submissionDescription: 'twopointo',
                programIDs: ['13221'],
                submissionType: 'CONTRACT_ONLY',
                contractType: 'BASE',
            })
        )
        must(
            await updateDraftContractWithRates(client, {
                contractID: contract2.id,
                formData: { submissionDescription: 'twopointo' },
                rateFormDatas: [rateA.draftRevision.formData],
            })
        )

        const contract3 = must(
            await insertDraftContract(client, {
                stateCode: 'MN',
                submissionDescription: 'threepointo',
                programIDs: ['13221'],
                submissionType: 'CONTRACT_ONLY',
                contractType: 'BASE',
            })
        )
        must(
            await updateDraftContractWithRates(client, {
                contractID: contract3.id,
                formData: { submissionDescription: 'threepointo' },
                rateFormDatas: [rateA.draftRevision.formData],
            })
        )

        // Submit rateA
        const submittedRateA = must(
            await submitRate(client, {
                rateID: rateA.id,
                submittedByUserID: stateUser.id,
                submitReason: 'initial rate submit',
            })
        )

        // Submit Contract 1, 2, and 3
        must(
            await submitContract(client, {
                contractID: contract1.id,
                submittedByUserID: stateUser.id,
                submitReason: 'Contract Submit',
            })
        )
        must(
            await submitContract(client, {
                contractID: contract2.id,
                submittedByUserID: stateUser.id,
                submitReason: 'ContractSubmit 2',
            })
        )
        must(
            await submitContract(client, {
                contractID: contract3.id,
                submittedByUserID: stateUser.id,
                submitReason: '3.0 create',
            })
        )

        // Now, find that rate and assert the history is what we expected
        const threeRate = must(await findRateWithHistory(client, rateA.id))
        if (threeRate instanceof Error) {
            throw threeRate
        }
        expect(threeRate.revisions).toHaveLength(4)

        // remove the connection from contract 2
        const unlockedContract2 = must(
            await unlockContract(client, {
                contractID: contract2.id,
                unlockedByUserID: cmsUser.id,
                unlockReason: 'unlock for 2.1 remove',
            })
        )
        must(
            await updateDraftContractWithRates(client, {
                contractID: unlockedContract2.id,
                formData: {
                    submissionType: 'CONTRACT_AND_RATES',
                    submissionDescription: 'a.2 body',
                    contractType: 'BASE',
                    populationCovered: 'MEDICAID',
                    riskBasedContract: false,
                },
                rateFormDatas:
                    unlockedContract2.draftRevision?.rateRevisions.filter(
                        (rate) => rate.formData.rateID !== submittedRateA.id
                    ),
            })
        )
        must(
            await submitContract(client, {
                contractID: contract2.id,
                submittedByUserID: stateUser.id,
                submitReason: '2.1 remove',
            })
        )

        // Now, find that contract and assert the history is what we expected
        const twoRate = must(
            await findRateWithHistory(client, submittedRateA.id)
        )
        if (twoRate instanceof Error) {
            throw twoRate
        }
        expect(twoRate.revisions).toHaveLength(5)
        expect(twoRate.revisions[0].contractRevisions).toHaveLength(2)

        // update rate 1 to have a new version, should make one new rev.
        const unlockedContract1 = must(
            await unlockContract(client, {
                contractID: contract1.id,
                unlockedByUserID: cmsUser.id,
                unlockReason: 'unlock for 1.1',
            })
        ) as DraftContractType
        must(
            await updateDraftContractWithRates(client, {
                contractID: unlockedContract1.id,
                formData: { submissionDescription: 'onepointone' },
                rateFormDatas: [rateA.draftRevision.formData],
            })
        )
        must(
            await submitContract(client, {
                contractID: contract1.id,
                submittedByUserID: stateUser.id,
                submitReason: '1.1 new name',
            })
        )

        // Now, find that contract and assert the history is what we expected
        const backAgainRate = must(
            await findRateWithHistory(client, submittedRateA.id)
        )
        if (backAgainRate instanceof Error) {
            throw backAgainRate
        }
        expect(backAgainRate.revisions).toHaveLength(6)

        // Make a new Contract Revision, should show up as a single new rev with all the old info
        must(
            await unlockRate(client, {
                rateID: rateA.id,
                unlockedByUserID: cmsUser.id,
                unlockReason: 'unlocking A.0',
            })
        )
        const resubmittedRateA = must(
            await submitRate(client, {
                rateID: rateA.id,
                submittedByUserID: stateUser.id,
                submitReason: 'Submitting A.1',
            })
        )

        // Now, find that contract and assert the history is what we expected
        let testingRate = must(
            await findRateWithHistory(client, resubmittedRateA.id)
        )
        if (testingRate instanceof Error) {
            throw testingRate
        }
        expect(testingRate.revisions).toHaveLength(7)

        // Make a new Rate Revision, changing the connections should show up as a single new rev.
        const secondUnlockRateA = must(
            await unlockRate(client, {
                rateID: resubmittedRateA.id,
                unlockedByUserID: cmsUser.id,
                unlockReason: 'unlocking A.1',
            })
        )
        must(
            await updateDraftRate(client, {
                rateID: secondUnlockRateA.id,
                formData: {
                    rateType: 'AMENDMENT',
                },
                contractIDs: [contract3.id],
            })
        )
        const secondResubmitRateA = must(
            await submitRate(client, {
                rateID: rateA.id,
                submittedByUserID: stateUser.id,
                submitReason: 'Submitting A.2',
            })
        )

        // Now, find that contract and assert the history is what we expected
        testingRate = must(
            await findRateWithHistory(client, secondResubmitRateA.id)
        )
        if (testingRate instanceof Error) {
            throw testingRate
        }
        expect(testingRate.revisions).toHaveLength(8)

        // Now, find that contract and assert the history is what we expected
        const resultingRate = must(
            await findRateWithHistory(client, secondResubmitRateA.id)
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
            'initial rate submit'
        )

        expect(revisionsInTimeOrder[1].contractRevisions).toHaveLength(1)
        expect(revisionsInTimeOrder[1].unlockInfo).toBeUndefined()
        expect(revisionsInTimeOrder[1].submitInfo?.updatedReason).toBe(
            'Contract Submit'
        )

        expect(revisionsInTimeOrder[2].contractRevisions).toHaveLength(2)
        expect(revisionsInTimeOrder[2].unlockInfo).toBeUndefined()
        expect(revisionsInTimeOrder[2].submitInfo?.updatedReason).toBe(
            'ContractSubmit 2'
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
                rateCertificationName: 'one contract',
                rateDateCertified: undefined,

                rateType: 'AMENDMENT',
            })
        )
        expect(revisionsInTimeOrder[7].submitInfo?.updatedReason).toBe(
            'Submitting A.2'
        )

        // check for contract and see if it handles the removed bit right

        const contract1fetched = await findContractWithHistory(
            client,
            contract1.id
        )
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
            await submitContract(client, {
                contractID: contractA.id,
                submittedByUserID: stateUser.id,
                submitReason: 'initial submit',
            })
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
        must(
            await submitRate(client, {
                rateID: rate1.id,
                submittedByUserID: stateUser.id,
                submitReason: 'Rate Submit',
            })
        )

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
        must(
            await submitRate(client, {
                rateID: rate2.id,
                submittedByUserID: stateUser.id,
                submitReason: 'RateSubmit 2',
            })
        )

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
        must(
            await submitRate(client, {
                rateID: rate3.id,
                submittedByUserID: stateUser.id,
                submitReason: '3.0 create',
            })
        )

        // remove the connection from rate 2
        must(
            await unlockRate(client, {
                rateID: rate2.id,
                unlockedByUserID: cmsUser.id,
                unlockReason: 'unlock for 2.1 remove',
            })
        )
        must(
            await updateDraftRate(client, {
                rateID: rate2.id,
                formData: { rateCertificationName: 'twopointone' },
                contractIDs: [],
            })
        )
        must(
            await submitRate(client, {
                rateID: rate2.id,
                submittedByUserID: stateUser.id,
                submitReason: '2.1 remove',
            })
        )

        // update rate 1 to have a new version, should make one new rev.
        must(
            await unlockRate(client, {
                rateID: rate1.id,
                unlockedByUserID: cmsUser.id,
                unlockReason: 'unlock for 1.1',
            })
        )
        must(
            await updateDraftRate(client, {
                rateID: rate1.id,
                formData: { rateCertificationName: 'onepointone' },
                contractIDs: [contractA.id],
            })
        )
        must(
            await submitRate(client, {
                rateID: rate1.id,
                submittedByUserID: stateUser.id,
                submitReason: '1.1 new name',
            })
        )

        // Make a new Contract Revision, should show up as a single new rev with all the old info
        must(
            await unlockContract(client, {
                contractID: contractA.id,
                unlockedByUserID: cmsUser.id,
                unlockReason: 'unlocking A.0',
            })
        )

        must(
            await updateDraftContractWithRates(client, {
                contractID: contractA.id,
                formData: {
                    submissionType: 'CONTRACT_AND_RATES',
                    submissionDescription: 'a.1 body',
                    contractType: 'BASE',
                    programIDs: draftContractData.programIDs,
                    populationCovered: 'MEDICAID',
                    riskBasedContract: false,
                },
            })
        )
        must(
            await submitContract(client, {
                contractID: contractA.id,
                submittedByUserID: stateUser.id,
                submitReason: 'Submitting A.1',
            })
        )

        // Make a new Contract Revision, changing the connections should show up as a single new rev.
        must(
            await unlockContract(client, {
                contractID: contractA.id,
                unlockedByUserID: cmsUser.id,
                unlockReason: 'unlocking A.1',
            })
        )
        // Save update to get latest rate data
        const updatedDraftContractA = must(
            await updateDraftContractWithRates(client, {
                contractID: contractA.id,
                formData: {
                    submissionType: 'CONTRACT_AND_RATES',
                    submissionDescription: 'a.2 body',
                    contractType: 'BASE',
                    programIDs: draftContractData.programIDs,
                    populationCovered: 'MEDICAID',
                    riskBasedContract: false,
                },
            })
        )
        // Remove rate1 from contract
        must(
            await updateDraftContractWithRates(client, {
                contractID: updatedDraftContractA.id,
                formData: {},
                rateFormDatas:
                    updatedDraftContractA.draftRevision?.rateRevisions
                        .filter(
                            (rateRevision) =>
                                rateRevision.formData.rateID !== rate1.id
                        )
                        .map((rate) => rate.formData),
            })
        )
        must(
            await submitContract(client, {
                contractID: updatedDraftContractA.id,
                submittedByUserID: stateUser.id,
                submitReason: 'Submitting A.2',
            })
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

        expect(revisions).toHaveLength(2)
        expect(revisions[0].contractRevisions).toHaveLength(1)
        expect(
            revisions[0].contractRevisions &&
                revisions[0].contractRevisions[0].formData
        ).toEqual(
            expect.objectContaining({
                submissionType: 'CONTRACT_AND_RATES',
                submissionDescription: 'one contract',
                contractType: 'BASE',
                programIDs: draftContractData.programIDs,
                populationCovered: 'MEDICAID',
                riskBasedContract: false,
            })
        )
        expect(revisions[0].submitInfo?.updatedReason).toBe('Rate Submit')
        expect(revisions[0].unlockInfo).toBeUndefined()

        expect(revisions[1].contractRevisions).toHaveLength(0)
        // expect(
        //     revisions[1].contractRevisions &&
        //         revisions[1].contractRevisions[0].formData
        // ).toEqual(
        //     expect.objectContaining({
        //         submissionType: 'CONTRACT_AND_RATES',
        //         submissionDescription: 'one contract',
        //         contractType: 'BASE',
        //         programIDs: draftContractData.programIDs,
        //         populationCovered: 'MEDICAID',
        //         riskBasedContract: false,
        //     })
        // )
        expect(revisions[1].submitInfo?.updatedReason).toBe('1.1 new name')
        expect(revisions[1].unlockInfo?.updatedReason).toBe('unlock for 1.1')
        expect(revisions[1].unlockInfo?.updatedBy).toBe('zuko@example.com')

        // expect(revisions[2].contractRevisions).toHaveLength(1)
        // expect(
        //     revisions[2].contractRevisions &&
        //         revisions[2].contractRevisions[0].formData
        // ).toEqual(
        //     expect.objectContaining({
        //         submissionType: 'CONTRACT_AND_RATES',
        //         submissionDescription: 'a.1 body',
        //         contractType: 'BASE',
        //         programIDs: draftContractData.programIDs,
        //         populationCovered: 'MEDICAID',
        //         riskBasedContract: false,
        //     })
        // )
        // expect(revisions[2].submitInfo?.updatedReason).toBe('Submitting A.1')
        // expect(revisions[2].unlockInfo?.updatedReason).toBe('unlocking A.0')
        // expect(revisions[2].unlockInfo?.updatedBy).toBe('zuko@example.com')

        // expect(revisions[3].contractRevisions).toHaveLength(0)
        // expect(revisions[3].submitInfo?.updatedReason).toBe('Submitting A.2')
    })
})
