import { z } from 'zod'
import { contractRevisionWithRatesSchema } from './revisionTypes'
import { statusSchema } from './statusType'

// Contract represents the contract specific information in a submission package
// All that data is contained in revisions, each revision represents the data in a single submission
// submissions are kept intact here across time
const contractSchema = z.object({
    id: z.string().uuid(),
    status: statusSchema,
    stateCode: z.string(),
    mccrsID: z.string().optional(),
    stateNumber: z.number().min(1),
    // If this contract is in a DRAFT or UNLOCKED status, there will be a draftRevision
    draftRevision: contractRevisionWithRatesSchema.optional(),
    // All revisions are submitted and in reverse chronological order
    revisions: z.array(contractRevisionWithRatesSchema),
})

const draftContractSchema = contractSchema.extend({
    status: z.literal('DRAFT'),
    draftRevision: contractRevisionWithRatesSchema,
    revisions: z.array(contractRevisionWithRatesSchema).min(1),
})

type ContractType = z.infer<typeof contractSchema>
type DraftContractType = z.infer<typeof draftContractSchema>

export { contractRevisionWithRatesSchema, draftContractSchema, contractSchema }

export type { ContractType, DraftContractType }
