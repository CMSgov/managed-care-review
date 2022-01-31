import { screen,within, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../testHelpers/jestHelpers'
import { RateDetailsSummarySection } from './RateDetailsSummarySection'
import {
    mockContractAndRatesDraft,
    mockStateSubmission,
} from '../../../testHelpers/apolloHelpers'

describe('RateDetailsSummarySection', () => {
    const draftSubmission = mockContractAndRatesDraft()
    const stateSubmission = mockStateSubmission()

    it('can render draft submission without errors', () => {
        renderWithProviders(
            <RateDetailsSummarySection
                submission={draftSubmission}
                navigateTo="rate-details"
            />
        )

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'Rate details',
            })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Edit Rate details' })
        ).toHaveAttribute('href', '/rate-details')
    })

    it('can render state submission without errors', () => {
        renderWithProviders(
            <RateDetailsSummarySection submission={stateSubmission} />
        )

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'Rate details',
            })
        ).toBeInTheDocument()
        // Is this the best way to check that the link is not present?
        expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })

    it('can render all rate details fields for amendment to prior rate certification submission', () => {
        renderWithProviders(
            <RateDetailsSummarySection
                submission={draftSubmission}
                navigateTo="rate-details"
            />
        )

        expect(
            screen.getByRole('definition', { name: 'Rate certification type' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('definition', {
                name: 'Rating period of original rate certification',
            })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('definition', {
                name: 'Date certified for rate amendment',
            })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('definition', {
                name: 'Rate amendment effective dates',
            })
        ).toBeInTheDocument()
    })

    it('can render all rate details fields for new rate certification submission', () => {
        renderWithProviders(
            <RateDetailsSummarySection submission={stateSubmission} />
        )

        expect(
            screen.getByRole('definition', { name: 'Rate certification type' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('definition', { name: 'Rating period' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('definition', { name: 'Date certified' })
        ).toBeInTheDocument()
    })

    it('render supporting rates docs when they exist', async () => {
        const testSubmission = {
            ...draftSubmission,
            rateDocuments:[
                 {
                    s3URL: 's3://foo/bar/rate',
                    name: 'rate docs test 1',
                    documentCategories: ['RATES' as const],
                }
            ],
            documents: [
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
            ],
        }
        renderWithProviders(
            <RateDetailsSummarySection submission={testSubmission} />
        )

        const supportingDocsTable = screen.getByRole('table', {
            name: 'Rate supporting documents',
        })
        const rateDocsTable = screen.getByRole('table', {
            name: 'Rate certification',
        })

        expect(screen.getByRole(rateDocsTable)).toBeInTheDocument()
        expect(supportingDocsTable).toBeInTheDocument()

        await waitFor (() => {
            const supportingDocsTableRows =
                within(supportingDocsTable).getAllByRole('rowgroup')
            expect(supportingDocsTableRows.length).toEqual(2)

            // check row content
            expect(
                within(supportingDocsTable).getByText('supporting docs test 2')
            ).toBeInTheDocument()
            expect(
                within(supportingDocsTable).getByText('*supporting docs test 3')
            ).toBeInTheDocument()
           
             // check both rate and supporting docs contract docs are on page
            expect(
                    within(supportingDocsTable).getAllByText(
                        'Rate-supporting'
                    ).length
                ).toEqual(2)
            expect(
                within(rateDocsTable).getAllByText('Rate-supporting')
                    .length
            ).toEqual(1)
        })
       
    })

    it('does not render supporting rate documents when they do not exist', () => {
        renderWithProviders(
            <RateDetailsSummarySection
                submission={draftSubmission}
            />
        )

     expect(screen.queryByRole('table', {
            name: 'Rate supporting documents',
        })).toBeNull()

    })
})
