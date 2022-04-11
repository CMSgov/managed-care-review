import { ApolloServer } from 'apollo-server-lambda'
import CREATE_DRAFT_SUBMISSION from '../../app-graphql/src/mutations/createDraftSubmission.graphql'
import CREATE_SUBMISSION_2 from '../../app-graphql/src/mutations/createSubmission2.graphql'
import SUBMIT_DRAFT_SUBMISSION from '../../app-graphql/src/mutations/submitDraftSubmission.graphql'
import UNLOCK_STATE_SUBMISSION from '../../app-graphql/src/mutations/unlockStateSubmission.graphql'
import UPDATE_DRAFT_SUBMISSION from '../../app-graphql/src/mutations/updateDraftSubmission.graphql'
import FETCH_DRAFT_SUBMISSION from '../../app-graphql/src/queries/fetchDraftSubmission.graphql'
import FETCH_STATE_SUBMISSION from '../../app-graphql/src/queries/fetchStateSubmission.graphql'
import typeDefs from '../../app-graphql/src/schema.graphql'
import { ProgramT } from '../../app-web/src/common-code/domain-models'
import { Emailer, newLocalEmailer } from '../emailer'
import {
    CreateDraftSubmissionInput,
    CreateSubmission2Input,
    DraftSubmission,
    DraftSubmissionUpdates,
    StateSubmission,
    Submission2,
    UpdateDraftSubmissionInput,
} from '../gen/gqlServer'
import { Context } from '../handlers/apollo_gql'
import { NewPostgresStore, Store } from '../postgres'
import { configureResolvers } from '../resolvers'
import { sharedTestPrismaClient } from './storeHelpers'

// Since our programs are checked into source code, we have a program we
// use as our default
function defaultFloridaProgram(): ProgramT {
    return {
        id: '5c10fe9f-bec9-416f-a20c-718b152ad633',
        name: 'MMA',
    }
}

const defaultContext = (): Context => {
    return {
        user: {
            name: 'james brown',
            state_code: 'FL',
            role: 'STATE_USER',
            email: 'james@example.com',
        },
    }
}

const constructTestPostgresServer = async (opts?: {
    context?: Context
    emailer?: Emailer
    store?: Store
}): Promise<ApolloServer> => {
    // set defaults
    const context = opts?.context || defaultContext()
    const emailer = opts?.emailer || constructTestEmailer()

    const prismaClient = await sharedTestPrismaClient()
    const postgresStore = opts?.store || NewPostgresStore(prismaClient)
    const postgresResolvers = configureResolvers(postgresStore, emailer)

    return new ApolloServer({
        typeDefs,
        resolvers: postgresResolvers,
        context,
    })
}

const constructTestEmailer = (): Emailer => {
    const config = {
        emailSource: 'local@example.com',
        stage: 'localtest',
        baseUrl: 'http://localtest',
        cmsReviewSharedEmails: ['test@example.com'],
    }
    return newLocalEmailer(config)
}

const createTestDraftSubmission = async (
    server: ApolloServer
): Promise<DraftSubmission> => {
    const input: CreateDraftSubmissionInput = {
        programIDs: [defaultFloridaProgram().id],
        submissionType: 'CONTRACT_ONLY' as const,
        submissionDescription: 'A created submission',
    }
    const result = await server.executeOperation({
        query: CREATE_DRAFT_SUBMISSION,
        variables: { input },
    })
    if (result.errors) {
        throw new Error(
            `createTestDraftSubmission mutation failed with errors ${result.errors}`
        )
    }

    if (!result.data) {
        throw new Error('createTestDraftSubmission returned nothing')
    }

    return result.data.createDraftSubmission.draftSubmission
}

const createTestSubmission2 = async (
    server: ApolloServer
): Promise<Submission2> => {
    const input: CreateSubmission2Input = {
        programIDs: [defaultFloridaProgram().id],
        submissionType: 'CONTRACT_ONLY' as const,
        submissionDescription: 'A created submission',
    }
    const result = await server.executeOperation({
        query: CREATE_SUBMISSION_2,
        variables: { input },
    })
    if (result.errors) {
        throw new Error(
            `createTestDraftSubmission mutation failed with errors ${result.errors}`
        )
    }

    if (!result.data) {
        throw new Error('createTestDraftSubmission returned nothing')
    }

    console.log('GOT BACK DA', result.data)

    return result.data.createSubmission2.submission
}

const updateTestDraftSubmission = async (
    server: ApolloServer,
    id: string,
    updates: DraftSubmissionUpdates
): Promise<DraftSubmission> => {
    const updateResult = await server.executeOperation({
        query: UPDATE_DRAFT_SUBMISSION,
        variables: {
            input: {
                submissionID: id,
                draftSubmissionUpdates: updates,
            },
        },
    })

    if (updateResult.errors) {
        console.log('errors', updateResult.errors)
        throw new Error(
            `updateTestDraftSubmission mutation failed with errors ${updateResult.errors}`
        )
    }

    if (!updateResult.data) {
        throw new Error('updateTestDraftSubmission returned nothing')
    }

    return updateResult.data.updateDraftSubmission.draftSubmission
}

