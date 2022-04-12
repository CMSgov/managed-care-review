import { ForbiddenError, UserInputError } from 'apollo-server-lambda'
import {
    UnlockedHealthPlanFormDataType,
    isCMSUser,
    LockedHealthPlanFormDataType,
    UpdateInfoType,
    submissionName,
} from '../../app-web/src/common-code/domain-models'
import { Emailer } from '../emailer'
import { MutationResolvers } from '../gen/gqlServer'
import { logError, logSuccess } from '../logger'
import { isStoreError, Store } from '../postgres'
import {
    setErrorAttributesOnActiveSpan,
    setResolverDetailsOnActiveSpan,
    setSuccessAttributesOnActiveSpan,
} from './attributeHelper'

// unlock takes a state submission and casts it into a draft submission
// Since draft submission is a strict subset of submitted submission, this can't error today.
function unlock(
    submission: LockedHealthPlanFormDataType
): UnlockedHealthPlanFormDataType {
    const draft: UnlockedHealthPlanFormDataType = {
        ...submission,
        status: 'DRAFT',
    }
    // this method does persist the submittedAt field onto the draft, but typescript won't let
    // us access it so that's fine.

    return draft
}

// unlockStateSubmissionResolver is a state machine transition for Submission,
// transforming it from a DraftSubmission to a StateSubmission
export function unlockStateSubmissionResolver(
    store: Store,
    emailer: Emailer
): MutationResolvers['unlockStateSubmission'] {
    return async (_parent, { input }, context) => {
        const { user, span } = context
        const { unlockedReason, submissionID } = input
        setResolverDetailsOnActiveSpan('createDraftSubmission', user, span)
        // This resolver is only callable by CMS users
        if (!isCMSUser(user)) {
            logError(
                'unlockStateSubmission',
                'user not authorized to unlock submission'
            )
            setErrorAttributesOnActiveSpan(
                'user not authorized to unlock submission',
                span
            )
            throw new ForbiddenError('user not authorized to unlock submission')
        }

        // fetch from the store
        const result = await store.findStateSubmission(submissionID)

        if (isStoreError(result)) {
            const errMessage = `Issue finding a state submission of type ${result.code}. Message: ${result.message}`
            logError('unlockStateSubmission', errMessage)
            setErrorAttributesOnActiveSpan(errMessage, span)
            if (result.code === 'WRONG_STATUS') {
                setErrorAttributesOnActiveSpan(
                    'Attempted to unlock submission with wrong status',
                    span
                )
                throw new UserInputError(
                    'Attempted to unlock submission with wrong status'
                )
            }
            throw new Error(errMessage)
        }

        if (result === undefined) {
            const errMessage = `A submission must exist to be unlocked: ${submissionID}`
            logError('unlockStateSubmission', errMessage)
            setErrorAttributesOnActiveSpan(errMessage, span)
            throw new UserInputError(errMessage, {
                argumentName: 'submissionID',
            })
        }

        const unlockInfo: UpdateInfoType = {
            updatedAt: new Date(),
            updatedBy: context.user.email,
            updatedReason: unlockedReason,
        }

        const submission: LockedHealthPlanFormDataType = result

        const draft: UnlockedHealthPlanFormDataType = unlock(submission)

        // Create a new revision with this draft in it
        const revisionResult = await store.insertNewRevision(
            submissionID,
            unlockInfo,
            draft
        )

        // const updateResult = await store.updateStateSubmission(stateSubmission)
        if (isStoreError(revisionResult)) {
            const errMessage = `Issue unlocking a state submission of type ${revisionResult.code}. Message: ${revisionResult.message}`
            logError('unlockStateSubmission', errMessage)
            setErrorAttributesOnActiveSpan(errMessage, span)
            throw new Error(errMessage)
        }

        const programs = store.findPrograms(
            submission.stateCode,
            submission.programIDs
        )
        if (!programs || programs.length !== submission.programIDs.length) {
            const errMessage = `Can't find programs ${submission.programIDs} from state ${submission.stateCode}, ${submission.id}`
            logError('unlockStateSubmission', errMessage)
            setErrorAttributesOnActiveSpan(errMessage, span)
            throw new Error(errMessage)
        }

        // Send emails!
        const name = submissionName(submission, programs)

        const updatedEmailData = {
            ...unlockInfo,
            submissionName: name,
        }
        const unlockPackageCMSEmailResult =
            await emailer.sendUnlockPackageCMSEmail(updatedEmailData)

        const unlockPackageStateEmailResult =
            await emailer.sendUnlockPackageStateEmail(
                submission,
                updatedEmailData
            )

        if (unlockPackageCMSEmailResult instanceof Error) {
            logError(
                'unlockPackageCMSEmail - CMS email failed',
                unlockPackageCMSEmailResult
            )
            throw unlockPackageCMSEmailResult
        }

        if (unlockPackageStateEmailResult instanceof Error) {
            logError(
                'unlockPackageCMSEmail - CMS email failed',
                unlockPackageStateEmailResult
            )
            throw unlockPackageStateEmailResult
        }

        logSuccess('unlockStateSubmission')
        setSuccessAttributesOnActiveSpan(span)

        return { submission: revisionResult }
    }
}
