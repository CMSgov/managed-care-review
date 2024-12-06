import {
    Grid,
    GridContainer,
    Link,
    ModalRef,
    FormGroup,
    DatePicker,
    Label,
} from '@trussworks/react-uswds'
import { formatUserInputDate } from '../../formHelpers'
import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { ContractDetailsSummarySection } from '../StateSubmission/ReviewSubmit/ContractDetailsSummarySection'
import { ContactsSummarySection } from '../StateSubmission/ReviewSubmit/ContactsSummarySection'
import { RateDetailsSummarySection } from '../StateSubmission/ReviewSubmit/RateDetailsSummarySection'
import { SubmissionTypeSummarySection } from '../StateSubmission/ReviewSubmit/SubmissionTypeSummarySection'
import {
    SubmissionUnlockedBanner,
    SubmissionUpdatedBanner,
    DocumentWarningBanner,
    LinkWithLogging,
    PoliteErrorMessage,
} from '../../components'
import { useTealium } from '../../hooks'
import { Formik, FormikErrors } from 'formik'
import { GenericApiErrorProps } from '../../components/Banner/GenericApiErrorBanner/GenericApiErrorBanner'
import { Loading } from '../../components'
import { usePage } from '../../contexts/PageContext'
import { recordJSException } from '../../otelHelpers'
import {
    useFetchContractQuery,
    UpdateInformation,
    useApproveContractMutation,
} from '../../gen/gqlClient'
import { ErrorForbiddenPage } from '../Errors/ErrorForbiddenPage'
import { Error404 } from '../Errors/Error404Page'
import { GenericErrorPage } from '../Errors/GenericErrorPage'
import styles from './SubmissionSummary.module.scss'
import { ChangeHistory } from '../../components/ChangeHistory'
import {
    ModalOpenButton,
    UnlockSubmitModal,
    Modal,
} from '../../components/Modal'
import { RoutesRecord } from '../../constants'
import { useRouteParams } from '../../hooks'
import { getVisibleLatestContractFormData } from '../../gqlHelpers/contractsAndRates'
import { generatePath, Navigate } from 'react-router-dom'
import { hasCMSUserPermissions } from '../../gqlHelpers'
import { useLDClient } from 'launchdarkly-react-client-sdk'
import { featureFlags } from '../../common-code/featureFlags'
import { SubmissionApprovedBanner } from '../../components/Banner'
// import { SubmissionSummarySchema } from './SubmissionSummarySchema'
import * as Yup from 'yup'

export interface SubmissionSummaryFormValues {
    dateApprovalReleasedToState: string
}
type FormError =
    FormikErrors<SubmissionSummaryFormValues>[keyof FormikErrors<SubmissionSummaryFormValues>]

