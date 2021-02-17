// apollo_gql.js
import { APIGatewayProxyHandler } from 'aws-lambda'

import {
	ApolloServer,
	AuthenticationError,
	gql,
	IResolvers,
} from 'apollo-server-lambda'

import {
	userFromAuthProvider,
	userFromCognitoAuthProvider,
	userFromLocalAuthProvider,
} from '../authn'

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
	type Query {
		hello: String
	}
`

// Provide resolver functions for your schema fields
const resolvers: IResolvers = {
	Query: {
		hello: async (parent, args, context, info) => {
			console.log('WOAH', context, info)

			let userFetcher: userFromAuthProvider

			if (process.env.REACT_APP_LOCAL_LOGIN) {
				userFetcher = userFromLocalAuthProvider
			} else {
				userFetcher = userFromCognitoAuthProvider
			}

			const authProvider =
				context.event.requestContext.identity
					.cognitoAuthenticationProvider
			if (authProvider == undefined) {
				throw new AuthenticationError(
					'This should only be possible in DEV, AWS should always populate cogito values'
				)
			}

			const userResult = await userFetcher(authProvider)
			if (userResult.isErr()) {
				throw new AuthenticationError(userResult.error.message)
			}

			const user = userResult.value

			return `Hello ${user.email}!`
		},
	},
}

const server = new ApolloServer({
	typeDefs,
	resolvers,
	playground: {
		endpoint: '/local/graphql',
	},
	context: ({ event, context }) => {
		console.log('CALLED ME', event, context)

		return {
			headers: event.headers,
			functionName: context.functionName,
			event,
			context,
		}
	},
})

function bodyMiddleware(
	wrapped: APIGatewayProxyHandler
): APIGatewayProxyHandler {
	return function (event, context, completion) {
		// For reasons I don't understand and I no longer care about
		// when graphql requests are sent by the amplify library to AWS
		// they are arriving with some escaping that is breaking apollo server.
		// This transformation makes things work down the line again.
		if (event.body !== null) {
			event.body = JSON.stringify(JSON.parse(event.body))
		}
		return wrapped(event, context, completion)
	}
}

exports.graphqlHandler = bodyMiddleware(
	server.createHandler({
		cors: {
			origin: true,
			credentials: true,
		},
	})
)
