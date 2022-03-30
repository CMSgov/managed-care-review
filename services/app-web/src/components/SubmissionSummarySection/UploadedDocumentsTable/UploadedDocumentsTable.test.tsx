import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../testHelpers/jestHelpers'
import { UploadedDocumentsTable } from './UploadedDocumentsTable'

describe('UploadedDocumentsTable', () => {
    it('renders documents without errors', async () => {
        const testDocuments = [
            {
                s3URL: 's3://foo/bar/test-1',
                name: 'supporting docs test 1',
                documentCategories: ['CONTRACT_RELATED' as const],
            },
        ]
        renderWithProviders(
            <UploadedDocumentsTable
                documents={testDocuments}
                caption="Contract"
                documentCategory="Contract"
            />
        )
        await waitFor(() => {
            expect(
                screen.getByRole('table', {
                    name: 'Contract',
                })
            ).toBeInTheDocument()

            expect(screen.getAllByRole('row').length - 1).toEqual(
                testDocuments.length
            )
        })
    })

    it('renders supporting contract documents when they exist', async () => {
        const testDocuments = [
            {
                s3URL: 's3://foo/bar/test-1',
                name: 'supporting docs test 1',
                documentCategories: ['CONTRACT_RELATED' as const],
            },
            {
                s3URL: 's3://foo/bar/test-3',
                name: 'supporting docs test 3',
                documentCategories: [
                    'CONTRACT_RELATED' as const,
                    'RATES_RELATED' as const,
                ],
            },
        ]

        renderWithProviders(
            <UploadedDocumentsTable
                documents={testDocuments}
                caption="Contract supporting"
                documentCategory="Contract-supporting"
                isSupportingDocuments
            />
        )

        await waitFor(() => {
            expect(
                screen.getByRole('table', {
                    name: /Contract supporting/,
                })
            ).toBeInTheDocument()

            expect(screen.getAllByRole('row').length - 1).toEqual(
                testDocuments.length
            )
            expect(
                screen.getByText(
                    /Listed as both a contract and rate supporting document/
                )
            ).toBeInTheDocument()
        })
    })

    it('renders documents that are both contract and rate related', async () => {
        const testDocuments = [
            {
                s3URL: 's3://foo/bar/test-1',
                name: 'supporting docs test 1',
                documentCategories: ['CONTRACT_RELATED' as const],
            },
            {
                s3URL: 's3://foo/bar/test-2',
                name: 'supporting docs test 2',
                documentCategories: ['RATES_RELATED' as const],
            },
            {
                s3URL: 's3://foo/bar/test-3',
                name: 'supporting docs test 3',
                documentCategories: [
                    'CONTRACT_RELATED' as const,
                    'RATES_RELATED' as const,
                ],
            },
        ]

        const contractAndRateSupportingDocs = testDocuments.filter(
            (doc) =>
                doc.documentCategories.includes('CONTRACT_RELATED') &&
                doc.documentCategories.includes('RATES_RELATED')
        )
        const haveJustOneCategory = testDocuments.filter(
            (doc) => !contractAndRateSupportingDocs.includes(doc)
        )
        renderWithProviders(
            <UploadedDocumentsTable
                documents={testDocuments}
                caption="Contract supporting"
                documentCategory="Contract-supporting"
                isSupportingDocuments
            />
        )
        await waitFor(() => {
            // confirm those documents are prefixed with asterisk
            contractAndRateSupportingDocs.forEach((doc) => {
                expect(screen.getByText(`*${doc.name}`)).toBeInTheDocument()
            })
            // and other docs exist but don't have asterisk
            expect(
                screen.getByText(`${haveJustOneCategory[0].name}`)
            ).toBeInTheDocument()
            expect(
                screen.queryByText(`*${haveJustOneCategory[0].name}`)
            ).toBeNull()
        })
    })
})
