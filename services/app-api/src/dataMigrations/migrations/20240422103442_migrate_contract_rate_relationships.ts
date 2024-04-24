import type { PrismaTransactionType } from "../../postgres/prismaTypes"

export async function migrate(
    client: PrismaTransactionType,
    contractIDs?: string[]
): Promise<Error | undefined> {

    // get all the old contract x rate relationships and splat them into the new tables
    try {
        const contracts = await client.contractTable.findMany({
            where:
                contractIDs
                ? {
                      id: { in: contractIDs },
                  }
                : undefined,
            include: {
                revisions: {
                    include: {
                        submitInfo: true,
                        unlockInfo: true,
                        relatedSubmisions: true,
                        rateRevisions: {
                            orderBy: {
                                validAfter: 'asc',
                            },
                            include: {
                                rateRevision: {
                                    include: {
                                        submitInfo: true,
                                        unlockInfo: true,
                                        rateDocuments: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        })


        const unmigrateRevisions = []
        for (const contract of contracts) {
            for (const contractRev of contract.revisions) {

                if (contractRev.relatedSubmisions.length > 0) {
                    continue
                }
                unmigrateRevisions.push(contractRev)
            }
        }

        console.log('found Unmigrated Revs: ', unmigrateRevisions.length)


        for (const contractRev of unmigrateRevisions) {
            const allLinkedRates = contractRev.rateRevisions

            const contractSubmissionTime = contractRev.submitInfo?.updatedAt

            if (contractSubmissionTime) {
                // we're in a submitted contract rev

                console.log('rateLinkTimes', contractRev.rateRevisions.map(rr => rr.validAfter))
                // console.log('rateLinkids', contractRev.rateRevisions.map(rr => rr.rateRevision))
                // let firstLinkTime: Date | undefined = undefined
                // const concurrentlySubmittedRateLinks = contractRev.rateRevisions.filter(rr => {
                //     if (!firstLinkTime) {
                //         firstLinkTime = rr.validAfter
                //         return true
                //     }
                //     if (rr.validAfter === firstLinkTime) {
                //         return true
                //     } else {
                //         return false
                //     }
                // }).map(rr => rr.rateRevision)

                let firstRateLinkTime: Date | undefined = undefined
                const concurrentlySubmittedRateLinks = allLinkedRates.filter((linkedRate) => {
                    if (linkedRate.isRemoval) {
                        return false
                    }

                    const rateSubmissionTime = linkedRate.validAfter

                    if (!firstRateLinkTime) {
                        firstRateLinkTime = rateSubmissionTime
                        return true
                    }

                    console.log('diff', Math.abs(rateSubmissionTime.getTime() - firstRateLinkTime.getTime()))


                    if (Math.abs(rateSubmissionTime.getTime() - firstRateLinkTime.getTime()) < 1000) {
                        return true
                    } else {
                        return false
                    }
                }).map(rr => rr.rateRevision)

                console.log('filtered out related rates', contractRev.contractID, concurrentlySubmittedRateLinks.length,  allLinkedRates.length - concurrentlySubmittedRateLinks.length)

                const concurrentRateIDs = concurrentlySubmittedRateLinks.map((r)=> r.rateID)
                const rateIDSet: {[id: string]: boolean} = {}
                for (const rID of concurrentRateIDs) {
                    rateIDSet[rID] = true
                }
                if (concurrentRateIDs.length != Object.keys(rateIDSet).length) {
                    console.error('found a collision!', contractRev.id, concurrentRateIDs)
                    throw new Error('found a collision')
                }

                const contractSubmissionID = contractRev.submitInfoID
                if (!contractSubmissionID) {
                    throw new Error('Better have an id, we had one above')
                }

                // add contract+submitinfo to related contract submissions
                const submittedRev = await client.contractRevisionTable.update({
                    where: {
                        id: contractRev.id
                    }, 
                    data: {
                        relatedSubmisions: {
                            connect: {
                                id: contractSubmissionID
                            }
                        }
                    },
                    include: {
                        relatedSubmisions: true,
                    }
                })

                console.log('updateds sumitter ev', submittedRev)

                let ratePosition = 1
                for (const rateRev of concurrentlySubmittedRateLinks) {
                    const oldSubmitInfoID = rateRev.submitInfo?.id


                    console.log('setting rate to contract sub id: ', contractSubmissionID, contractRev.id, ratePosition)
                    // set the submitInfo on each rate to be the same ID as the contract’s
                    // add rates+submitInfo to related rate submissions
                    // add join entries with rate position for contract + update info + rate rev.
                    await client.rateRevisionTable.update({
                        where: {
                            id: rateRev.id,
                        },
                        data: {
                            submitInfoID: contractSubmissionID,
                            relatedSubmissions: {
                                connect: {
                                    id: contractSubmissionID
                                }
                            },
                            submissionPackages: {
                                create: {
                                    submissionID: contractSubmissionID,
                                    contractRevisionID: contractRev.id,
                                    ratePosition: ratePosition,
                                }
                            }
                        }
                    })

                    if (!oldSubmitInfoID) {
                        throw new Error('Better have an old submit id, we had one above')
                    }
                    if (oldSubmitInfoID !== contractSubmissionID) {
                        console.log('deleting', oldSubmitInfoID, rateRev.id, contractRev.id, contractRev.contractID)
                        // ignore updateInfos we've already deleted
                        await client.updateInfoTable.deleteMany({
                            where: {
                                id: oldSubmitInfoID,
                            },
                        })
                    }

                    ratePosition ++
                }
            }
        }

    } catch (err) {
        console.error('Prisma Error: ', err)
        return err
    }

    return undefined
}
