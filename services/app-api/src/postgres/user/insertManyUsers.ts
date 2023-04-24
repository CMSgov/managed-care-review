import { PrismaClient } from '@prisma/client'
import { StoreError, convertPrismaErrorToStoreError } from '../storeError'
import { UserType, toDomainUser } from '../../domain-models'
import { InsertUserArgsType } from './insertUser'

export async function insertManyUsers(
    client: PrismaClient,
    users: InsertUserArgsType[]
): Promise<UserType[] | StoreError> {
    try {
        console.info(`Trying to insert ${users.length} users into postgres....`)

        const createResult = await client.user.createMany({
            data: users.map((user) => ({
                id: user.userID,
                givenName: user.givenName,
                familyName: user.familyName,
                email: user.email,
                role: user.role,
                stateCode: user.stateCode ?? null,
                divisionAssignment: user.divisionAssignment ?? null,
            })),
            skipDuplicates: true,
        })

        console.info(
            `Insert users completed, ${createResult.count} of ${users.length} users inserted.`
        )

        const userIDs = users.map((user) => user.userID)

        const usersResult = await client.user.findMany({
            where: {
                id: { in: userIDs },
            },
        })

        return usersResult.map((user) => toDomainUser(user))
    } catch (err) {
        return convertPrismaErrorToStoreError(err)
    }
}
