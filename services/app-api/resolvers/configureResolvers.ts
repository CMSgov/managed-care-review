import { GraphQLDate, GraphQLDateTime } from 'graphql-scalars'

import type { Store } from '../store'
import { Resolvers } from '../gen/gqlServer'

import { fetchCurrentUserResolver } from './fetchCurrentUser'
import { stateUserResolver } from './userResolver'
import { fetchDraftSubmissionResolver } from './fetchDraftSubmission'
import { createDraftSubmissionResolver } from './createDraftSubmission'
import { updateDraftSubmissionResolver } from './updateDraftSubmission'
import { submitDraftSubmissionResolver } from './submitDraftSubmission'
import { draftSubmissionResolver } from './draftSubmissionResolver'
import { stateSubmissionResolver } from './stateSubmissionResolver'
import { fetchStateSubmissionResolver } from './fetchStateSubmission'
import { indexSubmissionsResolver } from './indexSubmissions'

export function configureResolvers(store: Store): Resolvers {
    const resolvers: Resolvers = {
        Date: GraphQLDate,
        DateTime: GraphQLDateTime,
        Query: {
            fetchCurrentUser: fetchCurrentUserResolver(),
            fetchDraftSubmission: fetchDraftSubmissionResolver(store),
            fetchStateSubmission: fetchStateSubmissionResolver(store),
            indexSubmissions: indexSubmissionsResolver(store),
        },
        Mutation: {
            createDraftSubmission: createDraftSubmissionResolver(store),
            updateDraftSubmission: updateDraftSubmissionResolver(store),
            submitDraftSubmission: submitDraftSubmissionResolver(store),
        },
        Submission: {
            // resolveType is required to differentiate Unions
            __resolveType(obj) {
                if ('submittedAt' in obj) {
                    return 'StateSubmission'
                } else {
                    return 'DraftSubmission'
                }
            },
        },
        User: {
            // resolveType is required to differentiate Unions
            __resolveType(obj) {
                if ('state' in obj) {
                    return 'StateUser'
                } else {
                    return 'CMSUser'
                }
            },
        },
        StateUser: stateUserResolver,
        DraftSubmission: draftSubmissionResolver(store),
        StateSubmission: stateSubmissionResolver(store),
    }

    return resolvers
}
