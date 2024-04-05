import { screen, waitFor } from '@testing-library/react'
import { RateDetailsV2 } from './RateDetailsV2'
import {
    TEST_DOC_FILE,
    TEST_PNG_FILE,
    dragAndDrop,
    renderWithProviders,
} from '../../../../testHelpers'
import {
    fetchCurrentUserMock,
    fetchContractMockSuccess,
    mockValidStateUser,
} from '../../../../testHelpers/apolloMocks'
import { Route, Routes } from 'react-router-dom'
import { RoutesRecord } from '../../../../constants'
import userEvent from '@testing-library/user-event'
import { rateRevisionDataMock } from '../../../../testHelpers/apolloMocks/rateDataMock'
import {
    fetchDraftRateMockSuccess,
    indexRatesMockSuccess,
} from '../../../../testHelpers/apolloMocks/rateGQLMocks'
import {
    clickAddNewRate,
    fillOutFirstRate,
    rateCertifications,
} from '../../../../testHelpers/jestRateHelpers'
import { Formik } from 'formik'
import { LinkYourRates } from '../../../LinkYourRates/LinkYourRates'

describe('handles edit  of a multi rate', () => {
    // TODO move into the existing multi rate test suite
    // when no longer being skipped
    it('renders without errors', async () => {
        const rateID = 'test-abc-123'
        renderWithProviders(
            <Routes>
                <Route
                    path={RoutesRecord.SUBMISSIONS_RATE_DETAILS}
                    element={<RateDetailsV2 type="MULTI" />}
                />
            </Routes>,
            {
                apolloProvider: {
                    mocks: [
                        fetchCurrentUserMock({ statusCode: 200 }),
                        fetchDraftRateMockSuccess({ id: rateID }),
                        fetchContractMockSuccess({
                            contract: {
                                id: 'test-abc-123',
                            },
                        }),
                    ],
                },
                routerProvider: {
                    route: `/submissions/test-abc-123/edit/rate-details`,
                },
                featureFlags: {
                    'link-rates': true,
                    'rate-edit-unlock': false,
                },
            }
        )

        await screen.findByText('Rate Details')
        expect(
            screen.getByText(
                'Was this rate certification included with another submission?'
            )
        ).toBeInTheDocument()
        expect(
            screen.queryByText('Upload one rate certification document')
        ).not.toBeInTheDocument()
    })
})

