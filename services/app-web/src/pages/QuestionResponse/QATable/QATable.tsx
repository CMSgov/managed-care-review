import styles from './QATable.module.scss'
import { useState } from 'react'
import {
    CmsUser,
    Document,
    QuestionResponse,
    User,
} from '../../../gen/gqlClient'
import dayjs from 'dayjs'
import { useDocument } from '../../../hooks/useDocument'
import useDeepCompareEffect from 'use-deep-compare-effect'
import { LinkWithLogging, NavLinkWithLogging } from '../../../components'

type QuestionDocumentWithLink = {
    s3URL: string
    name: string
    url?: string | null
}

export type QuestionData = {
    id: string
    contractID: string
    createdAt: Date
    addedBy: CmsUser
    documents: Document[]
    responses: QuestionResponse[]
}

export type Division = 'DMCO' | 'DMCP' | 'OACT'

type TableData = QuestionDocumentWithLink & {
    createdAt: Date
    addedBy: User
}

export const QATable = ({
    question,
    division,
    round,
    user,
}: {
    question: QuestionData
    division: Division
    round: number
    user: User
}) => {
    const { getDocumentsWithS3KeyAndUrl } = useDocument()
    const tableDocuments = [
        ...question.documents.map((doc) => ({
            ...doc,
            createdAt: question.createdAt,
            addedBy: question.addedBy,
        })),
        ...question.responses.flatMap((res) =>
            res.documents.map((doc) => ({
                ...doc,
                createdAt: res.createdAt,
                addedBy: res.addedBy,
            }))
        ),
    ].sort((a, b) =>
        new Date(a.createdAt).getTime() > new Date(b.createdAt).getTime()
            ? -1
            : 1
    )

    const [refreshedDocs, setRefreshedDocs] =
        useState<TableData[]>(tableDocuments)
    const isStateUser = user.__typename === 'StateUser'

    const getAddedByName = (addedBy: User) => {
        if (user.id === addedBy.id) {
            return 'You'
        }
        if (addedBy.__typename === 'CMSUser') {
            return `${addedBy.givenName} (CMS)`
        }
        if (addedBy.__typename === 'StateUser') {
            return `${addedBy.givenName} (${addedBy.state.code})`
        }
        return `${addedBy.givenName}`
    }

    useDeepCompareEffect(() => {
        const refreshDocuments = async () => {
            const newDocuments = await getDocumentsWithS3KeyAndUrl(
                tableDocuments as TableData[],
                'QUESTION_ANSWER_DOCS'
            )
            if (newDocuments.length) {
                setRefreshedDocs(newDocuments)
            }
        }

        void refreshDocuments()
    }, [tableDocuments, getDocumentsWithS3KeyAndUrl, setRefreshedDocs])

    return (
        <>
            <div className={styles.tableHeader}>
                <h4>{`Round ${round}`}</h4>
                {isStateUser && (
                    <NavLinkWithLogging
                        className="usa-button"
                        variant="unstyled"
                        to={`./${division.toLowerCase()}/${
                            question.id
                        }/upload-response`}
                    >
                        Upload response
                    </NavLinkWithLogging>
                )}
            </div>
            <table
                className={`borderTopLinearGradient ${styles.qaDocumentTable}`}
                data-testid={`${question.id}-table`}
            >
                <thead>
                    <tr>
                        <th scope="col">Document name</th>
                        <th scope="col">Date added</th>
                        <th scope="col">Added by</th>
                    </tr>
                </thead>
                <tbody>
                    {refreshedDocs.map((doc, index) => (
                        <tr key={doc.name + index}>
                            <td>
                                {doc.url ? (
                                    <LinkWithLogging
                                        className={styles.inlineLink}
                                        aria-label={`${doc.name} (opens in new window)`}
                                        href={doc.url}
                                        target="_blank"
                                    >
                                        {doc.name}
                                    </LinkWithLogging>
                                ) : (
                                    doc.name
                                )}
                            </td>
                            <td>{dayjs(doc.createdAt).format('M/D/YY')}</td>
                            <td>{getAddedByName(doc.addedBy)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    )
}
