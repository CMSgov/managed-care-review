import { useEffect, useState } from 'react'
import { DataDetail } from '../../../components/DataDetail'
import { SectionHeader } from '../../../components/SectionHeader'
import { UploadedDocumentsTable } from '../../../components/SubmissionSummarySection'
import { DocumentDateLookupTable } from '../../../pages/SubmissionSummary/SubmissionSummary'
import { useS3 } from '../../../contexts/S3Context'
import { formatCalendarDate } from '../../../dateHelpers'
import { DraftSubmission, StateSubmission } from '../../../gen/gqlClient'
import { DoubleColumnGrid } from '../../DoubleColumnGrid'
import { DownloadButton } from '../../DownloadButton'
import { usePreviousSubmission } from '../../../hooks/usePreviousSubmission'
import { generateRateName } from '../../../common-code/domain-models/submission'
import styles from '../SubmissionSummarySection.module.scss'

export type RateDetailsSummarySectionProps = {
    submission: DraftSubmission | StateSubmission
    navigateTo?: string
    documentDateLookupTable?: DocumentDateLookupTable
    isCMSUser?: boolean
}

export const RateDetailsSummarySection = ({
    submission,
    navigateTo,
    documentDateLookupTable,
    isCMSUser,
}: RateDetailsSummarySectionProps): React.ReactElement => {
    const isSubmitted = submission.__typename === 'StateSubmission'
    const isEditing = !isSubmitted && navigateTo !== undefined
    //Checks if submission is a previous submission
    const isPreviousSubmission = usePreviousSubmission()
    // Get the zip file for the rate details
    const { getKey, getBulkDlURL } = useS3()
    const [zippedFilesURL, setZippedFilesURL] = useState<string>('')
    const rateSupportingDocuments = submission.documents.filter((doc) =>
        doc.documentCategories.includes('RATES_RELATED')
    )
    //Generate rate name

    const rateName = generateRateName(submission, submission.name)

    useEffect(() => {
        // get all the keys for the documents we want to zip
        async function fetchZipUrl() {
            const keysFromDocs = submission.rateDocuments
                .concat(rateSupportingDocuments)
                .map((doc) => {
                    const key = getKey(doc.s3URL)
                    if (!key) return ''
                    return key
                })
                .filter((key) => key !== '')

            // call the lambda to zip the files and get the url
            const zippedURL = await getBulkDlURL(
                keysFromDocs,
                submission.name + '-rate-details.zip'
            )
            if (zippedURL instanceof Error) {
                console.log('ERROR: TODO: DISPLAY AN ERROR MESSAGE')
                return
            }

            setZippedFilesURL(zippedURL)
        }

        void fetchZipUrl()
    }, [getKey, getBulkDlURL, submission, rateSupportingDocuments])

    return (
        <section id="rateDetails" className={styles.summarySection}>
            <dl>
                <SectionHeader header="Rate details" navigateTo={navigateTo}>
                    {isSubmitted && !isPreviousSubmission && (
                        <DownloadButton
                            text="Download all rate documents"
                            zippedFilesURL={zippedFilesURL}
                        />
                    )}
                </SectionHeader>

                <div aria-label="Rate ID" id="rateID" role="group">
                    <h4 role="definition" aria-labelledby="rateID">
                        {rateName}
                    </h4>
                </div>

                <DoubleColumnGrid>
                    <DataDetail
                        id="rateType"
                        label="Rate certification type"
                        data={
                            submission.rateAmendmentInfo
                                ? 'Amendment to prior rate certification'
                                : 'New rate certification'
                        }
                    />
                    <DataDetail
                        id="ratingPeriod"
                        label={
                            submission.rateAmendmentInfo
                                ? 'Rating period of original rate certification'
                                : 'Rating period'
                        }
                        data={`${formatCalendarDate(
                            submission.rateDateStart
                        )} to ${formatCalendarDate(submission.rateDateEnd)}`}
                    />
                    <DataDetail
                        id="dateCertified"
                        label={
                            submission.rateAmendmentInfo
                                ? 'Date certified for rate amendment'
                                : 'Date certified'
                        }
                        data={formatCalendarDate(submission.rateDateCertified)}
                    />
                    {submission.rateAmendmentInfo ? (
                        <DataDetail
                            id="effectiveRatingPeriod"
                            label="Rate amendment effective dates"
                            data={`${formatCalendarDate(
                                submission.rateAmendmentInfo.effectiveDateStart
                            )} to ${formatCalendarDate(
                                submission.rateAmendmentInfo.effectiveDateEnd
                            )}`}
                        />
                    ) : null}
                </DoubleColumnGrid>
            </dl>
            <UploadedDocumentsTable
                documents={submission.rateDocuments}
                documentDateLookupTable={documentDateLookupTable}
                isCMSUser={isCMSUser}
                caption="Rate certification"
                documentCategory="Rate certification"
            />
            <UploadedDocumentsTable
                documents={rateSupportingDocuments}
                documentDateLookupTable={documentDateLookupTable}
                isCMSUser={isCMSUser}
                caption="Rate supporting documents"
                documentCategory="Rate-supporting"
                isSupportingDocuments
                isEditing={isEditing}
            />
        </section>
    )
}
