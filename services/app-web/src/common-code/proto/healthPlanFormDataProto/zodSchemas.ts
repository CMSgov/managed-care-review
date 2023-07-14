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

const populationCoveredSchema = z.union([
    z.literal('MEDICAID'),
    z.literal('CHIP'),
    z.literal('MEDICAID_AND_CHIP'),
])

const capitationRatesAmendedReasonSchema = z.union([
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
    sha256: z.string().optional(),
})

const contractAmendmentInfoSchema = z.object({
    modifiedProvisions: z.object({
        inLieuServicesAndSettings: z.boolean().optional(),
        modifiedBenefitsProvided: z.boolean().optional(),
        modifiedGeoAreaServed: z.boolean().optional(),
        modifiedMedicaidBeneficiaries: z.boolean().optional(),
        modifiedRiskSharingStrategy: z.boolean().optional(),
        modifiedIncentiveArrangements: z.boolean().optional(),
        modifiedWitholdAgreements: z.boolean().optional(),
        modifiedStateDirectedPayments: z.boolean().optional(),
        modifiedPassThroughPayments: z.boolean().optional(),
        modifiedPaymentsForMentalDiseaseInstitutions: z.boolean().optional(),
        modifiedMedicalLossRatioStandards: z.boolean().optional(),
        modifiedOtherFinancialPaymentIncentive: z.boolean().optional(),
        modifiedEnrollmentProcess: z.boolean().optional(),
        modifiedGrevienceAndAppeal: z.boolean().optional(),
        modifiedNetworkAdequacyStandards: z.boolean().optional(),
        modifiedLengthOfContract: z.boolean().optional(),
        modifiedNonRiskPaymentArrangements: z.boolean().optional(),
    }),
})

const rateAmendmentInfoSchema = z.object({
    effectiveDateStart: z.date().optional(),
    effectiveDateEnd: z.date().optional(),
})

const contractTypeSchema = z.union([z.literal('BASE'), z.literal('AMENDMENT')])

const contractExecutionStatusSchema = z.union([
    z.literal('EXECUTED'),
    z.literal('UNEXECUTED'),
])

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

const sharedRateCertDisplay = z.object({
    packageName: z.string(),
    packageId: z.string(),
})

const rateTypeSchema = z.union([z.literal('NEW'), z.literal('AMENDMENT')])

const rateCapitationTypeSchema = z.union([
    z.literal('RATE_CELL'),
    z.literal('RATE_RANGE'),
])

const rateInfosTypeSchema = z.object({
    id: z.string().optional(),
    rateType: rateTypeSchema.optional(),
    rateCapitationType: rateCapitationTypeSchema.optional(),
    rateDocuments: z.array(submissionDocumentSchema).optional(),
    supportingDocuments: z.array(submissionDocumentSchema).optional(),
    rateDateStart: z.date().optional(),
    rateDateEnd: z.date().optional(),
    rateDateCertified: z.date().optional(),
    rateAmendmentInfo: rateAmendmentInfoSchema.optional(),
    rateProgramIDs: z.array(z.string()),
    rateCertificationName: z.string().optional(),
    actuaryContacts: z.array(actuaryContactSchema),
    actuaryCommunicationPreference: actuaryCommunicationTypeSchema.optional(),
    packagesWithSharedRateCerts: z.array(sharedRateCertDisplay),
})

const unlockedHealthPlanFormDataZodSchema = z.object({
    id: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    status: z.literal('DRAFT'),
    stateCode: z.string(),
    stateNumber: z.number(),
    programIDs: z.array(z.string()),
    populationCovered: populationCoveredSchema.optional(),
    submissionType: submissionTypeSchema,
    submissionDescription: z.string(),
    riskBasedContract: z.boolean().optional(),
    stateContacts: z.array(stateContactSchema),
    addtlActuaryContacts: z.array(actuaryContactSchema),
    addtlActuaryCommunicationPreference:
        actuaryCommunicationTypeSchema.optional(),
    documents: z.array(submissionDocumentSchema),
    contractType: contractTypeSchema.optional(),
    contractExecutionStatus: contractExecutionStatusSchema.optional(),
    contractDocuments: z.array(submissionDocumentSchema),
    contractDateStart: z.date().optional(),
    contractDateEnd: z.date().optional(),
    managedCareEntities: z.array(z.string()),
    federalAuthorities: z.array(federalAuthoritySchema),
    contractAmendmentInfo: contractAmendmentInfoSchema.optional(),
    rateInfos: z.array(rateInfosTypeSchema),
})

/*
      This locked Zod schema exists as a light correctness check for the proto decode step (which otherwise does no significant type checking)

      This is not the primary validation for user entered data in the app. It does NOT represent the latest valid state of all fields on the form.
      Look at the formik schemas (client side) and functions like isValidContract isValidRate functions (server side) if you are looking for the latest schemas for locked subs.
*/
const lockedHealthPlanFormDataZodSchema = z.object({
    id: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    status: z.literal('SUBMITTED'),
    stateCode: z.string(),
    stateNumber: z.number(),
    programIDs: z.array(z.string()),
    submissionType: submissionTypeSchema,
    submissionDescription: z.string(),
    contractDocuments: z.array(submissionDocumentSchema),
})

export {
    unlockedHealthPlanFormDataZodSchema,
    lockedHealthPlanFormDataZodSchema,
    rateCapitationTypeSchema,
    rateTypeSchema,
    sharedRateCertDisplay,
    actuaryContactSchema,
    stateContactSchema,
    federalAuthoritySchema,
    actuaryCommunicationTypeSchema,
    actuarialFirmTypeSchema,
    contractExecutionStatusSchema,
    contractTypeSchema,
    rateAmendmentInfoSchema,
    submissionDocumentSchema,
    capitationRatesAmendedReasonSchema,
    populationCoveredSchema,
    submissionTypeSchema,
}
