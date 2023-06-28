// // For use in TESTS only. Throws a returned error
import { sharedTestPrismaClient } from '../../testHelpers/storeHelpers'
import { v4 as uuidv4 } from 'uuid'
import { insertDraftContract } from './insertContract'
import { unlockContract } from './unlockContract'
import { insertDraftRate } from './insertRate'
import { unlockRate } from './unlockRate'
import { findDraftContract } from './findDraftContract'
import { submitRateRevision } from './submitRateRevision'
import { updateContractDraft } from './updateContractDraft'
import { updateRateDraft } from './updateRateDraft'
import { submitContract } from './submitContract'
import { findContract } from './findContract'
import { must } from '../../testHelpers'

describe('unlockContract', () => {
    it('Unlocks a rate without breaking connected draft contract', async () => {
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

        //Creat a draft contract and draft rate
        const contract = must(await insertDraftContract(client, 'Contract 1.0'))
        const rate = must(await insertDraftRate(client, 'Rate 1.0'))

        // Submit Rate A
        const submittedRateRev = must(
            await submitRateRevision(
                client,
                rate.id,
                stateUser.id,
                'Rate A 1.0 submit'
            )
        )

        // Connect draft contract to submitted rate
        must(
            await updateContractDraft(client, contract.id, 'Connecting rate', [
                rate.id,
            ])
        )

        const draftContract = must(await findDraftContract(client, contract.id))

        if (draftContract === undefined) {
            throw Error('Contract data was undefined')
        }

        // Rate revision should be connected to contract
        expect(draftContract.rateRevisions[0].id).toEqual(submittedRateRev.id)

        // Unlock the rate
        must(await unlockRate(client, rate.id, cmsUser.id, 'Unlocking rate'))
        must(await updateRateDraft(client, rate.id, 'Rate 2.0', []))
        const resubmittedRateRev = must(
            await submitRateRevision(
                client,
                rate.id,
                stateUser.id,
                'Updated things'
            )
        )

        const draftContractTwo = must(
            await findDraftContract(client, contract.id)
        )

        if (draftContractTwo === undefined) {
            throw Error('Contract data was undefined')
        }

        // Contract should now have the latest rate revision
        expect(draftContractTwo.rateRevisions[0].id).toEqual(
            resubmittedRateRev.id
        )
    })

    it('Unlocks a rate without breaking connected submitted contract', async () => {
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

        //Creat a draft contract and draft rate
        const contract = must(await insertDraftContract(client, 'Contract 1.0'))
        const rate = must(await insertDraftRate(client, 'Rate 1.0'))

        // Submit Rate A
        const submittedRateRev = must(
            await submitRateRevision(
                client,
                rate.id,
                stateUser.id,
                'Rate 1.0 submit'
            )
        )

        // Connect draft contract to submitted rate
        must(
            await updateContractDraft(client, contract.id, 'Connecting rate', [
                rate.id,
            ])
        )

        // Submit contract
        const submittedContract = must(
            await submitContract(
                client,
                contract.id,
                stateUser.id,
                'Initial Submit'
            )
        )
        // Latest revision is the last index
        const latestContractRev = submittedContract.revisions.reverse()[0]

        // Expect rate to be connected to submitted contract
        expect(latestContractRev.rateRevisions[0].id).toEqual(
            submittedRateRev.id
        )

        // Unlock the rate and resubmit rate
        must(await unlockRate(client, rate.id, cmsUser.id, 'Unlocking rate'))
        must(await updateRateDraft(client, rate.id, 'Rate 2.0', [contract.id]))
        const resubmittedRateRev = must(
            await submitRateRevision(
                client,
                rate.id,
                stateUser.id,
                'Rate resubmit'
            )
        )

        // Expect rate to still be connected to submitted contract
        const submittedContract2 = must(await findContract(client, contract.id))
        // Latest revision is the last index
        const latestResubmittedRev = submittedContract2.revisions.reverse()[0]

        // Expect latest contract revision to now be connected to latest rate revision
        expect(latestResubmittedRev.rateRevisions[0].id).toEqual(
            resubmittedRateRev.id
        )
    })

    it('Unlocks a contract without breaking connection to rate', async () => {
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

        //Creat a draft contract and draft rate
        const contract = must(await insertDraftContract(client, 'contract 1.0'))
        const rate = must(await insertDraftRate(client, 'rate 1.0'))

        // Connect draft contract to submitted rate
        must(
            await updateContractDraft(client, contract.id, 'contract 1.0', [
                rate.id,
            ])
        )

        // Submit rate
        const submittedRateRev = must(
            await submitRateRevision(
                client,
                rate.id,
                stateUser.id,
                'Submit rate 1.0'
            )
        )

        // Submit contract
        const submittedContract = must(
            await submitContract(
                client,
                contract.id,
                stateUser.id,
                'Submit contract 1.0'
            )
        )
        const latestContractRev = submittedContract.revisions.reverse()[0]

        expect(latestContractRev.rateRevisions[0].id).toEqual(
            submittedRateRev.id
        )

        // Unlock and resubmit contract
        must(
            await unlockContract(
                client,
                contract.id,
                cmsUser.id,
                'First unlock'
            )
        )
        must(
            await updateContractDraft(client, contract.id, 'contract 2.0', [
                rate.id,
            ])
        )
        const resubmittedContract = must(
            await submitContract(
                client,
                contract.id,
                stateUser.id,
                'Submit contract 2.0'
            )
        )
        const latestResubmittedRev = resubmittedContract.revisions.reverse()[0]

        // Expect rate revision to still be connected
        expect(latestResubmittedRev.rateRevisions[0].id).toEqual(
            submittedRateRev.id
        )
    })
    it('errors when submitting a contract that has a draft rate', async () => {
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

        //Creat a draft contract and draft rate
        const contract = must(await insertDraftContract(client, 'contract 1.0'))
        const rate = must(await insertDraftRate(client, 'rate 1.0'))

        // Connect draft contract to submitted rate
        must(
            await updateContractDraft(client, contract.id, 'contract 1.0', [
                rate.id,
            ])
        )

        // Submit contract
        const submittedContract = await submitContract(
            client,
            contract.id,
            stateUser.id,
            'Submit contract 1.0'
        )
        expect(submittedContract).toBeInstanceOf(Error)
    })
    it('errors when unlocking a draft contract or rate', async () => {
        const client = await sharedTestPrismaClient()

        const cmsUser = await client.user.create({
            data: {
                id: uuidv4(),
                givenName: 'Zuko',
                familyName: 'Hotman',
                email: 'zuko@example.com',
                role: 'CMS_USER',
            },
        })

        //Creat a draft contract
        const contractA = must(
            await insertDraftContract(client, 'contract A 1.1')
        )
        const rateA = must(await insertDraftRate(client, 'rate A 1.1'))

        //Unlocking it results in error
        expect(
            await unlockContract(
                client,
                contractA.id,
                cmsUser.id,
                'unlocking contact A 1.1'
            )
        ).toBeInstanceOf(Error)
        expect(
            await unlockRate(
                client,
                rateA.id,
                cmsUser.id,
                'unlocking rate A 1.1'
            )
        ).toBeInstanceOf(Error)
    })
})
