import { MockedResponse } from '@apollo/client/testing'
import { GraphQLError } from 'graphql'
import { unlockedWithALittleBitOfEverything } from '@managed-care-review/common-code/healthPlanFormDataMocks'
import { UnlockedHealthPlanFormDataType } from '@managed-care-review/common-code/healthPlanFormDataType'
import { domainToBase64 } from '@managed-care-review/common-code/proto/healthPlanFormDataProto'

import {
    FetchHealthPlanPackageDocument,
    UpdateHealthPlanFormDataDocument,
    IndexHealthPlanPackagesDocument,
    HealthPlanPackage,
    SubmitHealthPlanPackageDocument,
    UnlockHealthPlanPackageDocument,
    UnlockHealthPlanPackageMutation,
    SubmitHealthPlanPackageMutation,
    IndexHealthPlanPackagesQuery,
    FetchHealthPlanPackageQuery,
    UpdateHealthPlanFormDataMutation,
    CreateHealthPlanPackageDocument,
    CreateHealthPlanPackageMutation,
} from '../../gen/gqlClient'
import {
    mockContractAndRatesDraft,
    mockDraftHealthPlanPackage,
    mockSubmittedHealthPlanPackage,
    mockUnlockedHealthPlanPackageWithDocuments,
    mockUnlockedHealthPlanPackage,
} from './healthPlanFormDataMock'
import { ApolloError } from '@apollo/client'
import {
    GRAPHQL_ERROR_CAUSE_MESSAGES,
    GraphQLErrorCauseTypes,
    GraphQLErrorCodeTypes,
} from './apolloErrorCodeMocks'

type fetchHealthPlanPackageMockProps = {
    submission?: HealthPlanPackage
    id: string
}

const fetchHealthPlanPackageMockSuccess = ({
    submission = mockDraftHealthPlanPackage(),
    id,
}: fetchHealthPlanPackageMockProps): MockedResponse<FetchHealthPlanPackageQuery> => {
    // override the ID of the returned draft to match the queried id.
    const mergedDraftSubmission = Object.assign({}, submission, { id })
    return {
        request: {
            query: FetchHealthPlanPackageDocument,
            variables: { input: { pkgID: id } },
        },
        result: {
            data: {
                fetchHealthPlanPackage: {
                    pkg: mergedDraftSubmission,
                },
            },
        },
    }
}

const fetchHealthPlanPackageMockNotFound = ({
    id,
}: fetchHealthPlanPackageMockProps): MockedResponse<FetchHealthPlanPackageQuery> => {
    return {
        request: {
            query: FetchHealthPlanPackageDocument,
            variables: { input: { pkgID: id } },
        },
        result: {
            data: {
                fetchHealthPlanPackage: {
                    pkg: undefined,
                },
            },
        },
    }
}

const fetchHealthPlanPackageMockAuthFailure =
    (): MockedResponse<FetchHealthPlanPackageQuery> => {
        return {
            request: { query: FetchHealthPlanPackageDocument },
            error: new Error('You are not logged in'),
        }
    }

const fetchHealthPlanPackageMockNetworkFailure =
    (): MockedResponse<FetchHealthPlanPackageQuery> => {
        return {
            request: { query: FetchHealthPlanPackageDocument },
            error: new Error('A network error occurred'),
        }
    }

type fetchStateHealthPlanPackageMockSuccessProps = {
    stateSubmission?: HealthPlanPackage | Partial<HealthPlanPackage>
    id: string
}

const fetchStateHealthPlanPackageMockSuccess = ({
    stateSubmission = mockSubmittedHealthPlanPackage(),
    id,
}: fetchStateHealthPlanPackageMockSuccessProps): MockedResponse<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Record<string, any>
> => {
    // override the ID of the returned draft to match the queried id.
    const mergedStateSubmission = Object.assign({}, stateSubmission, { id })

    return {
        request: {
            query: FetchHealthPlanPackageDocument,
            variables: { input: { pkgID: id } },
        },
        result: {
            data: {
                fetchHealthPlanPackage: {
                    pkg: mergedStateSubmission,
                },
            },
        },
    }
}

