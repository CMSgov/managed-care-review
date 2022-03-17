import {
    Alert, Button,
    ButtonGroup,
    GridContainer, Modal, ModalFooter, ModalHeading, ModalRef, ModalToggleButton
} from '@trussworks/react-uswds'
import React, { useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'
import {
    ContactsSummarySection, ContractDetailsSummarySection,
    RateDetailsSummarySection, SubmissionTypeSummarySection, SupportingDocumentsSummarySection
} from '../../../components/SubmissionSummarySection'
import { useAuth } from '../../../contexts/AuthContext'
import {
    DraftSubmission,
    useSubmitDraftSubmissionMutation
} from '../../../gen/gqlClient'
import { PageActionsContainer } from '../PageActions'
import styles from './ReviewSubmit.module.scss'


export const ReviewSubmit = ({
    draftSubmission,
}: {
    draftSubmission: DraftSubmission
}): React.ReactElement => {
    const [userVisibleError, setUserVisibleError] = useState<
        string | undefined
    >(undefined)
    const history = useHistory()
    const modalRef = useRef<ModalRef>(null)
    const { loggedInUser } = useAuth()

    // pull the programs off the user
    const statePrograms = loggedInUser && 'state' in loggedInUser && loggedInUser.state.programs || []

    const [submitDraftSubmission] = useSubmitDraftSubmissionMutation({
        // An alternative to messing with the cache like we do with create, just zero it out.
        update(cache, { data }) {
            if (data) {
                cache.modify({
                    id: 'ROOT_QUERY',
                    fields: {
                        indexSubmissions2(_index, { DELETE }) {
                            return DELETE
                        },
                    },
                })
            }
        },
    })

    const showError = (error: string) => {
        setUserVisibleError(error)
    }

    const handleFormSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault()

        try {
            const data = await submitDraftSubmission({
                variables: {
                    input: {
                        submissionID: draftSubmission.id,
                    },
                },
            })

            if (data.errors) {
                showError('Error attempting to submit. Please try again.')
                modalRef.current?.toggleModal(undefined, false)
            }

            if (data.data?.submitDraftSubmission) {
                history.push(`/dashboard?justSubmitted=${draftSubmission.name}`)
            } else {
                console.error('Got nothing back from submit')
                showError('Error attempting to submit. Please try again.')
                modalRef.current?.toggleModal(undefined, false)
            }
        } catch (error) {
            showError('Error attempting to submit. Please try again.')
            modalRef.current?.toggleModal(undefined, false)
        }
    }

    const isContractActionAndRateCertification =
        draftSubmission.submissionType === 'CONTRACT_AND_RATES'

    return (
        <GridContainer className={styles.reviewSectionWrapper}>
            {userVisibleError && (
                <Alert type="error" heading="Submission Error">
                    {userVisibleError}
                </Alert>
            )}

            <SubmissionTypeSummarySection
                submission={draftSubmission}
                navigateTo="type"
                statePrograms={statePrograms}
            />

            <ContractDetailsSummarySection
                submission={draftSubmission}
                navigateTo="contract-details"
            />

            {isContractActionAndRateCertification && (
                <RateDetailsSummarySection
                    submission={draftSubmission}
                    navigateTo="rate-details"
                />
            )}

            <ContactsSummarySection
                submission={draftSubmission}
                navigateTo="contacts"
            />

            <SupportingDocumentsSummarySection
                submission={draftSubmission}
                navigateTo="documents"
            />

            <PageActionsContainer
                left={
                    <Button
                        type="button"
                        onClick={() => history.push('/dashboard')}
                        unstyled
                    >
                        Save as draft
                    </Button>
                }
            >
                <Button
                    type="button"
                    outline
                    onClick={() => history.push('documents')}
                >
                    Back
                </Button>
                <ModalToggleButton
                    modalRef={modalRef}
                    className={styles.submitButton}
                    data-testid="form-submit"
                    opener
                >
                    Submit
                </ModalToggleButton>
            </PageActionsContainer>

            <Modal
                ref={modalRef}
                aria-labelledby="review-and-submit-modal-heading"
                aria-describedby="review-and-submit-modal-description"
                id="review-and-submit-modal"
            >
                <ModalHeading id="review-and-submit-modal-heading">
                    Ready to submit?
                </ModalHeading>
                <p id="review-and-submit-description">
                    Submitting this package will send it to CMS to begin their
                    review.
                </p>
                <ModalFooter>
                    <ButtonGroup className="float-right">
                        <ModalToggleButton modalRef={modalRef} closer outline>
                            Cancel
                        </ModalToggleButton>
                        <Button
                            type="button"
                            key="submitButton"
                            aria-label="Submit"
                            data-testid="modal-submit"
                            className={styles.submitButton}
                            onClick={handleFormSubmit}
                        >
                            Submit
                        </Button>
                    </ButtonGroup>
                </ModalFooter>
            </Modal>
        </GridContainer>
    )
}
