import { GraphQLErrors } from '@apollo/client/errors'
import {
    Alert,
    GridContainer,
    Link,
    CharacterCount,
    ModalRef,
    ModalToggleButton,
    FormGroup,
} from '@trussworks/react-uswds'
import * as Yup from 'yup'
import { useFormik } from 'formik'
import React, { useEffect, useState, useRef } from 'react'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import sprite from 'uswds/src/img/sprite.svg'
import {
    submissionName,
    SubmissionUnionType,
    UpdateInfoType,
} from '../../common-code/domain-models'
import { makeDateTable } from '../../common-code/data-helpers/makeDocumentDateLookupTable'
import { base64ToDomain } from '../../common-code/proto/stateSubmission'
import { Loading } from '../../components/Loading'
import {
    ContactsSummarySection,
    ContractDetailsSummarySection,
    RateDetailsSummarySection,
    SubmissionTypeSummarySection,
    SupportingDocumentsSummarySection,
} from '../../components/SubmissionSummarySection'
import {
    SubmissionUnlockedBanner,
    Modal,
    PoliteErrorMessage,
    SubmissionUpdatedBanner,
} from '../../components'
import { useAuth } from '../../contexts/AuthContext'
import { usePage } from '../../contexts/PageContext'
import {
    Submission2,
    UnlockStateSubmissionMutationFn,
    useFetchSubmission2Query,
    useUnlockStateSubmissionMutation,
    Submission2Status,
} from '../../gen/gqlClient'
import {
    convertDomainModelFormDataToGQLSubmission,
    isGraphQLErrors,
} from '../../gqlHelpers'
import { Error404 } from '../Errors/Error404'
import { GenericErrorPage } from '../Errors/GenericErrorPage'
import styles from './SubmissionSummary.module.scss'
import { ChangeHistory } from '../../components/ChangeHistory/ChangeHistory'

export type DocumentDateLookupTable = {
    [key: string]: string
}

function UnlockModalButton({
    disabled,
    modalRef,
}: {
    disabled: boolean
    modalRef: React.RefObject<ModalRef>
}) {
    return (
        <ModalToggleButton
            modalRef={modalRef}
            className={styles.submitButton}
            data-testid="form-submit"
            disabled={disabled}
            outline
            opener
        >
            Unlock submission
        </ModalToggleButton>
    )
}

// This wrapper gets us some reasonable errors out of our unlock call. This would be a good candidate
// for a more general and generic function so that we can get more sensible errors out of all of the
// generated mutations.
async function unlockMutationWrapper(
    unlockStateSubmission: UnlockStateSubmissionMutationFn,
    id: string,
    unlockedReason: string
): Promise<Submission2 | GraphQLErrors | Error> {
    try {
        const result = await unlockStateSubmission({
            variables: {
                input: {
                    submissionID: id,
                    unlockedReason,
                },
            },
        })

        if (result.errors) {
            return result.errors
        }

        if (result.data?.unlockStateSubmission.submission) {
            return result.data?.unlockStateSubmission.submission
        } else {
            return new Error('No errors, and no unlock result.')
        }
    } catch (error) {
        // this can be an errors object
        if ('graphQLErrors' in error) {
            return error.graphQLErrors
        }
        return error
    }
}