const mockSubmittedHealthPlanPackageWithRevision = ({
    currentSubmissionData,
    previousSubmissionData,
    initialSubmissionData,
}: {
    currentSubmissionData?: Partial<UnlockedHealthPlanFormDataType>
    previousSubmissionData?: Partial<UnlockedHealthPlanFormDataType>
    initialSubmissionData?: Partial<UnlockedHealthPlanFormDataType>
}): HealthPlanPackage => {
    const currentFiles: Partial<UnlockedHealthPlanFormDataType> = {
        contractDocuments: [
            {
                s3URL: 's3://bucketname/1648242632157-Amerigroup Texas, Inc.pdf/Amerigroup Texas, Inc.pdf',
                name: 'Amerigroup Texas, Inc.pdf',
                documentCategories: ['CONTRACT'],
            },
            {
                s3URL: 's3://bucketname/1648490162641-lifeofgalileo.pdf/lifeofgalileo.pdf',
                name: 'lifeofgalileo.pdf',
                documentCategories: ['CONTRACT'],
            },
        ],
        rateInfos: [
            {
                rateDocuments: [
                    {
                        s3URL: 's3://bucketname/1648242665634-Amerigroup Texas, Inc.pdf/Amerigroup Texas, Inc.pdf',
                        name: 'Amerigroup Texas, Inc.pdf',
                        documentCategories: ['RATES_RELATED'],
                    },
                    {
                        s3URL: 's3://bucketname/1648242711421-Amerigroup Texas Inc copy.pdf/Amerigroup Texas Inc copy.pdf',
                        name: 'Amerigroup Texas Inc copy.pdf',
                        documentCategories: ['RATES_RELATED'],
                    },
                ],
                actuaryContacts: [],
                packagesWithSharedRateCerts: [],
            },
        ],
        documents: [
            {
                s3URL: 's3://bucketname/1648242711421-529-10-0020-00003_Superior_Health Plan, Inc.pdf/529-10-0020-00003_Superior_Health Plan, Inc.pdf',
                name: '529-10-0020-00003_Superior_Health Plan, Inc.pdf',
                documentCategories: ['CONTRACT_RELATED'],
            },
            {
                s3URL: 's3://bucketname/1648242873229-covid-ifc-2-flu-rsv-codes 5-5-2021.pdf/covid-ifc-2-flu-rsv-codes 5-5-2021.pdf',
                name: 'covid-ifc-2-flu-rsv-codes 5-5-2021.pdf',
                documentCategories: ['RATES_RELATED'],
            },
        ],
    }
    const previousFiles: Partial<UnlockedHealthPlanFormDataType> = {
        contractDocuments: [
            {
                s3URL: 's3://bucketname/1648242632157-Amerigroup Texas, Inc.pdf/Amerigroup Texas, Inc.pdf',
                name: 'Amerigroup Texas, Inc.pdf',
                documentCategories: ['CONTRACT'],
            },
            {
                s3URL: 's3://bucketname/1648242665634-Amerigroup Texas, Inc.pdf/Amerigroup Texas, Inc.pdf',
                name: 'Amerigroup Texas, Inc.pdf',
                documentCategories: ['CONTRACT'],
            },
            {
                s3URL: 's3://bucketname/1648242711421-Amerigroup Texas Inc copy.pdf/Amerigroup Texas Inc copy.pdf',
                name: 'Amerigroup Texas Inc copy.pdf',
                documentCategories: ['CONTRACT'],
            },
        ],
        rateInfos: [
            {
                rateDocuments: [
                    {
                        s3URL: 's3://bucketname/1648242711421-529-10-0020-00003_Superior_Health Plan, Inc.pdf/529-10-0020-00003_Superior_Health Plan, Inc.pdf',
                        name: '529-10-0020-00003_Superior_Health Plan, Inc.pdf',
                        documentCategories: ['RATES'],
                    },
                    {
                        s3URL: 's3://bucketname/1648242873229-covid-ifc-2-flu-rsv-codes 5-5-2021.pdf/covid-ifc-2-flu-rsv-codes 5-5-2021.pdf',
                        name: 'covid-ifc-2-flu-rsv-codes 5-5-2021.pdf',
                        documentCategories: ['RATES'],
                    },
                    {
                        s3URL: 's3://bucketname/1648242632157-Amerigroup Texas, Inc.pdf/Amerigroup Texas, Inc.pdf',
                        name: 'Amerigroup Texas, Inc.pdf',
                        documentCategories: ['RATES'],
                    },
                ],
                actuaryContacts: [],
                packagesWithSharedRateCerts: [],
            },
        ],
        documents: [
            {
                s3URL: 's3://bucketname/1648242665634-Amerigroup Texas, Inc.pdf/Amerigroup Texas, Inc.pdf',
                name: 'Amerigroup Texas, Inc.pdf',
                documentCategories: ['CONTRACT_RELATED'],
            },
            {
                s3URL: 's3://bucketname/1648242711421-Amerigroup Texas Inc copy.pdf/Amerigroup Texas Inc copy.pdf',
                name: 'Amerigroup Texas Inc copy.pdf',
                documentCategories: ['CONTRACT_RELATED'],
            },
            {
                s3URL: 's3://bucketname/1648242711421-529-10-0020-00003_Superior_Health Plan, Inc.pdf/529-10-0020-00003_Superior_Health Plan, Inc.pdf',
                name: '529-10-0020-00003_Superior_Health Plan, Inc.pdf',
                documentCategories: ['RATES_RELATED'],
            },
        ],
    }

    const currentProto = domainToBase64({
        ...unlockedWithALittleBitOfEverything(),
        ...currentFiles,
        ...currentSubmissionData,
    })
    const previousProto = domainToBase64({
        ...unlockedWithALittleBitOfEverything(),
        ...previousFiles,
        ...previousSubmissionData,
    })
    const initialProto = domainToBase64({
        ...mockContractAndRatesDraft(),
        ...previousFiles,
        ...initialSubmissionData,
    })
    return {
        __typename: 'HealthPlanPackage',
        id: '07f9efbf-d4d1-44ae-8674-56d9d6b75ce6',
        stateCode: 'MN',
        state: {
            name: 'Minnesota',
            code: 'MN',
            programs: [],
        },
        status: 'RESUBMITTED',
        initiallySubmittedAt: '2022-03-25',
        revisions: [
            {
                __typename: 'HealthPlanRevisionEdge',
                node: {
                    __typename: 'HealthPlanRevision',
                    id: '135972bf-e056-40d3-859c-6a69d9c982ad',
                    unlockInfo: {
                        __typename: 'UpdateInformation',
                        updatedAt: '2022-03-28T17:54:39.173Z',
                        updatedBy: 'zuko@example.com',
                        updatedReason: 'prepare to add documents',
                    },
                    submitInfo: {
                        __typename: 'UpdateInformation',
                        updatedAt: '2022-03-28T17:56:32.952Z',
                        updatedBy: 'aang@example.com',
                        updatedReason: 'Placeholder resubmission reason',
                    },
                    createdAt: '2022-03-28T17:54:39.175Z',
                    formDataProto: currentProto,
                },
            },
            {
                __typename: 'HealthPlanRevisionEdge',
                node: {
                    __typename: 'HealthPlanRevision',
                    id: '9aa14122-2d37-462a-b788-e25c1c30e8dc',
                    unlockInfo: {
                        __typename: 'UpdateInformation',
                        updatedAt: '2022-03-25T21:13:56.174Z',
                        updatedBy: 'zuko@example.com',
                        updatedReason: 'test',
                    },
                    submitInfo: {
                        __typename: 'UpdateInformation',
                        updatedAt: '2022-03-25T21:14:43.057Z',
                        updatedBy: 'aang@example.com',
                        updatedReason: 'Placeholder resubmission reason',
                    },
                    createdAt: '2022-03-25T21:13:56.176Z',
                    formDataProto: previousProto,
                },
            },
            {
                __typename: 'HealthPlanRevisionEdge',
                node: {
                    __typename: 'HealthPlanRevision',
                    id: '95fa29ec-c8b1-4195-82c1-5615bcda7bac',
                    unlockInfo: null,
                    submitInfo: {
                        __typename: 'UpdateInformation',
                        updatedAt: '2022-03-25T21:13:20.419Z',
                        updatedBy: 'aang@example.com',
                        updatedReason: 'Initial submission',
                    },
                    createdAt: '2022-03-25T03:28:56.244Z',
                    formDataProto: initialProto,
                },
            },
        ],
    }
}

