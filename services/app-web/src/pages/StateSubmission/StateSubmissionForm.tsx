import React, { useState, useEffect } from 'react'

import { Alert, GridContainer } from '@trussworks/react-uswds'
import { Switch, Route, useParams, useLocation } from 'react-router-dom'
import styles from './StateSubmissionForm.module.scss'

import { Error404 } from '../Errors/Error404'
import { ErrorInvalidSubmissionStatus } from '../Errors/ErrorInvalidSubmissionStatus'
import { GenericErrorPage } from '../Errors/GenericErrorPage'
import { Loading } from '../../components/Loading'
import { DynamicStepIndicator } from '../../components/DynamicStepIndicator'
import { usePage } from '../../contexts/PageContext'
import {
    RoutesRecord,
    getRouteName,
    STATE_SUBMISSION_FORM_ROUTES,
    RouteT,
} from '../../constants/routes'
import {
    getCurrentRevisionFromSubmission2,
    convertDomainModelFormDataToGQLSubmission,
} from '../../gqlHelpers'
import { StateSubmissionContainer } from './StateSubmissionContainer'
import { ContractDetails } from './ContractDetails'
import { RateDetails } from './RateDetails'
import { Contacts } from './Contacts'
import { Documents } from './Documents'
import { ReviewSubmit } from './ReviewSubmit'
import { SubmissionType } from './SubmissionType'

import {
    DraftSubmission,
    UpdateDraftSubmissionInput,
    useUpdateDraftSubmissionMutation,
    useFetchSubmission2Query,
    User,
} from '../../gen/gqlClient'
import { SubmissionUnlockedBanner } from '../../components/Banner'
import { UpdateInfoType } from '../../common-code/domain-models/Submission2Type'
import { useAuth } from '../../contexts/AuthContext'
import { GenericApiErrorBanner } from '../../components/Banner/GenericApiErrorBanner/GenericApiErrorBanner'
import {
    DraftSubmissionType,
    submissionName,
} from '../../common-code/domain-models'
import {
    cleanDraftSubmission,
    updatesFromSubmission,
} from './updateSubmissionTransform'

const FormAlert = ({ message }: { message?: string }): React.ReactElement => {
    return message ? (
        <Alert type="error">{message}</Alert>
    ) : (
        <GenericApiErrorBanner />
    )
}

const PageBannerAlerts = ({
    showPageErrorMessage,
    loggedInUser,
    unlockedInfo,
}: {
    showPageErrorMessage: string | boolean
    loggedInUser?: User
    unlockedInfo?: UpdateInfoType | null
}): JSX.Element => {
    const message =
        typeof showPageErrorMessage !== 'boolean'
            ? showPageErrorMessage
            : undefined
    return (
        <>
            {showPageErrorMessage && <FormAlert message={message} />}
            {unlockedInfo && (
                <SubmissionUnlockedBanner
                    userType={
                        loggedInUser?.role === 'CMS_USER'
                            ? 'CMS_USER'
                            : 'STATE_USER'
                    }
                    unlockedBy={unlockedInfo?.updatedBy || 'Not available'}
                    unlockedOn={unlockedInfo.updatedAt || 'Not available'}
                    reason={unlockedInfo.updatedReason || 'Not available'}
                />
            )}
        </>
    )
}

const activeFormPages = (draft: DraftSubmission): RouteT[] => {
    // If submission type is contract only, rate details is left out of the step indicator
    return STATE_SUBMISSION_FORM_ROUTES.filter(
        (formPage) =>
            !(
                draft?.submissionType === 'CONTRACT_ONLY' &&
                formPage === 'SUBMISSIONS_RATE_DETAILS'
            )
    )
}
type FormDataError =
    | 'NOT_FOUND'
    | 'MALFORMATTED_DATA'
    | 'WRONG_SUBMISSION_STATUS'

