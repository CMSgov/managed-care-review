import type { PrismaClient } from '@prisma/client'
import type { ContractType } from '../../domain-models/contractAndRates'
import { findContractWithHistory } from './findContractWithHistory'
import { NotFoundError } from '../storeError'
import type { UpdateInfoType } from '../../domain-models'
import { includeFirstSubmittedRateRev } from './prismaSubmittedRateHelpers'

type SubmitContractArgsType = {
    contractID: string
    submittedByUserID: UpdateInfoType['updatedBy']
    submitReason: UpdateInfoType['updatedReason']
}
// Update the given revision
// * invalidate relationships of previous revision by marking as outdated
// * set the UpdateInfo
async function submitContract(
    client: PrismaClient,
    args: SubmitContractArgsType
): Promise<ContractType | NotFoundError | Error> {
    const { contractID, submittedByUserID, submitReason } = args
    const currentDateTime = new Date()

    try {
        // Find current contract revision with related rates
        // query only the submitted revisions on the related rates
        return await client.$transaction(async (tx) => {
            const currentRev = await tx.contractRevisionTable.findFirst({
                where: {
                    contractID: contractID,
                    submitInfoID: null,
                },
                include: {
                    draftRates: {
                        include: includeFirstSubmittedRateRev,
                    },
                },
            })

            if (!currentRev) {
                const err = `PRISMA ERROR: Cannot find the current rev to submit with contract id: ${contractID}`
                console.error(err)
                return new NotFoundError(err)
            }

            // Given related rates, confirm rates valid by submitted by checking for revisions
            // If rates have no revisions, we know it is invalid and can throw error
            const relatedRateRevs = currentRev.draftRates.map(
                (c) => c.revisions[0]
            )
            const everyRelatedRateIsSubmitted = relatedRateRevs.every(
                (rev) => rev !== undefined
            )
            if (!everyRelatedRateIsSubmitted) {
                const message =
                    'Attempted to submit a contract related to a rate that has not been submitted.'
                console.error(message)
                return new Error(message)
            }

            const updated = await tx.contractRevisionTable.update({
                where: {
                    id: currentRev.id,
                },
                data: {
                    submitInfo: {
                        create: {
                            updatedAt: currentDateTime,
                            updatedByID: submittedByUserID,
                            updatedReason: submitReason,
                        },
                    },
                    rateRevisions: {
                        createMany: {
                            data: relatedRateRevs.map((rev) => ({
                                rateRevisionID: rev.id,
                                validAfter: currentDateTime,
                            })),
                        },
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

            // oldRev is the previously submitted revision of this contract (the one just superseded by the update)
            // on an initial submission, there won't be an oldRev
            const oldRev = await tx.contractRevisionTable.findFirst({
                where: {
                    contractID: updated.contractID,
                    NOT: {
                        id: updated.id,
                    },
                },
                include: {
                    rateRevisions: {
                        include: {
                            rateRevision: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            })

            // Take oldRev, invalidate all relationships and add any removed entries to the join table.
            if (oldRev) {
                // If any of the old rev's Rates aren't in the new Rates, add an entry in revisions join table
                // isRemoval field shows that this is a previous rate related with this contract that is now removed
                const oldRateRevs = oldRev.rateRevisions
                    .filter((rrevjoin) => !rrevjoin.validUntil)
                    .map((rrevjoin) => rrevjoin.rateRevision)
                const removedRateRevs = oldRateRevs.filter(
                    (rrev) =>
                        !currentRev.draftRates
                            .map((r) => r.id)
                            .includes(rrev.rateID)
                )

                if (removedRateRevs.length > 0) {
                    await tx.rateRevisionsOnContractRevisionsTable.createMany({
                        data: removedRateRevs.map((rrev) => ({
                            contractRevisionID: updated.id,
                            rateRevisionID: rrev.id,
                            validAfter: currentDateTime,
                            validUntil: currentDateTime,
                            isRemoval: true,
                        })),
                    })
                }

                // Invalidate old revision join table links by updating validUntil
                // these links are considered outdated going forward
                await tx.rateRevisionsOnContractRevisionsTable.updateMany({
                    where: {
                        contractRevisionID: oldRev.id,
                        validUntil: null,
                    },
                    data: {
                        validUntil: currentDateTime,
                    },
                })
            }

            return await findContractWithHistory(tx, contractID)
        })
    } catch (err) {
        console.error('Prisma error submitting contract', err)
        return err
    }
}

export { submitContract }
