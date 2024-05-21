import type { PrismaClient } from '@prisma/client'
import type { RateType } from '../../domain-models/contractAndRates'
import type { PrismaTransactionType } from '../prismaTypes'
import { findRateWithHistory } from './findRateWithHistory'

type UnlockRateArgsType = {
    rateID?: string
    rateRevisionID?: string
    unlockedByUserID: string
    unlockReason: string
}

async function unlockRateInDB(
    tx: PrismaTransactionType,
    rateID: string,
    unlockInfoID: string,
    linkRatesFF?: boolean
): Promise<string | Error> {
    // find the current rate revision in order to create a new unlocked revision
    const currentRev = await tx.rateRevisionTable.findFirst({
        where: {
            rateID,
        },
        include: {
            rateDocuments: {
                orderBy: {
                    position: 'asc',
                },
            },
            supportingDocuments: {
                orderBy: {
                    position: 'asc',
                },
            },
            certifyingActuaryContacts: {
                orderBy: {
                    position: 'asc',
                },
            },
            addtlActuaryContacts: {
                orderBy: {
                    position: 'asc',
                },
            },
            contractsWithSharedRateRevision: true,

            contractRevisions: {
                where: {
                    validUntil: null,
                },
                include: {
                    contractRevision: true,
                },
            },
            relatedSubmissions: {
                orderBy: {
                    updatedAt: 'desc',
                },
                take: 1,
                include: {
                    submissionPackages: {
                        include: {
                            contractRevision: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    })
    if (!currentRev) {
        console.error(
            'Programming Error: cannot find the current revision to submit'
        )
        return new Error(
            'Programming Error: cannot find the current revision to submit'
        )
    }

    if (!currentRev.submitInfoID) {
        console.error(
            'Programming Error: cannot unlock a already unlocked rate'
        )
        return new Error(
            'Programming Error: cannot unlock a already unlocked rate'
        )
    }

    // old way to find connected contracts
    //TODO: with linked rates on, find them via package submission
    const previouslySubmittedContractIDs = currentRev.contractRevisions.map(
        (c) => c.contractRevision.contractID
    )

    const prevContractsWithSharedRateRevisionIDs =
        currentRev.contractsWithSharedRateRevision.map(
            (contract) => contract.id
        )

    await tx.rateRevisionTable.create({
        data: {
            rate: {
                connect: {
                    id: currentRev.rateID,
                },
            },
            unlockInfo: {
                connect: { id: unlockInfoID },
            },
            draftContracts: {
                connect: previouslySubmittedContractIDs.map((cID) => ({
                    id: cID,
                })),
            },

            rateType: currentRev.rateType,
            rateCapitationType: currentRev.rateCapitationType,
            rateDateStart: currentRev.rateDateStart,
            rateDateEnd: currentRev.rateDateEnd,
            rateDateCertified: currentRev.rateDateCertified,
            amendmentEffectiveDateEnd: currentRev.amendmentEffectiveDateEnd,
            amendmentEffectiveDateStart: currentRev.amendmentEffectiveDateStart,
            rateProgramIDs: currentRev.rateProgramIDs,
            rateCertificationName: currentRev.rateCertificationName,
            actuaryCommunicationPreference:
                currentRev.actuaryCommunicationPreference,

            rateDocuments: {
                create: currentRev.rateDocuments.map((d) => ({
                    position: d.position,
                    name: d.name,
                    s3URL: d.s3URL,
                    sha256: d.sha256,
                })),
            },
            supportingDocuments: {
                create: currentRev.supportingDocuments.map((d) => ({
                    position: d.position,
                    name: d.name,
                    s3URL: d.s3URL,
                    sha256: d.sha256,
                })),
            },
            certifyingActuaryContacts: {
                create: currentRev.certifyingActuaryContacts.map((c) => ({
                    position: c.position,
                    name: c.name,
                    email: c.email,
                    titleRole: c.titleRole,
                    actuarialFirm: c.actuarialFirm,
                    actuarialFirmOther: c.actuarialFirmOther,
                })),
            },
            addtlActuaryContacts: {
                create: currentRev.addtlActuaryContacts.map((c) => ({
                    position: c.position,
                    name: c.name,
                    email: c.email,
                    titleRole: c.titleRole,
                    actuarialFirm: c.actuarialFirm,
                    actuarialFirmOther: c.actuarialFirmOther,
                })),
            },
            contractsWithSharedRateRevision: {
                connect: prevContractsWithSharedRateRevisionIDs.map(
                    (contractID) => ({
                        id: contractID,
                    })
                ),
            },
        },
        include: {
            contractRevisions: {
                include: {
                    contractRevision: true,
                },
            },
        },
    })

    // Unlock rate will only ever by run after the linked rates FF is enabled
    // we only need to set draft rates explicitly in that case, when doing a rate
    // unlock UNDER a contract unlock, the contract will set the draft rates correctly.
    if (linkRatesFF) {
        // add DraftContract connections to the Rate
        const lastSubmission = currentRev.relatedSubmissions[0]
        const submissionConnections = lastSubmission.submissionPackages.filter(
            (p) => p.rateRevisionID === currentRev.id
        )
        const newDraftConnections = []
        for (const submissionConnection of submissionConnections) {
            newDraftConnections.push({
                contractID: submissionConnection.contractRevision.contractID,
                rateID: currentRev.rateID,
                ratePosition: submissionConnection.ratePosition,
            })
        }
        await tx.draftRateJoinTable.createMany({
            data: newDraftConnections,
            skipDuplicates: true,
        })
    }

    return currentRev.id
}

// Unlock the given rate
// * copy form data
// * set relationships based on last submission
async function unlockRate(
    client: PrismaClient,
    args: UnlockRateArgsType
): Promise<RateType | Error> {
    const { rateRevisionID, unlockedByUserID, unlockReason } = args
    let rateID = args.rateID

    // this is a hack that should not outlive protobuf. Protobufs only have
    // rate revision IDs in them, so we allow submitting by rate revisionID from our submitHPP resolver
    if (!rateID && !rateRevisionID) {
        return new Error(
            'Either rateID or rateRevisionID must be supplied. both are blank'
        )
    }

    try {
        return await client.$transaction(async (tx) => {
            if (rateRevisionID) {
                const rate = await tx.rateRevisionTable.findUniqueOrThrow({
                    where: { id: rateRevisionID },
                })
                rateID = rate.id
            }

            if (!rateID) {
                throw new Error(
                    'Programming Error: we must have a rateID at this point.'
                )
            }

            const currentDateTime = new Date()
            // create the unlock info to be shared across all submissions.
            const unlockInfo = await tx.updateInfoTable.create({
                data: {
                    updatedAt: currentDateTime,
                    updatedByID: unlockedByUserID,
                    updatedReason: unlockReason,
                },
            })

            const submittedID = await unlockRateInDB(tx, rateID, unlockInfo.id)

            if (submittedID instanceof Error) {
                throw submittedID
            }

            return findRateWithHistory(tx, rateID)
        })
    } catch (err) {
        console.error('SUBMIT PRISMA CONTRACT ERR', err)
        return err
    }
}

export { unlockRate, unlockRateInDB }
export type { UnlockRateArgsType }
