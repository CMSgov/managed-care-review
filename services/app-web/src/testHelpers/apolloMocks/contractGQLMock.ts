import {
    FetchContractQuery,
    Contract,
    FetchContractDocument,
    UpdateDraftContractRatesDocument,
    UpdateContractDraftRevisionMutation,
    UpdateContractDraftRevisionDocument,
    UpdateDraftContractRatesMutation,
    SubmitContractMutation,
    SubmitContractDocument,
    CreateContractMutation,
    CreateContractDocument
} from '../../gen/gqlClient'
import { MockedResponse } from '@apollo/client/testing'
import { mockContractPackageDraft, mockContractPackageSubmittedWithRevisions } from './contractPackageDataMock'
import { GRAPHQL_ERROR_CAUSE_MESSAGES, GraphQLErrorCauseTypes, GraphQLErrorCodeTypes } from './apolloErrorCodeMocks'
import { GraphQLError } from 'graphql'
import { ApolloError } from '@apollo/client'

const fetchContractMockSuccess = ({
    contract,
}: {
    contract?: Partial<Contract>
}): MockedResponse<FetchContractQuery> => {
    const contractData = mockContractPackageDraft(contract)

    return {
        request: {
            query: FetchContractDocument,
            variables: { input: { contractID: contractData.id } },
        },
        result: {
            data: {
                fetchContract: {
                    contract: {
                        ...contractData,
                    },
                },
            },
        },
    }
}

const fetchContractMockFail = ({
    id,
    error,
}: {
    id: string
    error?: {
        code: GraphQLErrorCodeTypes
        cause: GraphQLErrorCauseTypes
    }
}): MockedResponse<FetchContractQuery | ApolloError> => {
    const graphQLError = new GraphQLError(
        error
            ? GRAPHQL_ERROR_CAUSE_MESSAGES[error.cause]
            : 'Error attempting to submit.',
        {
            extensions: {
                code: error?.code,
                cause: error?.cause,
            },
        }
    )

    return {
        request: {
            query: FetchContractDocument,
            variables: { input: { contractID: id } },
        },
        error: new ApolloError({
            graphQLErrors: [graphQLError],
        }),
        result: {
            data: null,
            errors: [graphQLError],
        },
    }
}

const createContractMockFail = ({
    error,
}: {
    error?: {
        code: GraphQLErrorCodeTypes
        cause: GraphQLErrorCauseTypes
    }
}): MockedResponse<CreateContractMutation | ApolloError> => {
    const graphQLError = new GraphQLError(
        error
            ? GRAPHQL_ERROR_CAUSE_MESSAGES[error.cause]
            : 'Error attempting to submit.',
        {
            extensions: {
                code: error?.code,
                cause: error?.cause,
            },
        }
    )

    return {
        request: {
            query: CreateContractDocument,
            variables: { input: { contractID: '123' } },
        },
        error: new ApolloError({
            graphQLErrors: [graphQLError],
        }),
        result: {
            data: null,
            errors: [graphQLError],
        },
    }
}

const createContractMockSuccess = ({
    contract,
}: {
    contract?: Partial<Contract>
}): MockedResponse<CreateContractMutation> => {
    const contractData = mockContractPackageDraft(contract)

    return {
        request: {
            query: FetchContractDocument,
            variables: { input: { contractID: contractData.id } },
        },
        result: {
            data: {
                createContract: {
                    contract: {
                        ...contractData,
                    },
                },
            },
        },
    }
}

