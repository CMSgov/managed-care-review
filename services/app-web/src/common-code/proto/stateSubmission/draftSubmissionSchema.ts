/*
 * This file was generated by ts-to-zod, which turned out to be more fragile
 * than I hoped. So I'm checking this file in for now. Some future reconciliation between
 * this and our yup parsers and the type assertion we use for StateSubmission should come
 * in the future.
 */
import { z } from 'zod'

const submissionTypeSchema = z.union([
    z.literal('CONTRACT_ONLY'),
    z.literal('CONTRACT_AND_RATES'),
])

export const capitationRatesAmendedReasonSchema = z.union([
    z.literal('ANNUAL'),
    z.literal('MIDYEAR'),
    z.literal('OTHER'),
])

const submissionDocumentSchema = z.object({
    name: z.string(),
    s3URL: z.string(),
    documentCategories: z.array(
        z
            .union([
                z.literal('CONTRACT'),
                z.literal('RATES'),
                z.literal('CONTRACT_RELATED'),
                z.literal('RATES_RELATED'),
            ])
            .optional()
    ),
})

const contractAmendmentInfoSchema = z.object({
    itemsBeingAmended: z.array(z.string()),
    otherItemBeingAmended: z.string().optional(),
    capitationRatesAmendedInfo: z
        .object({
            reason: capitationRatesAmendedReasonSchema.optional(),
            otherReason: z.string().optional(),
        })
        .optional(),
    relatedToCovid19: z.boolean().optional(),
    relatedToVaccination: z.boolean().optional(),
})

const rateAmendmentInfoSchema = z.object({
    effectiveDateStart: z.date().optional(),
    effectiveDateEnd: z.date().optional(),
})

const contractTypeSchema = z.union([z.literal('BASE'), z.literal('AMENDMENT')])

const actuarialFirmTypeSchema = z.union([
    z.literal('MERCER'),
    z.literal('MILLIMAN'),
    z.literal('OPTUMAS'),
    z.literal('GUIDEHOUSE'),
    z.literal('DELOITTE'),
    z.literal('STATE_IN_HOUSE'),
    z.literal('OTHER'),
])

const actuaryCommunicationTypeSchema = z.union([
    z.literal('OACT_TO_ACTUARY'),
    z.literal('OACT_TO_STATE'),
])

const federalAuthoritySchema = z.union([
    z.literal('STATE_PLAN'),
    z.literal('WAIVER_1915B'),
    z.literal('WAIVER_1115'),
    z.literal('VOLUNTARY'),
    z.literal('BENCHMARK'),
    z.literal('TITLE_XXI'),
])

const stateContactSchema = z.object({
    name: z.string(),
    titleRole: z.string(),
    email: z.string(),
})

const actuaryContactSchema = z.object({
    name: z.string(),
    titleRole: z.string(),
    email: z.string(),
    actuarialFirm: actuarialFirmTypeSchema.optional(),
    actuarialFirmOther: z.string().optional(),
})

const rateTypeSchema = z.union([z.literal('NEW'), z.literal('AMENDMENT')])

// Commenting out because this wasn't being used but was raising lint warning -hw
// const managedCareEntitySchema = z.union([
//     z.literal('MCO'),
//     z.literal('PIHP'),
//     z.literal('PAHP'),
//     z.literal('PCCM'),
// ])

// const amendableItemsSchema = z.union([
//     z.literal('BENEFITS_PROVIDED'),
//     z.literal('CAPITATION_RATES'),
//     z.literal('ENCOUNTER_DATA'),
//     z.literal('ENROLLE_ACCESS'),
//     z.literal('ENROLLMENT_PROCESS'),
//     z.literal('FINANCIAL_INCENTIVES'),
//     z.literal('GEO_AREA_SERVED'),
//     z.literal('GRIEVANCES_AND_APPEALS_SYSTEM'),
//     z.literal('LENGTH_OF_CONTRACT_PERIOD'),
//     z.literal('NON_RISK_PAYMENT'),
//     z.literal('PROGRAM_INTEGRITY'),
//     z.literal('QUALITY_STANDARDS'),
//     z.literal('RISK_SHARING_MECHANISM'),
// ])

export const draftSubmissionTypeSchema = z.object({
    id: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    status: z.literal('DRAFT'),
    stateCode: z.string(),
    stateNumber: z.number(),
    programIDs: z.array(z.string()),
    submissionType: submissionTypeSchema,
    submissionDescription: z.string(),
    stateContacts: z.array(stateContactSchema),
    actuaryContacts: z.array(actuaryContactSchema),
    actuaryCommunicationPreference: actuaryCommunicationTypeSchema.optional(),
    documents: z.array(submissionDocumentSchema),
    contractType: contractTypeSchema.optional(),
    contractDocuments: z.array(submissionDocumentSchema),
    contractDateStart: z.date().optional(),
    contractDateEnd: z.date().optional(),
    managedCareEntities: z.array(z.string()),
    federalAuthorities: z.array(federalAuthoritySchema),
    contractAmendmentInfo: contractAmendmentInfoSchema.optional(),
    rateType: rateTypeSchema.optional(),
    rateDocuments: z.array(submissionDocumentSchema).optional(),
    rateDateStart: z.date().optional(),
    rateDateEnd: z.date().optional(),
    rateDateCertified: z.date().optional(),
    rateAmendmentInfo: rateAmendmentInfoSchema.optional(),
})
