import { DraftSubmission, DraftSubmissionUpdates } from '../../gen/gqlClient'
/*
    Clean out _typename from submission
    If you pass gql __typename within a mutation input things break; however,  __typename comes down on cached queries by default
    This function is needed to remove _typename  for optional objects such as contractAmendmentInfo and rateAmendmentInfo
*/
function omitTypename<T>(key: unknown, value: T): T | undefined {
    return key === '__typename' ? undefined : value
}

function stripTypename<T>(input: T): T {
    return JSON.parse(JSON.stringify(input), omitTypename)
}

// this function cleans a draft submissions values whenever the draft is updated
function cleanDraftSubmission(
    draftUpdate: DraftSubmissionUpdates
): DraftSubmissionUpdates {
    // remove rate data if submission type is not contract only
    if (draftUpdate.submissionType === 'CONTRACT_ONLY') {
        delete draftUpdate.rateType
        delete draftUpdate.rateDateStart
        delete draftUpdate.rateDateEnd
        delete draftUpdate.rateDateCertified
        delete draftUpdate.rateAmendmentInfo
        draftUpdate.rateDocuments = []
        draftUpdate.actuaryContacts = []
        delete draftUpdate.actuaryCommunicationPreference
    }
    return draftUpdate
}

// this function takes a DraftSubmission and picks off all the keys that are valid
// keys for DraftSubmissionUpdates. This facilitates making an update request given
// an extant draft
// There's probably some Typescript Cleverness™ we could do for this mapping function
// but for now the compiler complains if you forget anything so ¯\_(ツ)_/¯
function updatesFromSubmission(draft: DraftSubmission): DraftSubmissionUpdates {
    return {
        programIDs: draft.programIDs,
        submissionType: draft.submissionType,
        submissionDescription: draft.submissionDescription,
        documents: draft.documents,
        contractType: draft.contractType,
        contractExecutionStatus: draft.contractExecutionStatus,
        contractDocuments: draft.contractDocuments,
        contractDateStart: draft.contractDateStart,
        contractDateEnd: draft.contractDateEnd,
        federalAuthorities: draft.federalAuthorities,
        managedCareEntities: draft.managedCareEntities,
        contractAmendmentInfo: draft.contractAmendmentInfo,
        rateType: draft.rateType,
        rateDocuments: draft.rateDocuments,
        rateDateStart: draft.rateDateStart,
        rateDateEnd: draft.rateDateEnd,
        rateDateCertified: draft.rateDateCertified,
        rateAmendmentInfo: draft.rateAmendmentInfo,
        stateContacts: draft.stateContacts,
        actuaryContacts: draft.actuaryContacts,
        actuaryCommunicationPreference: draft.actuaryCommunicationPreference,
    }
}

export {
    cleanDraftSubmission,
    stripTypename,
    omitTypename,
    updatesFromSubmission,
}
