import { screen } from '@testing-library/react'
import {
    renderWithProviders,
    ldUseClientSpy,
} from '../../../testHelpers/jestHelpers'
import { SubmissionTypeSummarySection } from './SubmissionTypeSummarySection'
import {
    mockContractAndRatesDraft,
    mockStateSubmission,
    mockMNState,
} from '../../../testHelpers/apolloHelpers'
import { HealthPlanFormDataType } from '../../../common-code/healthPlanFormDataType'

describe('SubmissionTypeSummarySection', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })
    const draftSubmission = mockContractAndRatesDraft()
    const stateSubmission = mockStateSubmission()
    const statePrograms = mockMNState().programs

    it('can render draft package without errors', () => {
        renderWithProviders(
            <SubmissionTypeSummarySection
                submission={draftSubmission}
                statePrograms={statePrograms}
                navigateTo="submission-type"
                submissionName="MN-PMAP-0001"
            />
        )

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'MN-PMAP-0001',
            })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Edit MN-PMAP-0001' })
        ).toHaveAttribute('href', '/submission-type')

        // Our mocks use the latest package data by default.
        // Therefore we can check here that missing field is not being displayed unexpectedly
        expect(screen.queryByText(/Missing Field/)).toBeNull()
    })

    it('can render submitted package without errors', () => {
        renderWithProviders(
            <SubmissionTypeSummarySection
                submission={stateSubmission}
                statePrograms={statePrograms}
                submissionName="MN-MSHO-0003"
            />
        )

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'MN-MSHO-0003',
            })
        ).toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'Edit' })).toBeNull()
        // We should never display missing field text on submission summary for submitted packages
        expect(screen.queryByText(/Missing Field/)).toBeNull()
    })

    it('renders expected fields for draft package on review and submit', () => {
        ldUseClientSpy({
            'rate-cert-assurance': true,
        })
        renderWithProviders(
            <SubmissionTypeSummarySection
                submission={draftSubmission}
                statePrograms={statePrograms}
                navigateTo="submission-type"
                submissionName="MN-PMAP-0001"
            />
        )

        expect(
            screen.getByRole('definition', { name: 'Program(s)' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('definition', {
                name: /Is this a risk based contract/,
            })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('definition', { name: 'Submission type' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('definition', { name: 'Submission description' })
        ).toBeInTheDocument()
    })

    it('renders missing field message for risk based contract when expected', () => {
        ldUseClientSpy({
            'rate-cert-assurance': true,
        })
        renderWithProviders(
            <SubmissionTypeSummarySection
                submission={
                    {
                        ...draftSubmission,
                        riskBasedContract: undefined,
                    } as unknown as HealthPlanFormDataType
                } // allow type coercion to be able to test edge case
                statePrograms={statePrograms}
                navigateTo="submission-type"
                submissionName="MN-PMAP-0001"
            />
        )

        expect(
            screen.getByRole('definition', { name: 'Program(s)' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('definition', {
                name: /Is this a risk based contract/,
            })
        ).toBeInTheDocument()
        const riskBasedDefinitionParentDiv = screen.getByRole('definition', {
            name: /Is this a risk based contract/,
        })
        if (!riskBasedDefinitionParentDiv) throw Error('Testing error')
        expect(riskBasedDefinitionParentDiv).toHaveTextContent(/Missing Field/)
    })

    it('renders expected fields for submitted package on submission summary', () => {
        renderWithProviders(
            <SubmissionTypeSummarySection
                submission={{ ...stateSubmission, status: 'SUBMITTED' }}
                statePrograms={statePrograms}
                navigateTo="submission-type"
                submissionName="MN-MSHO-0003"
            />
        )
        expect(
            screen.getByRole('definition', { name: 'Program(s)' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('definition', { name: 'Submission type' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('definition', { name: 'Submission description' })
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('definition', { name: 'Submitted' })
        ).toBeInTheDocument()
    })
    it('does not render Submitted at field', () => {
        renderWithProviders(
            <SubmissionTypeSummarySection
                submission={draftSubmission}
                statePrograms={statePrograms}
                navigateTo="submission-type"
                submissionName="MN-PMAP-0001"
            />
        )
        expect(
            screen.queryByRole('definition', { name: 'Submitted' })
        ).not.toBeInTheDocument()
    })
    it('renders headerChildComponent component', () => {
        renderWithProviders(
            <SubmissionTypeSummarySection
                submission={draftSubmission}
                statePrograms={statePrograms}
                navigateTo="submission-type"
                headerChildComponent={<button>Test button</button>}
                submissionName="MN-PMAP-0001"
            />
        )
        expect(
            screen.queryByRole('button', { name: 'Test button' })
        ).toBeInTheDocument()
    })
})
