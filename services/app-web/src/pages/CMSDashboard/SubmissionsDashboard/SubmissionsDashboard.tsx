import React from 'react'
import { SubmissionTypeRecord } from '../../../constants/healthPlanPackages'
import { useAuth } from '../../../contexts/AuthContext'
import { useIndexContractsForDashboardQuery } from '../../../gen/gqlClient'
import { mostRecentDate } from '../../../common-code/dateHelpers'
import styles from '../../StateDashboard/StateDashboard.module.scss'
import { recordJSException } from '../../../otelHelpers/tracingHelper'
import {
    Loading,
    ContractTable,
    ContractInDashboardType,
} from '../../../components'
import { ErrorFailedRequestPage } from '../../Errors/ErrorFailedRequestPage'

const SubmissionsDashboard = (): React.ReactElement => {
    const { loggedInUser } = useAuth()
    const { loading, data, error } = useIndexContractsForDashboardQuery({
        fetchPolicy: 'network-only',
    })

    if (loading || !loggedInUser) {
        return <Loading />
    } else if (error) {
        return (
            <ErrorFailedRequestPage
                error={error}
                testID="submissions-dashboard"
            />
        )
    }
    const submissionRows: ContractInDashboardType[] = []
    data?.indexContracts.edges
        .map((edge) => edge.node)
        .forEach((sub) => {
            // When a sub.reviewStatus has been moved out of 'UNDER_REVIEW'
            // have the reviewStatus supersede the sub.status
            const status =
                sub.reviewStatus !== 'UNDER_REVIEW'
                    ? sub.reviewStatus
                    : sub.status

            // Errors - data handling
            if (sub.status === 'DRAFT') {
                recordJSException(
                    `indexContractsQuery: should not return draft submissions for CMS user. ID: ${sub.id}`
                )
                return
            }
            const currentRevision = sub.packageSubmissions[0].contractRevision
            const currentFormData = currentRevision.formData

            if (
                currentRevision?.submitInfo?.updatedAt === undefined &&
                currentRevision?.unlockInfo?.updatedAt === undefined
            ) {
                recordJSException(
                    `indexContractsQuery: Error finding submit and unlock dates for submissions in CMSDashboard. ID: ${sub.id}`
                )
            }

            // Set package display data
            let displayRateFormData = currentFormData
            const subReviewActions =
                sub.reviewStatusActions && sub.reviewStatusActions[0]

            let lastUpdated = mostRecentDate([
                currentRevision?.submitInfo?.updatedAt,
                currentRevision?.unlockInfo?.updatedAt,
                subReviewActions?.updatedAt,
            ])

            if (sub.status === 'UNLOCKED') {
                // Errors - data handling
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const previousRevision = sub.draftRevision!
                const previousFormData = previousRevision.formData

                if (
                    previousRevision?.submitInfo?.updatedAt === undefined &&
                    previousRevision?.unlockInfo?.updatedAt === undefined
                ) {
                    recordJSException(
                        `indexContractsQuery: Error finding submit and unlock dates of an unlocked submission. ID: ${sub.id}`
                    )
                }
                // reset package display data since unlock submissions rely on previous revision data
                displayRateFormData = previousFormData
                lastUpdated = mostRecentDate([
                    currentRevision?.submitInfo?.updatedAt,
                    currentRevision?.unlockInfo?.updatedAt,
                    previousRevision?.submitInfo?.updatedAt,
                    previousRevision?.unlockInfo?.updatedAt,
                    subReviewActions?.updatedAt,
                ])
            }

            if (!lastUpdated) {
                recordJSException(
                    `CMSDashboard: Cannot find valid last updated date from submit and unlock info. Falling back to current revision's last edit timestamp. ID: ${sub.id}`
                )
                lastUpdated = new Date(currentRevision.updatedAt)
            }
            const programs = sub.state.programs

            submissionRows.push({
                id: sub.id,
                name: sub.packageSubmissions[0].contractRevision.contractName,
                programs: programs.filter((program) =>
                    displayRateFormData.programIDs.includes(program.id)
                ),
                submittedAt: sub.initiallySubmittedAt,
                status: status,
                updatedAt: lastUpdated,
                submissionType:
                    SubmissionTypeRecord[displayRateFormData.submissionType],
                stateName: sub.state.name,
            })
        })

    return (
        <section className={styles.panel}>
            <ContractTable
                tableData={submissionRows}
                user={loggedInUser}
                showFilters
            />
        </section>
    )
}

export { SubmissionsDashboard }
