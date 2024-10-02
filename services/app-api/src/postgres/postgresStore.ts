import type { PrismaClient, Division } from '@prisma/client'
import type { StateCodeType } from '../../../app-web/src/common-code/healthPlanFormDataType'
import type {
    ProgramType,
    UserType,
    StateUserType,
    Question,
    CreateQuestionInput,
    InsertQuestionResponseArgs,
    StateType,
    RateType,
    ContractType,
    UnlockedContractType,
    CMSUsersUnionType,
    RateQuestionType,
    CreateRateQuestionInputType,
} from '../domain-models'
import { findPrograms, findStatePrograms } from '../postgres'
import type { InsertUserArgsType } from './user'
import {
    findUser,
    insertUser,
    updateCmsUserProperties,
    findAllUsers,
    insertManyUsers,
} from './user'
import {
    findAllQuestionsByContract,
    insertQuestion,
    insertQuestionResponse,
    insertRateQuestion,
    findAllQuestionsByRate,
} from './questionResponse'
import { findAllSupportedStates } from './state'
import {
    insertDraftContract,
    findContractWithHistory,
    updateDraftContractWithRates,
    updateMCCRSID,
    findAllContractsWithHistoryByState,
    findAllContractsWithHistoryBySubmitInfo,
    findAllRatesWithHistoryBySubmitInfo,
    submitContract,
    submitRate,
    unlockContract,
    updateDraftContract,
    replaceRateOnContract,
} from './contractAndRates'
import type {
    SubmitContractArgsType,
    SubmitRateArgsType,
    InsertContractArgsType,
    UpdateContractArgsType,
    ContractOrErrorArrayType,
    RateOrErrorArrayType,
    UpdateMCCRSIDFormArgsType,
    ReplaceRateOnContractArgsType,
    FindAllRatesWithHistoryBySubmitType,
} from './contractAndRates'
import type { UnlockContractArgsType } from './contractAndRates/unlockContract'
import { unlockRate } from './contractAndRates/unlockRate'
import type { UnlockRateArgsType } from './contractAndRates/unlockRate'
import { findRateWithHistory } from './contractAndRates/findRateWithHistory'
import { updateDraftContractRates } from './contractAndRates/updateDraftContractRates'
import type { UpdateDraftContractRatesArgsType } from './contractAndRates/updateDraftContractRates'
import { updateStateAssignedUsers } from './state/updateStateAssignedUsers'
import { findStateAssignedUsers } from './state/findStateAssignedUsers'

type Store = {
    findPrograms: (
        stateCode: string,
        programIDs: Array<string>
    ) => ProgramType[] | Error

    findStatePrograms: (stateCode: string) => ProgramType[] | Error

    findAllSupportedStates: () => Promise<StateType[] | Error>

    findAllUsers: () => Promise<UserType[] | Error>

    findUser: (id: string) => Promise<UserType | undefined | Error>

    findStateAssignedUsers: (
        stateCode: StateCodeType
    ) => Promise<UserType[] | Error>

    insertUser: (user: InsertUserArgsType) => Promise<UserType | Error>

    insertManyUsers: (
        users: InsertUserArgsType[]
    ) => Promise<UserType[] | Error>

    updateStateAssignedUsers: (
        idOfUserPerformingUpdate: string,
        stateCode: StateCodeType,
        assignedUserIDs: string[]
    ) => Promise<UserType[] | Error>

    updateCmsUserProperties: (
        userID: string,
        idOfUserPerformingUpdate: string,
        states?: StateCodeType[],
        divisionAssignment?: Division,
        description?: string | null
    ) => Promise<CMSUsersUnionType | Error>

    insertQuestion: (
        questionInput: CreateQuestionInput,
        user: CMSUsersUnionType
    ) => Promise<Question | Error>

    findAllQuestionsByContract: (pkgID: string) => Promise<Question[] | Error>

    insertQuestionResponse: (
        questionInput: InsertQuestionResponseArgs,
        user: StateUserType
    ) => Promise<Question | Error>

    insertRateQuestion: (
        questionInput: CreateRateQuestionInputType,
        user: CMSUsersUnionType
    ) => Promise<RateQuestionType | Error>

    findAllQuestionsByRate: (
        rateID: string
    ) => Promise<RateQuestionType[] | Error>

    insertDraftContract: (
        args: InsertContractArgsType
    ) => Promise<ContractType | Error>

    findContractWithHistory: (
        contractID: string
    ) => Promise<ContractType | Error>

    findRateWithHistory: (rateID: string) => Promise<RateType | Error>
    updateContract: (
        args: UpdateMCCRSIDFormArgsType
    ) => Promise<ContractType | Error>

    updateDraftContract: (
        args: UpdateContractArgsType
    ) => Promise<ContractType | Error>

    updateDraftContractWithRates: (
        args: UpdateContractArgsType
    ) => Promise<ContractType | Error>

    updateDraftContractRates: (
        args: UpdateDraftContractRatesArgsType
    ) => Promise<ContractType | Error>

    findAllContractsWithHistoryByState: (
        stateCode: string
    ) => Promise<ContractOrErrorArrayType | Error>

    findAllContractsWithHistoryBySubmitInfo: () => Promise<
        ContractOrErrorArrayType | Error
    >
    findAllRatesWithHistoryBySubmitInfo: (
        args?: FindAllRatesWithHistoryBySubmitType
    ) => Promise<RateOrErrorArrayType | Error>

    replaceRateOnContract: (
        args: ReplaceRateOnContractArgsType
    ) => Promise<ContractType | Error>

    submitContract: (
        args: SubmitContractArgsType
    ) => Promise<ContractType | Error>

    submitRate: (args: SubmitRateArgsType) => Promise<RateType | Error>

    unlockContract: (
        args: UnlockContractArgsType,
        linkRatesFF?: boolean
    ) => Promise<UnlockedContractType | Error>

    unlockRate: (args: UnlockRateArgsType) => Promise<RateType | Error>
}

