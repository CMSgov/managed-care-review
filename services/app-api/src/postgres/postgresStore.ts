import { PrismaClient, HealthPlanRevisionTable } from '@prisma/client'
import {
    UnlockedHealthPlanFormDataType,
    HealthPlanFormDataType,
    StateCodeType,
} from '../../../app-web/src/common-code/healthPlanFormDataType'
import {
    ProgramType,
    HealthPlanPackageType,
    UpdateInfoType,
    UserType,
    CMSUserType,
    Question,
    CreateQuestionInput,
} from '../domain-models'
import { findPrograms, findStatePrograms } from '../postgres'
import { StoreError } from './storeError'
import {
    findAllHealthPlanPackagesByState,
    findAllHealthPlanPackagesBySubmittedAt,
    findHealthPlanPackage,
    insertHealthPlanPackage,
    InsertHealthPlanPackageArgsType,
    insertHealthPlanRevision,
    updateHealthPlanRevision,
    findAllRevisions,
} from './healthPlanPackage'
import {
    findUser,
    insertUser,
    InsertUserArgsType,
    updateUserAssignedState,
    findAllUsers,
} from './user'
import {
    findAllQuestionsByHealthPlanPackage,
    insertQuestion,
} from './questionResponse'

type Store = {
    findPrograms: (
        stateCode: string,
        programIDs: Array<string>
    ) => ProgramType[] | Error

    findStatePrograms: (stateCode: string) => ProgramType[] | Error

    findAllRevisions: () => Promise<HealthPlanRevisionTable[] | StoreError>

    findAllUsers: () => Promise<UserType[] | StoreError>

    findHealthPlanPackage: (
        draftUUID: string
    ) => Promise<HealthPlanPackageType | undefined | StoreError>

    findAllHealthPlanPackagesByState: (
        stateCode: string
    ) => Promise<HealthPlanPackageType[] | StoreError>

    findAllHealthPlanPackagesBySubmittedAt: () => Promise<
        HealthPlanPackageType[] | StoreError
    >

    insertHealthPlanPackage: (
        args: InsertHealthPlanPackageArgsType
    ) => Promise<HealthPlanPackageType | StoreError>

    updateHealthPlanRevision: (
        pkgID: string,
        revisionID: string,
        formData: HealthPlanFormDataType,
        submitInfo?: UpdateInfoType
    ) => Promise<HealthPlanPackageType | StoreError>

    insertHealthPlanRevision: (
        pkgID: string,
        unlockInfo: UpdateInfoType,
        draft: UnlockedHealthPlanFormDataType
    ) => Promise<HealthPlanPackageType | StoreError>

    findUser: (id: string) => Promise<UserType | undefined | StoreError>

    insertUser: (user: InsertUserArgsType) => Promise<UserType | StoreError>

    updateUserAssignedState: (
        userID: string,
        states: StateCodeType[]
    ) => Promise<CMSUserType | StoreError>

    insertQuestion: (
        questionInput: CreateQuestionInput,
        user: CMSUserType
    ) => Promise<Question | StoreError>

    findAllQuestionsByHealthPlanPackage: (
        pkgID: string
    ) => Promise<Question[] | StoreError>
}

function NewPostgresStore(client: PrismaClient): Store {
    return {
        insertHealthPlanPackage: (args) =>
            insertHealthPlanPackage(client, args),
        findHealthPlanPackage: (id) => findHealthPlanPackage(client, id),
        findAllHealthPlanPackagesByState: (stateCode) =>
            findAllHealthPlanPackagesByState(client, stateCode),
        findAllHealthPlanPackagesBySubmittedAt: () =>
            findAllHealthPlanPackagesBySubmittedAt(client),
        updateHealthPlanRevision: (pkgID, revisionID, formData, submitInfo) =>
            updateHealthPlanRevision(
                client,
                pkgID,
                revisionID,
                formData,
                submitInfo
            ),
        insertHealthPlanRevision: (pkgID, unlockInfo, draft) =>
            insertHealthPlanRevision(client, {
                pkgID,
                unlockInfo,
                draft,
            }),
        findPrograms: findPrograms,
        findUser: (id) => findUser(client, id),
        insertUser: (args) => insertUser(client, args),
        updateUserAssignedState: (userID, stateCodes) =>
            updateUserAssignedState(client, userID, stateCodes),
        findStatePrograms: findStatePrograms,
        findAllRevisions: () => findAllRevisions(client),
        findAllUsers: () => findAllUsers(client),
        insertQuestion: (questionInput, user) =>
            insertQuestion(client, questionInput, user),
        findAllQuestionsByHealthPlanPackage: (pkgID) =>
            findAllQuestionsByHealthPlanPackage(client, pkgID),
    }
}

export { NewPostgresStore, Store }