export const SubmissionSummary = (): React.ReactElement => {
    // Page level state
    const { id } = useParams<{ id: string }>()
    const { pathname } = useLocation()
    const { loggedInUser } = useAuth()
    const { updateHeading } = usePage()
    const [pageLevelAlert, setPageLevelAlert] = useState<string | undefined>(
        undefined
    )

    // Api fetched data state
    const [packageData, setPackageData] = useState<
        SubmissionUnionType | undefined
    >(undefined)
    const [updateInfo, setUpdateInfo] = useState<UpdateInfoType | null>(null)
    const [submissionStatus, setSubmissionStatus] =
        useState<Submission2Status | null>(null)

    // Unlock modal state
    const [focusErrorsInModal, setFocusErrorsInModal] = useState(true)
    const modalRef = useRef<ModalRef>(null)
    const modalFormInitialValues = {
        unlockReason: '',
    }

    // document date lookup state
    const [documentDates, setDocumentDates] = useState<
        DocumentDateLookupTable | undefined
    >({})

    const formik = useFormik({
        initialValues: modalFormInitialValues,
        validationSchema: Yup.object().shape({
            unlockReason: Yup.string()
                .max(300, 'Reason for unlocking submission is too long')
                .defined('Reason for unlocking submission is required'),
        }),
        onSubmit: (values) => onModalSubmit(values),
    })

    const { loading, error, data } = useFetchSubmission2Query({
        variables: {
            input: {
                submissionID: id,
            },
        },
    })

    const [unlockStateSubmission] = useUnlockStateSubmissionMutation()
    const submissionAndRevisions = data?.fetchSubmission2.submission

    const isCMSUser = loggedInUser?.role === 'CMS_USER'

    // Pull out the correct revision form api request, display errors for bad dad
    useEffect(() => {
        if (submissionAndRevisions) {
            const lookupTable = makeDateTable(submissionAndRevisions)
            setDocumentDates(lookupTable)
            // We ignore revisions currently being edited.
            // The summary page should only ever called on a package that has been submitted once
            const currentRevision = submissionAndRevisions.revisions.find(
                (rev) => {
                    // we want the most recent revision that has submission info.
                    return rev.revision.submitInfo
                }
            )

            if (!currentRevision) {
                console.error(
                    'ERROR: submission in summary has no submitted revision',
                    submissionAndRevisions.revisions
                )
                setPageLevelAlert(
                    'Error fetching the submission. Please try again.'
                )
                return
            }

            const submissionResult = base64ToDomain(
                currentRevision.revision.submissionData
            )
            if (submissionResult instanceof Error) {
                console.error(
                    'ERROR: got a proto decoding error',
                    submissionResult
                )
                setPageLevelAlert(
                    'Error fetching the submission. Please try again.'
                )
                return
            }

            const submissionStatus = submissionAndRevisions.status
            if (
                submissionStatus === 'UNLOCKED' ||
                submissionStatus === 'RESUBMITTED'
            ) {
                const updateInfo =
                    submissionStatus === 'UNLOCKED'
                        ? submissionAndRevisions.revisions.find(
                              (rev) => rev.revision.unlockInfo
                          )?.revision.unlockInfo
                        : currentRevision.revision.submitInfo

                if (updateInfo) {
                    setSubmissionStatus(submissionStatus)
                    setUpdateInfo({
                        ...updateInfo,
                    })
                } else {
                    const info =
                        submissionStatus === 'UNLOCKED'
                            ? 'unlock information'
                            : 'resubmission information'
                    console.error(
                        `ERROR: Encountered error when fetching ${info}`,
                        submissionAndRevisions.revisions
                    )
                    setPageLevelAlert(
                        `Error fetching ${info}. Please try again.`
                    )
                }
            }

            setPackageData(submissionResult)
        }
    }, [submissionAndRevisions, setPackageData, setPageLevelAlert])

    // Update header with submission name
    useEffect(() => {
        const subWithRevisions = data?.fetchSubmission2.submission
        if (packageData && subWithRevisions) {
            const programs = subWithRevisions.state.programs
            updateHeading(pathname, submissionName(packageData, programs))
        }
    }, [updateHeading, pathname, packageData, data])

    // Focus unlockReason field in the unlock modal on submit click when errors exist
    useEffect(() => {
        if (focusErrorsInModal && formik.errors.unlockReason) {
            const fieldElement: HTMLElement | null = document.querySelector(
                `[name="unlockReason"]`
            )

            if (fieldElement) {
                fieldElement.focus()
                setFocusErrorsInModal(false)
            } else {
                console.log('Attempting to focus element that does not exist')
            }
        }
    }, [focusErrorsInModal, formik.errors])

    if (loading || !submissionAndRevisions || !packageData) {
        return (
            <GridContainer>
                <Loading />
            </GridContainer>
        )
    }

    if (data && !submissionAndRevisions) return <Error404 /> // api request resolves but are no revisions likely because invalid submission is queried. This should be "Not Found"
    if (error || !packageData || !submissionAndRevisions)
        return <GenericErrorPage /> // api failure or protobuf decode failure

    const onModalSubmit = async (values: typeof modalFormInitialValues) => {
        const { unlockReason } = values
        await onUnlock(unlockReason)
    }

    const onUnlock = async (unlockReason: string) => {
        const result = await unlockMutationWrapper(
            unlockStateSubmission,
            submissionAndRevisions.id,
            unlockReason
        )

        if (result instanceof Error) {
            console.error(
                'ERROR: got an Apollo Client Error attempting to unlock',
                result
            )
            setPageLevelAlert('Error attempting to unlock. Please try again.')
            modalRef.current?.toggleModal(undefined, false)
        } else if (isGraphQLErrors(result)) {
            console.error('ERROR: got a GraphQL error response', result)
            if (result[0].extensions.code === 'BAD_USER_INPUT') {
                setPageLevelAlert(
                    'Submission is already unlocked. Please refresh and try again.'
                )
            } else {
                setPageLevelAlert(
                    'Error attempting to unlock. Please try again.'
                )
            }
            modalRef.current?.toggleModal(undefined, false)
        } else {
            const unlockedSub: Submission2 = result
            modalRef.current?.toggleModal(undefined, false)
            console.log('Submission Unlocked', unlockedSub)
        }
    }

    const statePrograms = submissionAndRevisions.state.programs

    // temporary kludge while the display data is expecting the wrong format.
    // This is turning our domain model into the GraphQL model which is what
    // all our frontend stuff expects right now.
    const submission = convertDomainModelFormDataToGQLSubmission(
        packageData,
        statePrograms
    )

    const disableUnlockButton = ['DRAFT', 'UNLOCKED'].includes(
        submissionAndRevisions.status
    )

    const isContractActionAndRateCertification =
        submission.submissionType === 'CONTRACT_AND_RATES'

    return (
        <div className={styles.background}>
            <GridContainer
                data-testid="submission-summary"
                className={styles.container}
            >
                {pageLevelAlert && (
                    <Alert
                        type="error"
                        heading="Unlock Error"
                        className={styles.banner}
                    >
                        {pageLevelAlert}
                    </Alert>
                )}

                {submissionStatus === 'UNLOCKED' && updateInfo && (
                    <SubmissionUnlockedBanner
                        userType={
                            loggedInUser?.role === 'CMS_USER'
                                ? 'CMS_USER'
                                : 'STATE_USER'
                        }
                        unlockedBy={updateInfo.updatedBy}
                        unlockedOn={updateInfo.updatedAt}
                        reason={updateInfo.updatedReason}
                        className={styles.banner}
                    />
                )}

                {submissionStatus === 'RESUBMITTED' && updateInfo && (
                    <SubmissionUpdatedBanner
                        submittedBy={updateInfo.updatedBy}
                        updatedOn={updateInfo.updatedAt}
                        changesMade={updateInfo.updatedReason}
                        className={styles.banner}
                    />
                )}

                {loggedInUser?.__typename === 'StateUser' ? (
                    <Link
                        asCustom={NavLink}
                        variant="unstyled"
                        to={{
                            pathname: '/dashboard',
                        }}
                    >
                        <svg
                            className="usa-icon"
                            aria-hidden="true"
                            focusable="false"
                            role="img"
                        >
                            <use xlinkHref={`${sprite}#arrow_back`}></use>
                        </svg>
                        <span>&nbsp;Back to state dashboard</span>
                    </Link>
                ) : null}

                <SubmissionTypeSummarySection
                    submission={submission}
                    headerChildComponent={
                        isCMSUser ? (
                            <UnlockModalButton
                                modalRef={modalRef}
                                disabled={disableUnlockButton}
                            />
                        ) : undefined
                    }
                    statePrograms={statePrograms}
                />
                <ContractDetailsSummarySection
                    submission={submission}
                    documentDateLookupTable={documentDates}
                    isCMSUser={isCMSUser}
                />

                {isContractActionAndRateCertification && (
                    <RateDetailsSummarySection
                        submission={submission}
                        documentDateLookupTable={documentDates}
                        isCMSUser={isCMSUser}
                    />
                )}

                <ContactsSummarySection submission={submission} />

                <SupportingDocumentsSummarySection submission={submission} />

                <ChangeHistory submission={submissionAndRevisions} />

                <Modal
                    modalHeading="Reason for unlocking submission"
                    id="unlockReason"
                    onSubmit={() => {
                        setFocusErrorsInModal(true)
                        formik.handleSubmit()
                    }}
                    modalRef={modalRef}
                >
                    <form>
                        <FormGroup error={Boolean(formik.errors.unlockReason)}>
                            {formik.errors.unlockReason && (
                                <PoliteErrorMessage role="alert">
                                    {formik.errors.unlockReason}
                                </PoliteErrorMessage>
                            )}
                            <span id="unlockReason-hint" role="note">
                                Provide reason for unlocking
                            </span>

                            <CharacterCount
                                id="unlockReasonCharacterCount"
                                name="unlockReason"
                                maxLength={300}
                                isTextArea
                                data-testid="unlockReason"
                                aria-labelledby="unlockReason-hint"
                                className={styles.unlockReasonTextarea}
                                aria-required
                                error={!!formik.errors.unlockReason}
                                onChange={formik.handleChange}
                                defaultValue={formik.values.unlockReason}
                            />
                        </FormGroup>
                    </form>
                </Modal>
            </GridContainer>
        </div>
    )
}

export type SectionHeaderProps = {
    header: string
    submissionName?: boolean
    href: string
}