//eslint-disable-next-line
describe.skip('RateDetailsv2', () => {
    describe('handles edit  of a single rate', () => {
        it('renders without errors', async () => {
            const rateID = 'test-abc-123'
            renderWithProviders(
                <Routes>
                    <Route
                        path={RoutesRecord.RATE_EDIT}
                        element={<RateDetailsV2 type="SINGLE" />}
                    />
                </Routes>,
                {
                    apolloProvider: {
                        mocks: [
                            fetchCurrentUserMock({ statusCode: 200 }),
                            fetchDraftRateMockSuccess({ id: rateID }),
                        ],
                    },
                    routerProvider: {
                        route: `/rates/${rateID}/edit`,
                    },
                }
            )

            await screen.findByText('Rate Details')
            await screen.findByText(/Rate certification/)
            await screen.findByText('Upload one rate certification document')

            expect(
                screen.getByRole('button', { name: 'Submit' })
            ).not.toHaveAttribute('aria-disabled')
            const requiredLabels = await screen.findAllByText('Required')
            expect(requiredLabels).toHaveLength(7)
            const optionalLabels = screen.queryAllByText('Optional')
            expect(optionalLabels).toHaveLength(1)
        })

        describe('submit', () => {
            it('enabled on initial load but disabled with alert if valid rate cert file replaced with invalid file', async () => {
                const rateID = 'abc-123'
                renderWithProviders(
                    <Routes>
                        <Route
                            path={RoutesRecord.RATE_EDIT}
                            element={<RateDetailsV2 type="SINGLE" />}
                        />
                    </Routes>,
                    {
                        apolloProvider: {
                            mocks: [
                                fetchCurrentUserMock({ statusCode: 200 }),
                                fetchDraftRateMockSuccess({ id: rateID }),
                            ],
                        },
                        routerProvider: {
                            route: `/rates/${rateID}/edit`,
                        },
                    }
                )
                await screen.findByText('Rate certification')

                const input = screen.getByLabelText(
                    'Upload one rate certification document'
                )
                const targetEl = screen.getAllByTestId(
                    'file-input-droptarget'
                )[0]

                await userEvent.upload(input, [TEST_DOC_FILE])
                dragAndDrop(targetEl, [TEST_PNG_FILE])

                await waitFor(() => {
                    const submitButton = screen.getByRole('button', {
                        name: 'Submit',
                    })
                    expect(
                        screen.getByText('This is not a valid file type.')
                    ).toBeInTheDocument()
                    expect(submitButton).not.toHaveAttribute('aria-disabled')
                })
            })
            // eslint-disable-next-line
            it.skip('disabled with alert if previously submitted with more than one rate cert file', async () => {
                const rateID = 'abc-123'
                renderWithProviders(
                    <Routes>
                        <Route
                            path={RoutesRecord.RATE_EDIT}
                            element={<RateDetailsV2 type="SINGLE" />}
                        />
                    </Routes>,
                    {
                        apolloProvider: {
                            mocks: [
                                fetchCurrentUserMock({ statusCode: 200 }),
                                fetchDraftRateMockSuccess({
                                    id: rateID,
                                    draftRevision: {
                                        ...rateRevisionDataMock(),
                                        formData: {
                                            ...rateRevisionDataMock().formData,
                                            rateDocuments: [
                                                {
                                                    s3URL: 's3://bucketname/one-one/one-one.png',
                                                    name: 'one one',
                                                    sha256: 'fakeSha1',
                                                },
                                                {
                                                    s3URL: 's3://bucketname/one-two/one-two.png',
                                                    name: 'one two',
                                                    sha256: 'fakeSha2',
                                                },
                                                {
                                                    s3URL: 's3://bucketname/one-three/one-three.png',
                                                    name: 'one three',
                                                    sha256: 'fakeSha3',
                                                },
                                            ],
                                        },
                                    },
                                }),
                            ],
                        },
                        routerProvider: {
                            route: `/rates/${rateID}/edit`,
                        },
                    }
                )

                await screen.findByText('Rate certification')
                const submitButton = screen.getByRole('button', {
                    name: 'Submit',
                })
                expect(submitButton).not.toHaveAttribute('aria-disabled')

                submitButton.click()

                await waitFor(() => {
                    expect(
                        screen.getAllByText(
                            'Only one document is allowed for a rate certification. You must remove documents before continuing.'
                        )
                    ).toHaveLength(2)

                    expect(submitButton).toHaveAttribute(
                        'aria-disabled',
                        'true'
                    )
                })
            })

            it.todo(
                'disabled with alert after first attempt to continue with invalid rate doc file'
            )
            it.todo(
                'disabled with alert when trying to continue while a file is still uploading'
            )
        })

        describe('Save as draft button', () => {
            it.todo('saves documents that were uploaded')
            it.todo('does not trigger form validations')
            it.todo('trigger duplicate file validations')
        })

        describe('Back button', () => {
            it.todo('saves documents that were uploaded')
            it.todo('does not trigger form validations')
            it.todo('does not trigger duplicate file validations')
        })
    })

    describe('handles editing multiple rates', () => {
        it.todo('handles multiple rates')
        //eslint-disable-next-line
        it.skip('add rate button will increase number of rate certification fields on the', async () => {
            const rateID = '123-dfg'
            renderWithProviders(
                <Routes>
                    <Route
                        path={RoutesRecord.SUBMISSIONS_RATE_DETAILS}
                        element={<RateDetailsV2 type="MULTI" />}
                    />
                </Routes>,
                {
                    apolloProvider: {
                        mocks: [
                            fetchCurrentUserMock({ statusCode: 200 }),
                            // fetchContractMockSuccess({ id: rateID }),
                        ],
                    },
                    routerProvider: {
                        route: `/submissions/${rateID}/edit`,
                    },
                }
            )

            const rateCertsOnLoad = rateCertifications(screen)
            expect(rateCertsOnLoad).toHaveLength(1)

            await fillOutFirstRate(screen)

            await clickAddNewRate(screen)

            await waitFor(() => {
                const rateCertsAfterAddAnother = rateCertifications(screen)
                expect(rateCertsAfterAddAnother).toHaveLength(2)
            })
        })
        //eslint-disable-next-line
        it.skip('disabled with alert after first attempt to continue with invalid duplicate files', async () => {
            const rateID = '123-dfg'
            renderWithProviders(
                <Routes>
                    <Route
                        path={RoutesRecord.SUBMISSIONS_RATE_DETAILS}
                        element={<RateDetailsV2 type="MULTI" />}
                    />
                </Routes>,
                {
                    apolloProvider: {
                        mocks: [
                            fetchCurrentUserMock({ statusCode: 200 }),
                            // fetchContractMockSuccess({ id: rateID }),
                        ],
                    },
                    routerProvider: {
                        route: `/submissions/${rateID}/edit`,
                    },
                }
            )
            await screen.findByText('Rate certification')
            const input = screen.getByLabelText(
                'Upload one rate certification document'
            )
            const submitButton = screen.getByRole('button', {
                name: 'Submit',
            })

            await userEvent.upload(input, TEST_DOC_FILE)
            await userEvent.upload(input, [])
            await userEvent.upload(input, TEST_DOC_FILE)
            expect(submitButton).not.toHaveAttribute('aria-disabled')

            submitButton.click()

            await screen.findAllByText(
                'You must remove all documents with error messages before continuing'
            )
            expect(submitButton).toHaveAttribute('aria-disabled', 'true')
        })

        it.todo(
            'renders remove rate certification button, which removes set of rate certification fields from the form'
        )
        it.todo('accepts documents on second rate')
        it.todo('cannot continue with partially filled out second rate')
    })

    describe('can link esisting rate', () => {
        it('renders without errors', async () => {
            renderWithProviders(
                <Formik
                    initialValues={{ ratePreviouslySubmitted: '' }}
                    onSubmit={(values) => console.info('submitted', values)}
                >
                    <form>
                        <LinkYourRates
                            fieldNamePrefix="rateForms.1"
                            index={1}
                            autofill={jest.fn()}
                        />
                    </form>
                </Formik>,
                {
                    apolloProvider: {
                        mocks: [
                            fetchCurrentUserMock({
                                statusCode: 200,
                                user: mockValidStateUser(),
                            }),
                            indexRatesMockSuccess(),
                        ],
                    },
                }
            )

            await waitFor(() => {
                expect(
                    screen.queryByText(
                        'Was this rate certification included with another submission?'
                    )
                ).toBeInTheDocument()
            })
        })

        it('does not display dropdown menu if no is selected', async () => {
            const rateID = 'test-abc-123'
            const { user } = renderWithProviders(
                <Routes>
                    <Route
                        path={RoutesRecord.SUBMISSIONS_RATE_DETAILS}
                        element={<RateDetailsV2 type="MULTI" />}
                    />
                </Routes>,
                {
                    apolloProvider: {
                        mocks: [
                            fetchCurrentUserMock({ statusCode: 200 }),
                            fetchDraftRateMockSuccess({ id: rateID }),
                            fetchContractMockSuccess({
                                contract: {
                                    id: 'test-abc-123',
                                },
                            }),
                        ],
                    },
                    routerProvider: {
                        route: `/submissions/test-abc-123/edit/rate-details`,
                    },
                    featureFlags: {
                        'link-rates': true,
                        'rate-edit-unlock': false,
                    },
                }
            )

            //Making sure page loads
            await screen.findByText('Rate Details')
            expect(
                screen.getByText(
                    'Was this rate certification included with another submission?'
                )
            ).toBeInTheDocument()

            //Click the no button and assert the dropdown does not appear
            const noRadioButton = screen.getByLabelText(
                'No, this rate certification was not included with any other submissions'
            )
            await user.click(noRadioButton)
            await waitFor(() => {
                expect(
                    screen.queryByText('Which rate certification was it?')
                ).not.toBeInTheDocument()
            })
        })

        it('displays dropdown menu if yes is selected', async () => {
            const rateID = 'test-abc-123'
            const { user } = renderWithProviders(
                <Routes>
                    <Route
                        path={RoutesRecord.SUBMISSIONS_RATE_DETAILS}
                        element={<RateDetailsV2 type="MULTI" />}
                    />
                </Routes>,
                {
                    apolloProvider: {
                        mocks: [
                            indexRatesMockSuccess(),
                            fetchCurrentUserMock({ statusCode: 200 }),
                            fetchDraftRateMockSuccess({ id: rateID }),
                            fetchContractMockSuccess({
                                contract: {
                                    id: 'test-abc-123',
                                },
                            }),
                            fetchDraftRateMockSuccess({
                                id: rateID,
                                draftRevision: {
                                    ...rateRevisionDataMock(),
                                    formData: {
                                        ...rateRevisionDataMock().formData,
                                        rateDocuments: [
                                            {
                                                s3URL: 's3://bucketname/one-one/one-one.png',
                                                name: 'one one',
                                                sha256: 'fakeSha1',
                                            },
                                            {
                                                s3URL: 's3://bucketname/one-two/one-two.png',
                                                name: 'one two',
                                                sha256: 'fakeSha2',
                                            },
                                            {
                                                s3URL: 's3://bucketname/one-three/one-three.png',
                                                name: 'one three',
                                                sha256: 'fakeSha3',
                                            },
                                        ],
                                    },
                                },
                            }),
                        ],
                    },
                    routerProvider: {
                        route: `/submissions/test-abc-123/edit/rate-details`,
                    },
                    featureFlags: {
                        'link-rates': true,
                        'rate-edit-unlock': false,
                    },
                }
            )

            //Making sure page loads
            await screen.findByText('Rate Details')
            expect(
                screen.getByText(
                    'Was this rate certification included with another submission?'
                )
            ).toBeInTheDocument()

            //Click the yes button and assert it's clickable and checked
            const yesRadioButton = screen.getByRole('radio', {
                name: 'Yes, this rate certification is part of another submission',
            })
            expect(yesRadioButton).toBeInTheDocument()
            await user.click(yesRadioButton)
            expect(yesRadioButton).toBeChecked()

            // Assert the dropdown has rendered
            await waitFor(() => {
                expect(
                    screen.getByText('Which rate certification was it?')
                ).toBeInTheDocument()
                expect(screen.getByRole('combobox')).toBeInTheDocument()
            })

            // Assert the options menu is open
            const dropdownMenu = screen.getByRole('listbox')
            expect(dropdownMenu).toBeInTheDocument()

            // Assert options are present
            const dropdownOptions = screen.getAllByRole('option')
            expect(dropdownOptions).toHaveLength(3)
        })

        it('removes the selected option from the dropdown list', async () => {
            const rateID = 'test-abc-123'
            const { user } = renderWithProviders(
                <Routes>
                    <Route
                        path={RoutesRecord.SUBMISSIONS_RATE_DETAILS}
                        element={<RateDetailsV2 type="MULTI" />}
                    />
                </Routes>,
                {
                    apolloProvider: {
                        mocks: [
                            indexRatesMockSuccess(),
                            fetchCurrentUserMock({ statusCode: 200 }),
                            fetchDraftRateMockSuccess({ id: rateID }),
                            fetchContractMockSuccess({
                                contract: {
                                    id: 'test-abc-123',
                                },
                            }),
                            fetchDraftRateMockSuccess({
                                id: rateID,
                                draftRevision: {
                                    ...rateRevisionDataMock(),
                                    formData: {
                                        ...rateRevisionDataMock().formData,
                                        rateDocuments: [
                                            {
                                                s3URL: 's3://bucketname/one-one/one-one.png',
                                                name: 'one one',
                                                sha256: 'fakeSha1',
                                            },
                                            {
                                                s3URL: 's3://bucketname/one-two/one-two.png',
                                                name: 'one two',
                                                sha256: 'fakeSha2',
                                            },
                                            {
                                                s3URL: 's3://bucketname/one-three/one-three.png',
                                                name: 'one three',
                                                sha256: 'fakeSha3',
                                            },
                                        ],
                                    },
                                },
                            }),
                        ],
                    },
                    routerProvider: {
                        route: `/submissions/test-abc-123/edit/rate-details`,
                    },
                    featureFlags: {
                        'link-rates': true,
                        'rate-edit-unlock': false,
                    },
                }
            )

            //Making sure page loads
            await screen.findByText('Rate Details')
            expect(
                screen.getByText(
                    'Was this rate certification included with another submission?'
                )
            ).toBeInTheDocument()

            //Click the yes button to trigger dropdown
            const yesRadioButton = screen.getByRole('radio', {
                name: 'Yes, this rate certification is part of another submission',
            })
            await user.click(yesRadioButton)

            // Assert that the selected value is removed from the list of options
            const option = screen
                .getByRole('listbox')
                .querySelector('#react-select-2-option-0')
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            await user.click(option!)

            await waitFor(() => {
                expect(screen.getByRole('listbox')).toBeInTheDocument()
                expect(option).not.toBeInTheDocument()
            })
        })

        it('returns the unselected option to the dropdown list', async () => {
            const rateID = 'test-abc-123'
            const { user } = renderWithProviders(
                <Routes>
                    <Route
                        path={RoutesRecord.SUBMISSIONS_RATE_DETAILS}
                        element={<RateDetailsV2 type="MULTI" />}
                    />
                </Routes>,
                {
                    apolloProvider: {
                        mocks: [
                            indexRatesMockSuccess(),
                            fetchCurrentUserMock({ statusCode: 200 }),
                            fetchDraftRateMockSuccess({ id: rateID }),
                            fetchContractMockSuccess({
                                contract: {
                                    id: 'test-abc-123',
                                },
                            }),
                            fetchDraftRateMockSuccess({
                                id: rateID,
                                draftRevision: {
                                    ...rateRevisionDataMock(),
                                    formData: {
                                        ...rateRevisionDataMock().formData,
                                        rateDocuments: [
                                            {
                                                s3URL: 's3://bucketname/one-one/one-one.png',
                                                name: 'one one',
                                                sha256: 'fakeSha1',
                                            },
                                            {
                                                s3URL: 's3://bucketname/one-two/one-two.png',
                                                name: 'one two',
                                                sha256: 'fakeSha2',
                                            },
                                            {
                                                s3URL: 's3://bucketname/one-three/one-three.png',
                                                name: 'one three',
                                                sha256: 'fakeSha3',
                                            },
                                        ],
                                    },
                                },
                            }),
                        ],
                    },
                    routerProvider: {
                        route: `/submissions/test-abc-123/edit/rate-details`,
                    },
                    featureFlags: {
                        'link-rates': true,
                        'rate-edit-unlock': false,
                    },
                }
            )

            //Making sure page loads
            await screen.findByText('Rate Details')
            expect(
                screen.getByText(
                    'Was this rate certification included with another submission?'
                )
            ).toBeInTheDocument()

            //Click the yes button to trigger dropdown
            const yesRadioButton = screen.getByRole('radio', {
                name: 'Yes, this rate certification is part of another submission',
            })
            await user.click(yesRadioButton)

            // Checking that the selected value is removed from the list of options
            const option = screen
                .getByRole('listbox')
                .querySelector('#react-select-2-option-0')
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            await user.click(option!)

            const clearSelectionButton = screen
                .getByRole('combobox')
                .querySelector('.select__clear-indicator')
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            await user.click(clearSelectionButton!)

            await waitFor(() => {
                const option = screen
                    .getByRole('listbox')
                    .querySelector('#react-select-5-option-0')
                expect(option).toBeInTheDocument()
            })
        })
    })
})
