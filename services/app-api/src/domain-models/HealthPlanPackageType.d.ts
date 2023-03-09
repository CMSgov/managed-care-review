import { IndexQuestionsPayload } from './QuestionsType'

type HealthPlanPackageStatusType =
    | 'DRAFT'
    | 'SUBMITTED'
    | 'UNLOCKED'
    | 'RESUBMITTED'

type HealthPlanPackageType = {
    id: string
    stateCode: string
    revisions: HealthPlanRevisionType[]
    questions?: IndexQuestionsPayload
}

type UpdateInfoType = {
    updatedAt: Date
    updatedBy: string
    updatedReason: string
}

type HealthPlanRevisionType = {
    id: string
    unlockInfo?: UpdateInfoType
    submitInfo?: UpdateInfoType
    createdAt: Date
    formDataProto: Uint8Array
}

export {
    HealthPlanPackageStatusType,
    HealthPlanPackageType,
    UpdateInfoType,
    HealthPlanRevisionType,
}
