import { GraphQLError } from 'graphql'
import UNLOCK_HEALTH_PLAN_PACKAGE from '../../../../app-graphql/src/mutations/unlockHealthPlanPackage.graphql'
import { HealthPlanPackage } from '../../gen/gqlServer'
import { todaysDate } from '../../testHelpers/dateHelpers'
import {
    constructTestPostgresServer,
    createAndUpdateTestHealthPlanPackage,
    createAndSubmitTestHealthPlanPackage,
    defaultFloridaProgram,
    fetchTestHealthPlanPackageById,
    submitTestHealthPlanPackage,
    unlockTestHealthPlanPackage,
    updateTestHealthPlanFormData,
    resubmitTestHealthPlanPackage,
    defaultFloridaRateProgram,
} from '../../testHelpers/gqlHelpers'
import { latestFormData } from '../../testHelpers/healthPlanPackageHelpers'
import { mockStoreThatErrors } from '../../testHelpers/storeHelpers'
import { testEmailConfig, testEmailer } from '../../testHelpers/emailerHelpers'
import { base64ToDomain } from '@managed-care-review/common-code/proto/healthPlanFormDataProto'
import {
    generateRateName,
    packageName,
} from '@managed-care-review/common-code/healthPlanFormDataType'
import {
    getTestStateAnalystsEmails,
    mockEmailParameterStoreError,
} from '../../testHelpers/parameterStoreHelpers'
import { testCMSUser, testStateUser } from '../../testHelpers/userHelpers'

