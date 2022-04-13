import { PrismaClient } from '@prisma/client'
import { Buffer } from 'buffer'
import { v4 as uuidv4 } from 'uuid'
import {
    UnlockedHealthPlanFormDataType,
    HealthPlanPackageType,
    SubmissionType,
} from '../../app-web/src/common-code/domain-models'
import { toProtoBuffer } from '../../app-web/src/common-code/proto/stateSubmission'
import {
    convertPrismaErrorToStoreError,
    isStoreError,
    StoreError,
} from './storeError'
import { convertToHealthPlanPackageType } from './submissionWithRevisionsHelpers'

export type InsertDraftSubmissionArgsType = {
    stateCode: string
    programIDs: string[]
    submissionType: SubmissionType
    submissionDescription: string
}

// By using Prisma's "increment" syntax here, we ensure that we are atomically increasing
// the state number every time we call this function.
async function incrementAndGetStateNumber(
    client: PrismaClient,
    stateCode: string
): Promise<number | StoreError> {
    try {
        const stateNumberResult = await client.state.update({
            data: {
                latestStateSubmissionNumber: {
                    increment: 1,
                },
            },
            where: {
                stateCode: stateCode,
            },
        })

        return stateNumberResult.latestStateSubmissionNumber
    } catch (e) {
        return convertPrismaErrorToStoreError(e)
    }
}

export async function insertDraftSubmission(
    client: PrismaClient,
    args: InsertDraftSubmissionArgsType
): Promise<HealthPlanPackageType | StoreError> {
    const stateNumberResult = await incrementAndGetStateNumber(
        client,
        args.stateCode
    )

    if (isStoreError(stateNumberResult)) {
        console.log('Error: Getting New State Number', stateNumberResult)
        return stateNumberResult
    }

    const stateNumber: number = stateNumberResult

    // construct a new Draft Submission
    const draft: UnlockedHealthPlanFormDataType = {
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
        stateNumber,
        status: 'DRAFT',
        submissionType: args.submissionType,
        programIDs: args.programIDs,
        submissionDescription: args.submissionDescription,
        stateCode: args.stateCode,

        documents: [],
        contractDocuments: [],
        rateDocuments: [],
        stateContacts: [],
        actuaryContacts: [],
        managedCareEntities: [],
        federalAuthorities: [],
    }

    const protobuf = toProtoBuffer(draft)

    const buffer = Buffer.from(protobuf)

    try {
        const pkg = await client.stateSubmission.create({
            data: {
                id: draft.id,
                stateCode: draft.stateCode,
                revisions: {
                    create: {
                        id: uuidv4(),
                        createdAt: new Date(),
                        submissionFormProto: buffer,
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

        return convertToHealthPlanPackageType(pkg)
    } catch (e: unknown) {
        console.log('ERROR: inserting into to the database: ', e)

        return convertPrismaErrorToStoreError(e)
    }
}
