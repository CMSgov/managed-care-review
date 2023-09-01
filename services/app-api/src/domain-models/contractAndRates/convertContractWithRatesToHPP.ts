import type {
    ActuaryContact,
    RateInfoType,
    SubmissionDocument,
    UnlockedHealthPlanFormDataType,
} from 'app-web/src/common-code/healthPlanFormDataType'
import type {
    HealthPlanPackageType,
    HealthPlanRevisionType,
} from '../HealthPlanPackageType'
import type { ContractType } from './contractTypes'
import {
    toDomain,
    toProtoBuffer,
} from 'app-web/src/common-code/proto/healthPlanFormDataProto'
import type { ContractRevisionWithRatesType } from './revisionTypes'

function convertContractWithRatesToUnlockedHPP(
    contract: ContractType
): HealthPlanPackageType | Error {
    console.info('Attempting to convert contract to health plan package')

    // Since drafts come in separate on the Contract type, we push it onto the revisions before converting below
    if (contract.draftRevision) {
        contract.revisions.unshift(contract.draftRevision)
    }

    const healthPlanRevisions =
        convertContractWithRatesRevtoHPPRev(contract)

    if (healthPlanRevisions instanceof Error) {
        return healthPlanRevisions
    }

    return {
        id: contract.id,
        stateCode: contract.stateCode,
        revisions: healthPlanRevisions,
    }
}

function convertContractWithRatesRevtoHPPRev(
    contract: ContractType
): HealthPlanRevisionType[] | Error {
    if (contract.status !== 'DRAFT') {
        return new Error(
            `Contract with ID: ${contract.id} status is not "DRAFT". Cannot convert to unlocked health plan package`
        )
    }

    let healthPlanRevisions: HealthPlanRevisionType[] | Error = []
    for (const contractRev of contract.revisions) {
        const unlockedHealthPlanFormData = convertContractWithRatesToFormData(contractRev, contract.stateCode, contract.stateNumber)

        const formDataProto = toProtoBuffer(unlockedHealthPlanFormData)

        // check that we can encode then decode with no issues
        const domainData = toDomain(formDataProto)

        // If any revision has en error in decoding we break the loop and return an error
        if (domainData instanceof Error) {
            healthPlanRevisions = new Error(
                `Could not convert contract revision with ID: ${contractRev.id} to health plan package revision: ${domainData}`
            )
            break
        }

        const healthPlanRevision: HealthPlanRevisionType = {
            id: contractRev.id,
            unlockInfo: contractRev.unlockInfo,
            submitInfo: contractRev.submitInfo,
            createdAt: contractRev.createdAt,
            formDataProto,
        }

        healthPlanRevisions.push(healthPlanRevision)
    }

    return healthPlanRevisions
}

