import { UserType } from '../domain-models'
import { constructTestPostgresServer } from '../testHelpers/gqlHelpers'
import UPDATE_STATE_ASSIGNMENTS from '../../../app-graphql/src/mutations/updateStateAssignments.graphql'
import { InsertUserArgsType, isStoreError, NewPostgresStore } from '../postgres'
import { v4 as uuidv4 } from 'uuid'
import { sharedTestPrismaClient } from '../testHelpers/storeHelpers'

describe('updateStateAssignments', () => {
    it('updates a cms users state assignments', async () => {
        const testAdminUser: UserType = {
            id: 'd60e82de-13d7-459b-825e-61ce6ca2eb36',
            role: 'ADMIN_USER',
            email: 'iroh@example.com',
            familyName: 'Iroh',
            givenName: 'Uncle',
        }

        const prismaClient = await sharedTestPrismaClient()
        const postgresStore = NewPostgresStore(prismaClient)
        const server = await constructTestPostgresServer({
            store: postgresStore,
            context: {
                user: testAdminUser,
            },
        })

        // setup a user in the db for us to modify
        const cmsUserID = uuidv4()
        const userToInsert: InsertUserArgsType = {
            userID: cmsUserID,
            role: 'CMS_USER',
            givenName: 'Zuko',
            familyName: 'Firebender',
            email: 'zuko@example.com',
        }

        const newUser = await postgresStore.insertUser(userToInsert)
        if (isStoreError(newUser)) {
            throw new Error(newUser.code)
        }

        const updateRes = await server.executeOperation({
            query: UPDATE_STATE_ASSIGNMENTS,
            variables: {
                input: {
                    cmsUserID: cmsUserID,
                    stateAssignments: ['CA'],
                },
            },
        })

        expect(updateRes.data).toBeDefined()
        expect(updateRes.errors).toBeUndefined()

        if (!updateRes.data) {
            throw new Error('no data')
        }

        const user = updateRes.data.updateStateAssignments.user
        expect(user.email).toBe(newUser.email)
        expect(user.stateAssignments).toEqual([
            {
                code: 'CA',
                name: 'California',
            },
        ])

        // change the value and see if it updates
        const updateRes2 = await server.executeOperation({
            query: UPDATE_STATE_ASSIGNMENTS,
            variables: {
                input: {
                    cmsUserID: cmsUserID,
                    stateAssignments: ['VA', 'MA'],
                },
            },
        })

        expect(updateRes2.data).toBeDefined()
        expect(updateRes2.errors).toBeUndefined()

        if (!updateRes2.data) {
            throw new Error('no data')
        }

        const user2 = updateRes2.data.updateStateAssignments.user
        expect(user2.email).toBe(newUser.email)
        expect(user2.stateAssignments).toEqual([
            {
                code: 'MA',
                name: 'Massachusetts',
            },
            {
                code: 'VA',
                name: 'Virginia',
            },
        ])
    })

    it('errors if the userID doesnt exist', async () => {
        const testAdminUser: UserType = {
            id: 'd60e82de-13d7-459b-825e-61ce6ca2eb36',
            role: 'ADMIN_USER',
            email: 'iroh@example.com',
            familyName: 'Iroh',
            givenName: 'Uncle',
        }

        const prismaClient = await sharedTestPrismaClient()
        const postgresStore = NewPostgresStore(prismaClient)
        const server = await constructTestPostgresServer({
            store: postgresStore,
            context: {
                user: testAdminUser,
            },
        })

        // setup a user in the db for us to modify
        const cmsUserID = uuidv4()

        const updateRes = await server.executeOperation({
            query: UPDATE_STATE_ASSIGNMENTS,
            variables: {
                input: {
                    cmsUserID: cmsUserID,
                    stateAssignments: ['CA'],
                },
            },
        })

        expect(updateRes.errors).toBeDefined()
        if (!updateRes.errors || !updateRes.errors[0].extensions) {
            throw new Error('no errors')
        }

        expect(updateRes.errors[0].message).toContain(
            'cmsUserID does not exist'
        )
        expect(updateRes.errors[0].extensions.code).toBe('BAD_USER_INPUT')
    })

    it('errors if called by a CMS user', async () => {
        const testCMSUser: UserType = {
            id: 'd60e82de-13d7-459b-825e-61ce6ca2eb36',
            role: 'CMS_USER',
            email: 'iroh@example.com',
            familyName: 'Iroh',
            givenName: 'Uncle',
            stateAssignments: [],
        }

        const prismaClient = await sharedTestPrismaClient()
        const postgresStore = NewPostgresStore(prismaClient)
        const server = await constructTestPostgresServer({
            store: postgresStore,
            context: {
                user: testCMSUser,
            },
        })

        // setup a user in the db for us to modify
        const cmsUserID = uuidv4()

        const updateRes = await server.executeOperation({
            query: UPDATE_STATE_ASSIGNMENTS,
            variables: {
                input: {
                    cmsUserID: cmsUserID,
                    stateAssignments: ['CA'],
                },
            },
        })

        expect(updateRes.errors).toBeDefined()
        if (!updateRes.errors || !updateRes.errors[0].extensions) {
            throw new Error('no errors')
        }

        expect(updateRes.errors[0].message).toContain(
            'user not authorized to modify state assignments'
        )
        expect(updateRes.errors[0].extensions.code).toBe('FORBIDDEN')
    })

    it('errors if called by a state user', async () => {
        const prismaClient = await sharedTestPrismaClient()
        const postgresStore = NewPostgresStore(prismaClient)
        const server = await constructTestPostgresServer({
            store: postgresStore,
        })

        // setup a user in the db for us to modify
        const cmsUserID = uuidv4()

        const updateRes = await server.executeOperation({
            query: UPDATE_STATE_ASSIGNMENTS,
            variables: {
                input: {
                    cmsUserID: cmsUserID,
                    stateAssignments: ['CA'],
                },
            },
        })

        expect(updateRes.errors).toBeDefined()
        if (!updateRes.errors || !updateRes.errors[0].extensions) {
            throw new Error('no errors')
        }

        expect(updateRes.errors[0].message).toContain(
            'user not authorized to modify state assignments'
        )
        expect(updateRes.errors[0].extensions.code).toBe('FORBIDDEN')
    })

    it('returns an error with missing arguments', async () => {
        const prismaClient = await sharedTestPrismaClient()
        const postgresStore = NewPostgresStore(prismaClient)
        const server = await constructTestPostgresServer({
            store: postgresStore,
        })

        // setup a user in the db for us to modify
        const cmsUserID = uuidv4()

        const updateRes = await server.executeOperation({
            query: UPDATE_STATE_ASSIGNMENTS,
            variables: {
                input: {
                    cmsUserID: cmsUserID,
                },
            },
        })

        expect(updateRes.errors).toBeDefined()
        if (!updateRes.errors || !updateRes.errors[0].extensions) {
            throw new Error('no errors')
        }
        expect(updateRes.errors[0].message).toContain(
            'Variable "$input" got invalid value'
        )
        expect(updateRes.errors[0].extensions.code).toBe('BAD_USER_INPUT')
    })

    it('returns an error with invalid state codes', async () => {
        const testAdminUser: UserType = {
            id: 'd60e82de-13d7-459b-825e-61ce6ca2eb36',
            role: 'ADMIN_USER',
            email: 'iroh@example.com',
            familyName: 'Iroh',
            givenName: 'Uncle',
        }

        const prismaClient = await sharedTestPrismaClient()
        const postgresStore = NewPostgresStore(prismaClient)
        const server = await constructTestPostgresServer({
            store: postgresStore,
            context: {
                user: testAdminUser,
            },
        })

        // setup a user in the db for us to modify
        const cmsUserID = uuidv4()

        const updateRes = await server.executeOperation({
            query: UPDATE_STATE_ASSIGNMENTS,
            variables: {
                input: {
                    cmsUserID: cmsUserID,
                    stateAssignments: ['CA', 'XX', 'BS'],
                },
            },
        })

        expect(updateRes.errors).toBeDefined()
        if (!updateRes.errors || !updateRes.errors[0].extensions) {
            throw new Error('no errors')
        }
        expect(updateRes.errors[0].message).toContain('Invalid state codes')
        expect(updateRes.errors[0].extensions.code).toBe('BAD_USER_INPUT')
        expect(updateRes.errors[0].extensions.argumentValues).toEqual([
            'XX',
            'BS',
        ])
    })
})
