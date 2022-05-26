import { GridContainer, Link, Table, Tag } from '@trussworks/react-uswds'
import classnames from 'classnames'
import dayjs from 'dayjs'
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
    packageName,
    programNames,
} from '../../common-code/healthPlanFormDataType'
import { base64ToDomain } from '../../common-code/proto/healthPlanFormDataProto'
import { Loading } from '../../components/Loading'
import { SubmissionStatusRecord } from '../../constants/healthPlanPackages'
import { useAuth } from '../../contexts/AuthContext'
import {
    HealthPlanPackageStatus,
    SubmissionType as GQLSubmissionType,
    useIndexHealthPlanPackagesQuery,
} from '../../gen/gqlClient'
import styles from './Dashboard.module.scss'
import { SubmissionSuccessMessage } from './SubmissionSuccessMessage'
import { GenericApiErrorBanner } from '../../components/Banner/GenericApiErrorBanner/GenericApiErrorBanner'

import { useLDClient } from 'launchdarkly-react-client-sdk'

import { MaintenanceMessage } from './MaintenanceMessage'
import { featureFlags } from '../../common-code/featureFlags'

// We only pull a subset of data out of the submission and revisions for display in Dashboard
type SubmissionInDashboard = {
    id: string
    name: string
    programIDs: Array<string>
    submittedAt?: string
    updatedAt: string
    status: HealthPlanPackageStatus
    submissionType: GQLSubmissionType
}

const isSubmitted = (status: HealthPlanPackageStatus) =>
    status === 'SUBMITTED' || status === 'RESUBMITTED'

function submissionURL(
    id: SubmissionInDashboard['id'],
    status: SubmissionInDashboard['status']
): string {
    if (status === 'DRAFT') {
        return `/submissions/${id}/edit/type`
    } else if (status === 'UNLOCKED') {
        return `/submissions/${id}/edit/review-and-submit`
    }
    return `/submissions/${id}`
}

const StatusTag = ({
    status,
}: {
    status: HealthPlanPackageStatus
}): React.ReactElement => {
    const tagStyles = classnames('', {
        [styles.submittedTag]: isSubmitted(status),
        [styles.draftTag]: status === 'DRAFT',
        [styles.unlockedTag]: status === 'UNLOCKED',
    })

    const statusText = isSubmitted(status)
        ? SubmissionStatusRecord.SUBMITTED
        : SubmissionStatusRecord[status]

    return <Tag className={tagStyles}>{statusText}</Tag>
}

export const Dashboard = (): React.ReactElement => {
    const { loginStatus, loggedInUser } = useAuth()
    const location = useLocation()

    // Get the LD feature flag
    const ldClient = useLDClient()
    const testFrontendBanner = ldClient?.variation(
        featureFlags.REACT_TEST_FRONTEND_BANNER
    )

    const { loading, data, error } = useIndexHealthPlanPackagesQuery()

    if (error) {
        console.error('Error indexing submissions: ', error)
        return (
            <div id="dashboard-page" className={styles.wrapper}>
                <GridContainer className={styles.container}>
                    <GenericApiErrorBanner />
                </GridContainer>
            </div>
        )
    }

    if (loginStatus === 'LOADING' || !loggedInUser || loading || !data) {
        return <Loading />
    }

    if (loggedInUser.__typename !== 'StateUser') {
        return (
            <div id="dashboard-page" className={styles.wrapper}>
                <div>CMS Users not supported yet.</div>{' '}
            </div>
        )
    }

    const programs = loggedInUser.state.programs
    const submissionRows: SubmissionInDashboard[] = []

    data?.indexHealthPlanPackages.edges
        .map((edge) => edge.node)
        .forEach((sub) => {
            const currentRevision = sub.revisions[0]
            const currentSubmissionData = base64ToDomain(
                currentRevision.node.formDataProto
            )
            if (currentSubmissionData instanceof Error) {
                console.error(
                    'ERROR: got a proto decoding error',
                    currentSubmissionData
                )
                return null
            }

            submissionRows.push({
                id: sub.id,
                name: packageName(currentSubmissionData, programs),
                programIDs: programNames(
                    programs,
                    currentSubmissionData.programIDs
                ),
                submittedAt: sub.initiallySubmittedAt,
                status: sub.status,
                updatedAt: currentSubmissionData.updatedAt,
                submissionType: currentSubmissionData.submissionType,
            })
        })

    // Sort by updatedAt for current revision
    submissionRows.sort((a, b) => (a['updatedAt'] > b['updatedAt'] ? -1 : 1))

    const justSubmittedSubmissionName = new URLSearchParams(
        location.search
    ).get('justSubmitted')

    const hasSubmissions = submissionRows.length > 0

    return (
        <>
            <div id="dashboard-page" className={styles.wrapper}>
                <GridContainer
                    className={styles.container}
                    data-testid="dashboard-page"
                >
                    {programs.length ? (
                        <section className={styles.panel}>
                            {justSubmittedSubmissionName && (
                                <SubmissionSuccessMessage
                                    submissionName={justSubmittedSubmissionName}
                                />
                            )}
                            {testFrontendBanner && (
                                <MaintenanceMessage message="This is a test message from launch darkly" />
                            )}

                            <div className={styles.panelHeader}>
                                <h2>Submissions</h2>
                                <div>
                                    <Link
                                        asCustom={NavLink}
                                        className="usa-button"
                                        variant="unstyled"
                                        to={{
                                            pathname: '/submissions/new',
                                        }}
                                    >
                                        Start new submission
                                    </Link>
                                </div>
                            </div>
                            {hasSubmissions ? (
                                <Table fullWidth>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Programs</th>
                                            <th>Submitted</th>
                                            <th>Last updated</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissionRows.map(
                                            (dashboardSubmission) => {
                                                return (
                                                    <tr
                                                        key={
                                                            dashboardSubmission.id
                                                        }
                                                    >
                                                        <td data-testid="submission-id">
                                                            <NavLink
                                                                to={submissionURL(
                                                                    dashboardSubmission.id,
                                                                    dashboardSubmission.status
                                                                )}
                                                            >
                                                                {
                                                                    dashboardSubmission.name
                                                                }
                                                            </NavLink>
                                                        </td>
                                                        <td>
                                                            {dashboardSubmission.programIDs.map(
                                                                (id) => {
                                                                    return (
                                                                        <Tag
                                                                            data-testid="program-tag"
                                                                            key={
                                                                                id
                                                                            }
                                                                            className={`radius-pill ${styles.programTag}`}
                                                                        >
                                                                            {id}
                                                                        </Tag>
                                                                    )
                                                                }
                                                            )}
                                                        </td>
                                                        <td data-testid="submission-date">
                                                            {dashboardSubmission.submittedAt
                                                                ? dayjs(
                                                                      dashboardSubmission.submittedAt
                                                                  ).format(
                                                                      'MM/DD/YYYY'
                                                                  )
                                                                : ''}
                                                        </td>
                                                        <td>
                                                            {dayjs(
                                                                dashboardSubmission.updatedAt
                                                            ).format(
                                                                'MM/DD/YYYY'
                                                            )}
                                                        </td>
                                                        <td data-testid="submission-status">
                                                            <StatusTag
                                                                status={
                                                                    dashboardSubmission.status
                                                                }
                                                            />
                                                        </td>
                                                    </tr>
                                                )
                                            }
                                        )}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className={styles.panelEmpty}>
                                    <h3>You have no submissions yet</h3>
                                </div>
                            )}
                        </section>
                    ) : (
                        <p>No programs exist</p>
                    )}
                </GridContainer>
            </div>
        </>
    )
}
