import React, { useEffect, useState } from 'react'
import styles from '../SubmissionSummarySection.module.scss'
import { Document } from '../../../gen/gqlClient'
import { SectionHeader } from '../../SectionHeader'
import { DownloadButton } from '../../DownloadButton'
import { Link } from '@trussworks/react-uswds'
import { useS3 } from '../../../contexts/S3Context'
import { HealthPlanFormDataType } from '../../../common-code/healthPlanFormDataType'

type DocumentWithLink = { url: string | null } & Document

export type SupportingDocumentsSummarySectionProps = {
    submission: HealthPlanFormDataType
    navigateTo?: string
    submissionName?: string
}
const getUncategorizedDocuments = (documents: Document[]): Document[] =>
    documents.filter(
        (doc) => !doc.documentCategories || doc.documentCategories.length === 0
    )
// This component is only used for supporting docs that are not categorized (not expected behavior but still possible)
// since supporting documents are now displayed in the rate and contract sections
export const SupportingDocumentsSummarySection = ({
    submission,
    navigateTo,
    submissionName,
}: SupportingDocumentsSummarySectionProps): React.ReactElement | null => {
    const { getURL, getKey, getBulkDlURL } = useS3()
    const [refreshedDocs, setRefreshedDocs] = useState<DocumentWithLink[]>([])
    const [zippedFilesURL, setZippedFilesURL] = useState<string>('')
    const isSubmitted = submission.status === 'SUBMITTED'
    useEffect(() => {
        const refreshDocuments = async () => {
            const uncategorizedDocuments = getUncategorizedDocuments(
                submission.documents
            )

            const newDocuments = await Promise.all(
                uncategorizedDocuments.map(async (doc) => {
                    const key = getKey(doc.s3URL)
                    if (!key)
                        return {
                            ...doc,
                            url: null,
                        }

                    const documentLink = await getURL(key)
                    return {
                        ...doc,
                        url: documentLink,
                    }
                })
            ).catch((err) => {
                console.log(err)
                return []
            })

            setRefreshedDocs(newDocuments)
        }

        void refreshDocuments()
    }, [submission, getKey, getURL])

    useEffect(() => {
        // get all the keys for the documents we want to zip
        const uncategorizedDocuments = getUncategorizedDocuments(
            submission.documents
        )

        async function fetchZipUrl() {
            const keysFromDocs = uncategorizedDocuments
                .map((doc) => {
                    const key = getKey(doc.s3URL)
                    if (!key) return ''
                    return key
                })
                .filter((key) => key !== '')

            // call the lambda to zip the files and get the url
            const zippedURL = await getBulkDlURL(
                keysFromDocs,
                submissionName + '-supporting-documents.zip'
            )
            if (zippedURL instanceof Error) {
                console.log('ERROR: TODO: DISPLAY AN ERROR MESSAGE')
                return
            }

            setZippedFilesURL(zippedURL)
        }

        void fetchZipUrl()
    }, [getKey, getBulkDlURL, submission, submissionName])

    const documentsSummary = `${refreshedDocs.length} ${
        refreshedDocs.length === 1 ? 'file' : 'files'
    }`
    // when there are no uncategorized supporting documents, remove this section entirely
    if (refreshedDocs.length === 0) return null

    return (
        <section id="documents" className={styles.summarySection}>
            <SectionHeader
                header="Supporting documents"
                navigateTo={navigateTo}
            >
                {isSubmitted && (
                    <DownloadButton
                        text="Download all supporting documents"
                        zippedFilesURL={zippedFilesURL}
                    />
                )}
            </SectionHeader>
            <span className="text-bold">{documentsSummary}</span>
            <ul>
                {refreshedDocs.map((doc) => (
                    <li key={doc.name}>
                        {doc.url ? (
                            <Link
                                aria-label={`${doc.name} (opens in new window)`}
                                href={doc.url}
                                variant="external"
                                target="_blank"
                            >
                                {doc.name}
                            </Link>
                        ) : (
                            <span>{doc.name}</span>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    )
}
