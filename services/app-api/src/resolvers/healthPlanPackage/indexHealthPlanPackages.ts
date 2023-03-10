import { Span } from '@opentelemetry/api'
import { ForbiddenError } from 'apollo-server-lambda'
import {
    isStateUser,
    HealthPlanPackageType,
    isCMSUser,
    isAdminUser,
} from '../../domain-models'
import { QueryResolvers } from '../../gen/gqlServer'
import { logError, logSuccess } from '../../logger'
import { isStoreError, Store, StoreError } from '../../postgres'
import {
    setErrorAttributesOnActiveSpan,
    setResolverDetailsOnActiveSpan,
    setSuccessAttributesOnActiveSpan,
} from '../attributeHelper'

const validateAndReturnHealthPlanPackages = (
    results: HealthPlanPackageType[] | StoreError,
    span?: Span
) => {
    if (isStoreError(results)) {
        const errMessage = `Issue indexing packages of type ${results.code}. Message: ${results.message}`
        logError('indexHealthPlanPackages', errMessage)
        setErrorAttributesOnActiveSpan(errMessage, span)
        throw new Error(errMessage)
    }

    const packages: HealthPlanPackageType[] = results

    const edges = packages.map((sub) => {
        return {
            node: {
                ...sub,
            },
        }
    })

    logSuccess('indexHealthPlanPackages')
    setSuccessAttributesOnActiveSpan(span)
    return { totalCount: edges.length, edges }
}

export function indexHealthPlanPackagesResolver(
    store: Store
): QueryResolvers['indexHealthPlanPackages'] {
    return async (_parent, _args, context) => {
        const { user, span } = context
        setResolverDetailsOnActiveSpan('fetchHealthPlanPackage', user, span)

        if (isStateUser(user)) {
            const results = await store.findAllHealthPlanPackagesByState(
                user.stateCode
            )
            return validateAndReturnHealthPlanPackages(results, span)
        } else if (isCMSUser(user) || isAdminUser(user)) {
            const results = await store.findAllHealthPlanPackagesBySubmittedAt()

            return validateAndReturnHealthPlanPackages(results, span)
        } else {
            const errMsg = 'user not authorized to fetch state data'
            logError('indexHealthPlanPackages', errMsg)
            setErrorAttributesOnActiveSpan(errMsg, span)
            throw new ForbiddenError(errMsg)
        }
    }
}
