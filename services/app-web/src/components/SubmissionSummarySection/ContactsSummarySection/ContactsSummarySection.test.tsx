import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../testHelpers/jestHelpers'
import { ContactsSummarySection } from '.'
import {
    mockContractAndRatesDraft,
    mockStateSubmission,
} from '../../../testHelpers/apolloHelpers'

describe('ContactsSummarySection', () => {
    const draftSubmission = mockContractAndRatesDraft()
    const stateSubmission = mockStateSubmission()
    afterEach(() => jest.clearAllMocks())

    it('can render draft submission without errors', () => {
        renderWithProviders(
            <ContactsSummarySection
                submission={draftSubmission}
                navigateTo="contacts"
            />
        )

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'State contacts',
            })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'Additional actuary contacts',
            })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Edit State contacts' })
        ).toHaveAttribute('href', '/contacts')
    })

    it('can render state submission without errors', () => {
        renderWithProviders(
            <ContactsSummarySection submission={stateSubmission} />
        )

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'State contacts',
            })
        ).toBeInTheDocument()
        expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })

    it('can render all state and actuary contact fields', () => {
        renderWithProviders(
            <ContactsSummarySection
                submission={draftSubmission}
                navigateTo="contacts"
            />
        )

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'State contacts',
            })
        ).toBeInTheDocument()
        expect(screen.queryByText('Contact 1')).toBeInTheDocument()
        // expect(screen.queryByText('State Contact 1')).toBeInTheDocument()
        // expect(screen.queryByText('Test State Contact 1')).toBeInTheDocument()
        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'Additional actuary contacts',
            })
        ).toBeInTheDocument()
        expect(
            screen.queryByText('Additional actuary contact')
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', {
                name: 'additionalactuarycontact1@test.com',
            })
        ).toBeInTheDocument()
        expect(
            screen.queryByText('Actuaries’ communication preference')
        ).toBeInTheDocument()
        expect(
            screen.queryByText(
                'OACT can communicate directly with the state’s actuaries but should copy the state on all written communication and all appointments for verbal discussions.'
            )
        ).toBeInTheDocument()
    })

    it('can render only state contacts for contract only submission', () => {
        renderWithProviders(
            <ContactsSummarySection
                submission={{
                    ...stateSubmission,
                    submissionType: 'CONTRACT_ONLY',
                }}
            />
        )

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'State contacts',
            })
        ).toBeInTheDocument()

        expect(screen.queryByText('Actuary contacts')).not.toBeInTheDocument()
    })

    it('renders submitted package without errors', () => {
        renderWithProviders(
            <ContactsSummarySection submission={draftSubmission} />
        )

        // We should never display missing field text on submission summary for submitted packages
        expect(
            screen.queryByText(/You must provide this information/)
        ).toBeNull()
    })

    it('does not include additional actuary contacts heading when this optional field is not provided', () => {
        const mockSubmission = { ...draftSubmission, addtlActuaryContacts: [] }
        renderWithProviders(
            <ContactsSummarySection submission={mockSubmission} />
        )
        expect(screen.queryByText(/Additional actuary contacts/)).toBeNull()
    })
})
