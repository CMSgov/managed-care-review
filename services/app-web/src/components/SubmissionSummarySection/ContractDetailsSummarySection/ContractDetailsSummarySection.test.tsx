import { screen, waitFor, within } from '@testing-library/react'
import { renderWithProviders } from '../../../testHelpers/jestHelpers'
import { ContractDetailsSummarySection } from './ContractDetailsSummarySection'
import {
    mockContractAndRatesDraft,
    mockStateSubmission,
} from '../../../testHelpers/apolloHelpers'
import { Route, Routes } from 'react-router'
import { RoutesRecord } from '../../../constants/routes'

describe('ContractDetailsSummarySection', () => {
    const draftContractAndRatesSubmission = mockContractAndRatesDraft()
    const stateBaseContractOnlySubmission = mockStateSubmission()

    it('can render draft submission without errors (review and submit behavior)', () => {
        const testSubmission = {
            ...draftContractAndRatesSubmission,
            documents: [
                {
                    s3URL: 's3://bucketname/key/test1',
                    name: 'supporting docs test 1',
                    documentCategories: ['CONTRACT_RELATED' as const],
                },
                {
                    s3URL: 's3://bucketname/key/test3',
                    name: 'supporting docs test 3',
                    documentCategories: [
                        'CONTRACT_RELATED' as const,
                        'RATES_RELATED' as const,
                    ],
                },
            ],
        }

        renderWithProviders(
            <ContractDetailsSummarySection
                submission={testSubmission}
                navigateTo="contract-details"
                submissionName="MN-PMAP-0001"
            />
        )

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'Contract details',
            })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Edit Contract details' })
        ).toHaveAttribute('href', '/contract-details')
        expect(
            screen.getByRole('link', {
                name: /Edit Contract supporting documents/,
            })
        ).toHaveAttribute('href', '/documents')
        expect(
            screen.queryByRole('link', {
                name: 'Download all contract documents',
            })
        ).toBeNull()
    })

    it('can render state submission on summary page without errors (submission summary behavior)', () => {
        renderWithProviders(
            <ContractDetailsSummarySection
                submission={{
                    ...stateBaseContractOnlySubmission,
                    status: 'SUBMITTED',
                }}
                submissionName="MN-PMAP-0001"
            />
        )

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'Contract details',
            })
        ).toBeInTheDocument()
        expect(screen.queryByText('Edit')).not.toBeInTheDocument()
        expect(
            screen.getByRole('link', {
                name: 'Download all contract documents',
            })
        ).toBeInTheDocument()
    })

    it('can render all contract details fields', () => {
        renderWithProviders(
            <ContractDetailsSummarySection
                submission={draftContractAndRatesSubmission}
                navigateTo="contract-details"
                submissionName="MN-PMAP-0001"
            />
        )

        expect(
            screen.getByRole('definition', { name: 'Contract action type' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('definition', { name: 'Contract status' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('definition', {
                name: 'Contract amendment effective dates',
            })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('definition', { name: 'Managed care entities' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('definition', {
                name: 'Active federal operating authority',
            })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('definition', {
                name: 'Items being amended',
            })
        ).toBeInTheDocument()
    })

    it('displays correct text content for contract a base contract', () => {
        renderWithProviders(
            <ContractDetailsSummarySection
                submission={stateBaseContractOnlySubmission}
                submissionName="MN-PMAP-0001"
            />
        )
        expect(screen.getByText('Contract effective dates')).toBeInTheDocument()
        expect(
            screen.queryByText('Items being amended')
        ).not.toBeInTheDocument()
    })

    it('displays correct text content for a contract amendment', () => {
        renderWithProviders(
            <ContractDetailsSummarySection
                submission={draftContractAndRatesSubmission}
                submissionName="MN-PMAP-0001"
            />
        )
        expect(
            screen.getByText('Contract amendment effective dates')
        ).toBeInTheDocument()
        expect(screen.queryByText('Items being amended')).toBeInTheDocument()
    })

    it('render supporting contract docs when they exist', async () => {
        const testSubmission = {
            ...draftContractAndRatesSubmission,
            contractDocuments: [
                {
                    s3URL: 's3://foo/bar/contract',
                    name: 'contract test 1',
                    documentCategories: ['CONTRACT' as const],
                },
            ],
            documents: [
                {
                    s3URL: 's3://bucketname/key/test1',
                    name: 'supporting docs test 1',
                    documentCategories: ['CONTRACT_RELATED' as const],
                },
                {
                    s3URL: 's3://bucketname/key/test2',
                    name: 'supporting docs test 2',
                    documentCategories: ['RATES_RELATED' as const],
                },
                {
                    s3URL: 's3://bucketname/key/test3',
                    name: 'supporting docs test 3',
                    documentCategories: [
                        'CONTRACT_RELATED' as const,
                        'RATES_RELATED' as const,
                    ],
                },
            ],
        }
        renderWithProviders(
            <ContractDetailsSummarySection
                submission={testSubmission}
                submissionName="MN-PMAP-0001"
            />
        )

        await waitFor(() => {
            const contractDocsTable = screen.getByRole('table', {
                name: 'Contract',
            })

            const supportingDocsTable = screen.getByRole('table', {
                name: /Contract supporting documents/,
            })

            expect(contractDocsTable).toBeInTheDocument()

            expect(supportingDocsTable).toBeInTheDocument()

            // check row content
            expect(
                within(contractDocsTable).getByRole('row', {
                    name: /contract test 1/,
                })
            ).toBeInTheDocument()
            expect(
                within(supportingDocsTable).getByText('supporting docs test 1')
            ).toBeInTheDocument()
            expect(
                within(supportingDocsTable).getByText('*supporting docs test 3')
            ).toBeInTheDocument()

            // check correct category on supporting docs
            expect(
                within(supportingDocsTable).getAllByText('Contract-supporting')
            ).toHaveLength(2)
        })
    })

    it('does not render supporting contract documents table when no documents exist', () => {
        renderWithProviders(
            <ContractDetailsSummarySection
                submission={draftContractAndRatesSubmission}
                submissionName="MN-PMAP-0001"
            />
        )

        expect(
            screen.queryByRole('table', {
                name: /Contract supporting documents/,
            })
        ).toBeNull()
    })

    it('does not render download all button when on previous submission', () => {
        renderWithProviders(
            <Routes>
                <Route
                    path={RoutesRecord.SUBMISSIONS_REVISION}
                    element={
                        <ContractDetailsSummarySection
                            submission={draftContractAndRatesSubmission}
                            submissionName="MN-PMAP-0001"
                        />
                    }
                />
            </Routes>,
            {
                routerProvider: {
                    route: '/submissions/15/revisions/2',
                },
            }
        )
        expect(
            screen.queryByRole('button', {
                name: 'Download all contract documents',
            })
        ).toBeNull()
    })
})
