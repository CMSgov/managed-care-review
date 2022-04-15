import { ZodError } from 'zod'
import { statesubmission } from '../../../gen/stateSubmissionProto'
import {
    basicLockedHealthPlanFormData,
    basicHealthPlanFormData,
    contractOnly,
    unlockedWithALittleBitOfEverything,
    unlockedWithContacts,
    unlockedWithDocuments,
    unlockedWithFullContracts,
    unlockedWithFullRates,
    newHealthPlanFormData,
} from '../../domain-mocks'
import {
    UnlockedHealthPlanFormDataType,
    isLockedHealthPlanFormData,
    LockedHealthPlanFormDataType,
} from '../../domain-models'
import { toDomain } from './toDomain'
import { toProtoBuffer } from './toProtoBuffer'

describe('Validate encoding to protobuf and decoding back to domain model', () => {
    if (!isLockedHealthPlanFormData(basicLockedHealthPlanFormData())) {
        throw new Error(
            'Bad test, the state submission is not a state submission'
        )
    }

    test.each([
        newHealthPlanFormData(),
        basicHealthPlanFormData(),
        contractOnly(),
        unlockedWithContacts(),
        unlockedWithDocuments(),
        unlockedWithFullRates(),
        unlockedWithFullContracts(),
        unlockedWithALittleBitOfEverything(),
        basicLockedHealthPlanFormData(),
    ])(
        'given valid domain model %j expect protobufs to be symmetric)',
        (
            domainObject:
                | UnlockedHealthPlanFormDataType
                | LockedHealthPlanFormDataType
        ) => {
            expect(toDomain(toProtoBuffer(domainObject))).toEqual(domainObject)
        }
    )
})

describe('handles invalid data as expected', () => {
    it('toDomain errors when passed an empty proto message', () => {
        const protoMessage = new statesubmission.StateSubmissionInfo({})
        const encodedEmpty =
            statesubmission.StateSubmissionInfo.encode(protoMessage).finish()

        const maybeError = toDomain(encodedEmpty)

        expect(maybeError).toBeInstanceOf(Error)
        expect(maybeError.toString()).toBe(
            'Error: Unknown or missing status on this proto. Cannot decode.'
        )
    })

    it('toDomain returns a decode error when passed an invalid FormData', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invalidDraft = Object.assign({}, basicHealthPlanFormData()) as any
        delete invalidDraft.id
        delete invalidDraft.stateNumber
        invalidDraft.submissionType = 'nonsense'

        const encoded = toProtoBuffer(invalidDraft)
        const decodeErr = toDomain(encoded)

        expect(decodeErr).toBeInstanceOf(Error)

        // the zod error should note these three fields are wrong
        const zErr = decodeErr as ZodError
        expect(zErr.issues.flatMap((zodErr) => zodErr.path)).toEqual([
            'id',
            'stateNumber',
            'submissionType',
        ])
    })

    it('toDomain returns a decode error when passed an invalid StateSubmission', () => {
        const invalidSubmission = Object.assign(
            {},
            basicLockedHealthPlanFormData()
        ) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        delete invalidSubmission.id
        delete invalidSubmission.stateNumber
        invalidSubmission.documents = []
        invalidSubmission.submissionType = 'nonsense'

        const encoded = toProtoBuffer(invalidSubmission)
        const decodeErr = toDomain(encoded)

        expect(decodeErr).toBeInstanceOf(Error)
        expect(decodeErr.toString()).toBe(
            'Error: ERROR: attempting to parse state submission proto failed'
        )
    })
})
