import type { Prisma, UpdateInfoTable } from '@prisma/client'
import type { DocumentCategoryType } from 'app-web/src/common-code/healthPlanFormDataType'
import type {
    ContractFormDataType,
    RateFormDataType,
    RateRevisionType,
    ContractStatusType,
    UpdateInfoType,
} from '../../domain-models/contractAndRates'

const subincludeUpdateInfo = {
    updatedBy: true,
} satisfies Prisma.UpdateInfoTableInclude

const includeUpdateInfo = {
    include: subincludeUpdateInfo,
}

type UpdateInfoTableWithUpdater = Prisma.UpdateInfoTableGetPayload<{
    include: typeof subincludeUpdateInfo
}>

function convertUpdateInfoToDomainModel(
    info?: UpdateInfoTableWithUpdater | null
): UpdateInfoType | undefined {
    if (!info) {
        return undefined
    }

    return {
        updatedAt: info.updatedAt,
        updatedBy: info.updatedBy.email,
        updatedReason: info.updatedReason,
    }
}

// -----

function getContractStatus(
    revision: {
        createdAt: Date
        submitInfo: UpdateInfoTable | null
    }[]
): ContractStatusType {
    // need to order revisions from latest to earliest
    const latestToEarliestRev = revision.sort(
        (revA, revB) => revB.createdAt.getTime() - revA.createdAt.getTime()
    )
    const latestRevision = latestToEarliestRev[0]
    return latestRevision?.submitInfo ? 'SUBMITTED' : 'DRAFT'
}

// ------

const includeRateFormData = {
    submitInfo: includeUpdateInfo,
    unlockInfo: includeUpdateInfo,

    rateDocuments: true,
    supportingDocuments: true,
    certifyingActuaryContacts: true,
    addtlActuaryContacts: true,
} satisfies Prisma.RateRevisionTableInclude

type RateRevisionTableWithFormData = Prisma.RateRevisionTableGetPayload<{
    include: typeof includeRateFormData
}>

function rateFormDataToDomainModel(
    rateRevision: RateRevisionTableWithFormData
): RateFormDataType {
    return {
        id: rateRevision.id,
        rateType: rateRevision.rateType ?? undefined,
        rateCapitationType: rateRevision.rateCapitationType ?? undefined,
        rateDocuments: rateRevision.rateDocuments
            ? rateRevision.rateDocuments.map((doc) => ({
                  name: doc.name,
                  s3URL: doc.s3URL,
                  sha256: doc.sha256 ?? undefined,
                  documentCategories: ['RATES'] as DocumentCategoryType[],
              }))
            : [],
        supportingDocuments: rateRevision.supportingDocuments
            ? rateRevision.supportingDocuments.map((doc) => ({
                  name: doc.name,
                  s3URL: doc.s3URL,
                  sha256: doc.sha256 ?? undefined,
                  documentCategories: [
                      'RATES_RELATED',
                  ] as DocumentCategoryType[],
              }))
            : [],
        rateDateStart: rateRevision.rateDateStart ?? undefined,
        rateDateEnd: rateRevision.rateDateEnd ?? undefined,
        rateDateCertified: rateRevision.rateDateCertified ?? undefined,
        amendmentEffectiveDateStart:
            rateRevision.amendmentEffectiveDateStart ?? undefined,
        amendmentEffectiveDateEnd:
            rateRevision.amendmentEffectiveDateEnd ?? undefined,
        rateProgramIDs: rateRevision.rateProgramIDs,
        rateCertificationName: rateRevision.rateCertificationName ?? undefined,
        certifyingActuaryContacts: rateRevision.certifyingActuaryContacts
            ? rateRevision.certifyingActuaryContacts.map((actuary) => ({
                  name: actuary.name,
                  titleRole: actuary.titleRole,
                  email: actuary.email,
                  actuarialFirm: actuary.actuarialFirm,
                  actuarialFirmOther: actuary.actuarialFirmOther ?? undefined,
              }))
            : [],
        addtlActuaryContacts: rateRevision.addtlActuaryContacts
            ? rateRevision.addtlActuaryContacts.map((actuary) => ({
                  name: actuary.name,
                  titleRole: actuary.titleRole,
                  email: actuary.email,
                  actuarialFirm: actuary.actuarialFirm,
                  actuarialFirmOther: actuary.actuarialFirmOther ?? undefined,
              }))
            : [],
        actuaryCommunicationPreference:
            rateRevision.actuaryCommunicationPreference ?? undefined,
        packagesWithSharedRateCerts: [], // intentionally not handling packagesWithSharedRates yet - this is MR-3568
    }
}

function rateReivisionToDomainModel(
    revision: RateRevisionTableWithFormData
): RateRevisionType {
    return {
        id: revision.id,
        createdAt: revision.createdAt,
        updatedAt: revision.updatedAt,
        unlockInfo: convertUpdateInfoToDomainModel(revision.unlockInfo),
        submitInfo: convertUpdateInfoToDomainModel(revision.submitInfo),

        formData: rateFormDataToDomainModel(revision),
    }
}