export const StateSubmissionForm = (): React.ReactElement => {
    const { id } = useParams<{ id: string }>()
    const { pathname } = useLocation()
    const currentRoute = getRouteName(pathname)
    const { updateHeading } = usePage()
    const [formDataFromLatestRevision, setFormDataFromLatestRevision] =
        useState<DraftSubmissionType | null>(null)
    const [formDataError, setFormDataError] = useState<FormDataError | null>(
        null
    )
    const { loggedInUser } = useAuth()
    const [showPageErrorMessage, setShowPageErrorMessage] = useState<
        boolean | string
    >(false) // string is a custom error message, defaults to generic of true
    const [unlockedInfo, setUnlockedInfo] = useState<UpdateInfoType | null>(
        null
    )

    // Set up graphql calls
    const {
        data: fetchData,
        loading,
        error: fetchError,
    } = useFetchSubmission2Query({
        variables: {
            input: {
                submissionID: id,
            },
        },
    })

    const submissionAndRevisions = fetchData?.fetchSubmission2?.submission
    const [updateDraftSubmission, { error: updateError }] =
        useUpdateDraftSubmissionMutation()

    const updateDraft = async (
        input: UpdateDraftSubmissionInput
    ): Promise<DraftSubmission | undefined> => {
        setShowPageErrorMessage(false)
        try {
            const updateResult = await updateDraftSubmission({
                variables: {
                    input: input,
                },
                update(cache) {
                    cache.evict({ id: `Submission2:${id}` })
                    cache.gc()
                },
            })
            const updatedSubmission: DraftSubmission | undefined =
                updateResult?.data?.updateDraftSubmission.draftSubmission

            if (!updatedSubmission) setShowPageErrorMessage(true)

            return updatedSubmission
        } catch (serverError) {
            setShowPageErrorMessage(true)
            return undefined
        }
    }

    // When the new API is done, we'll call the new API here
    const updateDraftSubmission2 = async (
        input: DraftSubmissionType
    ): Promise<undefined | Error> => {
        // convert to GQL DraftSubmissionUpdates type

        const draft = convertDomainModelFormDataToGQLSubmission(
            input,
            statePrograms
        ) as DraftSubmission
        const updatedDraft = updatesFromSubmission(draft)
        const cleanSubmission = cleanDraftSubmission(updatedDraft)

        setShowPageErrorMessage(false)
        try {
            const updateResult = await updateDraftSubmission({
                variables: {
                    input: {
                        submissionID: input.id,
                        draftSubmissionUpdates: cleanSubmission,
                    },
                },
                update(cache) {
                    cache.evict({ id: `Submission2:${id}` })
                    cache.gc()
                },
            })
            const updatedSubmission: DraftSubmission | undefined =
                updateResult?.data?.updateDraftSubmission.draftSubmission

            if (!updatedSubmission) setShowPageErrorMessage(true)

            return undefined
        } catch (serverError) {
            setShowPageErrorMessage(true)
            return serverError
        }
    }

    // Set up side effects
    useEffect(() => {
        if (formDataFromLatestRevision) {
            const statePrograms =
                (loggedInUser &&
                    'state' in loggedInUser &&
                    loggedInUser.state.programs) ||
                []
            const name = submissionName(
                formDataFromLatestRevision,
                statePrograms
            )
            updateHeading(pathname, name)
        }
    }, [updateHeading, pathname, formDataFromLatestRevision, loggedInUser])

    useEffect(() => {
        if (submissionAndRevisions) {
            const currentRevisionPackageOrError =
                getCurrentRevisionFromSubmission2(submissionAndRevisions)

            // set form data
            if (currentRevisionPackageOrError instanceof Error) {
                setFormDataError('MALFORMATTED_DATA')
                return
            }

            const [revision, planFormData] = currentRevisionPackageOrError

            if (planFormData.status !== 'DRAFT') {
                setFormDataError('WRONG_SUBMISSION_STATUS')
                return
            }

            setFormDataFromLatestRevision(planFormData)

            // set unlock info
            if (submissionAndRevisions.status === 'UNLOCKED') {
                const unlockInfo = revision.unlockInfo

                if (unlockInfo) {
                    setUnlockedInfo({
                        updatedBy: unlockInfo.updatedBy,
                        updatedAt: unlockInfo.updatedAt,
                        updatedReason: unlockInfo.updatedReason,
                    })
                } else {
                    //Maybe could use a better error message.
                    console.error(
                        'ERROR: submission in summary has no revision with unlocked information',
                        submissionAndRevisions.revisions
                    )
                    setShowPageErrorMessage(
                        'This may be an unlocked submission that is currently being edited. Please reload the page and try again.'
                    )
                }
            }
        }
    }, [submissionAndRevisions])

    if (loading) {
        return (
            <GridContainer>
                <Loading />
            </GridContainer>
        )
    }

    if (updateError && !showPageErrorMessage) {
        setShowPageErrorMessage(true)
    }

    if (fetchError) {
        // This is a sign that we are handling the same error handling logic frontend and backend around invalid status
        let specificContent: React.ReactElement | undefined = undefined
        fetchError.graphQLErrors.forEach((err) => {
            if (err?.extensions?.code === 'WRONG_STATUS') {
                if (
                    currentRoute !== 'UNKNOWN_ROUTE' &&
                    STATE_SUBMISSION_FORM_ROUTES.includes(currentRoute)
                ) {
                    specificContent = <ErrorInvalidSubmissionStatus />
                }
            }
        })
        return specificContent ?? <GenericErrorPage />
    }
    if (
        (fetchData && formDataError === 'NOT_FOUND') ||
        (fetchData && !formDataFromLatestRevision)
    ) {
        return <Error404 />
    }

    if (formDataError === 'MALFORMATTED_DATA') {
        return <GenericErrorPage />
    }

    if (formDataError === 'NOT_FOUND' || !formDataFromLatestRevision) {
        return <Error404 />
    }

    if (formDataError === 'WRONG_SUBMISSION_STATUS') {
        return <ErrorInvalidSubmissionStatus />
    }

    // Hacky way to not have to change the individual pages yet.
    const statePrograms =
        (loggedInUser &&
            'state' in loggedInUser &&
            loggedInUser.state.programs) ||
        []
    const draft = convertDomainModelFormDataToGQLSubmission(
        formDataFromLatestRevision,
        statePrograms
    ) as DraftSubmission

    return (
        <>
            <div className={styles.stepIndicator}>
                <DynamicStepIndicator
                    formPages={activeFormPages(draft)}
                    currentFormPage={currentRoute}
                />
                <PageBannerAlerts
                    loggedInUser={loggedInUser}
                    unlockedInfo={unlockedInfo}
                    showPageErrorMessage={showPageErrorMessage}
                />
            </div>
            <StateSubmissionContainer>
                <Switch>
                    <Route path={RoutesRecord.SUBMISSIONS_TYPE}>
                        <SubmissionType
                            draftSubmission={formDataFromLatestRevision}
                            updateDraft={updateDraftSubmission2}
                        />
                    </Route>
                    <Route path={RoutesRecord.SUBMISSIONS_CONTRACT_DETAILS}>
                        <ContractDetails
                            draftSubmission={draft}
                            updateDraft={updateDraft}
                        />
                    </Route>
                    <Route path={RoutesRecord.SUBMISSIONS_RATE_DETAILS}>
                        <RateDetails
                            draftSubmission={draft}
                            updateDraft={updateDraft}
                        />
                    </Route>
                    <Route path={RoutesRecord.SUBMISSIONS_CONTACTS}>
                        <Contacts
                            draftSubmission={draft}
                            updateDraft={updateDraft}
                        />
                    </Route>
                    <Route path={RoutesRecord.SUBMISSIONS_DOCUMENTS}>
                        <Documents
                            draftSubmission={draft}
                            updateDraft={updateDraft}
                        />
                    </Route>
                    <Route path={RoutesRecord.SUBMISSIONS_REVIEW_SUBMIT}>
                        <ReviewSubmit
                            draftSubmission={draft}
                            unlocked={!!unlockedInfo}
                        />
                    </Route>
                </Switch>
            </StateSubmissionContainer>
        </>
    )
}
