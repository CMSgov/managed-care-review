// Draft state submission is a health plan that a state user is still working on

// GQL SCHEMA MATCHED TYPES
type SubmissionType = 'CONTRACT_ONLY' | 'CONTRACT_AND_RATES'
export type CapitationRatesAmendedReason = 'ANNUAL' | 'MIDYEAR' | 'OTHER'

type DocumentCategoryType =
    | 'CONTRACT'
    | 'RATES'
    | 'CONTRACT_RELATED'
    | 'RATES_RELATED'

type SubmissionDocument = {
    name: string
    s3URL: string
    documentCategories: DocumentCategoryType[]
}

type ContractAmendmentInfo = {
    itemsBeingAmended: string[]
    otherItemBeingAmended?: string
    capitationRatesAmendedInfo?: {
        reason?: CapitationRatesAmendedReason
        otherReason?: string
    }
}

type RateAmendmentInfo = {
    effectiveDateStart?: Date
    effectiveDateEnd?: Date
}

type ContractType = 'BASE' | 'AMENDMENT'

type ContractExecutionStatus = 'EXECUTED' | 'UNEXECUTED'

type ActuarialFirmType =
    | 'MERCER'
    | 'MILLIMAN'
    | 'OPTUMAS'
    | 'GUIDEHOUSE'
    | 'DELOITTE'
    | 'STATE_IN_HOUSE'
    | 'OTHER'

type ActuaryCommunicationType = 'OACT_TO_ACTUARY' | 'OACT_TO_STATE'

type FederalAuthority =
    | 'STATE_PLAN'
    | 'WAIVER_1915B'
    | 'WAIVER_1115'
    | 'VOLUNTARY'
    | 'BENCHMARK'
    | 'TITLE_XXI'

type StateContact = {
    name: string
    titleRole: string
    email: string
}

type ActuaryContact = {
    name: string
    titleRole: string
    email: string
    actuarialFirm?: ActuarialFirmType
    actuarialFirmOther?: string
}

type RateType = 'NEW' | 'AMENDMENT'

type ManagedCareEntity = 'MCO' | 'PIHP' | 'PAHP' | 'PCCM'

type AmendableItems =
    | 'BENEFITS_PROVIDED'
    | 'CAPITATION_RATES'
    | 'ENCOUNTER_DATA'
    | 'ENROLLE_ACCESS'
    | 'ENROLLMENT_PROCESS'
    | 'FINANCIAL_INCENTIVES'
    | 'GEO_AREA_SERVED'
    | 'GRIEVANCES_AND_APPEALS_SYSTEM'
    | 'LENGTH_OF_CONTRACT_PERIOD'
    | 'NON_RISK_PAYMENT'
    | 'PROGRAM_INTEGRITY'
    | 'QUALITY_STANDARDS'
    | 'RISK_SHARING_MECHANISM'

// MAIN
export type UnlockedHealthPlanFormDataType = {
    id: string
    createdAt: Date
    updatedAt: Date
    status: 'DRAFT'
    stateCode: string
    stateNumber: number
    programIDs: string[]
    submissionType: SubmissionType
    submissionDescription: string
    stateContacts: StateContact[]
    actuaryContacts: ActuaryContact[]
    actuaryCommunicationPreference?: ActuaryCommunicationType
    documents: SubmissionDocument[]
    contractType?: ContractType
    contractExecutionStatus?: ContractExecutionStatus
    contractDocuments: SubmissionDocument[]
    contractDateStart?: Date
    contractDateEnd?: Date
    managedCareEntities: string[]
    federalAuthorities: FederalAuthority[]
    contractAmendmentInfo?: ContractAmendmentInfo
    rateType?: RateType
    rateDocuments: SubmissionDocument[]
    rateDateStart?: Date
    rateDateEnd?: Date
    rateDateCertified?: Date
    rateAmendmentInfo?: RateAmendmentInfo
}

type RateDataType = {
    rateType?: 'AMENDMENT' | 'NEW' | null
    rateDateStart?: Date
    rateDateEnd?: Date
    rateDateCertified?: Date
    rateAmendmentInfo?: {
        effectiveDateEnd?: Date
        effectiveDateStart?: Date
    } | null
}

export type {
    DocumentCategoryType,
    SubmissionType,
    SubmissionDocument,
    RateType,
    StateContact,
    ActuaryContact,
    ActuaryContactType,
    ActuarialFirmType,
    ActuaryCommunicationType,
    ContractType,
    FederalAuthority,
    ManagedCareEntity,
    UnlockedHealthPlanFormDataType,
    AmendableItems,
    ContractAmendmentInfo,
    ContractExecutionStatus,
    RateDataType,
}
