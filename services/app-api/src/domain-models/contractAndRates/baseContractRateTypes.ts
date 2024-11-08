import { z } from 'zod'
import {
    contractPackageSubmissionSchema,
    ratePackageSubmissionSchema,
} from './packageSubmissions'
import { contractRevisionSchema, rateRevisionSchema } from './revisionTypes'
import { statusSchema, reviewStatusSchema } from './statusType'
import {
    indexContractQuestionsPayload,
    indexRateQuestionsPayload,
} from '../QuestionsType'
import { updateInfoSchema } from './updateInfoType'
import { contractReviewActionSchema } from './contractReviewActionType'
// Contract represents the contract specific information in a submission package
// All that data is contained in revisions, each revision represents the data in a single submission
// submissions are kept intact here across time
const contractWithoutDraftRatesSchema = z.object({
    id: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
    status: statusSchema,
    reviewStatus: reviewStatusSchema.optional(),
    stateCode: z.string(),
    mccrsID: z.string().optional(),
    stateNumber: z.number().min(1),
    // If this contract is in a DRAFT or UNLOCKED status, there will be a draftRevision
    draftRevision: contractRevisionSchema.optional(),
    reviewStatusActions: z.array(contractReviewActionSchema).optional(),
    // All revisions are submitted and in reverse chronological order
    revisions: z.array(contractRevisionSchema),

    packageSubmissions: z.array(contractPackageSubmissionSchema),

    questions: indexContractQuestionsPayload.optional(),
})

type ContractWithoutDraftRatesType = z.infer<
    typeof contractWithoutDraftRatesSchema
>

const rateWithoutDraftContractsSchema = z.object({
    id: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
    status: statusSchema,
    stateCode: z.string(),
    parentContractID: z.string().uuid(),
    stateNumber: z.number().min(1),
    withdrawInfo: updateInfoSchema.optional(),
    // If this rate is in a DRAFT or UNLOCKED status, there will be a draftRevision
    draftRevision: rateRevisionSchema.optional(),
    // All revisions are submitted and in reverse chronological order
    revisions: z.array(rateRevisionSchema),

    packageSubmissions: z.array(ratePackageSubmissionSchema),

    questions: indexRateQuestionsPayload.optional(),
})

type RateWithoutDraftContractsType = z.infer<
    typeof rateWithoutDraftContractsSchema
>

export { contractWithoutDraftRatesSchema, rateWithoutDraftContractsSchema }

export type { ContractWithoutDraftRatesType, RateWithoutDraftContractsType }
