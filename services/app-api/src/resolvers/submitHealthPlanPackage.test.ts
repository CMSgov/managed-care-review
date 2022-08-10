import SUBMIT_HEALTH_PLAN_PACKAGE from '../../../app-graphql/src/mutations/submitHealthPlanPackage.graphql'
import {
    constructTestPostgresServer,
    createAndUpdateTestHealthPlanPackage,
    fetchTestHealthPlanPackageById,
    defaultContext,
    defaultFloridaProgram,
    unlockTestHealthPlanPackage,
    resubmitTestHealthPlanPackage,
    createAndSubmitTestHealthPlanPackage,
    defaultFloridaRateProgram,
    updateTestHealthPlanFormData,
} from '../testHelpers/gqlHelpers'
import { testEmailConfig, testEmailer } from '../testHelpers/emailerHelpers'
import { base64ToDomain } from '../../../app-web/src/common-code/proto/healthPlanFormDataProto'
import {
    generateRateName,
    packageName,
} from '../../../app-web/src/common-code/healthPlanFormDataType'
import { latestFormData } from '../testHelpers/healthPlanPackageHelpers'
import {
    getTestStateAnalystsEmails,
    mockEmailParameterStoreError,
} from '../testHelpers/parameterStoreHelpers'

describe('submitHealthPlanPackage', () => {
    it('returns a StateSubmission if complete', async () => {
        console.log('TIMEOUT DEBUG: Start Test')
        const server = await constructTestPostgresServer()
        console.log('TIMEOUT DEBUG: Got Postgres Server')

        // setup
        const initialPkg = await createAndUpdateTestHealthPlanPackage(
            server,
            {}
        )
        console.log('TIMEOUT DEBUG: Created HPP')
        const draft = latestFormData(initialPkg)
        const draftID = draft.id

        await new Promise((resolve) => setTimeout(resolve, 2000))
        console.log('TIMEOUT DEBUG: Waited')

        // submit
        const submitResult = await server.executeOperation({
            query: SUBMIT_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: draftID,
                },
            },
        })
        console.log('TIMEOUT DEBUG: Submitted')

        expect(submitResult.errors).toBeUndefined()
        const createdID = submitResult?.data?.submitHealthPlanPackage.pkg.id

        // test result
        const pkg = await fetchTestHealthPlanPackageById(server, createdID)

        const resultDraft = latestFormData(pkg)

        // The submission fields should still be set
        expect(resultDraft.id).toEqual(createdID)
        expect(resultDraft.submissionType).toBe('CONTRACT_AND_RATES')
        expect(resultDraft.programIDs).toEqual([defaultFloridaProgram().id])
        // check that the stateNumber is being returned the same
        expect(resultDraft.stateNumber).toEqual(draft.stateNumber)
        expect(resultDraft.submissionDescription).toBe('An updated submission')
        expect(resultDraft.documents).toEqual(draft.documents)

        // Contract details fields should still be set
        expect(resultDraft.contractType).toEqual(draft.contractType)
        expect(resultDraft.contractExecutionStatus).toEqual(
            draft.contractExecutionStatus
        )
        expect(resultDraft.contractDateStart).toEqual(draft.contractDateStart)
        expect(resultDraft.contractDateEnd).toEqual(draft.contractDateEnd)
        expect(resultDraft.managedCareEntities).toEqual(
            draft.managedCareEntities
        )
        expect(resultDraft.contractDocuments).toEqual(draft.contractDocuments)

        expect(resultDraft.federalAuthorities).toEqual(draft.federalAuthorities)

        if (resultDraft.status == 'DRAFT') {
            throw new Error('Not a locked submission')
        }

        // submittedAt should be set to today's date
        const today = new Date()
        const expectedDate = today.toISOString().split('T')[0]
        expect(pkg.initiallySubmittedAt).toEqual(expectedDate)

        // UpdatedAt should be after the former updatedAt
        const resultUpdated = new Date(resultDraft.updatedAt)
        const createdUpdated = new Date(draft.updatedAt)
        expect(
            resultUpdated.getTime() - createdUpdated.getTime()
        ).toBeGreaterThan(0)

        console.log('TIMEOUT DEBUG: Ran all expects')
    }, 20000)

    it('returns an error if there are no contract documents attached', async () => {
        const server = await constructTestPostgresServer()

        const draft = await createAndUpdateTestHealthPlanPackage(server, {
            documents: [],
            contractDocuments: [],
        })
        const draftID = draft.id

        const submitResult = await server.executeOperation({
            query: SUBMIT_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: draftID,
                },
            },
        })

        expect(submitResult.errors).toBeDefined()

        expect(submitResult.errors?.[0].extensions?.code).toBe('BAD_USER_INPUT')
        expect(submitResult.errors?.[0].extensions?.message).toBe(
            'formData must have valid documents'
        )
    })

    it('returns an error if there are no contract details fields', async () => {
        const server = await constructTestPostgresServer()

        const draft = await createAndUpdateTestHealthPlanPackage(server, {
            contractType: undefined,
            contractExecutionStatus: undefined,
            managedCareEntities: [],
            federalAuthorities: [],
        })

        const draftID = draft.id
        const submitResult = await server.executeOperation({
            query: SUBMIT_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: draftID,
                },
            },
        })

        expect(submitResult.errors).toBeDefined()

        expect(submitResult.errors?.[0].extensions?.code).toBe('BAD_USER_INPUT')
        expect(submitResult.errors?.[0].extensions?.message).toBe(
            'formData is missing required contract fields'
        )
    })

    it('returns an error if there are missing rate details fields for submission type', async () => {
        const server = await constructTestPostgresServer()

        const draft = await createAndUpdateTestHealthPlanPackage(server, {
            submissionType: 'CONTRACT_AND_RATES',
            rateType: undefined,
            rateDateStart: undefined,
            rateDateEnd: undefined,
            rateDateCertified: undefined,
        })

        const draftID = draft.id
        const submitResult = await server.executeOperation({
            query: SUBMIT_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: draftID,
                },
            },
        })

        expect(submitResult.errors).toBeDefined()

        expect(submitResult.errors?.[0].extensions?.code).toBe('BAD_USER_INPUT')
        expect(submitResult.errors?.[0].extensions?.message).toBe(
            'formData is missing required rate fields'
        )
    })

    it('returns an error if there are invalid rate details fields for submission type', async () => {
        const server = await constructTestPostgresServer()

        const draft = await createAndUpdateTestHealthPlanPackage(server, {
            submissionType: 'CONTRACT_ONLY',
            rateDateStart: new Date(Date.UTC(2025, 5, 1)),
            rateDateEnd: new Date(Date.UTC(2026, 4, 30)),
            rateDateCertified: new Date(Date.UTC(2025, 3, 15)),
        })

        const draftID = draft.id
        const submitResult = await server.executeOperation({
            query: SUBMIT_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: draftID,
                },
            },
        })

        expect(submitResult.errors).toBeDefined()

        expect(submitResult.errors?.[0].extensions?.code).toBe('BAD_USER_INPUT')
        expect(submitResult.errors?.[0].extensions?.message).toBe(
            'formData includes invalid rate fields'
        )
    })

    it('sends two emails', async () => {
        const mockEmailer = testEmailer()

        //mock invoke email submit lambda
        const server = await constructTestPostgresServer({
            emailer: mockEmailer,
        })
        const draft = await createAndUpdateTestHealthPlanPackage(server, {})
        const draftID = draft.id

        const submitResult = await server.executeOperation({
            query: SUBMIT_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: draftID,
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
        const draft = await createAndUpdateTestHealthPlanPackage(server, {})
        const draftID = draft.id

        const submitResult = await server.executeOperation({
            query: SUBMIT_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: draftID,
                },
            },
        })

        const currentRevision =
            submitResult?.data?.submitHealthPlanPackage?.pkg.revisions[0].node

        const sub = base64ToDomain(currentRevision.formDataProto)
        if (sub instanceof Error) {
            throw sub
        }

        const programs = [defaultFloridaProgram()]
        const name = packageName(sub, programs)
        const stateAnalystsEmails = getTestStateAnalystsEmails(sub)

        const cmsEmails = [
            ...config.cmsReviewSharedEmails,
            ...stateAnalystsEmails,
        ]

        // email subject line is correct for CMS email
        expect(mockEmailer.sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                subject: expect.stringContaining(
                    `New Managed Care Submission: ${name}`
                ),
                sourceEmail: config.emailSource,
                toAddresses: expect.arrayContaining(Array.from(cmsEmails)),
            })
        )
    })

    it('does send email when request for state analysts emails fails', async () => {
        const config = testEmailConfig
        const mockEmailer = testEmailer(config)
        //mock invoke email submit lambda
        const mockEmailParameterStore = mockEmailParameterStoreError()
        const server = await constructTestPostgresServer({
            emailer: mockEmailer,
            emailParameterStore: mockEmailParameterStore,
        })
        const draft = await createAndUpdateTestHealthPlanPackage(server, {})
        const draftID = draft.id

        await server.executeOperation({
            query: SUBMIT_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: draftID,
                },
            },
        })

        expect(mockEmailer.sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                toAddresses: expect.arrayContaining(
                    Array.from(config.cmsReviewSharedEmails)
                ),
            })
        )
    })

    it('does log error when request for state specific analysts emails failed', async () => {
        const mockEmailParameterStore = mockEmailParameterStoreError()
        const consoleErrorSpy = jest.spyOn(console, 'error')
        const error = {
            error: 'No store found',
            message: 'getStateAnalystsEmails failed',
            operation: 'getStateAnalystsEmails',
            status: 'ERROR',
        }

        const server = await constructTestPostgresServer({
            emailParameterStore: mockEmailParameterStore,
        })
        const draft = await createAndUpdateTestHealthPlanPackage(server, {})
        const draftID = draft.id

        await server.executeOperation({
            query: SUBMIT_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: draftID,
                },
            },
        })

        expect(consoleErrorSpy).toHaveBeenCalledWith(error)
    })

    it('send state email to logged in user if submission is valid', async () => {
        const config = testEmailConfig
        const mockEmailer = testEmailer(config)
        const server = await constructTestPostgresServer({
            emailer: mockEmailer,
        })

        const currentUser = defaultContext().user // need this to reach into gql tests and understand who current user is
        const draft = await createAndUpdateTestHealthPlanPackage(server, {})
        const draftID = draft.id

        const submitResult = await server.executeOperation({
            query: SUBMIT_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: draftID,
                },
            },
        })

        expect(submitResult.errors).toBeUndefined()

        const currentRevision =
            submitResult?.data?.submitHealthPlanPackage?.pkg.revisions[0].node

        const sub = base64ToDomain(currentRevision.formDataProto)
        if (sub instanceof Error) {
            throw sub
        }

        const programs = [defaultFloridaProgram()]
        const ratePrograms = [defaultFloridaRateProgram()]
        const name = packageName(sub, programs)
        const rateName = generateRateName(sub, ratePrograms)

        expect(mockEmailer.sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                subject: expect.stringContaining(`${name} was sent to CMS`),
                sourceEmail: config.emailSource,
                toAddresses: expect.arrayContaining([currentUser.email]),
                bodyHTML: expect.stringContaining(rateName),
            })
        )
    })

    it('generates rate name by package programs when rate programs are not specified', async () => {
        const config = testEmailConfig
        const mockEmailer = testEmailer(config)
        //mock invoke email submit lambda
        const stateServer = await constructTestPostgresServer({
            emailer: mockEmailer,
        })

        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            stateServer
        )
        const cmsServer = await constructTestPostgresServer({
            context: {
                user: {
                    name: 'Zuko',
                    role: 'CMS_USER',
                    email: 'zuko@example.com',
                },
            },
        })

        const unlockResult = await unlockTestHealthPlanPackage(
            cmsServer,
            stateSubmission.id,
            'Test unlock reason.'
        )

        const unlockedRevisionFormData =
            unlockResult.revisions[0].node.formDataProto

        const unlockedFormData = base64ToDomain(unlockedRevisionFormData)
        if (unlockedFormData instanceof Error) {
            throw unlockedFormData
        }

        //Set rate programs to empty string
        unlockedFormData.rateProgramIDs = []

        //Update and resubmit
        await updateTestHealthPlanFormData(stateServer, unlockedFormData)

        const submitResult = await resubmitTestHealthPlanPackage(
            stateServer,
            unlockedFormData.id,
            'Test resubmitted reason'
        )

        const currentRevision = submitResult.revisions[0].node.formDataProto

        const sub = base64ToDomain(currentRevision)
        if (sub instanceof Error) {
            throw sub
        }

        const programs = [defaultFloridaProgram()]
        const name = packageName(sub, programs)
        const rateName = generateRateName(sub, programs)

        // email subject line is correct for CMS email and contains correct email body text
        expect(mockEmailer.sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                subject: expect.stringContaining(`${name} was resubmitted`),
                //Rate name should have defaulted back to using package programs to generate name
                bodyHTML: expect.stringContaining(rateName),
            })
        )
    })

    it('send state email to all state contacts if submission is valid', async () => {
        const mockEmailer = testEmailer()
        const server = await constructTestPostgresServer({
            emailer: mockEmailer,
        })
        const draft = await createAndUpdateTestHealthPlanPackage(server, {})
        const draftID = draft.id

        const submitResult = await server.executeOperation({
            query: SUBMIT_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: draftID,
                },
            },
        })

        expect(submitResult.errors).toBeUndefined()

        const currentRevision =
            submitResult?.data?.submitHealthPlanPackage?.pkg.revisions[0].node

        const sub = base64ToDomain(currentRevision.formDataProto)
        if (sub instanceof Error) {
            throw sub
        }

        const programs = [defaultFloridaProgram()]
        const name = packageName(sub, programs)

        expect(mockEmailer.sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                subject: expect.stringContaining(`${name} was sent to CMS`),
                toAddresses: expect.arrayContaining([
                    sub.stateContacts[0].email,
                ]),
            })
        )
    })

    it('send CMS email to CMS on valid resubmission', async () => {
        const config = testEmailConfig
        const mockEmailer = testEmailer(config)
        //mock invoke email submit lambda
        const stateServer = await constructTestPostgresServer({
            emailer: mockEmailer,
        })

        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            stateServer
        )
        const cmsServer = await constructTestPostgresServer({
            context: {
                user: {
                    name: 'Zuko',
                    role: 'CMS_USER',
                    email: 'zuko@example.com',
                },
            },
        })

        await unlockTestHealthPlanPackage(
            cmsServer,
            stateSubmission.id,
            'Test unlock reason.'
        )

        const submitResult = await stateServer.executeOperation({
            query: SUBMIT_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: stateSubmission.id,
                    submittedReason: 'Test resubmitted reason',
                },
            },
        })

        const currentRevision =
            submitResult?.data?.submitHealthPlanPackage?.pkg.revisions[0].node

        const sub = base64ToDomain(currentRevision.formDataProto)
        if (sub instanceof Error) {
            throw sub
        }

        const programs = [defaultFloridaProgram()]
        const name = packageName(sub, programs)

        // email subject line is correct for CMS email and contains correct email body text
        expect(mockEmailer.sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                subject: expect.stringContaining(`${name} was resubmitted`),
                sourceEmail: config.emailSource,
                bodyText: expect.stringContaining(
                    `The state completed their edits on submission ${name}`
                ),
                toAddresses: expect.arrayContaining(
                    Array.from(config.cmsReviewSharedEmails)
                ),
            })
        )
    })

    it('send state email to state contacts and current user on valid resubmission', async () => {
        const config = testEmailConfig
        const mockEmailer = testEmailer(config)
        //mock invoke email submit lambda
        const stateServer = await constructTestPostgresServer({
            emailer: mockEmailer,
        })

        const currentUser = defaultContext().user

        const stateSubmission = await createAndSubmitTestHealthPlanPackage(
            stateServer
        )

        const cmsServer = await constructTestPostgresServer({
            context: {
                user: {
                    name: 'Zuko',
                    role: 'CMS_USER',
                    email: 'zuko@example.com',
                },
            },
        })

        await unlockTestHealthPlanPackage(
            cmsServer,
            stateSubmission.id,
            'Test unlock reason.'
        )

        const submitResult = await resubmitTestHealthPlanPackage(
            stateServer,
            stateSubmission.id,
            'Test resubmission reason'
        )

        const currentRevision = submitResult?.revisions[0].node

        const sub = base64ToDomain(currentRevision.formDataProto)
        if (sub instanceof Error) {
            throw sub
        }

        const programs = [defaultFloridaProgram()]
        const name = packageName(sub, programs)

        // email subject line is correct for CMS email and contains correct email body text
        expect(mockEmailer.sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                subject: expect.stringContaining(`${name} was resubmitted`),
                sourceEmail: config.emailSource,
                toAddresses: expect.arrayContaining([
                    currentUser.email,
                    sub.stateContacts[0].email,
                ]),
            })
        )
    })

    it('does not send any emails if submission fails', async () => {
        const mockEmailer = testEmailer()
        const server = await constructTestPostgresServer({
            emailer: mockEmailer,
        })
        const draft = await createAndUpdateTestHealthPlanPackage(server, {
            submissionType: 'CONTRACT_ONLY',
            rateDateStart: new Date(Date.UTC(2025, 5, 1)),
            rateDateEnd: new Date(Date.UTC(2026, 4, 30)),
            rateDateCertified: new Date(Date.UTC(2025, 3, 15)),
        })
        const draftID = draft.id

        const submitResult = await server.executeOperation({
            query: SUBMIT_HEALTH_PLAN_PACKAGE,
            variables: {
                input: {
                    pkgID: draftID,
                },
            },
        })

        expect(submitResult.errors).toBeDefined()
        expect(mockEmailer.sendEmail).not.toHaveBeenCalled()
    })
})
