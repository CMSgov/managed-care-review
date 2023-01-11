import { PrismaClient, HealthPlanRevisionTable } from '@prisma/client'
import {
    UnlockedHealthPlanFormDataType,
    HealthPlanFormDataType,
} from '../../../app-web/src/common-code/healthPlanFormDataType'
import {
    ProgramType,
    HealthPlanPackageType,
    UpdateInfoType,
    UserType,
    StateCodeType,
} from '../domain-models'
import { findPrograms, findStatePrograms } from '../postgres'
import { findAllHealthPlanPackagesByState } from './findAllHealthPlanPackagesByState'
import { findAllHealthPlanPackagesBySubmittedAt } from './findAllHealthPlanPackagesBySubmittedAt'
import { findHealthPlanPackage } from './findHealthPlanPackage'
import {
    insertHealthPlanPackage,
    InsertHealthPlanPackageArgsType,
} from './insertHealthPlanPackage'
import { insertHealthPlanRevision } from './insertHealthPlanRevision'
import { StoreError } from './storeError'
import { updateHealthPlanRevision } from './updateHealthPlanRevision'
import { findAllRevisions } from './findAllRevisions'

import { findUser } from './findUser'
import { insertUser, InsertUserArgsType } from './insertUser'
import { deleteUserAssignedState } from './deleteUserAssignedState'
import { updateUserAssignedState } from './updateUserAssignedState'

type Store = {
    findPrograms: (
        stateCode: string,
        programIDs: Array<string>
    ) => ProgramType[] | Error

    findStatePrograms: (stateCode: string) => ProgramType[] | Error

    findAllRevisions: () => Promise<HealthPlanRevisionTable[] | StoreError>

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

    findUser: (id: string) => Promise<UserType | StoreError>

    insertUser: (user: InsertUserArgsType) => Promise<UserType | StoreError>

    updateUserAssignedState: (
        userID: string,
        states: StateCodeType[]
    ) => Promise<UserType | StoreError>

    deleteUserAssignedState: (
        userID: string,
        stateCode: string
    ) => Promise<UserType | StoreError>
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
        deleteUserAssignedState: (userID, stateCode) =>
            deleteUserAssignedState(client, userID, stateCode),
        findStatePrograms: findStatePrograms,
        findAllRevisions: () => findAllRevisions(client),
    }
}

export { NewPostgresStore, Store }
