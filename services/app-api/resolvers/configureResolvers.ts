import { GraphQLDate, GraphQLDateTime } from 'graphql-scalars'

import type { Store } from '../store'
import { Resolvers } from '../gen/gqlServer'

import { fetchCurrentUserResolver } from './fetchCurrentUser'
import { userResolver } from './userResolver'
import { fetchDraftSubmissionResolver } from './fetchDraftSubmission'
import { createDraftSubmissionResolver } from './createDraftSubmission'
import { updateDraftSubmissionResolver } from './updateDraftSubmission'
import { submitDraftSubmissionResolver } from './submitDraftSubmission'
import { draftSubmissionResolver } from './draftSubmissionResolver'
import { fetchStateSubmissionResolver } from './fetchStateSubmission'

export function configureResolvers(store: Store): Resolvers {
    const resolvers: Resolvers = {
        Date: GraphQLDate,
        DateTime: GraphQLDateTime,
        Query: {
            fetchCurrentUser: fetchCurrentUserResolver(),
            fetchDraftSubmission: fetchDraftSubmissionResolver(store),
            fetchStateSubmission: fetchStateSubmissionResolver(store),
        },
        Mutation: {
            createDraftSubmission: createDraftSubmissionResolver(store),
            updateDraftSubmission: updateDraftSubmissionResolver(store),
            submitDraftSubmission: submitDraftSubmissionResolver(store),
        },
        User: userResolver,
        DraftSubmission: draftSubmissionResolver(store),
        StateSubmission: draftSubmissionResolver(store), // Surprisingly, we can reuse this
        // This may diverge eventually, but so long as the computed properties are the same
        // we should be able to get away with this.
    }

    return resolvers
}
