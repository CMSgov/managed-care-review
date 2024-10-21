import type { PrismaTransactionType } from '../prismaTypes'
import {
    rateRevisionSchema,
    type RateRevisionType,
} from '../../domain-models/contractAndRates'
import { NotFoundError } from '../postgresErrors'

async function findRateRevision(
    client: PrismaTransactionType,
    rateRevisionID: string
): Promise<RateRevisionType | Error> {
    try {
        const rateRevision = await client.rateRevisionTable.findUnique({
            where: {
                id: rateRevisionID,
            },
            include: {
                rate: {
                    include: {
                        revisions: true,
                    },
                },
                unlockInfo: true,
                submitInfo: true,
            },
        })

        if (!rateRevision) {
            const err = `PRISMA ERROR: Cannot find rate revision with id: ${rateRevisionID}`
            return new NotFoundError(err)
        }

        const parseResult = rateRevisionSchema.safeParse(rateRevision)
        if (!parseResult.success) {
            const error = new Error(
                `Zod parsing error: ${parseResult.error.message}`
            )
            console.error(error)
            return error
        }

        return parseResult.data
    } catch (err) {
        console.error('PRISMA ERROR', err)
        return err
    }
}

export { findRateRevision }
