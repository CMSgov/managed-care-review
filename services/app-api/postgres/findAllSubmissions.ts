import { PrismaClient } from '@prisma/client'
import {
    UnlockedHealthPlanFormDataType,
    LockedHealthPlanFormDataType,
} from '../../app-web/src/common-code/domain-models'
import { toDomain } from '../../app-web/src/common-code/proto/stateSubmission'
import {
    convertPrismaErrorToStoreError,
    isStoreError,
    StoreError,
} from './storeError'
import {
    getCurrentRevision,
    HealthPlanPackageWithRevisionsTable,
} from './submissionWithRevisionsHelpers'

export async function findAllSubmissionWrapper(
    client: PrismaClient,
    stateCode: string
): Promise<HealthPlanPackageWithRevisionsTable[] | StoreError> {
    try {
        const result = await client.healthPlanPackageTable.findMany({
            where: {
                stateCode: {
                    equals: stateCode,
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
        return result
    } catch (e: unknown) {
        console.log('failed to findAll', e)
        return convertPrismaErrorToStoreError(e)
    }
}

export async function findAllSubmissions(
    client: PrismaClient,
    stateCode: string
): Promise<
    | (UnlockedHealthPlanFormDataType | LockedHealthPlanFormDataType)[]
    | StoreError
> {
    const result = await findAllSubmissionWrapper(client, stateCode)

    if (isStoreError(result)) {
        return result
    }

    const drafts: (
        | UnlockedHealthPlanFormDataType
        | LockedHealthPlanFormDataType
    )[] = []
    const errors: Error[] = []
    result.forEach((dbDraftSubmissionWithRevisions) => {
        const currentRevisionOrError = getCurrentRevision(
            dbDraftSubmissionWithRevisions.id,
            dbDraftSubmissionWithRevisions
        )
        if (isStoreError(currentRevisionOrError)) return currentRevisionOrError
        const currentRevision = currentRevisionOrError

        const proto = currentRevision.formDataProto

        const decodeResult = toDomain(proto)

        if (decodeResult instanceof Error) {
            console.log(
                `ERROR: decoding protobuf. id: ${dbDraftSubmissionWithRevisions.id}: ${decodeResult}`
            )
            errors.push(decodeResult)
            return
        }

        drafts.push(decodeResult)
    })

    if (errors.length != 0) {
        console.log(
            'ERROR: findAllSubmissions failed to decode protobufs: ',
            errors.map((e) => e.toString()).join(',')
        )
    }

    // Rather than completely break our index api if we have submissions that are failing to decode,
    // we log an error and return the ones that worked. We could potentially return empty
    // submissions in their place if we wanted to indicate to users that something was wrong.
    return drafts
}
