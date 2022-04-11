import { PrismaClient } from '@prisma/client'
import {
    DraftSubmissionType,
    ProgramT,
    StateSubmissionType,
    Submission2Type,
    UpdateInfoType,
} from '../../app-web/src/common-code/domain-models'
import { findPrograms } from '../postgres'
import { findAllSubmissions } from './findAllSubmissions'
import { findAllSubmissionsWithRevisions } from './findAllSubmissionsWithRevisions'
import { findDraftSubmission } from './findDraftSubmission'
import { findStateSubmission } from './findStateSubmission'
import { findSubmissionWithRevisions } from './findSubmissionWithRevisions'
import {
    insertDraftSubmission,
    InsertDraftSubmissionArgsType,
} from './insertDraftSubmission'
import { insertSubmissionRevision } from './insertSubmissionRevision'
import { StoreError } from './storeError'
import { updateDraftSubmission } from './updateDraftSubmission'
import { updateFormData } from './updateFormData'
import { updateStateSubmission } from './updateStateSubmission'

type Store = {
    insertDraftSubmission: (
        args: InsertDraftSubmissionArgsType
    ) => Promise<Submission2Type | StoreError>

    findAllSubmissions: (
        stateCode: string
    ) => Promise<(DraftSubmissionType | StateSubmissionType)[] | StoreError>

    findDraftSubmission: (
        draftUUID: string
    ) => Promise<DraftSubmissionType | undefined | StoreError>

    findDraftSubmissionByStateNumber: (
        stateCoder: string,
        stateNumber: number
    ) => Promise<DraftSubmissionType | undefined | StoreError>

    updateDraftSubmission: (
        draftSubmission: DraftSubmissionType
    ) => Promise<DraftSubmissionType | StoreError>

    findStateSubmission: (
        draftUUID: string
    ) => Promise<StateSubmissionType | undefined | StoreError>

    updateStateSubmission: (
        stateSubmission: StateSubmissionType,
        submitInfo: UpdateInfoType
    ) => Promise<Submission2Type | StoreError>

    insertNewRevision: (
        submissionID: string,
        unlockInfo: UpdateInfoType,
        draft: DraftSubmissionType
    ) => Promise<Submission2Type | StoreError>

    updateFormData: (
        submissionID: string,
        revisionID: string,
        formData: DraftSubmissionType
    ) => Promise<Submission2Type | StoreError>

    findPrograms: (
        stateCode: string,
        programIDs: Array<string>
    ) => ProgramT[] | undefined

    // new api
    findSubmissionWithRevisions: (
        draftUUID: string
    ) => Promise<Submission2Type | undefined | StoreError>

    findAllSubmissionsWithRevisions: (
        stateCode: string
    ) => Promise<Submission2Type[] | StoreError>
}

function NewPostgresStore(client: PrismaClient): Store {
    return {
        findAllSubmissions: (stateCode) =>
            findAllSubmissions(client, stateCode),
        insertDraftSubmission: (args) => insertDraftSubmission(client, args),
        findDraftSubmission: (draftUUID) =>
            findDraftSubmission(client, draftUUID),
        findSubmissionWithRevisions: (id) =>
            findSubmissionWithRevisions(client, id),
        findAllSubmissionsWithRevisions: (stateCode) =>
            findAllSubmissionsWithRevisions(client, stateCode),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        findDraftSubmissionByStateNumber: (_stateCode, _stateNumber) => {
            throw new Error('UNIMPLEMENTED')
        },
        updateDraftSubmission: (draftSubmission) =>
            updateDraftSubmission(client, draftSubmission),
        updateFormData: (submissionID, revisionID, formData) =>
            updateFormData(client, submissionID, revisionID, formData),
        updateStateSubmission: (submission, submitInfo) =>
            updateStateSubmission(client, submission, submitInfo),
        findStateSubmission: (submissionID) =>
            findStateSubmission(client, submissionID),
        insertNewRevision: (submissionID, unlockInfo, draft) =>
            insertSubmissionRevision(client, {
                submissionID,
                unlockInfo,
                draft,
            }),
        findPrograms: findPrograms,
    }
}

export { NewPostgresStore, Store }
