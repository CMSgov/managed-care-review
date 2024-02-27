import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    RateFormDataInput,
    UpdateInformation,
    useFetchRateQuery,
    useSubmitRateMutation,
} from '../../gen/gqlClient'
import { GridContainer } from '@trussworks/react-uswds'
import { Loading } from '../../components'
import { GenericErrorPage } from '../Errors/GenericErrorPage'
import { RateDetailsV2 } from '../StateSubmission/RateDetails/V2/RateDetailsV2'
import { RouteT, RoutesRecord } from '../../constants'
import { useAuth } from '../../contexts/AuthContext'
import { ErrorForbiddenPage } from '../Errors/ErrorForbiddenPage'
import { Error404 } from '../Errors/Error404Page'
import { PageBannerAlerts } from '../StateSubmission'

export type SubmitRateHandler = (
    rateID: string,
    formInput: RateFormDataInput,
    setIsSubmitting: (isSubmitting: boolean) => void,
    redirect: RouteT
) => void

type RouteParams = {
    id: string
}

export const RateEdit = (): React.ReactElement => {
    const navigate = useNavigate()
    const { id } = useParams<keyof RouteParams>()
    const { loggedInUser } = useAuth()
    if (!id) {
        throw new Error(
            'PROGRAMMING ERROR: id param not set in state submission form.'
        )
    }

    // API handling
    const {
        data: fetchData,
        loading: fetchLoading,
        error: fetchError,
    } = useFetchRateQuery({
        variables: {
            input: {
                rateID: id,
            },
        },
    })
    const rate = fetchData?.fetchRate.rate

    const [submitRate, { error: submitError }] = useSubmitRateMutation()
    const submitRateHandler: SubmitRateHandler = async (
        rateID,
        formInput,
        setIsSubmitting,
        redirect
    ) => {
        setIsSubmitting(true)
        try {
            await submitRate({
                variables: {
                    input: {
                        rateID: rateID,
                        formData: formInput,
                    },
                },
            })

            navigate(RoutesRecord[redirect])
        } catch (serverError) {
            setIsSubmitting(false)
        }
    }

    if (fetchLoading) {
        return (
            <GridContainer>
                <Loading />
            </GridContainer>
        )
    } else if (fetchError || !rate) {
        //error handling for a state user that tries to access rates for a different state
        if (fetchError?.graphQLErrors[0]?.extensions?.code === 'FORBIDDEN') {
            return (
                <ErrorForbiddenPage
                    errorMsg={fetchError.graphQLErrors[0].message}
                />
            )
        } else if (
            fetchError?.graphQLErrors[0]?.extensions?.code === 'NOT_FOUND'
        ) {
            return <Error404 />
        } else {
            return <GenericErrorPage />
        }
    }

    if (rate.status !== 'UNLOCKED') {
        navigate(`/rates/${id}`)
    }

    // An unlocked revision is defined by having unlockInfo on it, pull it out here if it exists
    const unlockedInfo: UpdateInformation | undefined =
        rate.revisions[0].unlockInfo || undefined

    return (
        <div data-testid="single-rate-edit">
            <PageBannerAlerts
                loggedInUser={loggedInUser}
                unlockedInfo={unlockedInfo}
                showPageErrorMessage={Boolean(fetchError || submitError)}
            />
            <RateDetailsV2
                type="SINGLE"
                rates={[rate]}
                submitRate={submitRateHandler}
            />
        </div>
    )
}
