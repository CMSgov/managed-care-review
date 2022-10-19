import { mcreviewproto, google } from '../../../gen/healthPlanFormDataProto'
import {
    UnlockedHealthPlanFormDataType,
    LockedHealthPlanFormDataType,
    isLockedHealthPlanFormData,
    generateRateName,
} from '../../healthPlanFormDataType'
import statePrograms from '../../data/statePrograms.json'
import { ProgramArgType } from '../../healthPlanFormDataType/State'

const findRatePrograms = (
    domainData: UnlockedHealthPlanFormDataType | LockedHealthPlanFormDataType,
    index: number
): ProgramArgType[] => {
    let programIDs = [] as string[]
    const stateCode = domainData.stateCode
    const packageProgramIDs = domainData.programIDs
    const rateProgramIDs = domainData.rateInfos[index].rateProgramIDs
    if (rateProgramIDs && rateProgramIDs.length > 0) {
        programIDs = rateProgramIDs
    } else {
        programIDs = packageProgramIDs
    }

    const programs = statePrograms.states
        .find((state) => state.code === stateCode)
        ?.programs.filter((program) => programIDs.includes(program.id))

    if (
        !programs ||
        programs.length === 0 ||
        programIDs.length !== programs.length
    ) {
        return [
            {
                id: 'error',
                name: 'no programs found',
                fullName: 'no programs found',
            },
        ]
    }
    return programs
}

/*
    Convert domain date to proto timestamp
*/
const domainDateToProtoDate = (
    domainDate: Date | undefined
): mcreviewproto.IHealthPlanFormData['createdAt'] => {
    if (!domainDate) {
        return undefined
    }

    return {
        day: domainDate.getUTCDate(),
        month: domainDate.getUTCMonth(),
        year: domainDate.getUTCFullYear(),
    }
}

const domainDateToProtoTimestamp = (
    domainDate: Date | undefined
): mcreviewproto.IHealthPlanFormData['updatedAt'] => {
    if (!domainDate) {
        return undefined
    }

    const seconds = domainDate.getTime() / 1000
    const nanos = (domainDate.getTime() % 1000) * 1e6
    const timestamp = new google.protobuf.Timestamp({ seconds, nanos })

    return timestamp
}

/*
    Convert domain enum (e.g. CONTRACT_ONLY) to proto enum (e.g. SUBMISSION_TYPE_CONTRACT_ONLY)
*/
function domainEnumStringToProtoString(
    defaultProtoValue: string,
    domainEnum: string
): string {
    const prefix = getEnumPrefix(defaultProtoValue)

    const protoEnumString = `${prefix}_${domainEnum}`
    return protoEnumString
}

type StandardEnum<T> = {
    [id: string]: T | string
    [nu: number]: string
}

function domainEnumToProto<T extends StandardEnum<unknown>>(
    domainEnum: string | undefined,
    protoEnum: T
) {
    if (!domainEnum) {
        return undefined
    }

    const protoKey = domainEnumStringToProtoString(protoEnum[0], domainEnum)

    return protoEnum[protoKey as keyof T]
}

/*
    Convert array of domain enums to proto enums
*/
function domainEnumArrayToProto<T extends StandardEnum<unknown>>(
    protoEnum: T,
    domainEnumArray: string[]
) {
    const enums = []

    for (const domainEnum of domainEnumArray) {
        const penum = domainEnumToProto<T>(domainEnum, protoEnum)
        if (penum) {
            enums.push(penum)
        }
    }

    return enums
}

/*
Return the prefix for proto enum based on the default value of that field
    - (e.g. return SUBMISSION_TYPE from the default value SUBMISSION_TYPE_UNSPECIFIED)
    - the prefix is a substring of the default value without _UNSPECIFIED
*/
const getEnumPrefix = (defaultValue: string) => {
    const lastUnderscoreIndex = defaultValue.lastIndexOf('_')
    return defaultValue.substring(0, lastUnderscoreIndex)
}

