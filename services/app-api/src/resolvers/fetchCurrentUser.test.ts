import { Context } from '../handlers/apollo_gql'

import { constructTestPostgresServer } from '../testHelpers/gqlHelpers'
import FETCH_CURRENT_USER from '../../../app-graphql/src/queries/fetchCurrentUser.graphql'

describe('currentUser', () => {
    it('returns the currentUser', async () => {
        const server = await constructTestPostgresServer()

        // make a mock request
        const res = await server.executeOperation({ query: FETCH_CURRENT_USER })

        // confirm that we get what we got
        expect(res.errors).toBeUndefined()

        expect(res.data?.fetchCurrentUser.email).toBe('james@example.com')
        expect(res.data?.fetchCurrentUser.state.code).toBe('FL')
        expect(res.data?.fetchCurrentUser.state.programs).toHaveLength(6)
    })

    it('returns programs for MI', async () => {
        const customContext: Context = {
            user: {
                name: 'james brown',
                state_code: 'MI',
                role: 'STATE_USER',
                email: 'james@example.com',
                familyName: 'Brown',
                givenName: 'James',
                euaID: 'WAAH',
            },
        }

        const server = await constructTestPostgresServer({
            context: customContext,
        })

        // make a mock request
        const res = await server.executeOperation({ query: FETCH_CURRENT_USER })

        // confirm that we get what we got
        expect(res.errors).toBeUndefined()

        expect(res.data?.fetchCurrentUser.email).toBe('james@example.com')
        expect(res.data?.fetchCurrentUser.state.code).toBe('MI')
        expect(res.data?.fetchCurrentUser.state.name).toBe('Michigan')
        expect(res.data?.fetchCurrentUser.state.programs).toHaveLength(6)
    })
})
