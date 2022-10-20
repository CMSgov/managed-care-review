import { screen, waitFor, within } from '@testing-library/react'

import {
    mockDraft,
    mockContactAndRatesDraft,
    mockCompleteDraft,
    fetchCurrentUserMock,
} from '../../../testHelpers/apolloHelpers'

import {
    renderWithProviders,
    ldUseClientSpy,
} from '../../../testHelpers/jestHelpers'
import { Contacts } from './'
import userEvent from '@testing-library/user-event'

describe('Contacts', () => {
    afterEach(() => jest.clearAllMocks())

    it('renders without errors', async () => {
        const mockUpdateDraftFn = jest.fn()

        renderWithProviders(
            <Contacts
                draftSubmission={mockDraft()}
                updateDraft={mockUpdateDraftFn}
            />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        await waitFor(() => {
            expect(screen.getByTestId('state-contacts')).toBeInTheDocument()
            expect(screen.getByLabelText('Name')).toBeInTheDocument()
            expect(screen.getByLabelText('Title/Role')).toBeInTheDocument()
            expect(screen.getByLabelText('Email')).toBeInTheDocument()
        })
    })

    it('displays correct form guidance for contract only submission', async () => {
        renderWithProviders(
            <Contacts draftSubmission={mockDraft()} updateDraft={jest.fn()} />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        expect(
            screen.getByText(/A state contact is required/)
        ).toBeInTheDocument()
    })

    it('displays correct form guidance for contract and rates submission', async () => {
        renderWithProviders(
            <Contacts
                draftSubmission={mockContactAndRatesDraft()}
                updateDraft={jest.fn()}
            />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        expect(
            screen.getByText(/A state and an actuary contact are required/)
        ).toBeInTheDocument()
    })

    it('checks saved mocked state contacts correctly', async () => {
        const mockUpdateDraftFn = jest.fn()

        renderWithProviders(
            <Contacts
                draftSubmission={mockCompleteDraft()}
                updateDraft={mockUpdateDraftFn}
            />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        // checks the submission values in apollohelper mock
        expect(screen.getByLabelText('Name')).toHaveValue('Test Person')
        expect(screen.getByLabelText('Title/Role')).toHaveValue('A Role')
        expect(screen.getByLabelText('Email')).toHaveValue('test@test.com')
    })

    it('should error and not continue if state contacts are not filled out', async () => {
        const mock = mockDraft()
        const mockUpdateDraftFn = jest.fn()
        const emptyContactsDraft = {
            ...mock,
            stateContacts: [
                {
                    name: '',
                    titleRole: '',
                    email: '',
                },
            ],
        }

        renderWithProviders(
            <Contacts
                draftSubmission={emptyContactsDraft}
                updateDraft={mockUpdateDraftFn}
            />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        const continueButton = screen.getByRole('button', { name: 'Continue' })

        continueButton.click()

        await waitFor(() => {
            expect(screen.getAllByText('You must provide a name')).toHaveLength(
                2
            )
            expect(
                screen.getAllByText('You must provide a title/role')
            ).toHaveLength(2)
            expect(
                screen.getAllByText('You must provide an email address')
            ).toHaveLength(2)
        })
    })

    it('after "Add state contact" button click, should focus on the field name of the new contact', async () => {
        const mock = mockDraft()
        const mockUpdateDraftFn = jest.fn()

        renderWithProviders(
            <Contacts draftSubmission={mock} updateDraft={mockUpdateDraftFn} />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )
        const addStateContactButton = screen.getByRole('button', {
            name: 'Add another state contact',
        })
        const firstContactName = screen.getByLabelText('Name')

        await userEvent.type(firstContactName, 'First person')
        expect(firstContactName).toHaveFocus()

        addStateContactButton.click()

        await waitFor(() => {
            expect(screen.getAllByLabelText('Name')).toHaveLength(2)
            const secondContactName = screen.getAllByLabelText('Name')[1]
            expect(firstContactName).toHaveValue('First person')
            expect(firstContactName).not.toHaveFocus()

            expect(secondContactName).toHaveValue('')
            expect(secondContactName).toHaveFocus()
        })
    })

    it('after "Add actuary contact" button click, it should focus on the field name of the new actuary contact', async () => {
        const mock = mockContactAndRatesDraft()
        const mockUpdateDraftFn = jest.fn()

        renderWithProviders(
            <Contacts draftSubmission={mock} updateDraft={mockUpdateDraftFn} />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        const addActuaryContactButton = screen.getByRole('button', {
            name: 'Add another actuary contact',
        })
        const firstActuaryContactName = screen.getAllByLabelText('Name')[1]

        await userEvent.type(firstActuaryContactName, 'First actuary person')
        expect(firstActuaryContactName).toHaveFocus()

        addActuaryContactButton.click()

        await waitFor(() => {
            expect(
                screen.getByText('Add another actuary contact')
            ).toBeInTheDocument()

            expect(screen.getAllByLabelText('Name')).toHaveLength(3)

            const secondActuaryContactName = screen.getAllByLabelText('Name')[2]
            expect(firstActuaryContactName).toHaveValue('First actuary person')
            expect(firstActuaryContactName).not.toHaveFocus()

            expect(secondActuaryContactName).toHaveValue('')
            expect(secondActuaryContactName).toHaveFocus()
        })
    })

    it('after state contact "Remove contact" button click, should focus on add new contact button', async () => {
        const mock = mockDraft()
        const mockUpdateDraftFn = jest.fn()

        renderWithProviders(
            <Contacts draftSubmission={mock} updateDraft={mockUpdateDraftFn} />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )
        const addStateContactButton = screen.getByRole('button', {
            name: 'Add another state contact',
        })
        expect(addStateContactButton).toBeInTheDocument()
        await userEvent.click(addStateContactButton)

        expect(
            screen.getByRole('button', { name: 'Remove contact' })
        ).toBeInTheDocument()

        await userEvent.click(
            screen.getByRole('button', { name: 'Remove contact' })
        )

        expect(addStateContactButton).toHaveFocus()
    })

    it('after actuary contact "Remove contact" button click, should focus on add new actuary contact button', async () => {
        const mock = mockContactAndRatesDraft()
        const mockUpdateDraftFn = jest.fn()

        renderWithProviders(
            <Contacts draftSubmission={mock} updateDraft={mockUpdateDraftFn} />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )
        const addActuaryContactButton = screen.getByRole('button', {
            name: 'Add another actuary contact',
        })
        await userEvent.click(addActuaryContactButton)

        expect(
            screen.getByRole('button', { name: 'Remove contact' })
        ).toBeInTheDocument()

        await userEvent.click(
            screen.getByRole('button', { name: 'Remove contact' })
        )

        expect(addActuaryContactButton).toHaveFocus()
    })

    it('when there are multiple state contacts, they should numbered', async () => {
        const mock = mockContactAndRatesDraft()
        const mockUpdateDraftFn = jest.fn()

        renderWithProviders(
            <Contacts draftSubmission={mock} updateDraft={mockUpdateDraftFn} />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )
        const addStateContactButton = screen.getByRole('button', {
            name: 'Add another state contact',
        })
        addStateContactButton.click()

        await waitFor(() => {
            expect(screen.getByText(/State contacts 1/)).toBeInTheDocument()
            expect(screen.getByText('State contacts 2')).toBeInTheDocument()
        })
    })

    it('when there are multiple actuary contacts, they should numbered', async () => {
        const mock = mockContactAndRatesDraft()
        const mockUpdateDraftFn = jest.fn()

        renderWithProviders(
            <Contacts draftSubmission={mock} updateDraft={mockUpdateDraftFn} />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )
        const addActuaryContactButton = screen.getByRole('button', {
            name: 'Add another actuary contact',
        })
        addActuaryContactButton.click()
        addActuaryContactButton.click()
        await waitFor(() => {
            expect(
                screen.getByText('Additional actuary contact 1')
            ).toBeInTheDocument()
        })
    })

    /* This test is likely to time out if we use userEvent.type().  Converted to .paste() */
    it('when there are multiple state and actuary contacts, remove button works as expected', async () => {
        const mock = mockContactAndRatesDraft()
        const mockUpdateDraftFn = jest.fn()

        renderWithProviders(
            <Contacts draftSubmission={mock} updateDraft={mockUpdateDraftFn} />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        screen.getAllByLabelText('Name')[0].focus()
        await userEvent.paste('State Contact Person')

        screen.getAllByLabelText('Title/Role')[0].focus()
        await userEvent.paste('State Contact Title')

        screen.getAllByLabelText('Email')[0].focus()
        await userEvent.paste('statecontact@test.com')

        expect(screen.queryAllByTestId('errorMessage')).toHaveLength(0)

        // add actuary contact
        screen.getAllByLabelText('Name')[1].focus()
        await userEvent.paste('Actuary Contact Person')

        screen.getAllByLabelText('Title/Role')[1].focus()
        await userEvent.paste('Actuary Contact Title')

        screen.getAllByLabelText('Email')[1].focus()
        await userEvent.paste('actuarycontact@test.com')

        await userEvent.click(screen.getAllByLabelText('Mercer')[0])

        await userEvent.click(
            screen.getByText(
                `OACT can communicate directly with the state’s actuary but should copy the state on all written communication and all appointments for verbal discussions.`
            )
        )

        expect(screen.queryAllByTestId('errorMessage')).toHaveLength(0)

        // Add additional state contact
        await userEvent.click(
            screen.getByRole('button', {
                name: /Add another state contact/,
            })
        )

        screen.getAllByLabelText('Name')[1].focus()
        await userEvent.paste('State Contact Person 2')

        screen.getAllByLabelText('Title/Role')[1].focus()
        await userEvent.paste('State Contact Title 2')

        screen.getAllByLabelText('Email')[1].focus()
        await userEvent.paste('statecontact2@test.com')

        expect(screen.queryAllByTestId('errorMessage')).toHaveLength(0)

        // Add additional actuary contact
        await userEvent.click(
            screen.getByRole('button', {
                name: /Add another actuary contact/,
            })
        )

        screen.getAllByLabelText('Name')[1].focus()
        await userEvent.paste('Actuary Contact Person 2')

        screen.getAllByLabelText('Title/Role')[1].focus()
        await userEvent.paste('Actuary Contact Title 2')

        screen.getAllByLabelText('Email')[1].focus()
        await userEvent.paste('actuarycontact2@test.com')

        await userEvent.click(screen.getAllByLabelText('Mercer')[1])

        // Remove additional state contact
        expect(
            screen.getAllByRole('button', { name: /Remove contact/ })
        ).toHaveLength(2) // there are two remove contact buttons on screen, one for state one for actuary
        await userEvent.click(
            screen.getAllByRole('button', { name: /Remove contact/ })[0]
        )

        expect(screen.queryByText('State contact 2')).toBeNull()

        // Remove additional actuary contact
        expect(
            screen.getAllByRole('button', { name: /Remove contact/ })
        ).toHaveLength(1) // there is only 1 button on screen, for actuary

        await userEvent.click(
            screen.getAllByRole('button', { name: /Remove contact/ })[0]
        )

        expect(screen.queryByText('Additional actuary contact 1')).toBeNull()
    })

    it('text renders correctly when multi-rate-submissions flag is turned on', async () => {
        ldUseClientSpy({ 'multi-rate-submissions': true })
        const mock = mockContactAndRatesDraft()
        const mockUpdateDraftFn = jest.fn()

        renderWithProviders(
            <Contacts draftSubmission={mock} updateDraft={mockUpdateDraftFn} />,
            {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            }
        )

        //Make sure text on page is correct with multi-rate-submissions flag on, without any actuaries.
        expect(
            screen.queryByText('A state contact is required')
        ).toBeInTheDocument()
        expect(
            screen.queryByText('Additional Actuary Contacts')
        ).toBeInTheDocument()
        expect(
            screen.queryByText(
                'Provide contact information for any additional actuaries who worked directly on this submission.'
            )
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Add actuary contact' })
        ).toBeInTheDocument()
        expect(
            screen.queryByText(
                'Communication preference between CMS Office of the Actuary (OACT) and all state’s actuaries (i.e. certifying actuaries and additional actuary contacts)'
            )
        ).toBeInTheDocument()
        expect(
            screen.queryByText(
                'OACT can communicate directly with the state’s actuaries but should copy the state on all written communication and all appointments for verbal discussions.'
            )
        ).toBeInTheDocument()
        expect(
            screen.queryByText(
                'OACT can communicate directly with the state, and the state will relay all written communication to their actuaries and set up time for any potential verbal discussions.'
            )
        ).toBeInTheDocument()
        expect(screen.queryAllByTestId('actuary-contact')).toHaveLength(0)

        //Add two actuaries
        await userEvent.click(
            screen.getByRole('button', { name: /Add actuary contact/ })
        )
        await userEvent.click(
            screen.getByRole('button', { name: /Add actuary contact/ })
        )

        //Check each actuary field sets have correct text
        await waitFor(() => {
            expect(screen.queryAllByTestId('actuary-contact')).toHaveLength(2)
            const actuaryContactOne =
                screen.queryAllByTestId('actuary-contact')[0]
            expect(
                within(actuaryContactOne).queryByText(
                    'Additional actuary contact 1'
                )
            ).toBeInTheDocument()
            expect(
                within(actuaryContactOne).queryByText('Name')
            ).toBeInTheDocument()
            expect(
                within(actuaryContactOne).queryByText('Title/Role')
            ).toBeInTheDocument()
            expect(
                within(actuaryContactOne).queryByRole('button', {
                    name: /Remove contact/,
                })
            ).toBeInTheDocument()

            const actuaryContactTwo =
                screen.queryAllByTestId('actuary-contact')[1]
            expect(
                within(actuaryContactTwo).queryByText(
                    'Additional actuary contact 2'
                )
            ).toBeInTheDocument()
            expect(
                within(actuaryContactTwo).queryByText('Name')
            ).toBeInTheDocument()
            expect(
                within(actuaryContactTwo).queryByText('Title/Role')
            ).toBeInTheDocument()
            expect(
                within(actuaryContactOne).queryByRole('button', {
                    name: /Remove contact/,
                })
            ).toBeInTheDocument()
        })
    })
})
