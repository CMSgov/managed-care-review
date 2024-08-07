import type { InsertUserArgsType } from '../postgres'
import { NewPostgresStore } from '../postgres'
import type {
    AdminUserType,
    CMSApproverUserType,
    CMSUserType,
    StateUserType,
    UserType,
} from '../domain-models'
import { sharedTestPrismaClient } from './storeHelpers'
import { v4 as uuidv4 } from 'uuid'

const testCMSUser = (userData?: Partial<CMSUserType>): CMSUserType => ({
    id: uuidv4(),
    role: 'CMS_USER',
    email: 'zuko@example.com',
    familyName: 'Zuko',
    givenName: 'Prince',
    divisionAssignment: 'DMCO' as const,
    stateAssignments: [],
    ...userData,
})

const testCMSApproverUser = (
    userData?: Partial<CMSApproverUserType>
): CMSApproverUserType => ({
    id: uuidv4(),
    role: 'CMS_APPROVER_USER',
    email: 'azula@example.com',
    familyName: 'Azula',
    givenName: 'Princess',
    divisionAssignment: 'DMCO' as const,
    stateAssignments: [],
    ...userData,
})

const testStateUser = (userData?: Partial<StateUserType>): StateUserType => ({
    id: uuidv4(),
    stateCode: 'FL',
    role: 'STATE_USER',
    email: 'james@example.com',
    familyName: 'Brown',
    givenName: 'James',
    ...userData,
})

const testAdminUser = (userData?: Partial<AdminUserType>): AdminUserType => ({
    id: uuidv4(),
    role: 'ADMIN_USER',
    email: 'iroh@example.com',
    familyName: 'Iroh',
    givenName: 'Uncle',
    ...userData,
})

const createDBUsersWithFullData = async (
    users: UserType[]
): Promise<UserType[]> => {
    const prismaClient = await sharedTestPrismaClient()
    const postgresStore = NewPostgresStore(prismaClient)

    const usersSeed: InsertUserArgsType[] = users.map((user: UserType) => {
        const userArgs: InsertUserArgsType & { id?: string } = {
            ...user,
            userID: user.id,
        }

        delete userArgs.id

        return userArgs as InsertUserArgsType
    })

    const result = await postgresStore.insertManyUsers(usersSeed)

    if (result instanceof Error) {
        throw result
    }

    return result
}

const iterableCmsUsersMockData: {
    userRole: 'CMS_USER' | 'CMS_APPROVER_USER'
    mockUser: <T>(userData?: Partial<T>) => CMSUserType | CMSApproverUserType
}[] = [
    {
        userRole: 'CMS_USER',
        mockUser: testCMSUser,
    },
    {
        userRole: 'CMS_APPROVER_USER',
        mockUser: testCMSApproverUser,
    },
]

export {
    testAdminUser,
    testStateUser,
    testCMSUser,
    createDBUsersWithFullData,
    iterableCmsUsersMockData,
    testCMSApproverUser,
}
