import styles from './QATable.module.scss'
import React, { useState } from 'react'
import {
    CmsUser,
    Document,
    QuestionResponse,
    User,
} from '../../../gen/gqlClient'
import { Link } from '@trussworks/react-uswds'
import dayjs from 'dayjs'
import { NavLink } from 'react-router-dom'
import { useDocument } from '../../../hooks/useDocument'
import useDeepCompareEffect from 'use-deep-compare-effect'

type QuestionDocumentWithLink = {
    s3URL: string
    name: string
    url?: string | null
}

export type QuestionData = {
    id: string
    pkgID: string
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
    const { getDocumentsUrl } = useDocument()
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
            const newDocuments = await getDocumentsUrl(
                tableDocuments,
                'HEALTH_PLAN_DOCS'
            )
            if (newDocuments.length) {
                setRefreshedDocs(newDocuments)
            }
        }

        void refreshDocuments()
    }, [tableDocuments, getDocumentsUrl, setRefreshedDocs])

    return (
        <>
            <div className={styles.tableHeader}>
                <h4>{`Round ${round}`}</h4>
                {isStateUser && (
                    <Link
                        asCustom={NavLink}
                        className="usa-button"
                        variant="unstyled"
                        to={`./${division.toLowerCase()}/${
                            question.id
                        }/upload-response`}
                    >
                        Upload response
                    </Link>
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
                                    <Link
                                        className={styles.inlineLink}
                                        aria-label={`${doc.name} (opens in new window)`}
                                        href={doc.url}
                                        target="_blank"
                                    >
                                        {doc.name}
                                    </Link>
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
