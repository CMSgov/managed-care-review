import { ForbiddenError, UserInputError } from 'apollo-server-lambda'
import {
    isCMSUser,
    convertContractWithRatesToUnlockedHPP,
} from '../../domain-models'
import type { MutationResolvers } from '../../gen/gqlServer'
import { logError } from '../../logger'
import type { Store } from '../../postgres'
import {
    setResolverDetailsOnActiveSpan,
    setErrorAttributesOnActiveSpan,
} from '../attributeHelper'
import type { LDService } from '../../launchDarkly/launchDarkly'
import { GraphQLError } from 'graphql'

export function updateContractResolver(
    store: Store,
    launchDarkly: LDService
): MutationResolvers['updateContract'] {
    return async (_parent, { input }, context) => {
        const { user, span } = context
        setResolverDetailsOnActiveSpan('updateContract', user, span)
        const ratesDatabaseRefactor = await launchDarkly.getFeatureFlag(
            context,
            'rates-db-refactor'
        )

        if (ratesDatabaseRefactor) {
            // This resolver is only callable by CMS users
            if (!isCMSUser(user)) {
                logError(
                    'updateContract',
                    'user not authorized to update contract'
                )
                setErrorAttributesOnActiveSpan(
                    'user not authorized to update contract',
                    span
                )
                throw new ForbiddenError(
                    'user not authorized to update contract'
                )
            }

            const contract = await store.findContractWithHistory(input.id)
            if (contract instanceof Error) {
                throw contract
            }

            const hasSubmitInfo =
                contract.revisions.filter((rev) => rev.submitInfo).length > 0

            if (!hasSubmitInfo) {
                const errMessage = `Can not update a contract has not been submitted. Fails for contract with ID: ${contract.id}`
                logError('updateContract', errMessage)
                setErrorAttributesOnActiveSpan(errMessage, span)
                throw new UserInputError(errMessage, {
                    argumentName: 'contractID',
                    cause: 'CONTRACT_NOT_SUBMITTED',
                })
            }

            const updatedContract = await store.updateContract({
                contractID: input.id,
                mccrsID: input.mccrsID || undefined,
            })

            if (updatedContract instanceof Error) {
                throw updatedContract
            }

            const convertedPkg =
                convertContractWithRatesToUnlockedHPP(updatedContract)

            if (convertedPkg instanceof Error) {
                const errMessage = `Issue converting contract. Message: ${convertedPkg.message}`
                logError('fetchHealthPlanPackage', errMessage)
                setErrorAttributesOnActiveSpan(errMessage, span)
                throw new GraphQLError(errMessage, {
                    extensions: {
                        code: 'INTERNAL_SERVER_ERROR',
                        cause: 'PROTO_DECODE_ERROR',
                    },
                })
            }
            return {
                pkg: convertedPkg,
            }
        } else {
            const contract = await store.findContractWithHistory(input.id)
            if (contract instanceof Error) {
                throw contract
            }
            const convertedPkg = convertContractWithRatesToUnlockedHPP(contract)
            if (convertedPkg instanceof Error) {
                const errMessage = `Issue converting contract. Message: ${convertedPkg.message}`
                logError('fetchHealthPlanPackage', errMessage)
                setErrorAttributesOnActiveSpan(errMessage, span)
                throw new GraphQLError(errMessage, {
                    extensions: {
                        code: 'INTERNAL_SERVER_ERROR',
                        cause: 'PROTO_DECODE_ERROR',
                    },
                })
            }
            return {
                pkg: convertedPkg,
            }
        }
    }
}