// TODO: Clean up parameters into args and improve types to make things more strict
const convertContractWithRatesToFormData = (contractRev: ContractRevisionWithRatesType, stateCode: string, stateNumber: number): UnlockedHealthPlanFormDataType => {
    const rateInfos: RateInfoType[] = contractRev.rateRevisions.map((rateRev) => {
        const { rateType, rateCapitationType, rateCertificationName, rateDateCertified, rateDateEnd, rateDateStart, rateDocuments = [], supportingDocuments = [], rateProgramIDs, packagesWithSharedRateCerts, certifyingActuaryContacts = [], addtlActuaryContacts = [], amendmentEffectiveDateEnd, amendmentEffectiveDateStart, actuaryCommunicationPreference } = rateRev.formData
        return {
            id: rateRev.id, // form data ids are always revision ID
            rateType,
            rateCapitationType,
            rateDocuments: rateDocuments.map(
                (doc) => ({
                    ...doc,
                    documentCategories: ['RATES'],
                })
            ) as SubmissionDocument[],
            supportingDocuments: supportingDocuments.map(
                (doc) => ({
                    ...doc,
                    documentCategories: ['RATES_RELATED'],
                })
            ) as SubmissionDocument[],
            rateAmendmentInfo: {
                effectiveDateEnd: amendmentEffectiveDateEnd,
                effectiveDateStart: amendmentEffectiveDateStart
            },
            rateDateStart,
            rateDateEnd,
            rateDateCertified,
            rateProgramIDs,
            rateCertificationName,
            actuaryContacts: [...certifyingActuaryContacts, addtlActuaryContacts] as ActuaryContact[],
            actuaryCommunicationPreference,
            packagesWithSharedRateCerts
        }
    })
    const unlockedHealthPlanFormData: UnlockedHealthPlanFormDataType = {
        id: contractRev.id,
        createdAt: contractRev.createdAt,
        updatedAt: contractRev.updatedAt,
        status: 'DRAFT',
        stateCode: stateCode,
        stateNumber: stateNumber,
        programIDs: contractRev.formData.programIDs,
        populationCovered: contractRev.formData.populationCovered,
        submissionType: contractRev.formData.submissionType,
        riskBasedContract: contractRev.formData.riskBasedContract,
        submissionDescription: contractRev.formData.submissionDescription,
        stateContacts: contractRev.formData.stateContacts,
        addtlActuaryCommunicationPreference: undefined,
        addtlActuaryContacts: [],
        documents: contractRev.formData.supportingDocuments.map((doc) => ({
            ...doc,
            documentCategories: ['CONTRACT_RELATED'],
        })) as SubmissionDocument[],
        contractType: contractRev.formData.contractType,
        contractExecutionStatus:
            contractRev.formData.contractExecutionStatus,
        contractDocuments: contractRev.formData.contractDocuments.map(
            (doc) => ({
                ...doc,
                documentCategories: ['CONTRACT'],
            })
        ) as SubmissionDocument[],
        contractDateStart: contractRev.formData.contractDateStart,
        contractDateEnd: contractRev.formData.contractDateEnd,
        managedCareEntities: contractRev.formData.managedCareEntities,
        federalAuthorities: contractRev.formData.federalAuthorities,
        contractAmendmentInfo: {
            modifiedProvisions: {
                inLieuServicesAndSettings:
                    contractRev.formData.inLieuServicesAndSettings,
                modifiedBenefitsProvided:
                    contractRev.formData.modifiedBenefitsProvided,
                modifiedGeoAreaServed:
                    contractRev.formData.modifiedGeoAreaServed,
                modifiedMedicaidBeneficiaries:
                    contractRev.formData.modifiedMedicaidBeneficiaries,
                modifiedRiskSharingStrategy:
                    contractRev.formData.modifiedRiskSharingStrategy,
                modifiedIncentiveArrangements:
                    contractRev.formData.modifiedIncentiveArrangements,
                modifiedWitholdAgreements:
                    contractRev.formData.modifiedWitholdAgreements,
                modifiedStateDirectedPayments:
                    contractRev.formData.modifiedStateDirectedPayments,
                modifiedPassThroughPayments:
                    contractRev.formData.modifiedPassThroughPayments,
                modifiedPaymentsForMentalDiseaseInstitutions:
                    contractRev.formData
                        .modifiedPaymentsForMentalDiseaseInstitutions,
                modifiedMedicalLossRatioStandards:
                    contractRev.formData.modifiedMedicalLossRatioStandards,
                modifiedOtherFinancialPaymentIncentive:
                    contractRev.formData
                        .modifiedOtherFinancialPaymentIncentive,
                modifiedEnrollmentProcess:
                    contractRev.formData.modifiedEnrollmentProcess,
                modifiedGrevienceAndAppeal:
                    contractRev.formData.modifiedGrevienceAndAppeal,
                modifiedNetworkAdequacyStandards:
                    contractRev.formData.modifiedNetworkAdequacyStandards,
                modifiedLengthOfContract:
                    contractRev.formData.modifiedLengthOfContract,
                modifiedNonRiskPaymentArrangements:
                    contractRev.formData.modifiedNonRiskPaymentArrangements,
            },
        },
        rateInfos
    }

    return unlockedHealthPlanFormData
}

export {
    convertContractWithRatesRevtoHPPRev,
    convertContractWithRatesToUnlockedHPP,
    convertContractWithRatesToFormData
}
