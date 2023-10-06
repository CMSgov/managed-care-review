import { findContractWithHistory } from './findContractWithHistory'
import { NotFoundError } from '../storeError'
import type { PrismaClient } from '@prisma/client'
import type { ContractType } from '../../domain-models/contractAndRates'
import { includeFullContract } from './prismaSubmittedContractHelpers'

type UpdateContractNoFormArgsType = {
    contractID: string
    mccrsID?: string
}

// Update the MCCRS record number
async function updateContract(
    client: PrismaClient,
    args: UpdateContractNoFormArgsType
): Promise<ContractType | NotFoundError | Error> {
    const { contractID, mccrsID } = args

    try {
        return await client.$transaction(async (tx) => {
            // Get the Contract associated with this given contract ID
            const currentContract = await tx.contractTable.findFirst({
                where: {
                    id: contractID,
                },
                include: includeFullContract,
            })

            if (!currentContract) {
                const err = `PRISMA ERROR: Cannot find the current contract to update with contract id: ${contractID}`
                console.error(err)
                return new NotFoundError(err)
            }
            await tx.contractTable.update({
                data: {
                    mccrsID,
                },
                where: {
                    id: contractID,
                },
            })
            const contract = findContractWithHistory(tx, contractID)

            return contract
        })
    } catch (err) {
        console.error('Prisma error updating contract', err)
        return err
    }
}

export { updateContract }
export type { UpdateContractNoFormArgsType }