const SubmissionSummarySchema = Yup.object().shape({
    dateApprovalReleasedToState: Yup.string().required(
        'You must select a date'
    ),
})
export const SubmissionSummary = (): React.ReactElement => {
    // Page level state
    const { updateHeading } = usePage()
    const modalRef = useRef<ModalRef>(null)
    const approveModalRef = useRef<ModalRef>(null)
    const [documentError, setDocumentError] = useState(false)
    const { loggedInUser } = useAuth()
    const { id } = useRouteParams()
    const [approveContract] = useApproveContractMutation()
    const [modalAlert, setModalAlert] = useState<
        GenericApiErrorProps | undefined
    >(undefined)
    const [shouldValidate, setShouldValidate] = useState(false)
    const showFieldErrors = (error?: FormError) =>
    shouldValidate && Boolean(error)
    const { logFormSubmitEvent } = useTealium()
    const hasCMSPermissions = hasCMSUserPermissions(loggedInUser)
    const isStateUser = loggedInUser?.role === 'STATE_USER'
    const isHelpDeskUser = loggedInUser?.role === 'HELPDESK_USER'

    const [isSubmitting, setIsSubmitting] = useState(false) // mock same behavior as formik isSubmitting

    const ldClient = useLDClient()

    const submissionApprovalFlag = ldClient?.variation(
        featureFlags.SUBMISSION_APPROVALS.flag,
        featureFlags.SUBMISSION_APPROVALS.defaultValue
    )

    // API requests
    const {
        data: fetchContractData,
        loading: fetchContractLoading,
        error: fetchContractError,
    } = useFetchContractQuery({
        variables: {
            input: {
                contractID: id ?? 'unknown-contract',
            },
        },
        fetchPolicy: 'network-only',
    })
    const contract = fetchContractData?.fetchContract.contract
    const name =
        contract && contract?.packageSubmissions.length > 0
            ? contract.packageSubmissions[0].contractRevision.contractName
            : ''
    useEffect(() => {
        updateHeading({
            customHeading: name,
        })
    }, [name, updateHeading])
    if (fetchContractLoading) {
        return (
            <GridContainer>
                <Loading />
            </GridContainer>
        )
    } else if (fetchContractError) {
        //error handling for a state user that tries to access rates for a different state
        if (
            fetchContractError?.graphQLErrors[0]?.extensions?.code ===
            'FORBIDDEN'
        ) {
            return (
                <ErrorForbiddenPage
                    errorMsg={fetchContractError.graphQLErrors[0].message}
                />
            )
        } else if (
            fetchContractError?.graphQLErrors[0]?.extensions?.code ===
            'NOT_FOUND'
        ) {
            return <Error404 />
        } else {
            return <GenericErrorPage />
        }
    } else if (!contract) {
        return <GenericErrorPage />
    }

    const submissionStatus = contract.status
    const isSubmitted =
        submissionStatus === 'SUBMITTED' || submissionStatus === 'RESUBMITTED'
    const statePrograms = contract.state.programs

    const approvalModalInitialValues = {
        dateApprovalReleasedToState: '',
    }

    if (!isSubmitted && isStateUser) {
        if (submissionStatus === 'DRAFT') {
            return (
                <Navigate
                    to={generatePath(RoutesRecord.SUBMISSIONS_TYPE, { id })}
                />
            )
        } else {
            return (
                <Navigate
                    to={generatePath(RoutesRecord.SUBMISSIONS_REVIEW_SUBMIT, {
                        id,
                    })}
                />
            )
        }
    }

    const contractFormData = getVisibleLatestContractFormData(
        contract,
        isStateUser
    )
    if (
        !contractFormData ||
        !statePrograms ||
        contract.packageSubmissions.length === 0
    ) {
        console.error(
            'missing fundamental contract data inside submission summary'
        )
        return <GenericErrorPage />
    }

    // Get the correct update info depending on the submission status
    let updateInfo: UpdateInformation | undefined = undefined
    if (submissionStatus === 'UNLOCKED' || submissionStatus === 'RESUBMITTED') {
        updateInfo =
            (submissionStatus === 'UNLOCKED'
                ? contract.draftRevision?.unlockInfo
                : contract.packageSubmissions[0].contractRevision.submitInfo) ||
            undefined
    }

    const isContractActionAndRateCertification =
        contractFormData?.submissionType === 'CONTRACT_AND_RATES'

    const handleDocumentDownloadError = (error: boolean) =>
        setDocumentError(error)

    const editOrAddMCCRSID = contract.mccrsID
        ? 'Edit MC-CRS number'
        : 'Add MC-CRS record number'
    const explainMissingData = (isHelpDeskUser || isStateUser) && !isSubmitted

    const latestContractAction = contract.reviewStatusActions?.[0]

    // Only show for CMS_USER or CMS_APPROVER_USER users
    // and if the submission isn't approved
    const showSubmissionApproval =
        submissionApprovalFlag &&
        hasCMSPermissions &&
        contract.reviewStatus !== 'APPROVED'
    const showApprovalBanner =
        submissionApprovalFlag &&
        contract.reviewStatus === 'APPROVED' &&
        latestContractAction

    const approveContractAction = async (actionModalInput?: string) => {
        logFormSubmitEvent({
            heading: 'Approve submission',
            form_name: 'Approve submission',
            event_name: 'form_field_submit',
            link_type: 'link_other',
        })
        setShouldValidate(true)

        if (actionModalInput !== '') {
            setIsSubmitting(true)
            try {
                await approveContract({
                    variables: {
                        input: {
                            contractID: contract.id,
                            dateApprovalReleasedToState: actionModalInput,
                        },
                    },
                })
                approveModalRef.current?.toggleModal(undefined, false)
            }catch (err) {
                recordJSException(
                    `SubmissionSummary: Apollo error reported. Error message: Failed to create form data ${err}`
                )
                setModalAlert({
                    heading: 'Approve submission error',
                    message: err.message,
                    // When we have generic/unknown errors override any suggestions and display the fallback "please refresh text"
                    validationFail: false,
                })
            }

        }
    }

    const renderStatusAlerts = () => {
        if (showApprovalBanner) {
            return (
                <SubmissionApprovedBanner
                    updatedBy={latestContractAction.updatedBy}
                    updatedAt={latestContractAction.updatedAt}
                    dateReleasedToState={
                        latestContractAction.dateApprovalReleasedToState
                    }
                />
            )
        }

        if (submissionStatus === 'UNLOCKED' && updateInfo) {
            return (
                <SubmissionUnlockedBanner
                    className={styles.banner}
                    loggedInUser={loggedInUser}
                    unlockedInfo={updateInfo}
                />
            )
        }

        if (submissionStatus === 'RESUBMITTED' && updateInfo) {
            return (
                <SubmissionUpdatedBanner
                    className={styles.banner}
                    updateInfo={updateInfo}
                />
            )
        }
    }

    return (
        <div className={styles.background}>
            <GridContainer
                data-testid="submission-summary"
                className={styles.container}
            >
                {renderStatusAlerts()}

                {documentError && (
                    <DocumentWarningBanner className={styles.banner} />
                )}

                {showSubmissionApproval && (
                    <>
                        <Grid
                            className={styles.approveWithdrawButtonContainer}
                            row
                        >
                            <ModalOpenButton
                                id="approval-modal-toggle-button"
                                modalRef={approveModalRef}
                                disabled={!isSubmitted}
                                data-testid="approval-modal-toggle-button"
                            >
                                Release to state
                            </ModalOpenButton>
                        </Grid>
                        <Formik
                            initialValues={{
                                dateApprovalReleasedToState: ''
                            }}
                            onSubmit={(values) => {
                                return approveContractAction(
                                    values.dateApprovalReleasedToState
                                )
                            }}
                            validationSchema={SubmissionSummarySchema}
                        >
                            {({ values, setFieldValue, errors }) => (
                                <>
                                    <Modal
                                        id="approvalModal"
                                        modalRef={approveModalRef}
                                        onSubmit={() => {
                                            return approveContractAction(
                                                values.dateApprovalReleasedToState
                                            )
                                        }}
                                        modalHeading="Are you sure you want to mark this submission as Released to the state?"
                                        onSubmitText="Release to state"
                                        submitButtonProps={{
                                            variant: 'default',
                                        }}
                                        className={styles.approvalModal}
                                        modalAlert={modalAlert}
                                        isSubmitting={isSubmitting}
                                    >
                                        <form>
                                            <p>
                                                Once you select Released to
                                                state, the status will change
                                                from Submitted to Approved on
                                                the dashboard. This submission
                                                should only be marked as
                                                released after the approval
                                                letter has been released to the
                                                state.
                                            </p>
                                            <Label htmlFor="dateReleasedToState" className="margin-bottom-0 text-bold">
                                                Date released to state
                                            </Label>
                                            <p className="margin-top-0 margin-bottom-0 usa-hint">
                                                Required
                                            </p>
                                            <p className="margin-top-0 margin-bottom-0 usa-hint">
                                                mm/dd/yyyy
                                            </p>
                                            <FormGroup error={true}>
                                                {/* {showFieldErrors(
                                                errors.dateApprovalReleasedToState
                                            ) && ( */}
                                                <span>kkkk
                                                    {errors.dateApprovalReleasedToState}
                                                </span>
                                            
                                                <DatePicker
                                                    aria-required
                                                    aria-describedby="dateApprovalReleasedToState"
                                                    id="dateApprovalReleasedToState"
                                                    name="dateApprovalReleasedToState"
                                                    onChange={(val) =>
                                                        setFieldValue(
                                                            'dateApprovalReleasedToState',
                                                            formatUserInputDate(
                                                                val
                                                            )
                                                        )
                                                    }
                                                />
                                            </FormGroup>
                                        </form>
                                    </Modal>
                                </>
                            )}
                        </Formik>
                    </>
                )}

                <SubmissionTypeSummarySection
                    subHeaderComponent={
                        hasCMSPermissions ? (
                            <div className={styles.subHeader}>
                                {contract.mccrsID && (
                                    <span className={styles.mccrsID}>
                                        MC-CRS record number:
                                        <Link
                                            href={`https://mccrs.internal.cms.gov/Home/Index/${contract.mccrsID}`}
                                            aria-label="MC-CRS system login"
                                        >
                                            {contract.mccrsID}
                                        </Link>
                                    </span>
                                )}
                                <LinkWithLogging
                                    href={`/submissions/${contract.id}/mccrs-record-number`}
                                    className={
                                        contract.mccrsID ? styles.editLink : ''
                                    }
                                    aria-label={editOrAddMCCRSID}
                                >
                                    {editOrAddMCCRSID}
                                </LinkWithLogging>
                            </div>
                        ) : undefined
                    }
                    contract={contract}
                    submissionName={name}
                    headerChildComponent={
                        hasCMSPermissions && !showApprovalBanner ? (
                            <ModalOpenButton
                                modalRef={modalRef}
                                disabled={
                                    ['DRAFT', 'UNLOCKED'].includes(
                                        contract.status
                                    ) || contract.reviewStatus === 'APPROVED'
                                }
                                className={styles.submitButton}
                                id="form-submit"
                                outline={showSubmissionApproval}
                            >
                                Unlock submission
                            </ModalOpenButton>
                        ) : undefined
                    }
                    statePrograms={statePrograms}
                    initiallySubmittedAt={contract.initiallySubmittedAt}
                    isStateUser={isStateUser}
                    explainMissingData={explainMissingData}
                />

                <ContractDetailsSummarySection
                    contract={contract}
                    isCMSUser={hasCMSPermissions}
                    isStateUser={isStateUser}
                    submissionName={name}
                    onDocumentError={handleDocumentDownloadError}
                    explainMissingData={explainMissingData}
                />

                {isContractActionAndRateCertification && (
                    <RateDetailsSummarySection
                        contract={contract}
                        submissionName={name}
                        isCMSUser={hasCMSPermissions}
                        statePrograms={statePrograms}
                        onDocumentError={handleDocumentDownloadError}
                        explainMissingData={explainMissingData}
                    />
                )}

                <ContactsSummarySection
                    contract={contract}
                    isStateUser={isStateUser}
                    explainMissingData={explainMissingData}
                />

                <ChangeHistory contract={contract} />

                <UnlockSubmitModal
                    modalRef={modalRef}
                    modalType="UNLOCK_CONTRACT"
                    submissionData={contract}
                />
            </GridContainer>
        </div>
    )
}

export type SectionHeaderProps = {
    header: string
    submissionName?: boolean
    href: string
}
