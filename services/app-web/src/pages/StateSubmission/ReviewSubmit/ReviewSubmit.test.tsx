import { screen, waitFor } from '@testing-library/react'
import { createMemoryHistory } from 'history'
import {
    fetchCurrentUserMock,
    mockCompleteDraft, submitDraftSubmissionMockError, submitDraftSubmissionMockSuccess
} from '../../../testHelpers/apolloHelpers'
import { renderWithProviders } from '../../../testHelpers/jestHelpers'
import { ReviewSubmit } from './ReviewSubmit'


describe('ReviewSubmit', () => {
    it('renders without errors', async () => {
        renderWithProviders(
            <ReviewSubmit draftSubmission={mockCompleteDraft()} />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )
        expect(
            screen.getByRole('heading', { name: 'Contract details' })
        ).toBeInTheDocument()
    })

    it('displays edit buttons for every section', async () => {
        renderWithProviders(
            <ReviewSubmit draftSubmission={mockCompleteDraft()} />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        await waitFor(() => {
            const sectionHeadings = screen.queryAllByRole('heading', {
                level: 2,
            })
            const editButtons = screen.queryAllByRole('button', {
                name: 'Edit',
            })
            expect(sectionHeadings.length).toBeGreaterThanOrEqual(
                editButtons.length
            )
        })
    })

    it('does not display zip download buttons', async () => {
        renderWithProviders(
            <ReviewSubmit draftSubmission={mockCompleteDraft()} />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        await waitFor(() => {
            const bulkDownloadButtons = screen.queryAllByRole('button', {
                name: /documents/,
            })
            expect(bulkDownloadButtons.length).toBe(0)
        })
    })

    it('renders info from a DraftSubmission', async () => {
        renderWithProviders(
            <ReviewSubmit draftSubmission={mockCompleteDraft()} />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'Contract details' })
            ).toBeInTheDocument()

            expect(
                screen.getByRole('heading', { name: 'State contacts' })
            ).toBeInTheDocument()

            const sectionHeadings = screen.queryAllByRole('heading', {
                level: 2,
            })
            const editButtons = screen.queryAllByRole('button', {
                name: 'Edit',
            })
            expect(sectionHeadings.length).toBeGreaterThanOrEqual(
                editButtons.length
            )

            const submissionDescription =
                screen.queryByText('A real submission')
            expect(submissionDescription).toBeInTheDocument()
        })
    })

    it('displays back and save as draft buttons', async () => {
        renderWithProviders(
            <ReviewSubmit draftSubmission={mockCompleteDraft()} />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        await waitFor(() =>
            expect(
                screen.getByRole('button', {
                    name: 'Back',
                })
            ).toBeDefined()
        )
        await waitFor(() =>
            expect(
                screen.getByRole('button', {
                    name: 'Save as draft',
                })
            ).toBeDefined()
        )
    })

    it('displays submit button', async () => {
        renderWithProviders(
            <ReviewSubmit draftSubmission={mockCompleteDraft()} />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        await waitFor(() =>
            expect(screen.getByTestId('form-submit')).toBeDefined()
        )
    })

    it('submit button opens confirmation modal', async () => {
        renderWithProviders(
            <ReviewSubmit draftSubmission={mockCompleteDraft()} />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )
        const submitButton = screen.getByTestId('form-submit')

        expect(submitButton).toBeInTheDocument()

        submitButton.click()

        await waitFor(() => {
            const confirmSubmit = screen.getByTestId('review-and-submit-modal-submit')
            expect(confirmSubmit).toBeInTheDocument()
            expect(screen.getByText('Ready to submit?')).toBeInTheDocument()
            expect(
                screen.getByText(
                    'Submitting this package will send it to CMS to begin their review.'
                )
            ).toBeInTheDocument()
        })
    })

    it('redirects if submission succeeds', async () => {
        const history = createMemoryHistory()

        renderWithProviders(
            <ReviewSubmit draftSubmission={mockCompleteDraft()} />,
            {
                apolloProvider: {
                    mocks: [
                        fetchCurrentUserMock({ statusCode: 200 }),
                        submitDraftSubmissionMockSuccess({
                            id: mockCompleteDraft().id,
                        }),
                    ],
                },
                routerProvider: {
                    route: `draftSubmission/${
                        mockCompleteDraft().id
                    }/review-and-submit`,
                    routerProps: {
                        history,
                    },
                },
            }
        )

        const submit = screen.getByTestId('review-and-submit-modal-submit')
        submit.click()

        await waitFor(() => {
            const confirmSubmit = screen.getByTestId('review-and-submit-modal-submit')
            expect(confirmSubmit).toBeInTheDocument()
            confirmSubmit.click()
        })

        await waitFor(() => {
            expect(history.location.pathname).toEqual(`/dashboard`)
            expect(history.location.search).toEqual(
                `?justSubmitted=${mockCompleteDraft().name}`
            )
        })
    })

    it('displays an error if submission fails', async () => {
        renderWithProviders(
            <ReviewSubmit draftSubmission={mockCompleteDraft()} />,
            {
                apolloProvider: {
                    mocks: [
                        fetchCurrentUserMock({ statusCode: 200 }),
                        submitDraftSubmissionMockError({
                            id: mockCompleteDraft().id,
                        }),
                    ],
                },
            }
        )

        const submitButton = screen.getByTestId('form-submit')

        submitButton.click()

        const confirmSubmit = screen.getByTestId('review-and-submit-modal-submit')
        expect(confirmSubmit).toBeInTheDocument()
        confirmSubmit.click()

        const errorText = await screen.findByText(
            'Error attempting to submit. Please try again.'
        )

        expect(errorText).toBeInTheDocument()
    })
})
