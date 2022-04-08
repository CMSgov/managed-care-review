import { Submission2Type } from '../../app-web/src/common-code/domain-models'
import { toDomain } from '../../app-web/src/common-code/proto/stateSubmission'
import { sharedTestPrismaClient } from '../testHelpers/storeHelpers'
import { insertDraftSubmission } from './insertDraftSubmission'
import { isStoreError } from './storeError'

describe('insertDraftSubmissionPostgres', () => {
    // TODO this test needs to be improved its not testing anything
    // eslint-disable-next-line jest/expect-expect
    it('increases state number with every insertion', async () => {
        // this test attempts to create a number of drafts concurrently.
        // if any of the state numbers in the resultant drafts are duplicates, we have a bug.

        const client = await sharedTestPrismaClient()

        const args = {
            stateCode: 'FL',
            programIDs: ['smmc'],
            submissionType: 'CONTRACT_ONLY' as const,
            submissionDescription: 'concurrency state code test',
        }

        const resultPromises = []
        for (let i = 0; i < 30; i++) {
            resultPromises.push(insertDraftSubmission(client, args))
        }

        const results = await Promise.all(resultPromises)
        if (results.some((result) => isStoreError(result))) {
            console.log('RESULTS', results)
            throw new Error('some of our inserts failed')
        }

        // Because we are erroring above if _any_ of our results are a store error
        // we can tell the type system that all of our results are DraftSubmissionType
        const drafts = results as Submission2Type[]

        const formDatum = drafts.map((d) => {
            const formDataResult = toDomain(d.revisions[0].submissionFormProto)
            if (formDataResult instanceof Error) {
                throw formDataResult
            }
            return formDataResult
        })

        // Quick way to see if there are any duplicates, throw the state numbers into
        // a set and check that the set and the array have the same number of elements
        const stateNumbers = formDatum.map((d) => d.stateNumber)
        const stateNumberSet = new Set(stateNumbers)

        if (stateNumbers.length !== stateNumberSet.size) {
            console.log(
                'We got some duplicates: ',
                stateNumbers.sort(),
                stateNumberSet.size
            )
            throw new Error('got some duplicate state numbers.')
        }
    })
})
