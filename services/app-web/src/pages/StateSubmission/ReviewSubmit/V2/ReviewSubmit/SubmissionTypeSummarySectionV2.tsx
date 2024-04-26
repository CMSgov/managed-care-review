import { Grid } from '@trussworks/react-uswds'
import dayjs from 'dayjs'
import { DataDetail } from '../../../../../components/DataDetail'
import { DoubleColumnGrid } from '../../../../../components/DoubleColumnGrid'
import { SectionHeader } from '../../../../../components/SectionHeader'
import {
    SubmissionTypeRecord,
    ContractTypeRecord,
    PopulationCoveredRecord,
} from '../../../../../constants/healthPlanPackages'
import { GenericErrorPage } from '../../../../Errors/GenericErrorPage'
import { getVisibleLatestContractFormData } from '../../../../../gqlHelpers/contractsAndRates'
import { Program, Contract } from '../../../../../gen/gqlClient'
import { usePreviousSubmission } from '../../../../../hooks/usePreviousSubmission'
import { booleanAsYesNoUserValue } from '../../../../../components/Form/FieldYesNo/FieldYesNo'
import { SectionCard } from '../../../../../components/SectionCard'
import styles from '../../../../../components/SubmissionSummarySection/SubmissionSummarySection.module.scss'

export type SubmissionTypeSummarySectionV2Props = {
    contract: Contract
    statePrograms: Program[]
    editNavigateTo?: string
    headerChildComponent?: React.ReactElement
    subHeaderComponent?: React.ReactElement
    initiallySubmittedAt?: Date
    submissionName: string
    isStateUser: boolean
}

export const SubmissionTypeSummarySectionV2 = ({
    contract,
    statePrograms,
    editNavigateTo,
    subHeaderComponent,
    headerChildComponent,
    initiallySubmittedAt,
    submissionName,
    isStateUser,
}: SubmissionTypeSummarySectionV2Props): React.ReactElement => {
    const isPreviousSubmission = usePreviousSubmission()
    const contractFormData = getVisibleLatestContractFormData(
        contract,
        isStateUser
    )
    if (!contractFormData) return <GenericErrorPage />

    const programNames = statePrograms
        .filter((p) => contractFormData.programIDs.includes(p.id))
        .map((p) => p.name)
    const isSubmitted = contract.status === 'SUBMITTED'

    return (
        <SectionCard
            id="submissionTypeSection"
            className={styles.summarySection}
        >
            <SectionHeader
                header={submissionName}
                subHeaderComponent={subHeaderComponent}
                editNavigateTo={editNavigateTo}
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
                    </DoubleColumnGrid>
                )}
                <DoubleColumnGrid>
                    {programNames && (
                        <DataDetail
                            id="program"
                            label="Program(s)"
                            explainMissingData={!isSubmitted}
                            children={programNames}
                        />
                    )}
                    {contractFormData && contractFormData.submissionType && (
                        <DataDetail
                            id="submissionType"
                            label="Submission type"
                            explainMissingData={!isSubmitted}
                            children={
                                SubmissionTypeRecord[
                                    contractFormData.submissionType
                                ]
                            }
                        />
                    )}
                    {contractFormData.contractType && (
                        <DataDetail
                            id="contractType"
                            label="Contract action type"
                            explainMissingData={!isSubmitted}
                            children={
                                contractFormData.contractType
                                    ? ContractTypeRecord[
                                          contractFormData.contractType
                                      ]
                                    : ''
                            }
                        />
                    )}
                    {contractFormData &&
                        contractFormData.riskBasedContract !== null && (
                            <DataDetail
                                id="riskBasedContract"
                                label="Is this a risk based contract"
                                explainMissingData={!isSubmitted}
                                children={booleanAsYesNoUserValue(
                                    contractFormData.riskBasedContract
                                )}
                            />
                        )}
                    {contractFormData && contractFormData.populationCovered && (
                        <DataDetail
                            id="populationCoverage"
                            label="Which populations does this contract action cover?"
                            explainMissingData={!isSubmitted}
                            children={
                                PopulationCoveredRecord[
                                    contractFormData.populationCovered
                                ]
                            }
                        />
                    )}
                </DoubleColumnGrid>

                <Grid row gap className={styles.reviewDataRow}>
                    <Grid col={12}>
                        {contractFormData && (
                            <DataDetail
                                id="submissionDescription"
                                label="Submission description"
                                explainMissingData={!isSubmitted}
                                children={
                                    contractFormData.submissionDescription
                                }
                            />
                        )}
                    </Grid>
                </Grid>
            </dl>
        </SectionCard>
    )
}
