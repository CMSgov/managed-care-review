import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { Contract } from './contractType'
import { findContract } from './findContract'

// Unlock the given contract
// * copy form data
// * set relationships based on last submission
async function unlockContract(
    client: PrismaClient,
    contractID: string,
    unlockedByUserID: string,
    unlockReason: string
): Promise<Contract | Error> {
    const groupTime = new Date()

    try {
        return await client.$transaction(async (tx) => {
            // Given all the Rates associated with this draft, find the most recent submitted
            // rateRevision to attach to this contract on submit.
            const currentRev = await tx.contractRevisionTable.findFirst({
                where: {
                    contractID: contractID,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    rateRevisions: {
                        where: {
                            validUntil: null,
                        },
                        include: {
                            rateRevision: true,
                        },
                    },
                },
            })
            if (!currentRev) {
                console.error('No Rev! Contracts should always have revisions.')
                return new Error('cant find the current rev to submit')
            }

            if (!currentRev.submitInfoID) {
                console.error(
                    'this contract already has an unsubmitted revision'
                )
                return new Error('cant unlock an alreday unlocked submission')
            }

            const previouslySubmittedRateIDs = currentRev.rateRevisions.map(
                (c) => c.rateRevision.rateID
            )

            await tx.contractRevisionTable.create({
                data: {
                    id: uuidv4(),
                    contract: {
                        connect: {
                            id: contractID,
                        },
                    },
                    name: currentRev.name,
                    unlockInfo: {
                        create: {
                            id: uuidv4(),
                            updatedAt: groupTime,
                            updatedByID: unlockedByUserID,
                            updatedReason: unlockReason,
                        },
                    },
                    draftRates: {
                        connect: previouslySubmittedRateIDs.map((cID) => ({
                            id: cID,
                        })),
                    },
                },
                include: {
                    rateRevisions: {
                        include: {
                            rateRevision: true,
                        },
                    },
                },
            })

            return findContract(tx, contractID)
        })
    } catch (err) {
        console.error('SUBMIT PRISMA CONTRACT ERR', err)
        return err
    }
}

export { unlockContract }
