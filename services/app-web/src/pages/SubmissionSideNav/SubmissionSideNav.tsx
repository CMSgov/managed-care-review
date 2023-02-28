import React from 'react'
import { Link, SideNav, GridContainer } from '@trussworks/react-uswds'
import { NavLink } from 'react-router-dom'
import styles from './SubmissionSideNav.module.scss'
import { useParams, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import sprite from 'uswds/src/img/sprite.svg'
import { RouteT } from '../../constants/routes'
import { getRouteName } from '../../routeHelpers'
import { useFetchHealthPlanPackageWithQuestionsWrapper } from '../../gqlHelpers'
import { Loading } from '../../components'
import { ApolloError } from '@apollo/client'
import { handleApolloError } from '../../gqlHelpers/apolloErrors'
import { recordJSException } from '../../otelHelpers'
import { GenericErrorPage } from '../Errors/GenericErrorPage'
import { Error404 } from '../Errors/Error404Page'
import {
    HealthPlanPackage,
    HealthPlanRevision,
    User,
} from '../../gen/gqlClient'
import { HealthPlanFormDataType } from '../../common-code/healthPlanFormDataType'
import { useLDClient } from 'launchdarkly-react-client-sdk'
import { featureFlags } from '../../common-code/featureFlags'
import { DocumentDateLookupTable } from '../SubmissionSummary/SubmissionSummary'

export type SideNavOutletContextType = {
    pkg: HealthPlanPackage
    currentRevision: HealthPlanRevision
    packageData: HealthPlanFormDataType
    documentDates: DocumentDateLookupTable
    user: User
}

export const SubmissionSideNav = () => {
    const { id } = useParams<{ id: string }>()
    if (!id) {
        throw new Error(
            'PROGRAMMING ERROR: id param not set in state submission form.'
        )
    }

    const { loggedInUser } = useAuth()
    const { pathname } = useLocation()
    const navigate = useNavigate()
    const ldClient = useLDClient()

    const showQuestionsAnswers = ldClient?.variation(
        featureFlags.CMS_QUESTIONS.flag,
        featureFlags.CMS_QUESTIONS.defaultValue
    )

    const isSelectedLink = (route: RouteT): string => {
        return getRouteName(pathname) === route ? 'usa-current' : ''
    }

    const { result: fetchResult } =
        useFetchHealthPlanPackageWithQuestionsWrapper(id)
    if (fetchResult.status === 'LOADING') {
        return (
            <GridContainer>
                <Loading />
            </GridContainer>
        )
    }

    if (fetchResult.status === 'ERROR') {
        const err = fetchResult.error
        console.error('Error from API fetch', fetchResult.error)
        if (err instanceof ApolloError) {
            handleApolloError(err, true)
        } else {
            recordJSException(err)
        }
        return <GenericErrorPage /> // api failure or protobuf decode failure
    }

    const { data, formDatas, documentDates } = fetchResult
    const pkg = data.fetchHealthPlanPackage.pkg

    // Display generic error page if getting logged in user returns undefined.
    if (!loggedInUser) {
        return <GenericErrorPage />
    }

    // fetchHPP returns null if no package is found with the given ID
    if (!pkg) {
        return <Error404 />
    }

    const submissionStatus = pkg.status

    const isCMSUser = loggedInUser.role === 'CMS_USER'

    // CMS Users can't see DRAFT, it's an error
    if (submissionStatus === 'DRAFT' && isCMSUser) {
        return <GenericErrorPage />
    }

    // State users should not see the submission summary page for DRAFT or UNLOCKED, it should redirect them to the edit flow.
    if (
        !isCMSUser &&
        (submissionStatus === 'DRAFT' || submissionStatus === 'UNLOCKED')
    ) {
        navigate(`/submissions/${id}/edit/type`)
    }

    // Current Revision is the last SUBMITTED revision, SubmissionSummary doesn't display data that is currently being edited
    // Since we've already bounced on DRAFT packages, this _should_ exist.
    const edge = pkg.revisions.find((rEdge) => rEdge.node.submitInfo)
    if (!edge) {
        const errMsg = `No currently submitted revision for this package: ${pkg.id}, programming error. `
        recordJSException(errMsg)
        return <GenericErrorPage />
    }
    const currentRevision = edge.node
    const packageData = formDatas[currentRevision.id]

    const outletContext: SideNavOutletContextType = {
        pkg,
        currentRevision,
        packageData,
        documentDates,
        user: loggedInUser,
    }

    return (
        <div className={styles.background}>
            <GridContainer className={styles.container}>
                {showQuestionsAnswers && (
                    <div className={styles.sideNavContainer}>
                        <div className={styles.backLinkContainer}>
                            <Link
                                asCustom={NavLink}
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
                                    <use xlinkHref={`${sprite}#arrow_back`} />
                                </svg>
                                {loggedInUser?.__typename === 'StateUser' ? (
                                    <span>&nbsp;Back to state dashboard</span>
                                ) : (
                                    <span>&nbsp;Back to dashboard</span>
                                )}
                            </Link>
                        </div>
                        <SideNav
                            items={[
                                <Link
                                    to={`/submissions/${id}`}
                                    asCustom={NavLink}
                                    className={isSelectedLink(
                                        'SUBMISSIONS_SUMMARY'
                                    )}
                                >
                                    Submission summary
                                </Link>,
                                <Link
                                    to={`/submissions/${id}/question-and-answers`}
                                    asCustom={NavLink}
                                    className={isSelectedLink(
                                        'SUBMISSIONS_QUESTIONS_AND_RESPONSES'
                                    )}
                                >
                                    Q&A
                                </Link>,
                            ]}
                        />
                    </div>
                )}
                <Outlet context={outletContext} />
            </GridContainer>
        </div>
    )
}