describe('unlockHealthPlanPackage', () => {
    const cmsUser = testCMSUser()
    it('returns a HealthPlanPackage with all revisions', async () => {
        const stateServer = await constructTestPostgresServer()

        // First, create a new submitted submission
        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            stateServer
        )

        const cmsServer = await constructTestPostgresServer({
            context: {
                user: cmsUser,
            },
        })

        // Unlock
        const unlockResult = await cmsServer.executeOperation({
            query: UNLOCK_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: stateSubmission.id,
                    unlockedReason: 'Super duper good reason.',
                },
            },
        })

        expect(unlockResult.errors).toBeUndefined()

        if (!unlockResult?.data) {
            throw new Error('this should never happen')
        }

        const unlockedSub: HealthPlanPackage =
            unlockResult.data.unlockHealthPlanPackage.pkg

        // After unlock, we should get a draft submission back
        expect(unlockedSub.status).toBe('UNLOCKED')

        expect(unlockedSub.revisions).toHaveLength(2)

        expect(unlockedSub.revisions[0].node.submitInfo).toBeNull()
        expect(unlockedSub.revisions[1].node.submitInfo).toBeDefined()
        expect(
            unlockedSub.revisions[1].node.submitInfo?.updatedAt.toISOString()
        ).toContain(todaysDate())
        // check that the date has full ISO time eg. 2022-03-25T03:09:54.864Z
        expect(
            unlockedSub.revisions[1].node.submitInfo?.updatedAt.toISOString()
        ).toContain('Z')

        expect(unlockedSub.revisions[0].node.unlockInfo).toBeDefined()
        expect(unlockedSub.revisions[0].node.unlockInfo?.updatedBy).toBe(
            'zuko@example.com'
        )
        expect(unlockedSub.revisions[0].node.unlockInfo?.updatedReason).toBe(
            'Super duper good reason.'
        )
        expect(
            unlockedSub.revisions[0].node.unlockInfo?.updatedAt.toISOString()
        ).toContain(todaysDate())
        // check that the date has full ISO time eg. 2022-03-25T03:09:54.864Z
        expect(
            unlockedSub.revisions[0].node.unlockInfo?.updatedAt.toISOString()
        ).toContain('Z')
    }, 20000)

    it('returns a package that can be updated without errors', async () => {
        const stateServer = await constructTestPostgresServer()

        // First, create a new submitted submission
        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            stateServer
        )

        const cmsServer = await constructTestPostgresServer({
            context: {
                user: cmsUser,
            },
        })

        // Unlock
        const unlockResult = await cmsServer.executeOperation({
            query: UNLOCK_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: stateSubmission.id,
                    unlockedReason: 'Super duper good reason.',
                },
            },
        })

        expect(unlockResult.errors).toBeUndefined()
        const unlockedSub = unlockResult?.data?.unlockHealthPlanPackage.pkg

        // After unlock, we should get a draft submission back
        expect(unlockedSub.status).toBe('UNLOCKED')
        expect(unlockedSub.revisions[0].node.unlockInfo).toBeDefined()
        expect(unlockedSub.revisions[0].node.unlockInfo?.updatedBy).toBe(
            'zuko@example.com'
        )
        expect(unlockedSub.revisions[0].node.unlockInfo?.updatedReason).toBe(
            'Super duper good reason.'
        )
        expect(
            unlockedSub.revisions[0].node.unlockInfo?.updatedAt.toISOString()
        ).toContain(todaysDate())
        // check that the date has full ISO time eg. 2022-03-25T03:09:54.864Z
        expect(
            unlockedSub.revisions[0].node.unlockInfo?.updatedAt.toISOString()
        ).toContain('Z')

        const formData = latestFormData(unlockedSub)

        // after unlock we should be able to update that draft submission and get the results
        formData.programIDs = [defaultFloridaProgram().id]
        formData.submissionType = 'CONTRACT_AND_RATES' as const
        formData.submissionDescription = 'UPDATED_AFTER_UNLOCK'
        formData.documents = []
        formData.contractType = 'BASE' as const
        formData.contractDocuments = []
        formData.managedCareEntities = ['MCO']
        formData.federalAuthorities = ['VOLUNTARY' as const]
        formData.stateContacts = []
        formData.addtlActuaryContacts = []

        await updateTestHealthPlanFormData(stateServer, formData)

        const refetched = await fetchTestHealthPlanPackageById(
            stateServer,
            stateSubmission.id
        )

        const refetchedFormData = latestFormData(refetched)

        expect(refetchedFormData.submissionDescription).toBe(
            'UPDATED_AFTER_UNLOCK'
        )
    }, 20000)

    it('can be unlocked repeatedly', async () => {
        const stateServer = await constructTestPostgresServer()

        // First, create a new submitted submission
        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            stateServer
        )

        const cmsServer = await constructTestPostgresServer({
            context: {
                user: cmsUser,
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
            'Test first resubmission reason'
        )

        await unlockTestHealthPlanPackage(
            cmsServer,
            stateSubmission.id,
            'Super duper duper good reason.'
        )

        await resubmitTestHealthPlanPackage(
            stateServer,
            stateSubmission.id,
            'Test second resubmission reason'
        )

        const draft = await unlockTestHealthPlanPackage(
            cmsServer,
            stateSubmission.id,
            'Very super duper good reason.'
        )
        expect(draft.status).toBe('UNLOCKED')
        expect(draft.revisions[0].node.unlockInfo?.updatedBy).toBe(
            'zuko@example.com'
        )
        expect(draft.revisions[0].node.unlockInfo?.updatedReason).toBe(
            'Very super duper good reason.'
        )
        expect(
            draft.revisions[0].node.unlockInfo?.updatedAt.toISOString()
        ).toContain(todaysDate())
        // check that the date has full ISO time eg. 2022-03-25T03:09:54.864Z
        expect(
            draft.revisions[0].node.unlockInfo?.updatedAt.toISOString()
        ).toContain('Z')
    }, 20000)

    it('returns errors if a state user tries to unlock', async () => {
        const stateServer = await constructTestPostgresServer()

        // First, create a new submitted submission
        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            stateServer
        )

        // Unlock
        const unlockResult = await stateServer.executeOperation({
            query: UNLOCK_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: stateSubmission.id,
                    unlockedReason: 'Super duper good reason.',
                },
            },
        })

        expect(unlockResult.errors).toBeDefined()
        const err = (unlockResult.errors as GraphQLError[])[0]

        expect(err.extensions['code']).toBe('FORBIDDEN')
        expect(err.message).toBe('user not authorized to unlock package')
    })

    it('returns errors if trying to unlock package with wrong package status', async () => {
        const stateServer = await constructTestPostgresServer()
        const cmsServer = await constructTestPostgresServer({
            context: {
                user: cmsUser,
            },
        })

        // First, create a new draft submission
        const stateSubmission = await createAndUpdateTestHealthPlanPackage(
            stateServer
        )

        // Attempt Unlock Draft
        const unlockDraftResult = await cmsServer.executeOperation({
            query: UNLOCK_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: stateSubmission.id,
                    unlockedReason: 'Super duper good reason.',
                },
            },
        })

        expect(unlockDraftResult.errors).toBeDefined()
        const err = (unlockDraftResult.errors as GraphQLError[])[0]

        expect(err.extensions).toEqual(
            expect.objectContaining({
                code: 'INTERNAL_SERVER_ERROR',
                cause: 'INVALID_PACKAGE_STATUS',
                exception: {
                    locations: undefined,
                    message: 'Attempted to unlock package with wrong status',
                    path: undefined,
                },
            })
        )
        expect(err.message).toBe(
            'Attempted to unlock package with wrong status'
        )

        await submitTestHealthPlanPackage(stateServer, stateSubmission.id)

        // Unlock Submission
        await unlockTestHealthPlanPackage(
            cmsServer,
            stateSubmission.id,
            'Super duper good reason.'
        )

        // Attempt Unlock Unlocked
        const unlockUnlockedResult = await cmsServer.executeOperation({
            query: UNLOCK_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: stateSubmission.id,
                    unlockedReason: 'Super duper good reason.',
                },
            },
        })

        expect(unlockUnlockedResult.errors).toBeDefined()
        const unlockErr = (unlockUnlockedResult.errors as GraphQLError[])[0]

        expect(unlockErr.extensions).toEqual(
            expect.objectContaining({
                code: 'INTERNAL_SERVER_ERROR',
                cause: 'INVALID_PACKAGE_STATUS',
                exception: {
                    locations: undefined,
                    message: 'Attempted to unlock package with wrong status',
                    path: undefined,
                },
            })
        )
        expect(unlockErr.message).toBe(
            'Attempted to unlock package with wrong status'
        )
    })

    it('returns an error if the submission does not exit', async () => {
        const cmsServer = await constructTestPostgresServer({
            context: {
                user: cmsUser,
            },
        })

        // First, create a new submitted submission
        // const stateSubmission = await createAndSubmitTestHealthPlanPackage(stateServer)

        // Unlock
        const unlockResult = await cmsServer.executeOperation({
            query: UNLOCK_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: 'foo-bar',
                    unlockedReason: 'Super duper good reason.',
                },
            },
        })

        expect(unlockResult.errors).toBeDefined()
        const err = (unlockResult.errors as GraphQLError[])[0]

        expect(err.extensions['code']).toBe('BAD_USER_INPUT')
        expect(err.message).toBe('A package must exist to be unlocked: foo-bar')
    })

    it('returns an error if the DB errors', async () => {
        const errorStore = mockStoreThatErrors()

        const cmsServer = await constructTestPostgresServer({
            store: errorStore,
            context: {
                user: cmsUser,
            },
        })

        // Unlock
        const unlockResult = await cmsServer.executeOperation({
            query: UNLOCK_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: 'foo-bar',
                    unlockedReason: 'Super duper good reason.',
                },
            },
        })

        expect(unlockResult.errors).toBeDefined()
        const err = (unlockResult.errors as GraphQLError[])[0]

        expect(err.extensions['code']).toBe('INTERNAL_SERVER_ERROR')
        expect(err.message).toBe(
            'Issue finding a package of type UNEXPECTED_EXCEPTION. Message: this error came from the generic store with errors mock'
        )
    })

    it('returns errors if unlocked reason is undefined', async () => {
        const stateServer = await constructTestPostgresServer()

        // First, create a new submitted submission
        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            stateServer
        )

        const cmsServer = await constructTestPostgresServer({
            context: {
                user: cmsUser,
            },
        })

        // Attempt Unlock Draft
        const unlockedResult = await cmsServer.executeOperation({
            query: UNLOCK_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: stateSubmission.id,
                    unlockedReason: undefined,
                },
            },
        })

        expect(unlockedResult.errors).toBeDefined()
        const err = (unlockedResult.errors as GraphQLError[])[0]

        expect(err.extensions['code']).toBe('BAD_USER_INPUT')
        expect(err.message).toContain(
            'Field "unlockedReason" of required type "String!" was not provided.'
        )
    })

    it('send email to CMS when unlocking submission succeeds', async () => {
        const config = testEmailConfig
        const mockEmailer = testEmailer(config)
        //mock invoke email submit lambda
        const stateServer = await constructTestPostgresServer()

        // First, create a new submitted submission
        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            stateServer
        )

        const cmsServer = await constructTestPostgresServer({
            context: {
                user: cmsUser,
            },
            emailer: mockEmailer,
        })

        // Unlock
        const unlockResult = await unlockTestHealthPlanPackage(
            cmsServer,
            stateSubmission.id,
            'Super duper good reason.'
        )

        const currentRevision = unlockResult.revisions[0].node.formDataProto

        const sub = base64ToDomain(currentRevision)
        if (sub instanceof Error) {
            throw sub
        }

        const programs = [defaultFloridaProgram()]
        const ratePrograms = [defaultFloridaRateProgram()]
        const name = packageName(sub, programs)
        const rateName = generateRateName(sub, sub.rateInfos[0], ratePrograms)
        const stateAnalystsEmails = getTestStateAnalystsEmails(sub.stateCode)

        const cmsEmails = [
            ...config.devReviewTeamEmails,
            ...stateAnalystsEmails,
            ...config.oactEmails,
        ]

        // email subject line is correct for CMS email
        expect(mockEmailer.sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                subject: expect.stringContaining(`${name} was unlocked`),
                sourceEmail: config.emailSource,
                toAddresses: expect.arrayContaining(Array.from(cmsEmails)),
                bodyHTML: expect.stringContaining(rateName),
            })
        )
    })

    it('send state email to state contacts and all submitters when unlocking submission succeeds', async () => {
        const config = testEmailConfig
        const mockEmailer = testEmailer(config)
        //mock invoke email submit lambda
        const stateServer = await constructTestPostgresServer()
        const stateServerTwo = await constructTestPostgresServer({
            context: {
                user: testStateUser({
                    email: 'notspiderman@example.com',
                }),
            },
        })

        // First, create a new submitted submission
        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            stateServer
        )

        const cmsServer = await constructTestPostgresServer({
            context: {
                user: cmsUser,
            },
            emailer: mockEmailer,
        })

        // First unlock
        await unlockTestHealthPlanPackage(
            cmsServer,
            stateSubmission.id,
            'Super duper good reason.'
        )

        // Resubmission to get multiple submitters
        await resubmitTestHealthPlanPackage(
            stateServerTwo,
            stateSubmission.id,
            'Test resubmission reason'
        )

        // Final unlock to test against
        const unlockResult = await unlockTestHealthPlanPackage(
            cmsServer,
            stateSubmission.id,
            'Super duper good reason.'
        )

        const currentRevision = unlockResult.revisions[0].node.formDataProto

        const sub = base64ToDomain(currentRevision)
        if (sub instanceof Error) {
            throw sub
        }

        const programs = [defaultFloridaProgram()]
        const ratePrograms = [defaultFloridaRateProgram()]
        const name = packageName(sub, programs)
        const rateName = generateRateName(sub, sub.rateInfos[0], ratePrograms)

        const stateReceiverEmails = [
            'james@example.com',
            'notspiderman@example.com',
            ...sub.stateContacts.map((contact) => contact.email),
        ]

        // email subject line is correct for CMS email.
        // Mock emailer is called 4 times, 2 for the first unlock, 2 for the second unlock.
        // From the pair of emails, the second one is the state email.
        expect(mockEmailer.sendEmail).toHaveBeenNthCalledWith(
            4,
            expect.objectContaining({
                subject: expect.stringContaining(`${name} was unlocked by CMS`),
                sourceEmail: config.emailSource,
                toAddresses: expect.arrayContaining(
                    Array.from(stateReceiverEmails)
                ),
                bodyHTML: expect.stringContaining(rateName),
            })
        )
    })

    it('does send unlock email when request for state analysts emails fails', async () => {
        const config = testEmailConfig
        const mockEmailer = testEmailer(config)
        //mock invoke email submit lambda
        const mockEmailParameterStore = mockEmailParameterStoreError()
        const stateServer = await constructTestPostgresServer()

        // First, create a new submitted submission
        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            stateServer
        )

        const cmsServer = await constructTestPostgresServer({
            context: {
                user: cmsUser,
            },
            emailer: mockEmailer,
            emailParameterStore: mockEmailParameterStore,
        })

        // Unlock
        await cmsServer.executeOperation({
            query: UNLOCK_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: stateSubmission.id,
                    unlockedReason: 'Super duper good reason.',
                },
            },
        })

        expect(mockEmailer.sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                toAddresses: expect.arrayContaining(
                    Array.from(config.devReviewTeamEmails)
                ),
            })
        )
    })

    it('does log error when request for state specific analysts emails failed', async () => {
        const mockEmailParameterStore = mockEmailParameterStoreError()
        const consoleErrorSpy = jest.spyOn(console, 'error')
        const stateServer = await constructTestPostgresServer()
        const error = {
            error: 'No store found',
            message: 'getStateAnalystsEmails failed',
            operation: 'getStateAnalystsEmails',
            status: 'ERROR',
        }

        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            stateServer
        )

        const cmsServer = await constructTestPostgresServer({
            context: {
                user: cmsUser,
            },
            emailParameterStore: mockEmailParameterStore,
        })

        await cmsServer.executeOperation({
            query: UNLOCK_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: stateSubmission.id,
                    unlockedReason: 'Super duper good reason.',
                },
            },
        })

        expect(consoleErrorSpy).toHaveBeenCalledWith(error)
    })
})