const createAndUpdateTestDraftSubmission = async (
    server: ApolloServer,
    partialDraftSubmissionUpdates?: Partial<
        UpdateDraftSubmissionInput['draftSubmissionUpdates']
    >
): Promise<DraftSubmission> => {
    const draft = await createTestDraftSubmission(server)
    const startDate = '2025-05-01'
    const endDate = '2026-04-30'
    const dateCertified = '2025-03-15'

    const updates = {
        programIDs: [defaultFloridaProgram().id],
        submissionType: 'CONTRACT_AND_RATES' as const,
        submissionDescription: 'An updated submission',
        documents: [],

        stateContacts: [
            {
                name: 'test name',
                titleRole: 'test title',
                email: 'email@test.com',
            },
        ],
        actuaryContacts: [
            {
                name: 'test name',
                titleRole: 'test title',
                email: 'email@test.com',
                actuarialFirm: 'MERCER' as const,
                actuarialFirmOther: '',
            },
        ],
        actuaryCommunicationPreference: 'OACT_TO_ACTUARY' as const,
        contractType: 'BASE' as const,
        contractExecutionStatus: 'EXECUTED' as const,
        contractDateStart: startDate,
        contractDateEnd: endDate,
        contractDocuments: [
            {
                name: 'contractDocument.pdf',
                s3URL: 'fakeS3URL',
                documentCategories: ['CONTRACT' as const],
            },
        ],
        managedCareEntities: ['MCO'],
        federalAuthorities: ['STATE_PLAN' as const],
        rateType: 'NEW' as const,
        rateDateStart: startDate,
        rateDateEnd: endDate,
        rateDateCertified: dateCertified,
        rateDocuments: [
            {
                name: 'rateDocument.pdf',
                s3URL: 'fakeS3URL',
                documentCategories: ['RATES' as const],
            },
        ],
        ...partialDraftSubmissionUpdates,
    }

    const updatedDraft = await updateTestDraftSubmission(
        server,
        draft.id,
        updates
    )

    return updatedDraft
}

const submitTestDraftSubmission = async (
    server: ApolloServer,
    submissionID: string
) => {
    const updateResult = await server.executeOperation({
        query: SUBMIT_DRAFT_SUBMISSION,
        variables: {
            input: {
                submissionID,
            },
        },
    })

    if (updateResult.errors) {
        console.log('errors', updateResult.errors)
        throw new Error(
            `updateTestDraftSubmission mutation failed with errors ${updateResult.errors}`
        )
    }

    if (updateResult.data === undefined || updateResult.data === null) {
        throw new Error('updateTestDraftSubmission returned nothing')
    }

    return updateResult.data.submitDraftSubmission.submission
}

const resubmitTestDraftSubmission = async (
    server: ApolloServer,
    submissionID: string,
    submittedReason: string
) => {
    const updateResult = await server.executeOperation({
        query: SUBMIT_DRAFT_SUBMISSION,
        variables: {
            input: {
                submissionID,
                submittedReason,
            },
        },
    })

    if (updateResult.errors) {
        console.log('errors', updateResult.errors)
        throw new Error(
            `updateTestDraftSubmission mutation failed with errors ${updateResult.errors}`
        )
    }

    if (updateResult.data === undefined || updateResult.data === null) {
        throw new Error('updateTestDraftSubmission returned nothing')
    }

    return updateResult.data.submitDraftSubmission.submission
}

const unlockTestDraftSubmission = async (
    server: ApolloServer,
    submissionID: string,
    unlockedReason: string
): Promise<Submission2> => {
    const updateResult = await server.executeOperation({
        query: UNLOCK_STATE_SUBMISSION,
        variables: {
            input: {
                submissionID,
                unlockedReason,
            },
        },
    })

    if (updateResult.errors) {
        console.log('errors', updateResult.errors)
        throw new Error(
            `updateTestDraftSubmission mutation failed with errors ${updateResult.errors}`
        )
    }

    if (updateResult.data === undefined || updateResult.data === null) {
        throw new Error('updateTestDraftSubmission returned nothing')
    }

    return updateResult.data.unlockStateSubmission.submission
}

const createTestStateSubmission = async (
    server: ApolloServer
): Promise<Submission2> => {
    const draft = await createAndUpdateTestDraftSubmission(server)

    const updatedSubmission = await submitTestDraftSubmission(server, draft.id)

    return updatedSubmission
}

const fetchTestDraftSubmissionById = async (
    server: ApolloServer,
    submissionID: string
): Promise<DraftSubmission> => {
    const input = { submissionID }
    const result = await server.executeOperation({
        query: FETCH_DRAFT_SUBMISSION,
        variables: { input },
    })

    if (result.errors)
        throw new Error(
            `fetchTestDraftSubmission query failed with errors ${result.errors}`
        )

    if (!result.data) {
        throw new Error('fetchTestDraftSubmission returned nothing')
    }

    return result.data.fetchDraftSubmission.draftSubmission
}

const fetchTestStateSubmissionById = async (
    server: ApolloServer,
    submissionID: string
): Promise<StateSubmission> => {
    const input = { submissionID }
    const result = await server.executeOperation({
        query: FETCH_STATE_SUBMISSION,
        variables: { input },
    })

    if (result.errors) {
        console.log('err fetching state submission: ', result.errors)
        throw new Error('fetchTestStateSubmissionById query failed with errors')
    }

    if (!result.data) {
        throw new Error('fetchTestStateSubmissionById returned nothing')
    }

    return result.data.fetchStateSubmission.submission
}

export {
    constructTestPostgresServer,
    createTestDraftSubmission,
    createTestStateSubmission,
    createTestSubmission2,
    updateTestDraftSubmission,
    createAndUpdateTestDraftSubmission,
    fetchTestDraftSubmissionById,
    submitTestDraftSubmission,
    unlockTestDraftSubmission,
    fetchTestStateSubmissionById,
    defaultContext,
    defaultFloridaProgram,
    resubmitTestDraftSubmission,
}
