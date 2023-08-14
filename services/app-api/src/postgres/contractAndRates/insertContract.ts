import type {
    PrismaClient,
    PopulationCoverageType,
    SubmissionType,
    ContractType as PrismaContractType,
} from '@prisma/client'
import type { ContractType } from '../../domain-models/contractAndRates'
import { parseDraftContract } from './parseDraftContract'
import { includeDraftContractRevisionsWithDraftRates } from './prismaDraftContractHelpers'

type InsertContractArgsType = {
    stateCode: string
    populationCovered?: PopulationCoverageType
    programIDs: string[]
    riskBasedContract?: boolean
    submissionType: SubmissionType
    submissionDescription: string
    contractType: PrismaContractType
}

// creates a new contract, with a new revision
async function insertDraftContract(
    client: PrismaClient,
    args: InsertContractArgsType
): Promise<ContractType | Error> {
    try {
        return await client.$transaction(async (tx) => {
            const { latestStateSubmissionNumber } = await tx.state.update({
                data: {
                    latestStateSubmissionNumber: {
                        increment: 1,
                    },
                },
                where: {
                    stateCode: args.stateCode,
                },
            })

            const contract = await tx.contractTable.create({
                data: {
                    stateCode: args.stateCode,
                    stateNumber: latestStateSubmissionNumber,
                    revisions: {
                        create: {
                            populationCovered: args.populationCovered,
                            programIDs: args.programIDs,
                            riskBasedContract: args.riskBasedContract,
                            submissionType: args.submissionType,
                            submissionDescription: args.submissionDescription,
                            contractType: args.contractType,
                        },
                    },
                },
                include: {
                    revisions: {
                        include: includeDraftContractRevisionsWithDraftRates,
                    },
                },
            })

            return parseDraftContract(contract)
        })
    } catch (err) {
        console.error('CONTRACT PRISMA ERR', err)
        return err
    }
}

export { insertDraftContract }
export type { InsertContractArgsType }
