import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { UploadRateResponse } from './UploadRateResponse'
import {
    dragAndDrop,
    renderWithProviders,
    TEST_DOC_FILE,
    TEST_PDF_FILE,
    TEST_PNG_FILE,
    TEST_XLS_FILE,
} from '../../../testHelpers'
import { RoutesRecord } from '../../../constants/routes'
import { ACCEPTED_SUBMISSION_FILE_TYPES } from '../../../components/FileUpload'
import {
    fetchCurrentUserMock,
    mockValidUser,
    mockRateSubmittedWithQuestions,
    fetchRateWithQuestionsMockSuccess,
} from '../../../testHelpers/apolloMocks'
import { createRateQuestionResponseNetworkFailure } from '../../../testHelpers/apolloMocks/questionResponseGQLMock'
import { SubmissionSideNav } from '../../SubmissionSideNav'

describe('UploadRateResponse', () => {
    const division = 'dmco'
    const questionID = 'testQuestion'
    const renderTestUI = () => {
        return (
            <Routes>
                <Route
                    path={RoutesRecord.SUBMISSIONS_UPLOAD_RATE_RESPONSE}
                    element={<UploadRateResponse />}
                />
            </Routes>
        )
    }
    it('displays file upload for correct cms division', async () => {
        const rate = mockRateSubmittedWithQuestions({ id: '15' })
        renderWithProviders(renderTestUI(), {
            apolloProvider: {
                mocks: [
                    fetchCurrentUserMock({
                        user: mockValidUser(),
                        statusCode: 200,
                    }),
                    fetchRateWithQuestionsMockSuccess({
                        rate: {
                            ...rate,
                            id: '15',
                            parentContractID: '25',
                        },
                    }),
                ],
            },
            routerProvider: {
                route: `/submissions/25/rates/15/question-and-answers/${division}/${questionID}/upload-response`,
            },
        })

        await screen.findByRole('heading', {
            name: /Upload response/,
            level: 2,
        })
        // Expect text to display correct division from url parameters.
        screen.queryByText(`Questions from ${division.toUpperCase()}`)
        // Expect file upload input on page
        expect(await screen.findByTestId('file-input')).toBeInTheDocument()
        expect(screen.getByLabelText('Upload response')).toBeInTheDocument()
    })

    it('file upload accepts multiple pdf, word, excel documents', async () => {
        const rate = mockRateSubmittedWithQuestions({ id: '15' })

        renderWithProviders(renderTestUI(), {
            apolloProvider: {
                mocks: [
                    fetchCurrentUserMock({
                        user: mockValidUser(),
                        statusCode: 200,
                    }),
                    fetchRateWithQuestionsMockSuccess({
                        rate: {
                            ...rate,
                            id: '15',
                        },
                    }),
                ],
            },
            routerProvider: {
                route: `/submissions/25/rates/15/question-and-answers/dmco/${questionID}/upload-response`,
            },
        })

        await screen.findByRole('heading', {
            name: /Upload response/,
            level: 2,
        })
        const input = screen.getByLabelText('Upload response')
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('accept', ACCEPTED_SUBMISSION_FILE_TYPES)
        await userEvent.upload(input, [
            TEST_DOC_FILE,
            TEST_PDF_FILE,
            TEST_XLS_FILE,
        ])
        await waitFor(() => {
            expect(screen.getByText(TEST_DOC_FILE.name)).toBeInTheDocument()
            expect(screen.getByText(TEST_PDF_FILE.name)).toBeInTheDocument()
            expect(screen.getByText(TEST_XLS_FILE.name)).toBeInTheDocument()
        })
    })

    it('displays form validation error if attempting to add question with zero files', async () => {
        const rate = mockRateSubmittedWithQuestions({ id: '15' })

        renderWithProviders(renderTestUI(), {
            apolloProvider: {
                mocks: [
                    fetchCurrentUserMock({
                        user: mockValidUser(),
                        statusCode: 200,
                    }),
                    fetchRateWithQuestionsMockSuccess({
                        rate: {
                            ...rate,
                            id: '15',
                        },
                    }),
                ],
            },
            routerProvider: {
                route: `/submissions/25/rates/15/question-and-answers/dmco/${questionID}/upload-response`,
            },
        })

        await screen.findByRole('heading', {
            name: /Upload response/,
            level: 2,
        })
        const continueButton = screen.getByRole('button', {
            name: 'Send response',
        })
        expect(continueButton).not.toHaveAttribute('aria-disabled')

        continueButton.click()

        await waitFor(() => {
            expect(
                screen.getAllByText('You must upload at least one document')
            ).toHaveLength(2)
        })
    })

    it('displays file upload alert if attempting to add question with all invalid files', async () => {
        const rate = mockRateSubmittedWithQuestions({ id: '15' })

        renderWithProviders(renderTestUI(), {
            apolloProvider: {
                mocks: [
                    fetchCurrentUserMock({
                        user: mockValidUser(),
                        statusCode: 200,
                    }),
                    fetchRateWithQuestionsMockSuccess({
                        rate: {
                            ...rate,
                            id: '15',
                        },
                    }),
                ],
            },
            routerProvider: {
                route: `/submissions/25/rates/15/question-and-answers/dmco/${questionID}/upload-response`,
            },
        })
        await screen.findByRole('heading', {
            name: /Upload response/,
            level: 2,
        })
        const continueButton = screen.getByRole('button', {
            name: 'Send response',
        })

        const targetEl = screen.getByTestId('file-input-droptarget')
        dragAndDrop(targetEl, [TEST_PNG_FILE])

        expect(
            await screen.findByText('This is not a valid file type.')
        ).toBeInTheDocument()

        expect(continueButton).not.toHaveAttribute('aria-disabled')
        continueButton.click()

        expect(
            await screen.findAllByText('You must upload at least one document')
        ).toHaveLength(2)
    })

    it('displays file upload error alert if attempting to add question while a file is still uploading', async () => {
        const rate = mockRateSubmittedWithQuestions({ id: '15' })

        renderWithProviders(renderTestUI(), {
            apolloProvider: {
                mocks: [
                    fetchCurrentUserMock({
                        user: mockValidUser(),
                        statusCode: 200,
                    }),
                    fetchRateWithQuestionsMockSuccess({
                        rate: {
                            ...rate,
                            id: '15',
                        },
                    }),
                ],
            },
            routerProvider: {
                route: `/submissions/25/rates/15/question-and-answers/dmco/${questionID}/upload-response`,
            },
        })
        await screen.findByRole('heading', {
            name: /Upload response/,
            level: 2,
        })
        const continueButton = screen.getByRole('button', {
            name: 'Send response',
        })
        const targetEl = screen.getByTestId('file-input-droptarget')

        // upload one file
        dragAndDrop(targetEl, [TEST_PDF_FILE])
        const imageElFile1 = screen.getByTestId('file-input-preview-image')
        expect(imageElFile1).toHaveClass('is-loading')
        await waitFor(() => expect(imageElFile1).not.toHaveClass('is-loading'))

        // upload second file
        dragAndDrop(targetEl, [TEST_DOC_FILE])

        const imageElFile2 = screen.getAllByTestId(
            'file-input-preview-image'
        )[1]
        expect(imageElFile2).toHaveClass('is-loading')
        fireEvent.click(continueButton)
        await waitFor(() => {
            expect(continueButton).toHaveAttribute('aria-disabled', 'true')
        })

        expect(
            await screen.findAllByText(
                'You must wait for all documents to finish uploading before continuing'
            )
        ).toHaveLength(2)
    })

    it('displays api error if createRateQuestionResponse fails', async () => {
        const rate = mockRateSubmittedWithQuestions({ id: '15' })

        renderWithProviders(renderTestUI(), {
            apolloProvider: {
                mocks: [
                    fetchCurrentUserMock({
                        user: mockValidUser(),
                        statusCode: 200,
                    }),
                    fetchRateWithQuestionsMockSuccess({
                        rate: {
                            ...rate,
                            id: '15',
                        },
                    }),
                    createRateQuestionResponseNetworkFailure({
                       questionID: questionID,
                       documents: [],
                    }),
                ],
            },
            routerProvider: {
                route: `/submissions/25/rates/15/question-and-answers/dmco/${questionID}/upload-response`,
            },
        })
        await screen.findByRole('heading', {
            name: /Upload response/,
            level: 2,
        })
        const createQuestionButton = screen.getByRole('button', {
            name: 'Send response',
        })
        const input = screen.getByLabelText('Upload response')

        await userEvent.upload(input, [TEST_DOC_FILE])
        await screen.findByText(TEST_DOC_FILE.name)
        await screen.findByText(/1 complete/)

        createQuestionButton.click()

        await screen.findByTestId('error-alert')
        expect(
            screen.getByText("We're having trouble loading this page.")
        ).toBeDefined()
    })
    describe('errors', () => {
        it('shows generic error if submission is a draft', async () => {
            const rate = mockRateSubmittedWithQuestions({
                id: '15',
                status: 'DRAFT',
            })
            renderWithProviders(
                <Routes>
                    <Route element={<SubmissionSideNav />}>
                        <Route
                            path={RoutesRecord.SUBMISSIONS_UPLOAD_RATE_RESPONSE}
                            element={<UploadRateResponse />}
                        />
                    </Route>
                </Routes>,
                {
                    apolloProvider: {
                        mocks: [
                            fetchCurrentUserMock({
                                user: mockValidUser(),
                                statusCode: 200,
                            }),
                            fetchRateWithQuestionsMockSuccess({
                                rate: {
                                    ...rate,
                                    id: '15',
                                },
                            }),
                        ],
                    },
                    routerProvider: {
                        route: `/submissions/25/rates/15/question-and-answers/${division}/${questionID}/upload-response`,
                    },
                }
            )

            await waitFor(() => {
                expect(screen.getByText('System error')).toBeInTheDocument()
            })
        })
    })
})
