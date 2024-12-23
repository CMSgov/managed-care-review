import React, { useEffect, useState } from 'react'
import styles from './RateWithdraw.module.scss'
import { ActionButton, Breadcrumbs, PoliteErrorMessage } from '../../components'
import { RoutesRecord } from '@mc-review/constants'
import { useNavigate, useParams } from 'react-router-dom'
import { useFetchRateQuery } from '../../gen/gqlClient'
import { ErrorOrLoadingPage } from '../StateSubmission'
import { handleAndReturnErrorState } from '../StateSubmission/ErrorOrLoadingPage'
import {
    ButtonGroup,
    Form,
    FormGroup,
    Label,
    Textarea,
} from '@trussworks/react-uswds'
import * as Yup from 'yup'
import { PageActionsContainer } from '../StateSubmission/PageActions'
import { Formik, FormikErrors } from 'formik'
import { usePage } from '../../contexts/PageContext'
import { GenericErrorPage } from '../Errors/GenericErrorPage'

type RateWithdrawValues = {
    rateWithdrawReason: string
}

const RateWithdrawSchema = Yup.object().shape({
    rateWithdrawReason: Yup.string().required(
        'You must provide a reason for withdrawing this rate.'
    ),
})

type FormError =
    FormikErrors<RateWithdrawValues>[keyof FormikErrors<RateWithdrawValues>]

export const RateWithdraw = () => {
    const { id } = useParams() as { id: string }
    const { updateHeading } = usePage()
    const navigate = useNavigate()
    const [rateName, setRateName] = useState<string | undefined>(undefined)
    const [shouldValidate, setShouldValidate] = React.useState(false)

    const showFieldErrors = (error?: FormError): boolean | undefined =>
        shouldValidate && Boolean(error)

    const formInitialValues: RateWithdrawValues = {
        rateWithdrawReason: '',
    }

    const { data, loading, error } = useFetchRateQuery({
        variables: {
            input: {
                rateID: id,
            },
        },
    })

    const rate = data?.fetchRate.rate

    useEffect(() => {
        updateHeading({ customHeading: rateName })
    }, [rateName, updateHeading])

    if (loading) {
        return <ErrorOrLoadingPage state="LOADING" />
    } else if (error) {
        return <ErrorOrLoadingPage state={handleAndReturnErrorState(error)} />
    } else if (!rate || !rate.packageSubmissions) {
        return <GenericErrorPage />
    }
    const rateRev = rate?.packageSubmissions?.[0]?.rateRevision
    const rateCertificationName =
        rateRev?.formData.rateCertificationName ?? undefined

    if (rateCertificationName && rateName !== rateCertificationName) {
        setRateName(rateCertificationName)
    }

    return (
        <div className={styles.rateWithdrawContainer}>
            <Breadcrumbs
                className="usa-breadcrumb--wrap"
                items={[
                    {
                        link: RoutesRecord.DASHBOARD_RATES,
                        text: 'Dashboard',
                    },
                    { link: `/rates/${id}`, text: rateCertificationName || '' },
                    {
                        text: 'Withdraw rate',
                        link: RoutesRecord.RATE_WITHDRAW,
                    },
                ]}
            />
            <Formik
                initialValues={formInitialValues}
                onSubmit={() => undefined}
                validationSchema={RateWithdrawSchema}
            >
                {({ handleSubmit, handleChange, errors, values }) => (
                    <Form
                        id="RateWithdrawForm"
                        className={styles.formContainer}
                        aria-label="Withdraw rate review"
                        aria-describedby="form-guidance"
                        onSubmit={(e) => {
                            setShouldValidate(true)
                            return handleSubmit(e)
                        }}
                    >
                        <fieldset className="usa-fieldset">
                            <h2>Withdraw a rate</h2>
                            <FormGroup
                                error={showFieldErrors(
                                    errors.rateWithdrawReason
                                )}
                                className="margin-top-0"
                            >
                                <Label
                                    htmlFor="rateWithdrawReason"
                                    className="margin-bottom-0 text-bold"
                                >
                                    Reason for withdrawing
                                </Label>
                                <p className="margin-bottom-0 margin-top-05 usa-hint">
                                    Required
                                </p>
                                <p className="margin-bottom-0 margin-top-05 usa-hint">
                                    Provide a reason for withdrawing the rate
                                    review.
                                </p>
                                {showFieldErrors(errors.rateWithdrawReason) && (
                                    <PoliteErrorMessage formFieldLabel="Reason for withdrawing">
                                        {errors.rateWithdrawReason}
                                    </PoliteErrorMessage>
                                )}
                                <Textarea
                                    name="rateWithdrawReason"
                                    id="rateWithdrawReason"
                                    data-testid="rateWithdrawReason"
                                    aria-labelledby="rateWithdrawReason"
                                    aria-required
                                    error={!!errors.rateWithdrawReason}
                                    onChange={handleChange}
                                    defaultValue={values.rateWithdrawReason}
                                ></Textarea>
                            </FormGroup>
                        </fieldset>
                        <PageActionsContainer>
                            <ButtonGroup type="default">
                                <ActionButton
                                    type="button"
                                    variant="outline"
                                    data-testid="page-actions-left-secondary"
                                    parent_component_type="page body"
                                    link_url={`/rates/${id}`}
                                    onClick={() => navigate(`/rates/${id}`)}
                                >
                                    Cancel
                                </ActionButton>
                                <ActionButton
                                    type="submit"
                                    variant="default"
                                    disabled={Boolean(
                                        errors.rateWithdrawReason
                                    )}
                                    data-testid="page-actions-right-primary"
                                    parent_component_type="page body"
                                    link_url={`/submissions/${id}`}
                                    animationTimeout={1000}
                                >
                                    Withdraw rate
                                </ActionButton>
                            </ButtonGroup>
                        </PageActionsContainer>
                    </Form>
                )}
            </Formik>
        </div>
    )
}