function ratesRevisionsToDomainModel(
    rateRevisions: RateRevisionTableWithFormData[]
): RateRevisionType[] {
    return rateRevisions.map((rrev) => rateReivisionToDomainModel(rrev))
}

// ------

const includeContractFormData = {
    unlockInfo: includeUpdateInfo,
    submitInfo: includeUpdateInfo,

    stateContacts: true,
    contractDocuments: true,
    supportingDocuments: true,
} satisfies Prisma.ContractRevisionTableInclude

type ContractRevisionTableWithFormData =
    Prisma.ContractRevisionTableGetPayload<{
        include: typeof includeContractFormData
    }>

function contractFormDataToDomainModel(
    contractRevision: ContractRevisionTableWithFormData
): ContractFormDataType {
    return {
        submissionType: contractRevision.submissionType,
        submissionDescription: contractRevision.submissionDescription,
        contractType: contractRevision.contractType,
        programIDs: contractRevision.programIDs ?? [],
        populationCovered: contractRevision.populationCovered ?? undefined,
        riskBasedContract: contractRevision.riskBasedContract ?? undefined,
        stateContacts: contractRevision.stateContacts
            ? contractRevision.stateContacts.map((contact) => ({
                  name: contact.name,
                  titleRole: contact.titleRole,
                  email: contact.email,
              }))
            : [],
        supportingDocuments: contractRevision.supportingDocuments
            ? contractRevision.supportingDocuments.map((doc) => ({
                  name: doc.name,
                  s3URL: doc.s3URL,
                  sha256: doc.sha256 ?? undefined,
                  documentCategories: [
                      'CONTRACT_RELATED',
                  ] as DocumentCategoryType[],
              }))
            : [],
        contractExecutionStatus:
            contractRevision.contractExecutionStatus ?? undefined,
        contractDocuments: contractRevision.contractDocuments
            ? contractRevision.contractDocuments.map((doc) => ({
                  name: doc.name,
                  s3URL: doc.s3URL,
                  sha256: doc.sha256 ?? undefined,
                  documentCategories: ['CONTRACT'] as DocumentCategoryType[],
              }))
            : [],
        contractDateStart: contractRevision.contractDateStart ?? undefined,
        contractDateEnd: contractRevision.contractDateEnd ?? undefined,
        managedCareEntities: contractRevision.managedCareEntities ?? undefined,
        federalAuthorities: contractRevision.federalAuthorities ?? undefined,
        modifiedBenefitsProvided:
            contractRevision.modifiedBenefitsProvided ?? undefined,
        modifiedGeoAreaServed:
            contractRevision.modifiedGeoAreaServed ?? undefined,
        modifiedMedicaidBeneficiaries:
            contractRevision.modifiedMedicaidBeneficiaries ?? undefined,
        modifiedRiskSharingStrategy:
            contractRevision.modifiedRiskSharingStrategy ?? undefined,
        modifiedIncentiveArrangements:
            contractRevision.modifiedIncentiveArrangements ?? undefined,
        modifiedWitholdAgreements:
            contractRevision.modifiedWitholdAgreements ?? undefined,
        modifiedStateDirectedPayments:
            contractRevision.modifiedStateDirectedPayments ?? undefined,
        modifiedPassThroughPayments:
            contractRevision.modifiedPassThroughPayments ?? undefined,
        modifiedPaymentsForMentalDiseaseInstitutions:
            contractRevision.modifiedPaymentsForMentalDiseaseInstitutions ??
            undefined,
        modifiedMedicalLossRatioStandards:
            contractRevision.modifiedMedicalLossRatioStandards ?? undefined,
        modifiedOtherFinancialPaymentIncentive:
            contractRevision.modifiedOtherFinancialPaymentIncentive ??
            undefined,
        modifiedEnrollmentProcess:
            contractRevision.modifiedEnrollmentProcess ?? undefined,
        modifiedGrevienceAndAppeal:
            contractRevision.modifiedGrevienceAndAppeal ?? undefined,
        modifiedNetworkAdequacyStandards:
            contractRevision.modifiedNetworkAdequacyStandards ?? undefined,
        modifiedLengthOfContract:
            contractRevision.modifiedLengthOfContract ?? undefined,
        modifiedNonRiskPaymentArrangements:
            contractRevision.modifiedNonRiskPaymentArrangements ?? undefined,
        inLieuServicesAndSettings:
            contractRevision.inLieuServicesAndSettings ?? undefined,
    }
}

// -------

export type {
    UpdateInfoTableWithUpdater,
    RateRevisionTableWithFormData,
    ContractRevisionTableWithFormData,
}

export {
    includeUpdateInfo,
    includeContractFormData,
    includeRateFormData,
    getContractStatus,
    convertUpdateInfoToDomainModel,
    contractFormDataToDomainModel,
    rateFormDataToDomainModel,
    rateReivisionToDomainModel,
    ratesRevisionsToDomainModel,
}
