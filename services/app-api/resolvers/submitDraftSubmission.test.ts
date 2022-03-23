import SUBMIT_DRAFT_SUBMISSION from '../../app-graphql/src/mutations/submitDraftSubmission.graphql'
import { StateSubmission } from '../gen/gqlServer'
import {
    constructTestPostgresServer,
    createAndUpdateTestDraftSubmission,
    fetchTestStateSubmissionById,
    defaultContext,
    defaultFloridaProgram,
} from '../testHelpers/gqlHelpers'
import {testEmailConfig, testEmailer} from '../testHelpers/emailerHelpers'

describe('submitDraftSubmission', () => {
    it('returns a StateSubmission if complete', async () => {
        const server = await constructTestPostgresServer()

        // setup
        const draft = await createAndUpdateTestDraftSubmission(server, {})
        const draftID = draft.id

        // submit
        await new Promise((resolve) => setTimeout(resolve, 2000))
        const submitResult = await server.executeOperation({
            query: SUBMIT_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: draftID,
                },
            },
        })

        expect(submitResult.errors).toBeUndefined()
        const createdID =
            submitResult?.data?.submitDraftSubmission.submission.id

        // test result
        const resultDraft = await fetchTestStateSubmissionById(
            server,
            createdID
        )

        // The submission fields should still be set
        expect(resultDraft.id).toEqual(createdID)
        expect(resultDraft.submissionType).toEqual('CONTRACT_AND_RATES')
        expect(resultDraft.programIDs).toEqual([defaultFloridaProgram().id])
        // check that the stateNumber is being returned the same
        expect(resultDraft.name.split('-')[2]).toEqual(draft.name.split('-')[2])
        expect(resultDraft.submissionDescription).toEqual(
            'An updated submission'
        )
        expect(resultDraft.documents).toEqual(draft.documents)

        // Contract details fields should still be set
        expect(resultDraft.contractType).toEqual(draft.contractType)
        expect(resultDraft.contractExecutionStatus).toEqual(draft.contractExecutionStatus)
        expect(resultDraft.contractDateStart).toEqual(draft.contractDateStart)
        expect(resultDraft.contractDateEnd).toEqual(draft.contractDateEnd)
        expect(resultDraft.managedCareEntities).toEqual(
            draft.managedCareEntities
        )
        expect(resultDraft.contractDocuments).toEqual(draft.contractDocuments)

        expect(resultDraft.federalAuthorities).toEqual(draft.federalAuthorities)
        // submittedAt should be set to today's date
        const today = new Date()
        const expectedDate = today.toISOString().split('T')[0]
        expect(resultDraft.submittedAt).toEqual(expectedDate)

        // UpdatedAt should be after the former updatedAt
        const resultUpdated = new Date(resultDraft.updatedAt)
        const createdUpdated = new Date(draft.updatedAt)
        expect(
            resultUpdated.getTime() - createdUpdated.getTime()
        ).toBeGreaterThan(0)
    })

    it('returns an error if there are no contract documents attached', async () => {
        const server = await constructTestPostgresServer()

        const draft = await createAndUpdateTestDraftSubmission(server, {
            documents: [],
            contractDocuments: [],
        })
        const draftID = draft.id

        const submitResult = await server.executeOperation({
            query: SUBMIT_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: draftID,
                },
            },
        })

        expect(submitResult.errors).toBeDefined()

        expect(submitResult.errors?.[0].extensions?.code).toEqual(
            'BAD_USER_INPUT'
        )
        expect(submitResult.errors?.[0].extensions?.message).toEqual(
            'submissions must have valid documents'
        )
    })

    it('returns an error if there are no contract details fields', async () => {
        const server = await constructTestPostgresServer()

        const draft = await createAndUpdateTestDraftSubmission(server, {
            contractType: undefined,
            contractExecutionStatus: undefined,
            managedCareEntities: [],
            federalAuthorities: [],
        })

        const draftID = draft.id
        const submitResult = await server.executeOperation({
            query: SUBMIT_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: draftID,
                },
            },
        })

        expect(submitResult.errors).toBeDefined()

        expect(submitResult.errors?.[0].extensions?.code).toEqual(
            'BAD_USER_INPUT'
        )
        expect(submitResult.errors?.[0].extensions?.message).toEqual(
            'submissions is missing required contract fields'
        )
    })

    it('returns an error if there are missing rate details fields for submission type', async () => {
        const server = await constructTestPostgresServer()

        const draft = await createAndUpdateTestDraftSubmission(server, {
            submissionType: 'CONTRACT_AND_RATES',
            rateType: undefined,
            rateDateStart: undefined,
            rateDateEnd: undefined,
            rateDateCertified: undefined,
        })

        const draftID = draft.id
        const submitResult = await server.executeOperation({
            query: SUBMIT_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: draftID,
                },
            },
        })

        expect(submitResult.errors).toBeDefined()

        expect(submitResult.errors?.[0].extensions?.code).toEqual(
            'BAD_USER_INPUT'
        )
        expect(submitResult.errors?.[0].extensions?.message).toEqual(
            'submission is missing required rate fields'
        )
    })

    it('returns an error if there are invalid rate details fields for submission type', async () => {
        const server = await constructTestPostgresServer()

        const draft = await createAndUpdateTestDraftSubmission(server, {
            submissionType: 'CONTRACT_ONLY',
            rateDateStart: '2025-05-01',
            rateDateEnd: '2026-04-30',
            rateDateCertified: '2025-03-15',
        })

        const draftID = draft.id
        const submitResult = await server.executeOperation({
            query: SUBMIT_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: draftID,
                },
            },
        })

        expect(submitResult.errors).toBeDefined()

        expect(submitResult.errors?.[0].extensions?.code).toEqual(
            'BAD_USER_INPUT'
        )
        expect(submitResult.errors?.[0].extensions?.message).toEqual(
            'submission includes invalid rate fields'
        )
    })

    it('sends two emails', async () => {
        const mockEmailer = testEmailer()

        //mock invoke email submit lambda
        const server = await constructTestPostgresServer({
            emailer: mockEmailer,
        })
        const draft = await createAndUpdateTestDraftSubmission(server, {})
        const draftID = draft.id

        await new Promise((resolve) => setTimeout(resolve, 2000)) // TODO: why is this here in other tests??
        const submitResult = await server.executeOperation({
            query: SUBMIT_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: draftID,
                },
            },
        })

        expect(submitResult.errors).toBeUndefined()
        expect(mockEmailer.sendEmail).toHaveBeenCalledTimes(2)
    })

    it('send CMS email to CMS if submission is valid', async () => {
        const config = testEmailConfig
        const mockEmailer = testEmailer(config)
        //mock invoke email submit lambda
        const server = await constructTestPostgresServer({
            emailer: mockEmailer,
        })
        const draft = await createAndUpdateTestDraftSubmission(server, {})
        const draftID = draft.id

        await new Promise((resolve) => setTimeout(resolve, 2000)) // TODO: why is this here in other tests??
        const submitResult = await server.executeOperation({
            query: SUBMIT_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: draftID,
                },
            },
        })


        const sub = submitResult?.data?.submitDraftSubmission
            ?.submission as StateSubmission

        // email subject line is correct for CMS email
        expect(mockEmailer.sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                subject: expect.stringContaining(
                    `TEST New Managed Care Submission: ${sub.name}`
                ),
                sourceEmail: config.emailSource,
                toAddresses: expect.arrayContaining(
                    Array.from(config.cmsReviewSharedEmails)
                ),
            })
        )
    })

    it('send state email to logged in user if submission is valid', async () => {
        const config = testEmailConfig
        const mockEmailer = testEmailer(config)
        const server = await constructTestPostgresServer({
            emailer: mockEmailer,
        })

        const currentUser  = defaultContext().user // need this to reach into gql tests and understand who current user is
        const draft = await createAndUpdateTestDraftSubmission(server, {})
        const draftID = draft.id

        await new Promise((resolve) => setTimeout(resolve, 2000)) // TODO: why is this here in other tests??
        const submitResult = await server.executeOperation({
            query: SUBMIT_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: draftID,
                },
            },
        })

        expect(submitResult.errors).toBeUndefined()

        const sub = submitResult?.data?.submitDraftSubmission
            ?.submission as StateSubmission

        expect(mockEmailer.sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                subject: expect.stringContaining(
                    `TEST ${sub.name} was sent to CMS`
                ),
                sourceEmail: config.emailSource,
                toAddresses: expect.arrayContaining(
                   [currentUser.email]
                ),
            })
        )
    })

    it('send state email to all state contacts if submission is valid', async () => {
        const mockEmailer = testEmailer()
        const server = await constructTestPostgresServer({
            emailer: mockEmailer,
        })
        const draft = await createAndUpdateTestDraftSubmission(server, {})
        const draftID = draft.id

        await new Promise((resolve) => setTimeout(resolve, 2000)) // TODO: why is this here in other tests??
        const submitResult = await server.executeOperation({
            query: SUBMIT_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: draftID,
                },
            },
        })

        expect(submitResult.errors).toBeUndefined()

        const sub = submitResult?.data?.submitDraftSubmission
            ?.submission as StateSubmission

        expect(mockEmailer.sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                subject: expect.stringContaining(
                    `TEST ${sub.name} was sent to CMS`
                ),
                toAddresses: expect.arrayContaining([sub.stateContacts[0].email])
            })
        )
    })


    it('does not send any emails if submission fails', async () => {
        const mockEmailer = testEmailer()
        const server = await constructTestPostgresServer({
            emailer: mockEmailer,
        })
        const draft = await createAndUpdateTestDraftSubmission(server, {
            submissionType: 'CONTRACT_ONLY',
            rateDateStart: '2025-05-01',
            rateDateEnd: '2026-04-30',
            rateDateCertified: '2025-03-15',
        })
        const draftID = draft.id

        const submitResult = await server.executeOperation({
            query: SUBMIT_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: draftID,
                },
            },
        })

        expect(submitResult.errors).toBeDefined()
        expect(mockEmailer.sendEmail).not.toHaveBeenCalled()
    })
})
