import { createTestClient } from 'apollo-server-testing'

import { DraftSubmissionType } from '../../app-web/src/common-code/domain-models'
import {
    DraftSubmissionUpdates,
    CreateDraftSubmissionInput,
} from '../gen/gqlServer'
import CREATE_DRAFT_SUBMISSION from '../../app-graphql/src/mutations/createDraftSubmission.graphql'
import UPDATE_DRAFT_SUBMISSION from '../../app-graphql/src/mutations/updateDraftSubmission.graphql'
import {
    constructTestServer,
    createTestDraftSubmission,
    fetchTestDraftSubmissionById,
} from '../testHelpers/gqlHelpers'

import { applyUpdates } from './updateDraftSubmission'

describe('updateDraftSubmission', () => {
    describe('applyUpdates', () => {
        it('correctly applies empty updates', () => {
            // table test, given different inputs do we get what we expect?

            const baseDraft: DraftSubmissionType = {
                id: 'foo-bar',
                status: 'DRAFT',
                stateCode: 'FL',
                stateNumber: 3,
                programID: 'smmc',
                submissionType: 'CONTRACT_ONLY' as const,
                submissionDescription: 'an old submission',
                createdAt: new Date(),
                updatedAt: new Date(),
                documents: [],
                managedCareEntities: [],
                federalAuthorities: [],
                rateType: 'AMENDMENT',
                rateDateStart: new Date(),
                rateDateEnd: new Date(),
                rateDateCertified: new Date(),
                rateAmendmentInfo: {
                    effectiveDateStart: new Date(),
                    effectiveDateEnd: new Date(),
                },
                stateContacts: [],
            }

            const updates: DraftSubmissionUpdates = {
                programID: 'smmc',
                submissionType: 'CONTRACT_ONLY',
                submissionDescription: 'an updated draft',
                documents: [],
                contractType: null,
                contractDateStart: null,
                contractDateEnd: null,
                managedCareEntities: [],
                federalAuthorities: [],
                contractAmendmentInfo: null,
                rateType: null,
                rateDateStart: null,
                rateDateEnd: null,
                rateDateCertified: null,
                rateAmendmentInfo: undefined,
                stateContacts: [],
            }

            applyUpdates(baseDraft, updates)

            expect(baseDraft.submissionDescription).toBe('an updated draft')
            expect(baseDraft.contractType).toBeUndefined()
            expect(baseDraft.contractDateStart).toBeUndefined()
            expect(baseDraft.contractDateEnd).toBeUndefined()
            expect(baseDraft.contractAmendmentInfo).toBeUndefined()
            expect(baseDraft.rateType).toBeUndefined()
            expect(baseDraft.rateDateStart).toBeUndefined()
            expect(baseDraft.rateDateEnd).toBeUndefined()
            expect(baseDraft.rateDateCertified).toBeUndefined()
            expect(baseDraft.rateAmendmentInfo).toBeUndefined()
        })

        it('correctly applies empty amendment updates', () => {
            // table test, given different inputs do we get what we expect?

            const baseDraft: DraftSubmissionType = {
                id: 'foo-bar',
                status: 'DRAFT',
                stateCode: 'FL',
                stateNumber: 3,
                programID: 'smmc',
                submissionType: 'CONTRACT_ONLY' as const,
                submissionDescription: 'an old submission',
                createdAt: new Date(),
                updatedAt: new Date(),
                documents: [],
                managedCareEntities: [],
                federalAuthorities: [],
                stateContacts: [],
            }

            const updates: DraftSubmissionUpdates = {
                programID: 'smmc',
                submissionType: 'CONTRACT_ONLY',
                submissionDescription: 'an updated draft',
                documents: [],
                contractType: null,
                contractDateStart: null,
                contractDateEnd: null,
                managedCareEntities: [],
                federalAuthorities: [],
                contractAmendmentInfo: {
                    itemsBeingAmended: [],
                    otherItemBeingAmended: null,
                    capitationRatesAmendedInfo: null,
                    relatedToCovid19: null,
                    relatedToVaccination: null,
                },
                rateType: null,
                rateDateStart: null,
                rateDateEnd: null,
                rateDateCertified: null,
                rateAmendmentInfo: {
                    effectiveDateStart: null,
                    effectiveDateEnd: null,
                },
                stateContacts: [],
            }

            applyUpdates(baseDraft, updates)

            expect(baseDraft.submissionDescription).toBe('an updated draft')
            expect(baseDraft.contractAmendmentInfo).toStrictEqual({
                itemsBeingAmended: [],
                otherItemBeingAmended: undefined,
                capitationRatesAmendedInfo: undefined,
                relatedToCovid19: undefined,
                relatedToVaccination: undefined,
            })
            expect(baseDraft.rateAmendmentInfo).toStrictEqual({
                effectiveDateStart: undefined,
                effectiveDateEnd: undefined,
            })
        })

        it('correctly applies empty capitationRates updates', () => {
            // table test, given different inputs do we get what we expect?

            const baseDraft: DraftSubmissionType = {
                id: 'foo-bar',
                status: 'DRAFT',
                stateCode: 'FL',
                stateNumber: 3,
                programID: 'smmc',
                submissionType: 'CONTRACT_ONLY' as const,
                submissionDescription: 'an old submission',
                createdAt: new Date(),
                updatedAt: new Date(),
                documents: [],
                managedCareEntities: [],
                federalAuthorities: [],
                stateContacts: [],
            }

            const updates: DraftSubmissionUpdates = {
                programID: 'smmc',
                submissionType: 'CONTRACT_ONLY',
                submissionDescription: 'an updated draft',
                documents: [],
                contractType: null,
                contractDateStart: null,
                contractDateEnd: null,
                managedCareEntities: [],
                federalAuthorities: [],
                contractAmendmentInfo: {
                    itemsBeingAmended: [],
                    otherItemBeingAmended: null,
                    capitationRatesAmendedInfo: {
                        reason: null,
                        otherReason: null,
                    },
                    relatedToCovid19: null,
                    relatedToVaccination: null,
                },
                rateType: null,
                rateDateStart: null,
                rateDateEnd: null,
                rateDateCertified: null,
                stateContacts: [],
            }

            applyUpdates(baseDraft, updates)

            expect(baseDraft.submissionDescription).toBe('an updated draft')
            expect(
                baseDraft.contractAmendmentInfo?.capitationRatesAmendedInfo
            ).toStrictEqual({
                reason: undefined,
                otherReason: undefined,
            })
        })
    })

    it('updates a submission if the state matches', async () => {
        const server = constructTestServer()

        const { query, mutate } = createTestClient(server)

        const createdDraft = await createTestDraftSubmission(mutate)
        const createdID = createdDraft.id
        const startDate = '2021-07-06'
        const endDate = '2021-07-12'
        const certifiedDate = '2021-01-01'
        // In order to test updatedAt, we delay 2 seconds here.
        await new Promise((resolve) => setTimeout(resolve, 2000))

        const updatedDraft = {
            programID: 'cnet',
            submissionType: 'CONTRACT_AND_RATES',
            submissionDescription: 'An updated submission',
            documents: [],
            contractType: 'BASE',
            contractDateStart: startDate,
            contractDateEnd: endDate,
            managedCareEntities: ['MCO'],
            federalAuthorities: ['VOLUNTARY'],
            rateDateStart: startDate,
            rateDateEnd: endDate,
            rateDateCertified: certifiedDate,
            stateContacts: [],
        }

        const updateResult = await mutate({
            mutation: UPDATE_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: createdID,
                    draftSubmissionUpdates: updatedDraft,
                },
            },
        })

        expect(updateResult.errors).toBeUndefined()

        const resultDraft = await fetchTestDraftSubmissionById(query, createdID)
        // General
        expect(resultDraft.id).toEqual(createdID)
        expect(resultDraft.submissionType).toEqual('CONTRACT_AND_RATES')
        expect(resultDraft.program.id).toEqual('cnet')
        // check that the stateNumber is being returned the same
        expect(resultDraft.name.split('-')[2]).toEqual(
            createdDraft.name.split('-')[2]
        )
        expect(resultDraft.submissionDescription).toEqual(
            'An updated submission'
        )

        // updatedAt should be after the former updatedAt
        const resultUpdated = new Date(resultDraft.updatedAt)
        const createdUpdated = new Date(createdDraft.updatedAt)
        expect(
            resultUpdated.getTime() - createdUpdated.getTime()
        ).toBeGreaterThan(0)

        // Contract details
        expect(resultDraft.contractType).toEqual('BASE')
        expect(resultDraft.contractDateStart).not.toBeUndefined()
        expect(resultDraft.contractDateStart).toBe(startDate)
        expect(resultDraft.contractDateEnd).toBe(endDate)
        expect(resultDraft.managedCareEntities).toEqual(['MCO'])
        expect(resultDraft.federalAuthorities).toEqual(['VOLUNTARY'])

        // Rate Details
        expect(resultDraft.rateDateStart).toBe(startDate)
        expect(resultDraft.rateDateEnd).toBe(endDate)
        expect(resultDraft.rateDateCertified).toBe(certifiedDate)
    })

    it('updates a submission to have documents', async () => {
        const server = constructTestServer()
        const { mutate } = createTestClient(server)

        const createdDraft = await createTestDraftSubmission(mutate)
        const createdID = createdDraft.id
        const startDate = '2021-07-06'
        const endDate = '2021-07-12'

        const updatedDraft = {
            programID: 'cnet',
            submissionType: 'CONTRACT_AND_RATES',
            submissionDescription: 'An updated submission',
            documents: [
                {
                    name: 'myfile.pdf',
                    s3URL: 'fakeS3URL',
                },
            ],
            contractType: 'BASE',
            contractDateStart: startDate,
            contractDateEnd: endDate,
            managedCareEntities: [],
            federalAuthorities: [],
            stateContacts: [
                {
                    name: 'Test Person',
                    titleRole: 'A Role',
                    email: 'test@test.com',
                }
            ]
        }

        const updateResult = await mutate({
            mutation: UPDATE_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: createdID,
                    draftSubmissionUpdates: updatedDraft,
                },
            },
        })

        expect(updateResult.errors).toBeUndefined()

        const resultDraft1 =
            updateResult.data.updateDraftSubmission.draftSubmission
        expect(resultDraft1.id).toEqual(createdID)
        expect(resultDraft1.documents).toEqual([
            {
                name: 'myfile.pdf',
                s3URL: 'fakeS3URL',
            },
        ])

        // Update with two more documents
        const updatedDraft2 = {
            programID: 'cnet',
            submissionType: 'CONTRACT_AND_RATES',
            submissionDescription: 'An updated submission',
            documents: [
                {
                    name: 'myfile2.pdf',
                    s3URL: 'fakeS3URL',
                },
                {
                    name: 'myfile3.pdf',
                    s3URL: 'fakeS3URL',
                },
            ],
            contractType: 'BASE',
            contractDateStart: resultDraft1.contractDateStart,
            contractDateEnd: resultDraft1.contractDateEnd,
            managedCareEntities: [],
            federalAuthorities: [],
            stateContacts: [
                {
                    name: 'John Smith',
                    titleRole: 'Fancy Title',
                    email: 'john@test.com',
                },
                {
                    name: 'Jane Doe',
                    titleRole: 'Doctor',
                    email: 'jane@test.com',
                },
            ]
        }

        const updateResult2 = await mutate({
            mutation: UPDATE_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: createdID,
                    draftSubmissionUpdates: updatedDraft2,
                },
            },
        })
        const resultDraft2 =
            updateResult2.data.updateDraftSubmission.draftSubmission
        expect(resultDraft2.documents.length).toEqual(2)
        expect(resultDraft2.documents[0].name).toEqual('myfile2.pdf')
    })

    it('updates a submission to have state contacts', async () => {
        const server = constructTestServer()
        const { mutate, query } = createTestClient(server)

        const createdDraft = await createTestDraftSubmission(mutate)
        const createdID = createdDraft.id

        const updatedDraft = {
            programID: 'cnet',
            submissionType: 'CONTRACT_AND_RATES',
            submissionDescription: 'An updated submission',
            stateContacts: [
                {
                    name: 'test name',
                    titleRole: 'fancy person',
                    email: 'test@test.com',
                },
            ],
            documents: [],
            contractType: 'BASE',
            contractDateStart: null,
            contractDateEnd: null,
            managedCareEntities: [],
            federalAuthorities: [],
        }

        const updateResult = await mutate({
            mutation: UPDATE_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: createdID,
                    draftSubmissionUpdates: updatedDraft,
                },
            },
        })

        expect(updateResult.errors).toBeUndefined()

        const resultDraft1 =
            updateResult.data.updateDraftSubmission.draftSubmission
        expect(resultDraft1.id).toEqual(createdID)
        expect(resultDraft1.stateContacts).toEqual([
          {
              name: 'test name',
              titleRole: 'fancy person',
              email: 'test@test.com',
          },
        ])

        const fetchedDraft = await fetchTestDraftSubmissionById(query, createdID)

        expect(fetchedDraft.id).toEqual(createdID)
        expect(fetchedDraft.stateContacts).toEqual([
          {
              name: 'test name',
              titleRole: 'fancy person',
              email: 'test@test.com',
          },
        ])
    })

    it('updates a submission to have contract amendment details', async () => {
        const server = constructTestServer()
        const { mutate } = createTestClient(server)

        const createdDraft = await createTestDraftSubmission(mutate)
        const createdID = createdDraft.id
        const startDate = '2021-07-06'

        const updatedDraft = {
            programID: 'cnet',
            submissionType: 'CONTRACT_AND_RATES',
            submissionDescription: 'An updated submission',
            documents: [],
            contractType: 'AMENDMENT',
            contractDateStart: startDate,
            managedCareEntities: [],
            federalAuthorities: [],
            stateContacts: [],

            // rate detail info
            contractAmendmentInfo: {
                itemsBeingAmended: [
                    'BENEFITS_PROVIDED',
                    'LENGTH_OF_CONTRACT_PERIOD',
                ],
                relatedToCovid19: false,
            },
        }

        const updateResult = await mutate({
            mutation: UPDATE_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: createdID,
                    draftSubmissionUpdates: updatedDraft,
                },
            },
        })

        expect(updateResult.errors).toBeUndefined()

        const resultDraft =
            updateResult.data.updateDraftSubmission.draftSubmission

        expect(resultDraft.id).toEqual(createdID)
        expect(resultDraft.contractAmendmentInfo.itemsBeingAmended).toEqual([
            'BENEFITS_PROVIDED',
            'LENGTH_OF_CONTRACT_PERIOD',
        ])
        expect(resultDraft.contractAmendmentInfo.relatedToCovid19).toEqual(
            false
        )
        expect(resultDraft.contractAmendmentInfo.relatedToVaccination).toEqual(
            null
        )
    })

    it('updates a submission with conditionals in contract amendment details', async () => {
        const server = constructTestServer()
        const { query, mutate } = createTestClient(server)

        const createdDraft = await createTestDraftSubmission(mutate)
        const createdID = createdDraft.id
        const startDate = '2021-07-06'

        const updatedDraft = {
            programID: 'cnet',
            submissionType: 'CONTRACT_AND_RATES',
            submissionDescription: 'An updated submission',
            documents: [],
            contractType: 'AMENDMENT',
            contractDateStart: startDate,
            managedCareEntities: [],
            federalAuthorities: [],
            contractAmendmentInfo: {
                itemsBeingAmended: [
                    'BENEFITS_PROVIDED',
                    'LENGTH_OF_CONTRACT_PERIOD',
                    'CAPITATION_RATES',
                ],
                otherItemBeingAmended: 'just having a laugh',
                capitationRatesAmendedInfo: {
                    reason: 'OTHER',
                    otherReason: 'something for fun',
                },
                relatedToCovid19: true,
            },
            stateContacts: [],
        }

        const updateResult = await mutate({
            mutation: UPDATE_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: createdID,
                    draftSubmissionUpdates: updatedDraft,
                },
            },
        })

        expect(updateResult.errors).toBeUndefined()

        const resultDraft =
            updateResult.data.updateDraftSubmission.draftSubmission

        // also check on the fetch of the same
        const fetchedDraft = await fetchTestDraftSubmissionById(
            query,
            createdID
        )

        const drafts = [resultDraft, fetchedDraft]

        // for both the result of the update call, and the result of the fetch call, make sure
        // our fields came through
        drafts.forEach((draft) => {
            expect(draft.id).toEqual(createdID)

            const info = draft.contractAmendmentInfo
            // todo should we sort these? // it should be a SET
            expect(info.itemsBeingAmended).toEqual([
                'BENEFITS_PROVIDED',
                'LENGTH_OF_CONTRACT_PERIOD',
                'CAPITATION_RATES',
            ])
            expect(info.otherItemBeingAmended).toEqual('just having a laugh')
            expect(info.capitationRatesAmendedInfo.reason).toEqual('OTHER')
            expect(info.capitationRatesAmendedInfo.otherReason).toEqual(
                'something for fun'
            )
        })
    })

    it('updates a submission to have a new rate', async () => {
        const server = constructTestServer()
        const { mutate } = createTestClient(server)

        const createdDraft = await createTestDraftSubmission(mutate)
        const createdID = createdDraft.id
        const startDate = '2021-07-01'
        const endDate = '2022-06-30'
        const rateDetails = {
            rateType: 'NEW' as const,
            rateDateStart: startDate,
            rateDateEnd: endDate,
            rateDateCertified: '2021-06-13',
        }

        const updatedDraft = {
            programID: 'cnet',
            submissionType: 'CONTRACT_AND_RATES',
            submissionDescription: 'An updated submission',
            documents: [],
            managedCareEntities: [],
            federalAuthorities: [],
            stateContacts: [],
            ...rateDetails,
        }

        const updateResult = await mutate({
            mutation: UPDATE_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: createdID,
                    draftSubmissionUpdates: updatedDraft,
                },
            },
        })

        expect(updateResult.errors).toBeUndefined()

        const resultDraft =
            updateResult.data.updateDraftSubmission.draftSubmission

        expect(resultDraft.id).toEqual(createdID)
        expect(resultDraft.rateType).toEqual(rateDetails.rateType)
        expect(resultDraft.rateDateStart).toEqual(rateDetails.rateDateStart)
        expect(resultDraft.rateDateEnd).toEqual(rateDetails.rateDateEnd)
        expect(resultDraft.rateDateCertified).toEqual(
            rateDetails.rateDateCertified
        )
        expect(resultDraft.rateAmendmentInfo).toBeNull()
    })

    it('updates a submission to have a rate amendment', async () => {
        const server = constructTestServer()
        const { mutate } = createTestClient(server)

        const createdDraft = await createTestDraftSubmission(mutate)
        const createdID = createdDraft.id
        const startDate = '2021-07-01'
        const endDate = '2022-06-30'
        const rateAmendment = {
            rateType: 'AMENDMENT' as const,
            rateDateStart: startDate,
            rateDateEnd: endDate,
            rateDateCertified: '2021-06-13',
            rateAmendmentInfo: {
                effectiveDateStart: startDate,
                effectiveDateEnd: endDate,
            },
        }

        const updatedDraft = {
            programID: 'cnet',
            submissionType: 'CONTRACT_AND_RATES',
            submissionDescription: 'An updated submission',
            documents: [],
            managedCareEntities: [],
            federalAuthorities: [],
            stateContacts: [],
            ...rateAmendment,
        }

        const updateResult = await mutate({
            mutation: UPDATE_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: createdID,
                    draftSubmissionUpdates: updatedDraft,
                },
            },
        })

        expect(updateResult.errors).toBeUndefined()

        const resultDraft =
            updateResult.data.updateDraftSubmission.draftSubmission

        expect(resultDraft.id).toEqual(createdID)
        expect(resultDraft.rateType).toEqual(rateAmendment.rateType)
        expect(resultDraft.rateDateStart).toEqual(rateAmendment.rateDateStart)
        expect(resultDraft.rateDateEnd).toEqual(rateAmendment.rateDateEnd)
        expect(resultDraft.rateDateCertified).toEqual(
            rateAmendment.rateDateCertified
        )
        expect(resultDraft.rateAmendmentInfo.effectiveDateStart).toEqual(
            rateAmendment.rateAmendmentInfo.effectiveDateStart
        )
        expect(resultDraft.rateAmendmentInfo.effectiveDateEnd).toEqual(
            rateAmendment.rateAmendmentInfo.effectiveDateEnd
        )
    })

    it('updates a submission to remove existing documents', async () => {
        const server = constructTestServer()
        const { query, mutate } = createTestClient(server)

        const createdDraft = await createTestDraftSubmission(mutate)
        const createdID = createdDraft.id

        const updatedDraftWithDocs = {
            programID: 'cnet',
            submissionType: 'CONTRACT_AND_RATES',
            submissionDescription: 'An updated submission',
            managedCareEntities: [],
            federalAuthorities: [],
            documents: [
                {
                    name: 'myfile.pdf',
                    s3URL: 'fakeS3URL',
                },
            ],
            stateContacts: [
                {
                    name: 'Test Person',
                    titleRole: 'Role',
                    email: 'test@test.com',
                },
            ],
        }

        const updateResult = await mutate({
            mutation: UPDATE_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: createdID,
                    draftSubmissionUpdates: updatedDraftWithDocs,
                },
            },
        })

        expect(updateResult.errors).toBeUndefined()

        const resultDraft = await fetchTestDraftSubmissionById(query, createdID)
        expect(resultDraft.id).toEqual(createdID)
        expect(resultDraft.documents).toEqual([
            {
                name: 'myfile.pdf',
                s3URL: 'fakeS3URL',
            },
        ])

        // Remove documents
        const updatedDraftWithoutDocs = {
            programID: resultDraft.programID,
            submissionType: resultDraft.submissionType,
            submissionDescription: resultDraft.submissionDescription,
            managedCareEntities: [],
            federalAuthorities: [],
            documents: [],
            stateContacts: [
                {
                    name: 'Test Person',
                    titleRole: 'Role',
                    email: 'test@test.com',
                },
            ],
        }

        const updateResult2 = await mutate({
            mutation: UPDATE_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: createdID,
                    draftSubmissionUpdates: updatedDraftWithoutDocs,
                },
            },
        })
        const resultDraft2 =
            updateResult2.data.updateDraftSubmission.draftSubmission
        expect(resultDraft2.documents).toEqual([])
    })

    it('errors if the ID does not exist', async () => {
        const server = constructTestServer()

        const { mutate } = createTestClient(server)
        const startDate = '2021-07-06'
        const endDate = '2021-07-12'

        const updatedDraft = {
            programID: 'cnet',
            submissionType: 'CONTRACT_AND_RATES',
            submissionDescription: 'An updated submission',
            documents: [],
            contractType: 'BASE',
            contractDateStart: startDate,
            contractDateEnd: endDate,
            managedCareEntities: [],
            federalAuthorities: [],
            stateContacts: [],
        }

        const updateResult = await mutate({
            mutation: UPDATE_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: 'foo-bar-123',
                    draftSubmissionUpdates: updatedDraft,
                },
            },
        })

        expect(updateResult.errors).toBeDefined()
        if (updateResult.errors === undefined) {
            throw new Error('type narrow')
        }

        expect(updateResult.errors[0].extensions?.code).toEqual(
            'BAD_USER_INPUT'
        )
        expect(updateResult.errors[0].extensions?.argumentName).toEqual(
            'submissionID'
        )
    })

    it('returns an error if you are requesting for a different state (403)', async () => {
        const server = constructTestServer()

        const { mutate } = createTestClient(server)

        // SETUP: First, create a new submission
        const createInput: CreateDraftSubmissionInput = {
            programID: 'smmc',
            submissionType: 'CONTRACT_ONLY',
            submissionDescription: 'A created submission',
        }
        const createResult = await mutate({
            mutation: CREATE_DRAFT_SUBMISSION,
            variables: { input: createInput },
        })

        expect(createResult.errors).toBeUndefined()

        const createdDraft =
            createResult.data.createDraftSubmission.draftSubmission

        // ACT: next, update that submission but from a user from a diferent state
        const createdID = createdDraft.id

        // setup a server with a different user
        const otherUserServer = constructTestServer({
            context: {
                user: {
                    name: 'Aang',
                    state_code: 'VA',
                    role: 'STATE_USER',
                    email: 'aang@va.gov',
                },
            },
        })

        const { mutate: otherMutate } = createTestClient(otherUserServer)
        const startDate = '2021-07-06'
        const endDate = '2021-07-12'
        const updatedDraft = {
            programID: 'cnet',
            submissionType: 'CONTRACT_AND_RATES',
            submissionDescription: 'An updated submission',
            documents: [],
            contractType: 'BASE',
            contractDateStart: startDate,
            contractDateEnd: endDate,
            managedCareEntities: [],
            federalAuthorities: [],
            stateContacts: [],
        }

        const updateResult = await otherMutate({
            mutation: UPDATE_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: createdID,
                    draftSubmissionUpdates: updatedDraft,
                },
            },
        })

        // TEST: that should error.
        expect(updateResult.errors).toBeDefined()
        if (updateResult.errors === undefined) {
            throw new Error('type narrow')
        }

        expect(updateResult.errors[0].extensions?.code).toEqual('FORBIDDEN')
    })

    it('returns an error if you try and set a programID thats not valid', async () => {
        const server = constructTestServer()

        const { mutate } = createTestClient(server)

        const createdDraft = await createTestDraftSubmission(mutate)
        const createdID = createdDraft.id
        const startDate = '2021-07-06'
        const endDate = '2021-07-12'
        // ACT: next, update that submission but from a user from a different state
        const updatedDraft = {
            programID: 'wefwefwefew',
            submissionType: 'CONTRACT_AND_RATES',
            submissionDescription: 'An updated submission',
            documents: [],
            contractType: 'BASE',
            contractDateStart: startDate,
            contractDateEnd: endDate,
            managedCareEntities: [],
            federalAuthorities: [],
            stateContacts: [],
        }

        const updateResult = await mutate({
            mutation: UPDATE_DRAFT_SUBMISSION,
            variables: {
                input: {
                    submissionID: createdID,
                    draftSubmissionUpdates: updatedDraft,
                },
            },
        })

        // TEST: that should error.
        expect(updateResult.errors).toBeDefined()
        if (updateResult.errors === undefined) {
            throw new Error('type narrow')
        }

        expect(updateResult.errors[0].extensions?.code).toEqual(
            'BAD_USER_INPUT'
        )
    })
})
