import { ApolloServer } from 'apollo-server-lambda'
import { getTestStore } from '../testHelpers/storeHelpers'

import typeDefs from '../../app-graphql/src/schema.graphql'
import { Resolvers } from '../gen/gqlServer'
import {
    getCurrentUserResolver,
    createDraftSubmissionResolver,
    showDraftSubmissionResolver,
    draftSubmissionResolver,
} from '../resolvers'
import { userResolver } from '../resolvers/userResolver'
import { Context } from '../handlers/apollo_gql'

const store = getTestStore()

const testResolvers: Resolvers = {
    Query: {
        getCurrentUser: getCurrentUserResolver(),
        showDraftSubmission: showDraftSubmissionResolver(store),
    },
    Mutation: {
        createDraftSubmission: createDraftSubmissionResolver(store),
    },
    User: userResolver,
    DraftSubmission: draftSubmissionResolver,
}

const defaultContext = (): Context => {
    return {
        user: {
            name: 'james brown',
            state_code: 'FL',
            role: 'STATE_USER',
            email: 'james@example.com',
        },
    }
}

const constructTestServer = (
    { context } = { context: defaultContext() }
): ApolloServer =>
    new ApolloServer({
        typeDefs,
        resolvers: testResolvers,
        playground: {
            endpoint: '/local/graphql',
        },
        context,
    })

export { constructTestServer }
