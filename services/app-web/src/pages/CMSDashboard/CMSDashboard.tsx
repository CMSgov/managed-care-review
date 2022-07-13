import { GridContainer, Table, Tag } from '@trussworks/react-uswds'
import classnames from 'classnames'
import dayjs from 'dayjs'
import React from 'react'
import { NavLink } from 'react-router-dom'
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
import styles from '../StateDashboard/StateDashboard.module.scss'
import { GenericApiErrorBanner } from '../../components/Banner/GenericApiErrorBanner/GenericApiErrorBanner'
import type { ProgramArgType } from '../../common-code/healthPlanFormDataType'
import { recordJSException } from '../../otelHelpers/tracingHelper'

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

function submissionURL(id: SubmissionInDashboard['id']): string {
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

export const CMSDashboard = (): React.ReactElement => {
    const { loginStatus, loggedInUser } = useAuth()

    const { loading, data, error } = useIndexHealthPlanPackagesQuery()

    if (error) {
        recordJSException(
            `indexHealthPlanPackagesQuery: Error indexing submissions. Error message:${error.message}`
        )
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
    const programs: ProgramArgType[] = []
    // const programs = loggedInUser.state.programs
    const submissionRows: SubmissionInDashboard[] = []

    data?.indexHealthPlanPackages.edges
        .map((edge) => edge.node)
        .forEach((sub) => {
            const currentRevision = sub.revisions[0]
            const currentSubmissionData = base64ToDomain(
                currentRevision.node.formDataProto
            )

            if (currentSubmissionData instanceof Error) {
                recordJSException(
                    `indexHealthPlanPackagesQuery: Error decoding proto. ID: ${sub.id} Error message: ${currentSubmissionData.message}`
                )

                return null
            }
            if (sub.status === 'DRAFT') {
                // should display draft submissions to a CMS user - this is also filtered out on the api side
                return
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

    const hasSubmissions = submissionRows.length > 0

    return (
        <>
            <div id="dashboard-page" className={styles.wrapper}>
                <GridContainer
                    className={styles.container}
                    data-testid="dashboard-page"
                >
                    <section className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <h2>Submissions</h2>
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
                                                    key={dashboardSubmission.id}
                                                >
                                                    <td data-testid="submission-id">
                                                        <NavLink
                                                            to={submissionURL(
                                                                dashboardSubmission.id
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
                                                                        key={id}
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
                                                        ).format('MM/DD/YYYY')}
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
                </GridContainer>
            </div>
        </>
    )
}