type updateHealthPlanFormDataMockSuccessProps = {
    pkg?: HealthPlanPackage
    updatedFormData: string
    id: string
}

const updateHealthPlanFormDataMockSuccess = ({
    pkg = mockUnlockedHealthPlanPackageWithDocuments(),
    updatedFormData,
    id,
}: updateHealthPlanFormDataMockSuccessProps): MockedResponse<UpdateHealthPlanFormDataMutation> => {
    return {
        request: {
            query: UpdateHealthPlanFormDataDocument,
            variables: {
                input: { pkgID: id, healthPlanFormData: updatedFormData },
            },
        },
        result: { data: { updateHealthPlanFormData: { pkg } } },
    }
}

const updateHealthPlanFormDataMockAuthFailure =
    (): MockedResponse<UpdateHealthPlanFormDataMutation> => {
        return {
            request: { query: UpdateHealthPlanFormDataDocument },
            error: new Error('You are not logged in'),
        }
    }

const updateHealthPlanFormDataMockNetworkFailure =
    (): MockedResponse<UpdateHealthPlanFormDataMutation> => {
        return {
            request: { query: UpdateHealthPlanFormDataDocument },
            error: new Error('A network error occurred'),
        }
    }

const createHealthPlanPackageMockSuccess =
    (): MockedResponse<CreateHealthPlanPackageMutation> => {
        const submissionData: Partial<UnlockedHealthPlanFormDataType> = {
            programIDs: ['d95394e5-44d1-45df-8151-1cc1ee66f100'],
            submissionType: 'CONTRACT_ONLY',
            riskBasedContract: true,
            submissionDescription: 'A submitted submission',
        }
        const pkg = mockDraftHealthPlanPackage()
        return {
            request: {
                query: CreateHealthPlanPackageDocument,
                variables: {
                    input: submissionData,
                },
            },
            result: { data: { createHealthPlanPackage: { pkg } } },
        }
    }

