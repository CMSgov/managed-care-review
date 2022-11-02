import FETCH_HEALTH_PLAN_PACKAGE from '../../../app-graphql/src/queries/fetchHealthPlanPackage.graphql'
import { base64ToDomain } from '../../../app-web/src/common-code/proto/healthPlanFormDataProto'
import { UserType } from '../domain-models'
import { todaysDate } from '../testHelpers/dateHelpers'
import {
    constructTestPostgresServer,
    createTestHealthPlanPackage,
    createAndSubmitTestHealthPlanPackage,
    unlockTestHealthPlanPackage,
    resubmitTestHealthPlanPackage,
} from '../testHelpers/gqlHelpers'

describe('fetchHealthPlanPackage', () => {
    const testUserCMS: UserType = {
        name: 'Zuko',
        role: 'CMS_USER',
        email: 'zuko@example.com',
        familyName: 'Zuko',
        givenName: 'Prince',
        euaID: 'CCCC',
    }

    const testUserState: UserType = {
        name: 'Aang',
        state_code: 'FL',
        role: 'STATE_USER',
        email: 'aang@mn.gov',
        familyName: 'Aang',
        givenName: 'Aang',
        euaID: 'AAGG',
    }

    it('returns package with one revision', async () => {
        const server = await constructTestPostgresServer()

        // First, create a new submission
        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            server
        )

        const createdID = stateSubmission.id

        // then see if we can fetch that same submission
        const input = {
            pkgID: createdID,
        }

        const result = await server.executeOperation({
            query: FETCH_HEALTH_PLAN_PACKAGE,
            variables: { input },
        })

        expect(result.errors).toBeUndefined()

        const resultSub = result.data?.fetchHealthPlanPackage.pkg
        expect(resultSub.id).toEqual(createdID)
        expect(resultSub.revisions).toHaveLength(1)

        const revision = resultSub.revisions[0].node

        const subData = base64ToDomain(revision.formDataProto)
        if (subData instanceof Error) {
            throw subData
        }

        expect(subData.id).toEqual(createdID)
        expect(subData.programIDs).toEqual([
            '5c10fe9f-bec9-416f-a20c-718b152ad633',
        ])
        expect(subData.submissionDescription).toBe('An updated submission')
        expect(subData.documents).toEqual([])
        expect(subData.contractDocuments).toEqual([
            {
                name: 'contractDocument.pdf',
                s3URL: 'fakeS3URL',
                documentCategories: ['CONTRACT'],
            },
        ])
    })

    it('returns nothing if the ID doesnt exist', async () => {
        const server = await constructTestPostgresServer()

        // then see if we can fetch that same submission
        const input = {
            pkgID: 'BOGUS-ID',
        }

        const result = await server.executeOperation({
            query: FETCH_HEALTH_PLAN_PACKAGE,
            variables: { input },
        })

        expect(result.errors).toBeUndefined()

        const resultSub = result.data?.fetchHealthPlanPackage.pkg
        expect(resultSub).toBeNull()
    })

    it('returns multiple submissions payload with multiple revisions', async () => {
        const server = await constructTestPostgresServer()

        const cmsServer = await constructTestPostgresServer({
            context: {
                user: testUserCMS,
            },
        })

        // First, create a new submission
        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            server
        )
        const createdID = stateSubmission.id

        // unlock it
        await unlockTestHealthPlanPackage(
            cmsServer,
            createdID,
            'Super duper good reason.'
        )

        // then see if we can fetch that same submission
        const input = {
            pkgID: createdID,
        }

        const result = await server.executeOperation({
            query: FETCH_HEALTH_PLAN_PACKAGE,
            variables: { input },
        })

        expect(result.errors).toBeUndefined()

        const resultSub = result.data?.fetchHealthPlanPackage.pkg
        expect(resultSub.id).toEqual(createdID)
        expect(resultSub.revisions).toHaveLength(2)
    })

    it('synthesizes the right statuses as a submission is submitted/unlocked/etc', async () => {
        const server = await constructTestPostgresServer()

        const cmsServer = await constructTestPostgresServer({
            context: {
                user: testUserCMS,
            },
        })

        // First, create a new submission
        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            server
        )
        const createdID = stateSubmission.id

        // DRAFT
        const fetchInput = {
            pkgID: createdID,
        }

        const draftResult = await server.executeOperation({
            query: FETCH_HEALTH_PLAN_PACKAGE,
            variables: { input: fetchInput },
        })

        expect(draftResult.errors).toBeUndefined()

        const resultSub = draftResult.data?.fetchHealthPlanPackage.pkg

        const today = todaysDate()

        expect(resultSub.status).toBe('SUBMITTED')
        expect(resultSub.initiallySubmittedAt).toEqual(today)

        // unlock it
        await unlockTestHealthPlanPackage(
            cmsServer,
            createdID,
            'Super duper good reason.'
        )

        const unlockResult = await server.executeOperation({
            query: FETCH_HEALTH_PLAN_PACKAGE,
            variables: { input: fetchInput },
        })

        expect(unlockResult.errors).toBeUndefined()

        expect(unlockResult.data?.fetchHealthPlanPackage.pkg.status).toBe(
            'UNLOCKED'
        )
        expect(
            unlockResult.data?.fetchHealthPlanPackage.pkg.initiallySubmittedAt
        ).toEqual(today)

        // resubmit it
        await resubmitTestHealthPlanPackage(
            server,
            createdID,
            'Test resubmission reason'
        )

        const resubmitResult = await server.executeOperation({
            query: FETCH_HEALTH_PLAN_PACKAGE,
            variables: { input: fetchInput },
        })

        expect(resubmitResult.errors).toBeUndefined()

        expect(resubmitResult.data?.fetchHealthPlanPackage.pkg.status).toBe(
            'RESUBMITTED'
        )
        expect(
            resubmitResult.data?.fetchHealthPlanPackage.pkg.initiallySubmittedAt
        ).toEqual(today)
    })

    it('a different user from the same state can fetch the draft', async () => {
        const server = await constructTestPostgresServer()

        // First, create a new submission
        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            server
        )

        const createdID = stateSubmission.id

        // then see if we can fetch that same submission
        const input = {
            pkgID: createdID,
        }

        // setup a server with a different user
        const otherUserServer = await constructTestPostgresServer({
            context: {
                user: testUserState,
            },
        })

        const result = await otherUserServer.executeOperation({
            query: FETCH_HEALTH_PLAN_PACKAGE,
            variables: { input },
        })

        expect(result.errors).toBeUndefined()

        expect(result.data?.fetchHealthPlanPackage.pkg).toBeDefined()
        expect(result.data?.fetchHealthPlanPackage.pkg).not.toBeNull()
    })

    it('returns an error if you are requesting for a different state (403)', async () => {
        const server = await constructTestPostgresServer()

        // First, create a new submission
        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            server
        )

        const createdID = stateSubmission.id

        // then see if we can fetch that same submission
        const input = {
            pkgID: createdID,
        }

        // setup a server with a different user
        const otherUserServer = await constructTestPostgresServer({
            context: {
                user: {
                    name: 'Aang',
                    state_code: 'VA',
                    role: 'STATE_USER',
                    email: 'aang@va.gov',
                    familyName: 'Aang',
                    givenName: 'Aang',
                    euaID: 'AAGG',
                },
            },
        })

        const result = await otherUserServer.executeOperation({
            query: FETCH_HEALTH_PLAN_PACKAGE,
            variables: { input },
        })

        expect(result.errors).toBeDefined()
        if (result.errors === undefined) {
            throw new Error('annoying jest typing behavior')
        }
        expect(result.errors).toHaveLength(1)
        const resultErr = result.errors[0]

        expect(resultErr?.message).toBe(
            'user not authorized to fetch data from a different state'
        )
        expect(resultErr?.extensions?.code).toBe('FORBIDDEN')
    })

    it('returns an error if you are a CMS user requesting a draft submission', async () => {
        const server = await constructTestPostgresServer()
        const cmsServer = await constructTestPostgresServer({
            context: {
                user: testUserCMS,
            },
        })

        // First, create a new submission
        const stateSubmission = await createTestHealthPlanPackage(server)

        const createdID = stateSubmission.id

        // then see if we can fetch that same submission
        const input = {
            pkgID: createdID,
        }

        const result = await cmsServer.executeOperation({
            query: FETCH_HEALTH_PLAN_PACKAGE,
            variables: { input },
        })

        expect(result.errors).toBeDefined()
        if (result.errors === undefined) {
            throw new Error('annoying jest typing behavior')
        }
        expect(result.errors).toHaveLength(1)
        const resultErr = result.errors[0]

        expect(resultErr?.message).toBe(
            'CMS user not authorized to fetch a draft'
        )
        expect(resultErr?.extensions?.code).toBe('FORBIDDEN')
    })

    it('returns the revisions in the correct order', async () => {
        const stateServer = await constructTestPostgresServer()

        // First, create a new submitted submission
        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            stateServer
        )

        const cmsServer = await constructTestPostgresServer({
            context: {
                user: testUserCMS,
            },
        })

        await unlockTestHealthPlanPackage(
            cmsServer,
            stateSubmission.id,
            'Super duper good reason.'
        )

        await resubmitTestHealthPlanPackage(
            stateServer,
            stateSubmission.id,
            'Test first resubmission'
        )

        await unlockTestHealthPlanPackage(
            cmsServer,
            stateSubmission.id,
            'Super duper good reason.'
        )

        await resubmitTestHealthPlanPackage(
            stateServer,
            stateSubmission.id,
            'Test second resubmission'
        )

        await unlockTestHealthPlanPackage(
            cmsServer,
            stateSubmission.id,
            'Super duper good reason.'
        )

        const input = {
            pkgID: stateSubmission.id,
        }

        const result = await cmsServer.executeOperation({
            query: FETCH_HEALTH_PLAN_PACKAGE,
            variables: { input },
        })

        expect(result.errors).toBeUndefined()

        const maxDate = new Date(8640000000000000)
        let mostRecentDate = maxDate
        const revs = result?.data?.fetchHealthPlanPackage.pkg.revisions
        if (!revs) {
            throw new Error('No revisions returned!')
        }
        for (const rev of revs) {
            expect(rev.node.createdAt.getTime()).toBeLessThan(
                mostRecentDate.getTime()
            )
            mostRecentDate = rev.node.createdAt
        }
    })
})
