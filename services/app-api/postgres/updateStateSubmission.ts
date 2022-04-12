import { PrismaClient } from '@prisma/client'
import {
    LockedHealthPlanFormDataType,
    Submission2Type,
    UpdateInfoType,
} from '../../app-web/src/common-code/domain-models'
import { toProtoBuffer } from '../../app-web/src/common-code/proto/stateSubmission'
import {
    convertPrismaErrorToStoreError,
    isStoreError,
    StoreError,
} from './storeError'
import {
    getCurrentRevision,
    convertToSubmission2Type,
} from './submissionWithRevisionsHelpers'

async function submitStateSubmissionWrapper(
    client: PrismaClient,
    id: string,
    submitInfo: UpdateInfoType,
    proto: Buffer
): Promise<Submission2Type | StoreError> {
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
            const submissionResult = await client.stateSubmission.update({
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
                                submittedAt: submitInfo.updatedAt,
                                submittedBy: submitInfo.updatedBy,
                                submittedReason: submitInfo.updatedReason,
                            },
                        },
                    },
                },
                include: {
                    revisions: {
                        orderBy: {
                            createdAt: 'desc', // We expect our revisions most-recent-first
                        },
                    },
                },
            })
            return convertToSubmission2Type(submissionResult)
        } catch (updateError) {
            return convertPrismaErrorToStoreError(updateError)
        }
    } catch (findError) {
        return convertPrismaErrorToStoreError(findError)
    }
}

export async function updateStateSubmission(
    client: PrismaClient,
    stateSubmission: LockedHealthPlanFormDataType,
    submitInfo: UpdateInfoType
): Promise<Submission2Type | StoreError> {
    stateSubmission.updatedAt = new Date()

    const proto = toProtoBuffer(stateSubmission)
    const buffer = Buffer.from(proto)

    const updateResult = await submitStateSubmissionWrapper(
        client,
        stateSubmission.id,
        submitInfo,
        buffer
    )

    if (isStoreError(updateResult)) {
        return updateResult
    }

    return updateResult
}