function NewPostgresStore(client: PrismaClient): Store {
    return {
        findPrograms: findPrograms,
        findUser: (id) => findUser(client, id),
        insertUser: (args) => insertUser(client, args),
        insertManyUsers: (args) => insertManyUsers(client, args),
        updateCmsUserProperties: (
            userID,
            stateCodes,
            idOfUserPerformingUpdate,
            divisionAssignment,
            description
        ) =>
            updateCmsUserProperties(
                client,
                userID,
                stateCodes,
                idOfUserPerformingUpdate,
                divisionAssignment,
                description
            ),
        updateStateAssignedUsers: (
            idOfUserPerformingUpdate,
            stateCode,
            assignedUserIDs
        ) =>
            updateStateAssignedUsers(
                client,
                idOfUserPerformingUpdate,
                stateCode,
                assignedUserIDs
            ),
        findStatePrograms: findStatePrograms,
        findAllSupportedStates: () => findAllSupportedStates(client),
        findAllUsers: () => findAllUsers(client),
        findStateAssignedUsers: (stateCode) =>
            findStateAssignedUsers(client, stateCode),

        insertQuestion: (questionInput, user) =>
            insertQuestion(client, questionInput, user),
        findAllQuestionsByContract: (pkgID) =>
            findAllQuestionsByContract(client, pkgID),
        insertQuestionResponse: (questionInput, user) =>
            insertQuestionResponse(client, questionInput, user),
        insertRateQuestion: (questionInput, user) =>
            insertRateQuestion(client, questionInput, user),
        findAllQuestionsByRate: (rateID) =>
            findAllQuestionsByRate(client, rateID),

        insertDraftContract: (args) => insertDraftContract(client, args),
        findContractWithHistory: (args) =>
            findContractWithHistory(client, args),
        findRateWithHistory: (args) => findRateWithHistory(client, args),
        updateDraftContractWithRates: (args) =>
            updateDraftContractWithRates(client, args),
        updateContract: (args) => updateMCCRSID(client, args),
        updateDraftContract: (args) => updateDraftContract(client, args),
        updateDraftContractRates: (args) =>
            updateDraftContractRates(client, args),
        findAllContractsWithHistoryByState: (args) =>
            findAllContractsWithHistoryByState(client, args),
        findAllContractsWithHistoryBySubmitInfo: () =>
            findAllContractsWithHistoryBySubmitInfo(client),
        findAllRatesWithHistoryBySubmitInfo: (args) =>
            findAllRatesWithHistoryBySubmitInfo(client, args),
        replaceRateOnContract: (args) => replaceRateOnContract(client, args),
        submitContract: (args) => submitContract(client, args),
        submitRate: (args) => submitRate(client, args),
        unlockContract: (args) => unlockContract(client, args),
        unlockRate: (args) => unlockRate(client, args),
    }
}

export type { Store }
export { NewPostgresStore }