// MAIN
const toProtoBuffer = (
    domainData: UnlockedHealthPlanFormDataType | LockedHealthPlanFormDataType
): Uint8Array => {
    const { contractAmendmentInfo } = domainData

    // The difference between DraftSubmission and StateSubmission is currently very small
    // only status and submittedAt differ from the perspective of the all-optional protobuf
    const literalMessage: mcreviewproto.IHealthPlanFormData = {
        // protoName and Version are for internal proto use only
        // We aren't really using them yet but in the future it will be possible
        // to differentiate between different versions of different messages
        // changes to the proto file at some point will require incrementing "proto version"
        protoName: 'STATE_SUBMISSION',
        protoVersion: 1,

        ...domainData, // For this conversion, we  can spread unnecessary fields because protobuf discards them

        // submittedAt is the only field that exists on StateSubmission but not on DraftSubmission.
        submittedAt:
            (isLockedHealthPlanFormData(domainData) &&
                domainDateToProtoTimestamp(domainData.submittedAt)) ||
            undefined,

        createdAt: domainDateToProtoDate(domainData.createdAt),
        updatedAt: domainDateToProtoTimestamp(domainData.updatedAt),
        submissionType: domainEnumToProto(
            domainData.submissionType,
            mcreviewproto.SubmissionType
        ),

        stateCode: domainEnumToProto(
            domainData.stateCode,
            mcreviewproto.StateCode
        ),

        stateNumber: domainData.stateNumber,
        // eventually this will need to be an array of ids
        programIds: domainData.programIDs,
        contractInfo: {
            contractType: domainEnumToProto(
                domainData.contractType,
                mcreviewproto.ContractType
            ),
            contractExecutionStatus: domainEnumToProto(
                domainData.contractExecutionStatus,
                mcreviewproto.ContractExecutionStatus
            ),
            contractDateStart: domainDateToProtoDate(
                domainData.contractDateStart
            ),
            contractDateEnd: domainDateToProtoDate(domainData.contractDateEnd),
            managedCareEntities: domainEnumArrayToProto(
                mcreviewproto.ManagedCareEntity,
                domainData.managedCareEntities
            ),
            federalAuthorities: domainEnumArrayToProto(
                mcreviewproto.FederalAuthority,
                domainData.federalAuthorities
            ),
            contractDocuments: domainData.contractDocuments.map((doc) => ({
                s3Url: doc.s3URL,
                name: doc.name,
                documentCategories: domainEnumArrayToProto(
                    mcreviewproto.DocumentCategory,
                    doc.documentCategories
                ),
            })),
            contractAmendmentInfo: contractAmendmentInfo,
        },
        rateInfos:
            domainData.rateInfos && domainData.rateInfos.length
                ? domainData.rateInfos.map((rateInfo, index) => {
                      return {
                          rateType: domainEnumToProto(
                              rateInfo.rateType,
                              mcreviewproto.RateType
                          ),
                          rateCapitationType: domainEnumToProto(
                              rateInfo.rateCapitationType,
                              mcreviewproto.RateCapitationType
                          ),
                          rateDateStart: domainDateToProtoDate(
                              rateInfo.rateDateStart
                          ),
                          rateDateEnd: domainDateToProtoDate(
                              rateInfo.rateDateEnd
                          ),
                          rateDateCertified: domainDateToProtoDate(
                              rateInfo.rateDateCertified
                          ),
                          rateDocuments: rateInfo.rateDocuments.map((doc) => ({
                              s3Url: doc.s3URL,
                              name: doc.name,
                              documentCategories: domainEnumArrayToProto(
                                  mcreviewproto.DocumentCategory,
                                  doc.documentCategories
                              ),
                          })),
                          rateProgramName: generateRateName(
                              domainData,
                              domainData.rateInfos[index],
                              findRatePrograms(domainData, index)
                          ),
                          rateProgramIds: rateInfo.rateProgramIDs,
                          rateAmendmentInfo: rateInfo.rateAmendmentInfo && {
                              effectiveDateStart: domainDateToProtoDate(
                                  rateInfo.rateAmendmentInfo.effectiveDateStart
                              ),
                              effectiveDateEnd: domainDateToProtoDate(
                                  rateInfo.rateAmendmentInfo.effectiveDateEnd
                              ),
                          },
                          //Currently, this Actuary data is in domainData, eventually it will be included in the rateInfo to have actuaries for each certification.
                          actuaryContacts: domainData.actuaryContacts.map(
                              (actuaryContact) => {
                                  const firmType = domainEnumToProto(
                                      actuaryContact.actuarialFirm,
                                      mcreviewproto.ActuarialFirmType
                                  )

                                  return {
                                      contact: {
                                          name: actuaryContact.name,
                                          titleRole: actuaryContact.titleRole,
                                          email: actuaryContact.email,
                                      },
                                      actuarialFirmType: firmType,
                                      actuarialFirmOther:
                                          actuaryContact.actuarialFirmOther,
                                  }
                              }
                          ),
                          actuaryCommunicationPreference: domainEnumToProto(
                              domainData.actuaryCommunicationPreference,
                              mcreviewproto.ActuaryCommunicationType
                          ),
                      }
                  })
                : undefined,
        documents: domainData.documents.map((doc) => ({
            s3Url: doc.s3URL,
            name: doc.name,
            documentCategories: domainEnumArrayToProto(
                mcreviewproto.DocumentCategory,
                doc.documentCategories
            ),
        })),
    }

    // turn the above literal into a byte array.
    const protoMessage = new mcreviewproto.HealthPlanFormData(literalMessage)

    return mcreviewproto.HealthPlanFormData.encode(protoMessage).finish()
}
export { toProtoBuffer }