const createHealthPlanPackageMockAuthFailure =
    (): MockedResponse<CreateHealthPlanPackageMutation> => {
        return {
            request: { query: UpdateHealthPlanFormDataDocument },
            error: new Error('You are not logged in'),
        }
    }

const createHealthPlanPackageMockNetworkFailure =
    (): MockedResponse<CreateHealthPlanPackageMutation> => {
        return {
            request: { query: UpdateHealthPlanFormDataDocument },
            error: new Error('A network error occurred'),
        }
    }

type submitHealthPlanPackageMockSuccessProps = {
    stateSubmission?: HealthPlanPackage
    id: string
    submittedReason?: string
}

const submitHealthPlanPackageMockSuccess = ({
    stateSubmission,
    id,
    submittedReason,
}: submitHealthPlanPackageMockSuccessProps): MockedResponse<SubmitHealthPlanPackageMutation> => {
    const pkg = stateSubmission ?? mockDraftHealthPlanPackage()
    return {
        request: {
            query: SubmitHealthPlanPackageDocument,
            variables: { input: { pkgID: id, submittedReason } },
        },
        result: { data: { submitHealthPlanPackage: { pkg } } },
    }
}

const submitHealthPlanPackageMockError = ({
    id,
    error,
}: {
    id: string
    error?: {
        code: GraphQLErrorCodeTypes
        cause: GraphQLErrorCauseTypes
    }
}): MockedResponse<SubmitHealthPlanPackageMutation | ApolloError> => {
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
            query: SubmitHealthPlanPackageDocument,
            variables: { input: { pkgID: id } },
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

type unlockHealthPlanPackageMockSuccessProps = {
    pkg?: HealthPlanPackage
    id: string
    reason: string
}

const unlockHealthPlanPackageMockSuccess = ({
    pkg = mockUnlockedHealthPlanPackage(),
    id,
    reason,
}: unlockHealthPlanPackageMockSuccessProps): MockedResponse<UnlockHealthPlanPackageMutation> => {
    return {
        request: {
            query: UnlockHealthPlanPackageDocument,
            variables: { input: { pkgID: id, unlockedReason: reason } },
        },
        result: { data: { unlockHealthPlanPackage: { pkg } } },
    }
}

const unlockHealthPlanPackageMockError = ({
    id,
    reason,
    error,
}: {
    id: string
    reason: string
    error?: {
        code: GraphQLErrorCodeTypes
        cause: GraphQLErrorCauseTypes
    }
}): MockedResponse<UnlockHealthPlanPackageMutation> => {
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
            query: UnlockHealthPlanPackageDocument,
            variables: { input: { pkgID: id, unlockedReason: reason } },
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

const indexHealthPlanPackagesMockSuccess = (
    submissions: HealthPlanPackage[] = [
        { ...mockUnlockedHealthPlanPackage(), id: 'test-id-123' },
        { ...mockSubmittedHealthPlanPackage(), id: 'test-id-124' },
    ]
): MockedResponse<IndexHealthPlanPackagesQuery> => {
    const submissionEdges = submissions.map((sub) => {
        return {
            node: sub,
        }
    })
    return {
        request: {
            query: IndexHealthPlanPackagesDocument,
        },
        result: {
            data: {
                indexHealthPlanPackages: {
                    totalCount: submissionEdges.length,
                    edges: submissionEdges,
                },
            },
        },
    }
}

export {
    fetchHealthPlanPackageMockSuccess,
    fetchHealthPlanPackageMockNotFound,
    fetchHealthPlanPackageMockNetworkFailure,
    fetchHealthPlanPackageMockAuthFailure,
    fetchStateHealthPlanPackageMockSuccess,
    updateHealthPlanFormDataMockAuthFailure,
    updateHealthPlanFormDataMockNetworkFailure,
    updateHealthPlanFormDataMockSuccess,
    submitHealthPlanPackageMockSuccess,
    submitHealthPlanPackageMockError,
    indexHealthPlanPackagesMockSuccess,
    unlockHealthPlanPackageMockSuccess,
    unlockHealthPlanPackageMockError,
    mockSubmittedHealthPlanPackageWithRevision,
    createHealthPlanPackageMockSuccess,
    createHealthPlanPackageMockAuthFailure,
    createHealthPlanPackageMockNetworkFailure,
}
