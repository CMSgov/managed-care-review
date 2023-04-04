/* eslint-disable @typescript-eslint/no-non-null-assertion */
import userEvent from '@testing-library/user-event'
import { screen, waitFor, within } from '@testing-library/react'
import selectEvent from 'react-select-event'
import { fetchCurrentUserMock } from '../../../testHelpers/apolloMocks'
import {
    ldUseClientSpy,
    renderWithProviders,
} from '../../../testHelpers/jestHelpers'
import { SubmissionType, SubmissionTypeFormValues } from './'
import { Formik } from 'formik'
import { contractOnly } from '../../../common-code/healthPlanFormDataMocks'

describe('SubmissionType', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    const SubmissionTypeInitialValues: SubmissionTypeFormValues = {
        programIDs: ['ccc-plus'],
        riskBasedContract: '',
        submissionDescription: '',
        submissionType: '',
        contractType: '',
    }
    const updateDraftMock = jest.fn()

    it('displays correct form guidance', async () => {
        renderWithProviders(<SubmissionType updateDraft={updateDraftMock} />, {
            apolloProvider: {
                mocks: [fetchCurrentUserMock({ statusCode: 200 })],
            },
        })

        expect(screen.getByText(/All fields are required/)).toBeInTheDocument()
    })

    it('displays submission type form when expected', async () => {
        renderWithProviders(
            <SubmissionType
                updateDraft={updateDraftMock}
                draftSubmission={contractOnly()}
            />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        expect(
            await screen.getByRole('form', { name: 'Submission Type Form' })
        ).toBeInTheDocument()
        expect(
            await screen.getByRole('button', {
                name: 'Save as draft',
            })
        ).toBeDefined()
        expect(
            await screen.getByRole('button', {
                name: 'Cancel',
            })
        ).toBeDefined()
        expect(
            await screen.getByRole('button', {
                name: 'Continue',
            })
        ).toBeDefined()
    })

    it('displays new submission form when expected', async () => {
        renderWithProviders(<SubmissionType updateDraft={updateDraftMock} />, {
            apolloProvider: {
                mocks: [fetchCurrentUserMock({ statusCode: 200 })],
            },
            routerProvider: {
                route: '/submissions/new',
            },
        })

        expect(
            await screen.getByRole('form', { name: 'New Submission Form' })
        ).toBeInTheDocument()
        expect(
            await screen.queryByRole('button', {
                name: 'Save as draft',
            })
        ).toBeNull()

        expect(
            await screen.getByRole('button', {
                name: 'Cancel',
            })
        ).toBeDefined()
        expect(
            await screen.getByRole('button', {
                name: 'Continue',
            })
        ).toBeDefined()
    })

    describe('Feature flagged population coverage questions', () => {
        beforeEach(() => {
            ldUseClientSpy({ 'chip-only-form': true })
        })
        it('displays population coverage question', async () => {
            renderWithProviders(
                <Formik
                    initialValues={SubmissionTypeInitialValues}
                    onSubmit={jest.fn()}
                >
                    <SubmissionType updateDraft={updateDraftMock} />
                </Formik>,
                {
                    apolloProvider: {
                        mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                    },
                }
            )

            expect(
                await screen.getByText(
                    'Which populations does this contact action cover?'
                )
            ).toBeInTheDocument()
            expect(
                await screen.getByRole('radio', { name: 'Medicaid' })
            ).toBeInTheDocument()
            expect(
                await screen.getByRole('radio', { name: 'CHIP-only' })
            ).toBeInTheDocument()
            expect(
                await screen.getByRole('radio', { name: 'Medicaid & CHIP' })
            ).toBeInTheDocument()
        })
        it('disables contract and rates submission type radio and displays hint when CHIP only is selected', async () => {
            renderWithProviders(
                <Formik
                    initialValues={SubmissionTypeInitialValues}
                    onSubmit={jest.fn()}
                >
                    <SubmissionType updateDraft={updateDraftMock} />
                </Formik>,
                {
                    apolloProvider: {
                        mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                    },
                }
            )

            expect(
                await screen.getByText(
                    'Which populations does this contact action cover?'
                )
            ).toBeInTheDocument()
            const chipOnlyRadio = await screen.getByRole('radio', {
                name: 'CHIP-only',
            })

            // Select Chip only population coverage
            await userEvent.click(chipOnlyRadio)

            // Contract and rates radio is disabled
            expect(
                await screen.getByRole('radio', {
                    name: 'Contract action and rate certification',
                })
            ).toHaveAttribute('disabled')

            // Shows hint for submission type
            expect(
                await screen.getByText(
                    'States are not required to submit rates with CHIP-only contracts.'
                )
            ).toBeInTheDocument()
        })
        it('clears contract and rates submission type radio when switching to CHIP-only population coverage', async () => {
            renderWithProviders(
                <Formik
                    initialValues={SubmissionTypeInitialValues}
                    onSubmit={jest.fn()}
                >
                    <SubmissionType updateDraft={updateDraftMock} />
                </Formik>,
                {
                    apolloProvider: {
                        mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                    },
                }
            )

            expect(
                await screen.getByText(
                    'Which populations does this contact action cover?'
                )
            ).toBeInTheDocument()
            const medicaidRadio = await screen.getByRole('radio', {
                name: 'Medicaid',
            })
            const contractAndRatesRadio = await screen.getByRole('radio', {
                name: 'Contract action and rate certification',
            })

            // Click Medicaid population coverage radio
            await userEvent.click(medicaidRadio)

            // Click contract and rates submission type
            await userEvent.click(contractAndRatesRadio)

            // Expect contract and rates radio to be selected
            expect(contractAndRatesRadio).toBeChecked()

            const chipOnlyRadio = await screen.getByRole('radio', {
                name: 'CHIP-only',
            })

            // Change population coverage to Chip only
            await userEvent.click(chipOnlyRadio)

            // Contract and rates radio is unselected and disabled
            expect(contractAndRatesRadio).not.toBeChecked()
            expect(contractAndRatesRadio).toHaveAttribute('disabled')

            // Shows hint for submission type
            expect(
                await screen.getByText(
                    'States are not required to submit rates with CHIP-only contracts.'
                )
            ).toBeInTheDocument()
        })
        it('does not clear contract only submission type radio when switching to CHIP-only population coverage', async () => {
            renderWithProviders(
                <Formik
                    initialValues={SubmissionTypeInitialValues}
                    onSubmit={jest.fn()}
                >
                    <SubmissionType updateDraft={updateDraftMock} />
                </Formik>,
                {
                    apolloProvider: {
                        mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                    },
                }
            )

            expect(
                await screen.getByText(
                    'Which populations does this contact action cover?'
                )
            ).toBeInTheDocument()
            const medicaidRadio = await screen.getByRole('radio', {
                name: 'Medicaid',
            })
            const contractOnlyRadio = await screen.getByRole('radio', {
                name: 'Contract action only',
            })

            // Click Medicaid population coverage radio
            await userEvent.click(medicaidRadio)

            // Click contract only submission type
            await userEvent.click(contractOnlyRadio)

            // Expect contract only radio to be selected
            expect(contractOnlyRadio).toBeChecked()

            const chipOnlyRadio = await screen.getByRole('radio', {
                name: 'CHIP-only',
            })

            // Change population coverage to Chip only
            await userEvent.click(chipOnlyRadio)

            // Contract only radio is still selected
            expect(contractOnlyRadio).toBeChecked()
        })
        it('shows validation message when population coverage is not selected', async () => {
            renderWithProviders(
                <Formik
                    initialValues={SubmissionTypeInitialValues}
                    onSubmit={jest.fn()}
                >
                    <SubmissionType updateDraft={updateDraftMock} />
                </Formik>,
                {
                    apolloProvider: {
                        mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                    },
                }
            )

            // Expect population coverage question and radios
            expect(
                await screen.getByText(
                    'Which populations does this contact action cover?'
                )
            ).toBeInTheDocument()
            expect(
                await screen.getByRole('radio', { name: 'Medicaid' })
            ).toBeInTheDocument()
            expect(
                await screen.getByRole('radio', { name: 'CHIP-only' })
            ).toBeInTheDocument()
            expect(
                await screen.getByRole('radio', { name: 'Medicaid & CHIP' })
            ).toBeInTheDocument()

            // Test validations work.
            await userEvent.click(
                screen.getByRole('button', { name: 'Continue' })
            )
            await screen.findByTestId('error-summary')
            await screen.findAllByText(
                'You must select the population this contract covers'
            )
        })
    })

    it('displays programs select dropdown', async () => {
        renderWithProviders(
            <Formik
                initialValues={SubmissionTypeInitialValues}
                onSubmit={jest.fn()}
            >
                <SubmissionType updateDraft={updateDraftMock} />
            </Formik>,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        expect(
            await screen.getByRole('combobox', {
                name: 'Programs this contract action covers (required)',
            })
        ).toBeInTheDocument()
    })

    it('displays program options based on current user state', async () => {
        const mockUser = {
            __typename: 'StateUser' as const,
            role: 'STATE_USER',
            name: 'Sheena in Minnesota',
            email: 'Sheena@dmas.mn.gov',
            state: {
                name: 'Minnesota',
                code: 'MN',
                programs: [
                    { id: 'first', name: 'Program 1', fullName: 'Program 1' },
                    {
                        id: 'second',
                        name: 'Program Test',
                        fullName: 'Program Test',
                    },
                    { id: 'third', name: 'Program 3', fullName: 'Program 3' },
                ],
            },
        }
        renderWithProviders(
            <Formik
                initialValues={SubmissionTypeInitialValues}
                onSubmit={jest.fn()}
            >
                <SubmissionType updateDraft={updateDraftMock} />
            </Formik>,
            {
                apolloProvider: {
                    mocks: [
                        fetchCurrentUserMock({
                            statusCode: 200,
                            user: mockUser,
                        }),
                    ],
                },
            }
        )
        const combobox = await screen.findByRole('combobox')

        await selectEvent.openMenu(combobox)

        await waitFor(() => {
            expect(screen.getByText('Program 3')).toBeInTheDocument()
        })

        await selectEvent.select(combobox, 'Program 1')
        await selectEvent.openMenu(combobox)
        await selectEvent.select(combobox, 'Program 3')

        // in react-select, only items that are selected have a "remove item" label
        expect(screen.getByLabelText('Remove Program 1')).toBeInTheDocument()
        expect(screen.getByLabelText('Remove Program 3')).toBeInTheDocument()
    })

    it('displays submission type radio buttons', async () => {
        renderWithProviders(
            <Formik
                initialValues={SubmissionTypeInitialValues}
                onSubmit={jest.fn()}
            >
                <SubmissionType updateDraft={updateDraftMock} />
            </Formik>,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        expect(
            await screen.getByRole('radio', { name: 'Contract action only' })
        ).toBeInTheDocument()
        expect(
            await screen.getByRole('radio', {
                name: 'Contract action and rate certification',
            })
        ).toBeInTheDocument()
    })

    it('displays contract type radio buttons', async () => {
        renderWithProviders(
            <Formik
                initialValues={SubmissionTypeInitialValues}
                onSubmit={jest.fn()}
            >
                <SubmissionType updateDraft={updateDraftMock} />
            </Formik>,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        expect(
            await screen.getByRole('radio', { name: 'Base contract' })
        ).toBeInTheDocument()
        expect(
            await screen.getByRole('radio', {
                name: 'Amendment to base contract',
            })
        ).toBeInTheDocument()
    })

    it('displays risk-based contract radio buttons and validation message', async () => {
        renderWithProviders(
            <Formik
                initialValues={SubmissionTypeInitialValues}
                onSubmit={jest.fn()}
            >
                <SubmissionType updateDraft={updateDraftMock} />
            </Formik>,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        // setup
        const riskBasedContract = screen.getByText(
            /Is this a risk-based contract/
        )
        const riskBasedContractParent = riskBasedContract.parentElement
        expect(riskBasedContract).toBeInTheDocument()
        expect(riskBasedContractParent).toBeDefined()

        // check that fields are on page
        expect(
            within(riskBasedContractParent!).getByLabelText('Yes')
        ).toBeInTheDocument()
        expect(
            within(riskBasedContractParent!).getByLabelText('No')
        ).toBeInTheDocument()

        // check that validations work
        await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
        await screen.findByTestId('error-summary')
        await screen.findAllByText('You must select yes or no')
        await userEvent.click(
            within(riskBasedContractParent!).getByLabelText('No')
        )
        await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    })

    it('displays submission description textarea', async () => {
        renderWithProviders(
            <Formik
                initialValues={SubmissionTypeInitialValues}
                onSubmit={jest.fn()}
            >
                <SubmissionType updateDraft={updateDraftMock} />
            </Formik>,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )
        expect(
            await screen.getByRole('textbox', {
                name: 'Submission description',
            })
        ).toBeInTheDocument()
    })

    describe('validations', () => {
        it('does not show error validations on initial load', async () => {
            renderWithProviders(
                <SubmissionType updateDraft={updateDraftMock} />,
                {
                    apolloProvider: {
                        mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                    },
                }
            )

            expect(await screen.getByRole('textbox')).not.toHaveClass(
                'usa-input--error'
            )
            expect(
                await screen.queryByText('You must choose a submission type')
            ).toBeNull()
            expect(
                await screen.queryByText(
                    'You must provide a description of any major changes or updates'
                )
            ).toBeNull()
        })

        it('shows error messages when there are validation errors and showValidations is true', async () => {
            renderWithProviders(
                <SubmissionType
                    updateDraft={updateDraftMock}
                    showValidations={true}
                />,

                {
                    apolloProvider: {
                        mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                    },
                }
            )
            const textarea = screen.getByRole('textbox', {
                name: 'Submission description',
            })

            expect(await textarea).toBeInTheDocument()

            //trigger validation
            await userEvent.type(textarea, 'something')
            await userEvent.clear(textarea)

            await waitFor(() => {
                expect(textarea).toHaveClass('usa-input--error')
                expect(
                    screen.getAllByText('You must choose a submission type')
                ).toHaveLength(2)
            })
        })

        it('shows error messages when contract type is not selected', async () => {
            renderWithProviders(
                <SubmissionType
                    updateDraft={updateDraftMock}
                    showValidations={true}
                />,

                {
                    apolloProvider: {
                        mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                    },
                }
            )
            const textarea = screen.getByRole('textbox', {
                name: 'Submission description',
            })

            expect(await textarea).toBeInTheDocument()

            const submissionType = await screen.findByText(
                'Contract action only'
            )
            await userEvent.click(submissionType)

            //trigger validation
            await userEvent.type(textarea, 'something')
            await userEvent.clear(textarea)

            await waitFor(() => {
                expect(textarea).toHaveClass('usa-input--error')
                expect(
                    screen.getAllByText('You must choose a contract type')
                ).toHaveLength(2)
            })
        })

        it('do not show error messages when showValidations is false', async () => {
            renderWithProviders(
                <SubmissionType
                    updateDraft={updateDraftMock}
                    showValidations={false}
                />,
                {
                    apolloProvider: {
                        mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                    },
                }
            )
            const textarea = screen.getByRole('textbox', {
                name: 'Submission description',
            })
            expect(textarea).toBeInTheDocument()

            //trigger validation
            await userEvent.type(textarea, 'something')
            await userEvent.clear(textarea)

            await waitFor(() => {
                expect(textarea).not.toHaveClass('usa-input--error')
                expect(
                    screen.queryByText('You must choose a submission type')
                ).toBeNull()
            })
        })

        it('if form fields are invalid, shows validation error messages when continue button is clicked', async () => {
            renderWithProviders(
                <SubmissionType updateDraft={updateDraftMock} />,
                {
                    apolloProvider: {
                        mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                    },
                }
            )

            await userEvent.click(
                screen.getByRole('button', {
                    name: 'Continue',
                })
            )
            await waitFor(() => {
                expect(
                    screen.queryAllByText('You must choose a submission type')
                ).toHaveLength(2)
                expect(
                    screen.queryAllByText(
                        'You must provide a description of any major changes or updates'
                    )
                ).toHaveLength(2)
                expect(
                    screen.queryAllByText(
                        'You must select at least one program'
                    )
                ).toHaveLength(2)
            })
        })
    })
})
