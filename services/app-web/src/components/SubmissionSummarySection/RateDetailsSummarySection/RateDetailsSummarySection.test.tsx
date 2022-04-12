import { screen, waitFor, within } from '@testing-library/react'
import {
    mockContractAndRatesDraft,
    mockStateSubmission,
} from '../../../testHelpers/apolloHelpers'
import { renderWithProviders } from '../../../testHelpers/jestHelpers'
import { RateDetailsSummarySection } from './RateDetailsSummarySection'
import { Route } from 'react-router'
import { RoutesRecord } from '../../../constants/routes'
import { formatRateNameDate } from '../../../dateHelpers'

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

    it('can render correct rate name for new rate submission', () => {
        const submission = mockStateSubmission()
        renderWithProviders(
            <RateDetailsSummarySection
                submission={submission}
                navigateTo="rate-details"
            />
        )
        const rateName = `MN-MSHO-0003-RATE-${formatRateNameDate(
            submission.rateDateStart
        )}-${formatRateNameDate(
            submission.rateDateEnd
        )}-CERTIFICATION-${formatRateNameDate(submission.rateDateCertified)}`
        expect(screen.getByText(rateName)).toBeInTheDocument()
    })

    it('can render correct rate name for AMENDMENT rate submission', () => {
        const submission = {
            ...mockContractAndRatesDraft(),
            rateDateStart: new Date('2022-01-25'),
            rateDateEnd: new Date('2023-01-25'),
            rateDateCertified: new Date('2022-01-26'),
            rateAmendmentInfo: {
                effectiveDateStart: new Date('2022-02-25'),
                effectiveDateEnd: new Date('2023-02-26'),
            },
        }

        renderWithProviders(
            <RateDetailsSummarySection
                submission={submission}
                navigateTo="rate-details"
            />
        )

        const rateName = `MN-PMAP-0001-RATE-${formatRateNameDate(
            submission.rateAmendmentInfo.effectiveDateStart
        )}-${formatRateNameDate(
            submission.rateAmendmentInfo.effectiveDateEnd
        )}-AMENDMENT-${formatRateNameDate(submission.rateDateCertified)}`

        expect(screen.getByText(rateName)).toBeInTheDocument()
    })

    it('can render all rate details fields for new rate certification submission', () => {
        renderWithProviders(
            <RateDetailsSummarySection submission={stateSubmission} />
        )

        const rateName = `MN-MSHO-0003-RATE-${formatRateNameDate(
            stateSubmission.rateDateStart
        )}-${formatRateNameDate(
            stateSubmission.rateDateEnd
        )}-CERTIFICATION-${formatRateNameDate(
            stateSubmission.rateDateCertified
        )}`

        expect(screen.getByText(rateName)).toBeInTheDocument()
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
            rateDocuments: [
                {
                    s3URL: 's3://foo/bar/rate',
                    name: 'rate docs test 1',
                    documentCategories: ['RATES' as const],
                },
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
            <RateDetailsSummarySection
                submission={testSubmission}
                navigateTo={'/rate-details'}
            />
        )

        await waitFor(() => {
            const supportingDocsTable = screen.getByRole('table', {
                name: /Rate supporting documents/,
            })
            const rateDocsTable = screen.getByRole('table', {
                name: 'Rate certification',
            })

            expect(rateDocsTable).toBeInTheDocument()
            expect(supportingDocsTable).toBeInTheDocument()
            expect(
                screen.getByRole('link', {
                    name: /Edit Rate supporting documents/,
                })
            ).toHaveAttribute('href', '/documents')

            const supportingDocsTableRows =
                within(supportingDocsTable).getAllByRole('rowgroup')
            expect(supportingDocsTableRows).toHaveLength(2)

            // check row content
            expect(
                within(rateDocsTable).getByRole('row', {
                    name: /rate docs test 1/,
                })
            ).toBeInTheDocument()
            expect(
                within(supportingDocsTable).getByText('supporting docs test 2')
            ).toBeInTheDocument()
            expect(
                within(supportingDocsTable).getByText('*supporting docs test 3')
            ).toBeInTheDocument()

            // check correct category on supporting docs
            expect(
                within(supportingDocsTable).getAllByText('Rate-supporting')
            ).toHaveLength(2)
        })
    })

    it('does not render supporting rate documents when they do not exist', () => {
        renderWithProviders(
            <RateDetailsSummarySection submission={draftSubmission} />
        )

        expect(
            screen.queryByRole('table', {
                name: /Rate supporting documents/,
            })
        ).toBeNull()
    })

    it('does not render download all button when on previous submission', () => {
        renderWithProviders(
            <Route
                path={RoutesRecord.SUBMISSIONS_REVISION}
                component={() => (
                    <RateDetailsSummarySection submission={stateSubmission} />
                )}
            />,
            {
                routerProvider: {
                    route: '/submissions/15/revisions/2',
                },
            }
        )
        expect(
            screen.queryByRole('button', {
                name: 'Download all rate documents',
            })
        ).toBeNull()
    })
})
