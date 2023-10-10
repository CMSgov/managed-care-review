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
    indexQuestionsResolver,
    createQuestionResolver,
    createQuestionResponseResolver,
} from './questionResponse'
import {
    fetchCurrentUserResolver,
    updateCMSUserResolver,
    stateUserResolver,
    cmsUserResolver,
    indexUsersResolver,
} from './user'
import type { EmailParameterStore } from '../parameterStore'
import type { LDService } from '../launchDarkly/launchDarkly'
import { fetchEmailSettingsResolver } from './email/fetchEmailSettings'
import { indexRatesResolver } from './contractAndRates/indexRates'
import { rateResolver } from './contractAndRates/rateResolver'
import { fetchRateResolver } from './contractAndRates/fetchRate'

export function configureResolvers(
    store: Store,
    emailer: Emailer,
    emailParameterStore: EmailParameterStore,
    launchDarkly: LDService
): Resolvers {
    const resolvers: Resolvers = {
        Date: GraphQLDate,
        DateTime: GraphQLDateTime,
        Query: {
            fetchCurrentUser: fetchCurrentUserResolver(),
            fetchHealthPlanPackage: fetchHealthPlanPackageResolver(
                store,
                launchDarkly
            ),
            indexHealthPlanPackages: indexHealthPlanPackagesResolver(
                store,
                launchDarkly
            ),
            indexUsers: indexUsersResolver(store),
            indexQuestions: indexQuestionsResolver(store),
            fetchEmailSettings: fetchEmailSettingsResolver(
                store,
                emailer,
                emailParameterStore
            ),
            // Rates refactor
            indexRates: indexRatesResolver(store, launchDarkly),
            fetchRate: fetchRateResolver(store, launchDarkly),
        },
        Mutation: {
            createHealthPlanPackage: createHealthPlanPackageResolver(
                store,
                launchDarkly
            ),
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
            unlockHealthPlanPackage: unlockHealthPlanPackageResolver(
                store,
                emailer,
                emailParameterStore,
                launchDarkly
            ),
            updateCMSUser: updateCMSUserResolver(store),
            createQuestion: createQuestionResolver(store),
            createQuestionResponse: createQuestionResponseResolver(store),
        },
        User: {
            // resolveType is required to differentiate Unions
            __resolveType(obj) {
                if (obj.role === 'STATE_USER') {
                    return 'StateUser'
                } else if (obj.role === 'CMS_USER') {
                    return 'CMSUser'
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
        StateUser: stateUserResolver,
        CMSUser: cmsUserResolver,
        HealthPlanPackage: healthPlanPackageResolver(store),
        Rate: rateResolver,
    }

    return resolvers
}
