import type {
    ActuaryCommunicationType,
    ActuaryContact,
    HealthPlanFormDataType,
    RateInfoType,
    SubmissionDocument,
} from '../../../../app-web/src/common-code/healthPlanFormDataType'
import type {
    HealthPlanPackageType,
    HealthPlanRevisionType,
} from '../HealthPlanPackageType'
import type { ContractType } from './contractTypes'
import {
    toDomain,
    toProtoBuffer,
} from '../../../../app-web/src/common-code/proto/healthPlanFormDataProto'
import type { ContractRevisionWithRatesType } from './revisionTypes'
import { parsePartialHPFD } from '../../../../app-web/src/common-code/proto/healthPlanFormDataProto/toDomain'
import type { PartialHealthPlanFormData } from '../../../../app-web/src/common-code/proto/healthPlanFormDataProto/toDomain'
import { isEqualData } from '../../resolvers/healthPlanPackage/contractAndRates/resolverHelpers'

function convertContractWithRatesToUnlockedHPP(
    contract: ContractType
): HealthPlanPackageType | Error {
    console.info('Attempting to convert contract to health plan package')

    // Since drafts come in separate on the Contract type, we push it onto the revisions before converting below
    if (contract.draftRevision) {
        contract.revisions.unshift(contract.draftRevision)
    }

    const healthPlanRevisions = convertContractWithRatesRevtoHPPRev(contract)

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
    let healthPlanRevisions: HealthPlanRevisionType[] | Error = []
    for (const contractRev of contract.revisions) {
        const unlockedHealthPlanFormData = convertContractWithRatesToFormData(
            contractRev,
            contract.id,
            contract.stateCode,
            contract.stateNumber
        )

        if (unlockedHealthPlanFormData instanceof Error) {
            return unlockedHealthPlanFormData
        }

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

function convertContractWithRatesToFormData(
    contractRev: ContractRevisionWithRatesType,
    contractID: string,
    stateCode: string,
    stateNumber: number
): HealthPlanFormDataType | Error {
    // additional certifying actuaries are on every rate post refactor but on the package pre-refactor
    const pkgAdditionalCertifyingActuaries: ActuaryContact[] = []
    let pkgActuaryCommsPref: ActuaryCommunicationType | undefined = undefined

    const rateInfos: RateInfoType[] = contractRev.rateRevisions.map(
        (rateRev) => {
            const {
                rateType,
                rateCapitationType,
                rateCertificationName,
                rateDateCertified,
                rateDateEnd,
                rateDateStart,
                rateDocuments = [],
                supportingDocuments = [],
                rateProgramIDs,
                packagesWithSharedRateCerts,
                certifyingActuaryContacts = [],
                addtlActuaryContacts = [],
                amendmentEffectiveDateEnd,
                amendmentEffectiveDateStart,
                actuaryCommunicationPreference,
            } = rateRev.formData

            for (const additionalActuary of addtlActuaryContacts) {
                if (
                    !pkgAdditionalCertifyingActuaries.find((actuary) =>
                        isEqualData(actuary, additionalActuary)
                    )
                ) {
                    pkgAdditionalCertifyingActuaries.push(additionalActuary)
                }
            }

            // The first time we find a rate that has an actuary comms pref, we use that to set the package's prefs
            if (actuaryCommunicationPreference && !pkgActuaryCommsPref) {
                pkgActuaryCommsPref = actuaryCommunicationPreference
            }

            const rateAmendmentInfo = (amendmentEffectiveDateStart ||
                amendmentEffectiveDateEnd) && {
                effectiveDateStart: amendmentEffectiveDateStart,
                effectiveDateEnd: amendmentEffectiveDateEnd,
            }
            return {
                id: rateRev.formData.rateID, // the rateInfo id needs to be the top level rate id
                rateType,
                rateCapitationType,
                rateDocuments: rateDocuments.map((doc) => ({
                    ...doc,
                    documentCategories: ['RATES'],
                })) as SubmissionDocument[],
                supportingDocuments: supportingDocuments.map((doc) => ({
                    ...doc,
                    documentCategories: ['RATES_RELATED'],
                })) as SubmissionDocument[],
                rateAmendmentInfo: rateAmendmentInfo,
                rateDateStart,
                rateDateEnd,
                rateDateCertified,
                rateProgramIDs,
                rateCertificationName,
                actuaryContacts: certifyingActuaryContacts ?? [],
                actuaryCommunicationPreference,
                packagesWithSharedRateCerts,
            }
        }
    )

    // since this data is coming out from the DB without validation, we start by making a draft.
    const healthPlanFormData: PartialHealthPlanFormData = {
        id: contractID, // contract form data id is the contract ID.
        createdAt: contractRev.createdAt,
        updatedAt: contractRev.updatedAt,
        stateCode: stateCode,
        stateNumber: stateNumber,
        programIDs: contractRev.formData.programIDs,
        populationCovered: contractRev.formData.populationCovered,
        submissionType: contractRev.formData.submissionType,
        riskBasedContract: contractRev.formData.riskBasedContract,
        submissionDescription: contractRev.formData.submissionDescription,
        stateContacts: contractRev.formData.stateContacts,
        addtlActuaryCommunicationPreference: pkgActuaryCommsPref,
        addtlActuaryContacts: [...pkgAdditionalCertifyingActuaries],
        documents: contractRev.formData.supportingDocuments.map((doc) => ({
            ...doc,
            documentCategories: ['CONTRACT_RELATED'],
        })) as SubmissionDocument[],
        contractType: contractRev.formData.contractType,
        contractExecutionStatus: contractRev.formData.contractExecutionStatus,
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
                    contractRev.formData.modifiedOtherFinancialPaymentIncentive,
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
        rateInfos,
    }

    const status = contractRev.submitInfo ? 'SUBMITTED' : 'DRAFT'
    if (contractRev.submitInfo) {
        healthPlanFormData.submittedAt = contractRev.submitInfo.updatedAt
    }

    const formDataResult = parsePartialHPFD(status, healthPlanFormData)

    if (formDataResult instanceof Error) {
        console.error('couldnt parse into valid form data', formDataResult)
    }

    return formDataResult
}

export {
    convertContractWithRatesRevtoHPPRev,
    convertContractWithRatesToUnlockedHPP,
    convertContractWithRatesToFormData,
}
