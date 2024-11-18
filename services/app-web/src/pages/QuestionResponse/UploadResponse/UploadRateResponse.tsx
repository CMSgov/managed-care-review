import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    CreateQuestionResponseInput,
    useCreateRateQuestionResponseMutation,
    useFetchRateWithQuestionsQuery,
} from '../../../gen/gqlClient'
import { usePage } from '../../../contexts/PageContext'
import styles from '../QuestionResponse.module.scss'
import { Breadcrumbs } from '../../../components/Breadcrumbs/Breadcrumbs'
import { createRateQuestionResponseWrapper } from '../../../gqlHelpers/mutationWrappersForUserFriendlyErrors'
import { RoutesRecord } from '../../../constants'
import { GenericErrorPage } from '../../Errors/GenericErrorPage'
import { UploadResponseForm } from './UploadResponseForm'
import { FileItemT } from '../../../components'
import { ErrorOrLoadingPage } from '../../StateSubmission'
import { handleAndReturnErrorState } from '../../StateSubmission/ErrorOrLoadingPage'
import {
    extractDocumentsFromQuestion,
    extractQuestions,
    getQuestionRoundForQuestionID,
    isValidCmsDivison,
} from '../QuestionResponseHelpers/questionResponseHelpers'
import { QuestionDisplayTable } from '../QATable/QuestionDisplayTable'
import { useAuth } from '../../../contexts/AuthContext'
import { Error404 } from '../../Errors/Error404Page'

export const UploadRateResponse = () => {
    // router context
    const { division, id, rateID, questionID } = useParams<{
        division: string
        id: string
        rateID: string
        questionID: string
    }>()

    const navigate = useNavigate()
    const { updateHeading } = usePage()
    const { loggedInUser } = useAuth()

    // api
    const {
        data: fetchRateData,
        loading: fetchRateLoading,
        error: fetchRateError,
    } = useFetchRateWithQuestionsQuery({
        variables: {
            input: {
                rateID: rateID || 'not-found',
            },
        },
    })

    const [createResponse, { loading: apiLoading, error: apiError }] =
        useCreateRateQuestionResponseMutation()

    const rate = fetchRateData?.fetchRate.rate
    const rateName =
        (rate?.packageSubmissions &&
            rate?.packageSubmissions[0].rateRevision.formData
                .rateCertificationName) ||
        ''
    const parentContractID = id
    const contractName =
        (rate?.packageSubmissions &&
            rate?.packageSubmissions[0].contractRevisions.find(
                (contractRev) => contractRev.contractID == parentContractID
            )?.contractName) ||
        undefined

    // side effects
    useEffect(() => {
        updateHeading({ customHeading: `${rateName} Upload response` })
    }, [rateName, updateHeading])

    if (fetchRateLoading) {
        return <ErrorOrLoadingPage state="LOADING" />
    }

    if (fetchRateError) {
        return (
            <ErrorOrLoadingPage
                state={handleAndReturnErrorState(fetchRateError)}
            />
        )
    }

    // confirm division is valid
    const realDivision = division?.toUpperCase()

    if (!realDivision || !isValidCmsDivison(realDivision)) {
        console.error(
            'Upload Questions called with bogus division in URL: ',
            division
        )
        return <Error404 />
    }

    if (!rate || rate.status === 'DRAFT' || !questionID || !rate.questions) {
        return <GenericErrorPage />
    }
    const questionRoundNumber = getQuestionRoundForQuestionID(
        rate.questions,
        realDivision,
        questionID
    )

    const handleFormSubmit = async (cleaned: FileItemT[]) => {
        const responseDocs = cleaned.map((item) => {
            return {
                name: item.name,
                s3URL: item.s3URL as string,
            }
        })

        const input: CreateQuestionResponseInput = {
            questionID: questionID as string,
            documents: responseDocs,
        }

        const createResult = await createRateQuestionResponseWrapper(
            createResponse,
            rateID as string,
            input,
            realDivision
        )

        if (createResult instanceof Error) {
            console.info(createResult.message)
        } else {
            navigate(
                `/submissions/${parentContractID}/rates/${rateID}/question-and-answers?submit=response`
            )
        }
    }
    const question = extractQuestions(rate.questions).find(
        (question) => question.id == questionID
    )

    return (
        <div className={styles.uploadFormContainer}>
            <Breadcrumbs
                className="usa-breadcrumb--wrap"
                items={[
                    {
                        link: RoutesRecord.DASHBOARD_SUBMISSIONS,
                        text: 'Dashboard',
                    },
                    {
                        link: `/submissions/${parentContractID}`,
                        text: contractName ?? 'Unknown Contract',
                    },
                    {
                        link: `/submissions/${parentContractID}/rates/${rate.id}/question-and-answers`,
                        text: `Rate questions: ${rateName}`,
                    },
                    {
                        text: 'Upload response',
                        link: RoutesRecord.SUBMISSIONS_UPLOAD_CONTRACT_RESPONSE,
                    },
                ]}
            />

            <UploadResponseForm
                handleSubmit={handleFormSubmit}
                apiLoading={apiLoading}
                apiError={Boolean(apiError)}
                type="rate"
                round={questionRoundNumber}
                questionBeingAsked={
                    question ? (
                        <QuestionDisplayTable
                            documents={extractDocumentsFromQuestion(question)}
                            user={loggedInUser!}
                            onlyDisplayInitial
                        />
                    ) : (
                        <p>'Related question unable to display'</p>
                    )
                }
            />
        </div>
    )
}