const updateDraftContractRatesMockSuccess = ({
    contract,
}: {
    contract?: Partial<Contract>
}): MockedResponse<UpdateDraftContractRatesMutation> => {
    const contractData = mockContractPackageDraft(contract)
    const contractInput = {
        contractID: contractData.id,
        lastSeenUpdatedAt: contractData.draftRevision?.updatedAt,
        updatedRates: [
            {
                formData: {
                rateType: undefined,
                rateCapitationType: undefined,
                rateDocuments: [],
                supportingDocuments: [],
                rateDateStart: undefined,
                rateDateEnd: undefined,
                rateDateCertified: undefined,
                amendmentEffectiveDateStart: undefined,
                amendmentEffectiveDateEnd: undefined,
                rateProgramIDs: [],
                deprecatedRateProgramIDs: [],
                certifyingActuaryContacts: [
                    {
                        name: "",
                        titleRole: "",
                        email: "",
                        actuarialFirm: undefined,
                        actuarialFirmOther: ""
                    }
                ],
                addtlActuaryContacts: [],
                actuaryCommunicationPreference: undefined,
            },
            rateID: undefined,
            type: "CREATE"
        }]
    }
    return {
        request: {
            query: UpdateDraftContractRatesDocument,
            variables: { input: contractInput },
        },
        result: {
            data: {
                updateDraftContractRates: {
                    contract: {
                        ...contractData,
                    },
                },
            },
        },
    }
}

const updateContractDraftRevisionMockSuccess = ({
    contract,
}: {
    contract?: Partial<Contract>
}): MockedResponse<UpdateContractDraftRevisionMutation> => {
    const contractData = mockContractPackageDraft(contract)
    const contractInput = {
        contractID: contractData.id,
        lastSeenUpdatedAt: contractData.draftRevision?.updatedAt,
        formData: contractData.draftRevision?.formData
    }
    return {
        request: {
            query: UpdateDraftContractRatesDocument,
            variables: { input: contractInput },
        },
        result: {
            data: {
                updateContractDraftRevision: {
                    contract: {
                        ...contractData,
                    },
                },
            },
        },
    }
}
const updateContractDraftRevisionMockFail = ({
    contract,
    error
}: {
    contract?: Partial<Contract>
    error?: {
        code: GraphQLErrorCodeTypes
        cause: GraphQLErrorCauseTypes
    }
}): MockedResponse<UpdateContractDraftRevisionMutation | ApolloError> => {
    const contractData = mockContractPackageDraft(contract)
    const contractInput = {
        contractID: contractData.id,
        lastSeenUpdatedAt: contractData.draftRevision?.updatedAt,
        formData: contractData.draftRevision?.formData
    }

    const graphQLError = new GraphQLError(
        error
            ? GRAPHQL_ERROR_CAUSE_MESSAGES[error.cause]
            : 'Error attempting to update',
        {
            extensions: {
                code: error?.code,
                cause: error?.cause,
            },
        }
    )

    return {
        request: {
            query: UpdateContractDraftRevisionDocument,
            variables: { input: contractInput },
        },
        error: new ApolloError({
            graphQLErrors: [graphQLError],
        }),
        result: {
            data: null,
            errors: [graphQLError],
        },
    }
}

const submitContractMockSuccess = ({
    id,
    submittedReason,
}: {
    submittedReason?: string
    id: string,
}): MockedResponse<SubmitContractMutation> => {
    const contractData = mockContractPackageSubmittedWithRevisions({id})
    return {
        request: {
            query: SubmitContractDocument,
            variables: { input: { contractID: id, submittedReason } },
        },
        result: { data: { submitContract: { contract: {...contractData} } } },
    }
}

const submitContractMockError = ({
    id,
    error,
}: {
    id: string
    error?: {
        code: GraphQLErrorCodeTypes
        cause: GraphQLErrorCauseTypes
    }
}): MockedResponse<SubmitContractMutation | ApolloError> => {
    const graphQLError = new GraphQLError(
        error
            ? GRAPHQL_ERROR_CAUSE_MESSAGES[error.cause]
            : 'Error attempting to submit.',
        {
            extensions: {
                code: error?.code,
                cause: error?.cause,
            },
        }
    )

    return {
        request: {
            query: SubmitContractDocument,
            variables: { input: { contractID: id } },
        },
        error: new ApolloError({
            graphQLErrors: [graphQLError],
        }),
        result: {
            data: null,
            errors: [graphQLError],
        },
    }
}
export { fetchContractMockSuccess, fetchContractMockFail, updateDraftContractRatesMockSuccess, updateContractDraftRevisionMockFail, updateContractDraftRevisionMockSuccess, submitContractMockSuccess, submitContractMockError, createContractMockFail, createContractMockSuccess }
