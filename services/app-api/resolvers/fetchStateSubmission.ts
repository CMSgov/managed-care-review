import { ApolloError, ForbiddenError } from 'apollo-server-lambda'
import {
    isCMSUser,
    isStateUser,
    LockedHealthPlanFormDataType,
} from '../../app-web/src/common-code/domain-models'
import { QueryResolvers, State } from '../gen/gqlServer'
import { logError, logSuccess } from '../logger'
import { isStoreError, Store } from '../postgres'
import {
    setErrorAttributesOnActiveSpan,
    setResolverDetailsOnActiveSpan,
    setSuccessAttributesOnActiveSpan,
} from './attributeHelper'

export function fetchStateSubmissionResolver(
    store: Store
): QueryResolvers['fetchStateSubmission'] {
    return async (_parent, { input }, context) => {
        const { user, span } = context
        setResolverDetailsOnActiveSpan('fetchStateSubmission', user, span)
        // fetch from the store
        const result = await store.findStateSubmission(input.submissionID)

        if (isStoreError(result)) {
            console.log('Error finding a submission', result)
            if (result.code === 'WRONG_STATUS') {
                logError(
                    'fetchStateSubmission',
                    'Submission is not a StateSubmission'
                )
                setErrorAttributesOnActiveSpan(
                    'Submission is not a StateSubmission',
                    span
                )
                throw new ApolloError(
                    `Submission is not a StateSubmission`,
                    'WRONG_STATUS',
                    {
                        argumentName: 'submissionID',
                    }
                )
            }

            const errMessage = `Issue finding a draft submission of type ${result.code}. Message: ${result.message}`
            logError('fetchStateSubmission', errMessage)
            setErrorAttributesOnActiveSpan(errMessage, span)
            throw new Error(errMessage)
        }

        if (result === undefined) {
            return {
                submission: undefined,
            }
        }

        const draft: LockedHealthPlanFormDataType = result

        // Authorization CMS users can view, state users can only view if the state matches
        if (isStateUser(context.user)) {
            const stateFromCurrentUser: State['code'] = context.user.state_code
            if (draft.stateCode !== stateFromCurrentUser) {
                logError(
                    'fetchStateSubmission',
                    'user not authorized to fetch data from a different state'
                )
                setErrorAttributesOnActiveSpan(
                    'user not authorized to fetch data from a different state',
                    span
                )
                throw new ForbiddenError(
                    'user not authorized to fetch data from a different state'
                )
            }
        } else if (isCMSUser(context.user)) {
            true // CMS users have access, no error to throw here, but I want to have it in the if tree so we don't forget something.
        } else {
            logError('fetchStateSubmission', 'unknown user type')
            setErrorAttributesOnActiveSpan('unknown user type', span)
            throw new ForbiddenError(`unknown user type`)
        }

        logSuccess('fetchStateSubmission')
        setSuccessAttributesOnActiveSpan(span)
        return { submission: draft }
    }
}
