import { ApolloServer } from 'apollo-server-lambda'
import { createTestClient } from 'apollo-server-testing'

import { Resolvers } from '../gen/gqlServer'
import typeDefs from '../../app-graphql/src/schema.graphql'
import GET_CURRENT_USER from '../../app-graphql/src/queries/currentUserQuery.graphql'

import { getCurrentUserResolver } from './currentUser'

describe('currentUser', () => {
    it('returns the currentUser', async () => {
        const resolvers: Resolvers = {
            Query: {
                getCurrentUser() {
                    return {
                        name: 'james brown', role: 'STATE_USER', email: 'james@example.com' 
                    }
                },
                // getState: getStateResolver,
            },
            User: {
                state() {
                    return {
                        name: 'Florida',
                        code: 'FL',
                        programs: [],
                    }
                },
            },
        }

        // create an apollo server
        const server = new ApolloServer({
            typeDefs,
            resolvers,
            playground: {
                endpoint: '/local/graphql',
            },
            context: ({ _event, context }) => {
                const event = {
                    requestContext: {
                        identity: {
                            cognitoAuthenticationProvider:
                                '{ "name": "james brown", "state_code": "FL", "role": "STATE_USER", "email": "james@example.com" }',
                        },
                    },
                }

                return {
                    event,
                    context,
                }
            },
        })

        // create a mock client
        const { query } = createTestClient(server)

        // make a mock request
        process.env.REACT_APP_LOCAL_LOGIN = 'true'
        const res = await query({ query: GET_CURRENT_USER })

        // confirm that we get what we got
        expect(res.errors).toBeUndefined()

        expect(res.data.getCurrentUser.email).toBe('james@example.com')
        expect(res.data.getCurrentUser.state.code).toBe('FL')
    })
})
