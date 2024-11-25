import { GraphQLDate, GraphQLDateTime } from 'graphql-scalars'
import type { Emailer } from '../emailer'
import type { Resolvers } from '../gen/gqlServer'
import type { Store } from '../postgres'
import {
    createHealthPlanPackageResolver,
    fetchHealthPlanPackageResolver,
    indexHealthPlanPackagesResolver,
    healthPlanPackageResolver,
    submitHealthPlanPackageResolver,
    unlockHealthPlanPackageResolver,
    updateHealthPlanFormDataResolver,
} from './healthPlanPackage'
import {
    createContractQuestionResolver,
    createContractQuestionResponseResolver,
    questionResponseDocumentResolver,
    createRateQuestionResolver,
    createRateQuestionResponseResolver,
} from './questionResponse'
import {
    fetchCurrentUserResolver,
    updateDivisionAssignment,
    stateUserResolver,
    cmsUserResolver,
    indexUsersResolver,
    cmsApproverUserResolver,
    updateStateAssignment,
} from './user'
import type { EmailParameterStore } from '../parameterStore'
import type { LDService } from '../launchDarkly/launchDarkly'
import type { JWTLib } from '../jwt'
import { indexRatesResolver } from './rate'
import { rateResolver } from './rate'
import { genericDocumentResolver } from './shared/genericDocumentResolver'
import { fetchRateResolver } from './rate/fetchRate'
import { updateContract } from './contract/updateContract'
import { indexContractsResolver } from './contract/indexContracts'
import { unlockContractResolver } from './contract/unlockContract'
import { createAPIKeyResolver } from './APIKey'
import { unlockRate } from './rate/unlockRate'
import { submitRate } from './rate'
import { updateDraftContractRates } from './contract/updateDraftContractRates'
import {
    contractResolver,
    unlockedContractResolver,
} from './contract/contractResolver'
import { contractRevisionResolver } from './contract/contractRevisionResolver'
import { fetchContractResolver } from './contract/fetchContract'
import { submitContract } from './contract/submitContract'
import { rateRevisionResolver } from './rate/rateRevisionResolver'
import type { S3ClientT } from '../s3'
import { createContract } from './contract/createContract'
import { updateContractDraftRevision } from './contract/updateContractDraftRevision'
import { withdrawAndReplaceRedundantRateResolver } from './contract/withdrawAndReplaceRedundantRate'
import { approveContract } from './contract/approveContract'
import { fetchMcReviewSettings } from './settings'
import { updateStateAssignmentsByState } from './user/updateStateAssignmentsByState'

export function configureResolvers(
    store: Store,
    emailer: Emailer,
    emailParameterStore: EmailParameterStore,
    launchDarkly: LDService,
    jwt: JWTLib,
    s3Client: S3ClientT
): Resolvers {
    const resolvers: Resolvers = {
        Date: GraphQLDate,
        DateTime: GraphQLDateTime,
        Query: {
            fetchCurrentUser: fetchCurrentUserResolver(),
            fetchHealthPlanPackage: fetchHealthPlanPackageResolver(store),
            indexHealthPlanPackages: indexHealthPlanPackagesResolver(store),
            indexContracts: indexContractsResolver(store),
            indexUsers: indexUsersResolver(store),
            fetchMcReviewSettings: fetchMcReviewSettings(store, emailer),
            // Rates refactor
            indexRates: indexRatesResolver(store),
            fetchRate: fetchRateResolver(store),
            fetchContract: fetchContractResolver(store),
        },
        Mutation: {
            createHealthPlanPackage: createHealthPlanPackageResolver(store),
            updateHealthPlanFormData: updateHealthPlanFormDataResolver(
                store,
                launchDarkly
            ),
            submitHealthPlanPackage: submitHealthPlanPackageResolver(
                store,
                emailer,
                emailParameterStore,
                launchDarkly
            ),
            submitContract: submitContract(
                store,
                emailer,
                emailParameterStore,
                launchDarkly
            ),
            unlockHealthPlanPackage: unlockHealthPlanPackageResolver(
                store,
                emailer,
                emailParameterStore,
                launchDarkly
            ),
            unlockContract: unlockContractResolver(store, emailer),
            createContract: createContract(store),
            updateContract: updateContract(store),
            updateContractDraftRevision: updateContractDraftRevision(
                store,
                launchDarkly
            ),
            updateDraftContractRates: updateDraftContractRates(store),
            withdrawAndReplaceRedundantRate:
                withdrawAndReplaceRedundantRateResolver(store),
            approveContract: approveContract(store),
            updateDivisionAssignment: updateDivisionAssignment(store),
            updateStateAssignment: updateStateAssignment(store),
            updateStateAssignmentsByState: updateStateAssignmentsByState(store),
            createContractQuestion: createContractQuestionResolver(
                store,
                emailer
            ),
            createContractQuestionResponse:
                createContractQuestionResponseResolver(store, emailer),
            createRateQuestion: createRateQuestionResolver(store, emailer),
            createRateQuestionResponse: createRateQuestionResponseResolver(
                store,
                emailer
            ),
            createAPIKey: createAPIKeyResolver(jwt),
            unlockRate: unlockRate(store),
            submitRate: submitRate(store, launchDarkly),
        },
        User: {
            // resolveType is required to differentiate Unions
            __resolveType(obj) {
                if (obj.role === 'STATE_USER') {
                    return 'StateUser'
                } else if (obj.role === 'CMS_USER') {
                    return 'CMSUser'
                } else if (obj.role === 'CMS_APPROVER_USER') {
                    return 'CMSApproverUser'
                } else if (obj.role === 'ADMIN_USER') {
                    return 'AdminUser'
                } else if (obj.role === 'HELPDESK_USER') {
                    return 'HelpdeskUser'
                } else if (obj.role === 'BUSINESSOWNER_USER') {
                    return 'BusinessOwnerUser'
                } else {
                    return 'StateUser'
                }
            },
        },
        CMSUsersUnion: {
            __resolveType(obj) {
                if (obj.role === 'CMS_USER') {
                    return 'CMSUser'
                } else {
                    return 'CMSApproverUser'
                }
            },
        },
        SubmittableRevision: {
            __resolveType(obj) {
                if ('contract' in obj) {
                    return 'ContractRevision'
                } else {
                    return 'RateRevision'
                }
            },
        },
        StateUser: stateUserResolver,
        CMSUser: cmsUserResolver,
        CMSApproverUser: cmsApproverUserResolver,
        HealthPlanPackage: healthPlanPackageResolver(store),
        Rate: rateResolver(store),
        RateRevision: rateRevisionResolver(store),
        Contract: contractResolver(store),
        UnlockedContract: unlockedContractResolver(store),
        ContractRevision: contractRevisionResolver(store),
        GenericDocument: genericDocumentResolver(s3Client),
        Document: questionResponseDocumentResolver(s3Client),
    }

    return resolvers
}
