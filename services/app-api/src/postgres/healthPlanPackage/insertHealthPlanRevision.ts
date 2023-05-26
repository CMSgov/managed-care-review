import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { UnlockedHealthPlanFormDataType } from '@managed-care-review/common-code/healthPlanFormDataType'
import { HealthPlanPackageType, UpdateInfoType } from '../../domain-models'
import { toProtoBuffer } from '@managed-care-review/common-code/proto'
import { convertPrismaErrorToStoreError, StoreError } from '../storeError'
import { convertToHealthPlanPackageType } from './healthPlanPackageHelpers'

export type InsertHealthPlanRevisionArgsType = {
    pkgID: string
    unlockInfo: UpdateInfoType
    draft: UnlockedHealthPlanFormDataType
}

export async function insertHealthPlanRevision(
    client: PrismaClient,
    args: InsertHealthPlanRevisionArgsType
): Promise<HealthPlanPackageType | StoreError> {
    args.draft.updatedAt = new Date()

    const protobuf = toProtoBuffer(args.draft)
    const buffer = Buffer.from(protobuf)

    const { unlockInfo, pkgID } = args

    try {
        const submission = await client.healthPlanPackageTable.update({
            where: {
                id: pkgID,
            },
            data: {
                revisions: {
                    create: [
                        {
                            id: uuidv4(),
                            createdAt: new Date(),
                            formDataProto: buffer,
                            unlockedAt: unlockInfo.updatedAt,
                            unlockedBy: unlockInfo.updatedBy,
                            unlockedReason: unlockInfo.updatedReason,
                        },
                    ],
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

        return convertToHealthPlanPackageType(submission)
    } catch (e: unknown) {
        console.info('ERROR: inserting into to the database: ', e)

        return convertPrismaErrorToStoreError(e)
    }
}
