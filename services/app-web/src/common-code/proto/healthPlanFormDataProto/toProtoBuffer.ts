import { mcreviewproto, google } from '../../../gen/healthPlanFormDataProto'
import {
    UnlockedHealthPlanFormDataType,
    LockedHealthPlanFormDataType,
    isLockedHealthPlanFormData,
    CalendarDate,
} from '../../healthPlanFormDataType'

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

const calendarDomainDateToProtoDate = (
    domainDate: CalendarDate | undefined
): mcreviewproto.IHealthPlanFormData['createdAt'] => {
    if (!domainDate) {
        return undefined
    }

    const parsedCalendarDate = domainDate.split('-')
    const month = parseInt(parsedCalendarDate[1])
    const day = parseInt(parsedCalendarDate[2])
    const year = parseInt(parsedCalendarDate[0])

    return {
        day: day,
        month: month,
        year: year,
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
    const { contractAmendmentInfo, rateAmendmentInfo } = domainData

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
            contractDateStart: calendarDomainDateToProtoDate(
                domainData.contractDateStart
            ),
            contractDateEnd: calendarDomainDateToProtoDate(
                domainData.contractDateEnd
            ),
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
        // 9.21 currently only ever one rate on a domain model, eventually this will be a map
        rateInfos: [
            {
                rateType: domainEnumToProto(
                    domainData.rateType,
                    mcreviewproto.RateType
                ),
                rateCapitationType: domainEnumToProto(
                    domainData.rateCapitationType,
                    mcreviewproto.RateCapitationType
                ),
                rateDateStart: calendarDomainDateToProtoDate(
                    domainData.rateDateStart
                ),
                rateDateEnd: calendarDomainDateToProtoDate(
                    domainData.rateDateEnd
                ),
                rateDateCertified: calendarDomainDateToProtoDate(
                    domainData.rateDateCertified
                ),
                rateDocuments: domainData.rateDocuments.map((doc) => ({
                    s3Url: doc.s3URL,
                    name: doc.name,
                    documentCategories: domainEnumArrayToProto(
                        mcreviewproto.DocumentCategory,
                        doc.documentCategories
                    ),
                })),
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
                rateAmendmentInfo: rateAmendmentInfo && {
                    effectiveDateStart: calendarDomainDateToProtoDate(
                        rateAmendmentInfo.effectiveDateStart
                    ),
                    effectiveDateEnd: calendarDomainDateToProtoDate(
                        rateAmendmentInfo.effectiveDateEnd
                    ),
                },
                actuaryCommunicationPreference: domainEnumToProto(
                    domainData.actuaryCommunicationPreference,
                    mcreviewproto.ActuaryCommunicationType
                ),
            },
        ],
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
