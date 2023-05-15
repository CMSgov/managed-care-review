import { Grid } from '@trussworks/react-uswds'
import dayjs from 'dayjs'
import { HealthPlanFormDataType } from '@managed-care-review/common-code/healthPlanFormDataType'
import { DataDetail } from '../../../components/DataDetail'
import { DoubleColumnGrid } from '../../../components/DoubleColumnGrid'
import { SectionHeader } from '../../../components/SectionHeader'
import {
    SubmissionTypeRecord,
    ContractTypeRecord,
    PopulationCoveredRecord,
} from '../../../constants/healthPlanPackages'
import { Program } from '../../../gen/gqlClient'
import { usePreviousSubmission } from '../../../hooks/usePreviousSubmission'
import { booleanAsYesNoUserValue } from '../../../components/Form/FieldYesNo/FieldYesNo'
import styles from '../SubmissionSummarySection.module.scss'
import { useLDClient } from 'launchdarkly-react-client-sdk'
import { featureFlags } from '@managed-care-review/common-code/featureFlags'

export type SubmissionTypeSummarySectionProps = {
    submission: HealthPlanFormDataType
    statePrograms: Program[]
    navigateTo?: string
    headerChildComponent?: React.ReactElement
    initiallySubmittedAt?: Date
    submissionName: string
}

export const SubmissionTypeSummarySection = ({
    submission,
    statePrograms,
    navigateTo,
    headerChildComponent,
    initiallySubmittedAt,
    submissionName,
}: SubmissionTypeSummarySectionProps): React.ReactElement => {
    const isPreviousSubmission = usePreviousSubmission()
    const programNames = statePrograms
        .filter((p) => submission.programIDs.includes(p.id))
        .map((p) => p.name)
    const isSubmitted = submission.status === 'SUBMITTED'

    const ldClient = useLDClient()
    const showCHIPOnlyForm = ldClient?.variation(
        featureFlags.CHIP_ONLY_FORM.flag,
        featureFlags.CHIP_ONLY_FORM.defaultValue
    )

    return (
        <section id="submissionTypeSection" className={styles.summarySection}>
            <SectionHeader
                header={submissionName}
                navigateTo={navigateTo}
                headerId={'submissionName'}
            >
                {headerChildComponent && headerChildComponent}
            </SectionHeader>

            <dl>
                {isSubmitted && !isPreviousSubmission && (
                    <DoubleColumnGrid>
                        <DataDetail
                            id="submitted"
                            label="Submitted"
                            children={
                                <span>
                                    {dayjs(initiallySubmittedAt).format(
                                        'MM/DD/YY'
                                    )}
                                </span>
                            }
                        />
                        <></>
                    </DoubleColumnGrid>
                )}
                <DoubleColumnGrid>
                    <DataDetail
                        id="program"
                        label="Program(s)"
                        explainMissingData={!isSubmitted}
                        children={programNames}
                    />
                    <DataDetail
                        id="submissionType"
                        label="Submission type"
                        explainMissingData={!isSubmitted}
                        children={
                            SubmissionTypeRecord[submission.submissionType]
                        }
                    />
                    <DataDetail
                        id="contractType"
                        label="Contract action type"
                        explainMissingData={!isSubmitted}
                        children={
                            submission.contractType
                                ? ContractTypeRecord[submission.contractType]
                                : ''
                        }
                    />
                    <DataDetail
                        id="riskBasedContract"
                        label="Is this a risk based contract"
                        explainMissingData={!isSubmitted}
                        children={booleanAsYesNoUserValue(
                            submission.riskBasedContract
                        )}
                    />
                    {showCHIPOnlyForm && (
                        <DataDetail
                            id="populationCoverage"
                            label="Which populations does this contract action cover?"
                            explainMissingData={!isSubmitted}
                            children={
                                submission.populationCovered &&
                                PopulationCoveredRecord[
                                    submission.populationCovered
                                ]
                            }
                        />
                    )}
                </DoubleColumnGrid>

                <Grid row gap className={styles.reviewDataRow}>
                    <Grid col={12}>
                        <DataDetail
                            id="submissionDescription"
                            label="Submission description"
                            explainMissingData={!isSubmitted}
                            children={submission.submissionDescription}
                        />
                    </Grid>
                </Grid>
            </dl>
        </section>
    )
}
