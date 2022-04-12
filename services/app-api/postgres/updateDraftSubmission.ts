import { PrismaClient } from '@prisma/client'
import {
    UnlockedHealthPlanFormDataType,
    isUnlockedHealthPlanFormData,
} from '../../app-web/src/common-code/domain-models'
import {
    toDomain,
    toProtoBuffer,
} from '../../app-web/src/common-code/proto/stateSubmission'
import {
    convertPrismaErrorToStoreError,
    isStoreError,
    StoreError,
} from './storeError'
import { getCurrentRevision } from './submissionWithRevisionsHelpers'

export async function updateSubmissionWrapper(
    client: PrismaClient,
    id: string,
    proto: Buffer
): Promise<Buffer | StoreError> {
    try {
        const findResult = await client.stateSubmission.findUnique({
            where: {
                id: id,
            },
            include: {
                revisions: true,
            },
        })

        const currentRevisionOrError = getCurrentRevision(id, findResult)
        if (isStoreError(currentRevisionOrError)) {
            return currentRevisionOrError
        }

        try {
            const currentRevision = currentRevisionOrError
            const updateResult = await client.stateSubmission.update({
                where: {
                    id,
                },
                data: {
                    revisions: {
                        update: {
                            where: {
                                id: currentRevision.id,
                            },
                            data: {
                                submissionFormProto: proto,
                            },
                        },
                    },
                },
                include: {
                    revisions: true,
                },
            })
            const updatedRevisionOrError = getCurrentRevision(id, updateResult)
            if (isStoreError(updatedRevisionOrError)) {
                return updatedRevisionOrError
            } else {
                const updatedRevision = updatedRevisionOrError
                return updatedRevision.submissionFormProto
            }
        } catch (updateError) {
            return convertPrismaErrorToStoreError(updateError)
        }
    } catch (findError) {
        return convertPrismaErrorToStoreError(findError)
    }
}

export async function updateDraftSubmission(
    client: PrismaClient,
    draftSubmission: UnlockedHealthPlanFormDataType
): Promise<UnlockedHealthPlanFormDataType | StoreError> {
    draftSubmission.updatedAt = new Date()

    const proto = toProtoBuffer(draftSubmission)
    const buffer = Buffer.from(proto)

    const updateResult = await updateSubmissionWrapper(
        client,
        draftSubmission.id,
        buffer
    )

    if (isStoreError(updateResult)) {
        return updateResult
    }

    const decodeUpdated = toDomain(updateResult)

    if (decodeUpdated instanceof Error) {
        console.log(
            'ERROR: decoding protobuf with id: ',
            draftSubmission.id,
            decodeUpdated
        )
        return {
            code: 'PROTOBUF_ERROR',
            message: 'Error decoding protobuf',
        }
    }

    if (!isUnlockedHealthPlanFormData(decodeUpdated)) {
        return {
            code: 'WRONG_STATUS',
            message: 'The updated submission is not a DraftSubmission',
        }
    }

    return decodeUpdated
}
