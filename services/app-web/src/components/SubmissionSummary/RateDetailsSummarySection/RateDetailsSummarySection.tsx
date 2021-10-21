import dayjs from 'dayjs'
import styles from '../SubmissionSummary.module.scss'
import { SectionHeader } from '../../SectionHeader'
import { DataDetail } from '../../DataDetail'
import { DoubleColumnRow } from '../../DoubleColumnRow'
import { DraftSubmission, StateSubmission } from '../../../gen/gqlClient'

export type RateDetailsSummarySectionProps = {
    submission: DraftSubmission | StateSubmission
    navigateTo?: string
}

export const RateDetailsSummarySection = ({
    submission,
    navigateTo,
}: RateDetailsSummarySectionProps): React.ReactElement => {
    return (
        <section id="rateDetails" className={styles.reviewSection}>
            <dl>
                <SectionHeader header="Rate details" navigateTo={navigateTo} />
                <DoubleColumnRow
                    left={
                        <DataDetail
                            id="rateType"
                            label="Rate certification type"
                            data={
                                submission.rateAmendmentInfo
                                    ? 'Amendment to prior rate certification'
                                    : 'New rate certification'
                            }
                        />
                    }
                    right={
                        <DataDetail
                            id="ratingPeriod"
                            label={
                                submission.rateAmendmentInfo
                                    ? 'Rating period of original rate certification'
                                    : 'Rating period'
                            }
                            data={`${dayjs(submission.rateDateStart).format(
                                'MM/DD/YYYY'
                            )} - ${dayjs(submission.rateDateEnd).format(
                                'MM/DD/YYYY'
                            )}`}
                        />
                    }
                />
                <DoubleColumnRow
                    left={
                        <DataDetail
                            id="dateCertified"
                            label={
                                submission.rateAmendmentInfo
                                    ? 'Date certified for rate amendment'
                                    : 'Date certified'
                            }
                            data={dayjs(submission.rateDateCertified).format(
                                'MM/DD/YYYY'
                            )}
                        />
                    }
                    right={
                        submission.rateAmendmentInfo ? (
                            <DataDetail
                                id="effectiveRatingPeriod"
                                label="Effective dates of rate amendment"
                                data={`${dayjs(
                                    submission.rateAmendmentInfo
                                        .effectiveDateStart
                                ).format('MM/DD/YYYY')} - ${dayjs(
                                    submission.rateAmendmentInfo
                                        .effectiveDateEnd
                                ).format('MM/DD/YYYY')}`}
                            />
                        ) : null
                    }
                />
            </dl>
        </section>
    )
}
