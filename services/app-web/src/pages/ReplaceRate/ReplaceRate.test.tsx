import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../testHelpers'
import {
    fetchCurrentUserMock,
    mockValidCMSUser,
    mockValidAdminUser,
    fetchContractMockSuccess,
    mockContractPackageSubmitted,
    indexRatesMockSuccess,
    withdrawAndReplaceRedundantRateMock,
    rateDataMock,
} from '@mc-review/mocks'
import { RoutesRecord } from '@mc-review/constants'
import { Location, Route, Routes } from 'react-router-dom'
import { ReplaceRate } from './ReplaceRate'
import userEvent from '@testing-library/user-event'
import { Rate } from '../../gen/gqlClient'

// Wrap test component in some top level routes to allow getParams to be tested
const wrapInRoutes = (children: React.ReactNode) => {
    return (
        <Routes>
            <Route
                path={RoutesRecord.SUBMISSIONS_SUMMARY}
                element={<div>Summary page placeholder</div>}
            />
            <Route path={RoutesRecord.REPLACE_RATE} element={children} />
        </Routes>
    )
}

describe('ReplaceRate', () => {
    afterEach(() => {
        vi.resetAllMocks()
    })

    it('does not render for CMS user', async () => {
        const contract = mockContractPackageSubmitted()
        renderWithProviders(wrapInRoutes(<ReplaceRate />), {
            apolloProvider: {
                mocks: [
                    fetchCurrentUserMock({
                        user: mockValidCMSUser(),
                        statusCode: 200,
                    }),
                    fetchContractMockSuccess({ contract }),
                ],
            },
            routerProvider: {
                route: `/submissions/${contract.id}/replace-rate/${contract.packageSubmissions[0].rateRevisions[0].rateID}`,
            },
        })

        const forbidden = await screen.findByText(
            'You do not have permission to view the requested file or resource.'
        )
        expect(forbidden).toBeInTheDocument()
    })

    it('renders without errors for admin user', async () => {
        const contract = mockContractPackageSubmitted()
        renderWithProviders(wrapInRoutes(<ReplaceRate />), {
            apolloProvider: {
                mocks: [
                    fetchCurrentUserMock({
                        user: mockValidAdminUser(),
                        statusCode: 200,
                    }),
                    fetchContractMockSuccess({ contract }),
                    indexRatesMockSuccess('MN'),
                ],
            },
            routerProvider: {
                route: `/submissions/${contract.id}/replace-rate/${contract.packageSubmissions[0].rateRevisions[0].rateID}`,
            },
        })

        await screen.findByRole('form')
        expect(
            screen.getByRole('heading', { name: 'Replace a rate review' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('form', {
                name: 'Withdraw and replace rate on contract',
            })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('textbox', { name: 'Reason for revoking' })
        ).toBeInTheDocument()
        expect(
            screen.getByText('Select a replacement rate')
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Replace rate' })
        ).toBeInTheDocument()
    })

    it('cancel button moves admin user back to parent contract summary', async () => {
        let testLocation: Location // set up location to track URL change
        const contract = mockContractPackageSubmitted()
        renderWithProviders(wrapInRoutes(<ReplaceRate />), {
            apolloProvider: {
                mocks: [
                    fetchCurrentUserMock({
                        user: mockValidAdminUser(),
                        statusCode: 200,
                    }),
                    fetchContractMockSuccess({ contract }),
                    indexRatesMockSuccess('MN'),
                ],
            },
            routerProvider: {
                route: `/submissions/${contract.id}/replace-rate/${contract.packageSubmissions[0].rateRevisions[0].rateID}`,
            },
            location: (location) => (testLocation = location),
        })
        await screen.findByRole('form')
        await userEvent.click(screen.getByText('Cancel'))
        await waitFor(() => {
            expect(testLocation.pathname).toBe(`/submissions/${contract.id}`)
        })
    })

    it('shows errors when required fields are not filled in', async () => {
        let testLocation: Location // set up location to track URL change
        const contract = mockContractPackageSubmitted()
        const replacementRates: Rate[] = [
            { ...rateDataMock(), id: 'test-id-123', stateNumber: 3 },
        ]
        const withdrawnRateID =
            contract.packageSubmissions[0].rateRevisions[0].rateID
        const replaceReason = 'This is a good reason'
        renderWithProviders(wrapInRoutes(<ReplaceRate />), {
            apolloProvider: {
                mocks: [
                    fetchCurrentUserMock({
                        user: mockValidAdminUser(),
                        statusCode: 200,
                    }),
                    fetchContractMockSuccess({ contract }),
                    indexRatesMockSuccess(contract.stateCode, replacementRates),
                    withdrawAndReplaceRedundantRateMock({
                        contract,
                        input: {
                            replaceReason,
                            withdrawnRateID,
                            contractID: contract.id,
                            replacementRateID: replacementRates[0].id,
                        },
                    }),
                ],
            },
            routerProvider: {
                route: `/submissions/${contract.id}/replace-rate/${withdrawnRateID}`,
            },
            location: (location) => (testLocation = location),
        })

        // Find replace button
        const replaceRateButton = await screen.findByRole('button', {
            name: 'Replace rate',
        })
        expect(replaceRateButton).toBeInTheDocument()

        // Click replace button to show errors
        await userEvent.click(replaceRateButton)

        // Check for both errors inline and error summary
        expect(
            screen.queryAllByText(
                'You must provide a reason for revoking this rate certification.'
            )
        ).toHaveLength(2)
        expect(
            screen.queryAllByText(
                'You must select a replacement rate certification.'
            )
        ).toHaveLength(2)

        // Fill withdraw reason
        const replaceReasonInput = screen.getByRole('textbox', {
            name: 'Reason for revoking',
        })
        expect(replaceReasonInput).toBeInTheDocument()
        await userEvent.type(replaceReasonInput, replaceReason)

        // Select a replacement rate
        const rateDropdown = screen.getByRole('combobox')
        expect(rateDropdown).toBeInTheDocument()
        await userEvent.click(rateDropdown)

        const rateDropdownOptions = screen.getAllByRole('option')
        expect(rateDropdownOptions).toHaveLength(1)

        await userEvent.click(rateDropdownOptions[0])

        // Check errors are gone
        expect(
            screen.queryAllByText(
                'You must provide a reason for revoking this rate certification.'
            )
        ).toHaveLength(0)
        expect(
            screen.queryAllByText(
                'You must select a replacement rate certification.'
            )
        ).toHaveLength(0)

        // Click replace rate button
        await userEvent.click(replaceRateButton)

        // Wait for redirect
        await waitFor(() => {
            expect(testLocation.pathname).toBe(`/submissions/${contract.id}`)
        })
    })

    it('does not render rates that are child or linked to contract as a replacement rate', async () => {
        const contract = mockContractPackageSubmitted()
        const templateRate = contract.packageSubmissions[0].rateRevisions[0]
        // Include all rates in indexRateMockSuccess
        contract.packageSubmissions[0].rateRevisions = [
            { ...templateRate, rateID: 'test-id-123' },
            { ...templateRate, rateID: 'test-id-124' },
            { ...templateRate, rateID: 'test-id-125' },
        ]

        await waitFor(() => {
            renderWithProviders(wrapInRoutes(<ReplaceRate />), {
                apolloProvider: {
                    mocks: [
                        fetchCurrentUserMock({
                            user: mockValidAdminUser(),
                            statusCode: 200,
                        }),

                        fetchContractMockSuccess({ contract }),
                        indexRatesMockSuccess('MN'),
                    ],
                },
                routerProvider: {
                    route: `/submissions/${contract.id}/replace-rate/${contract.packageSubmissions[0].rateRevisions[0].rateID}`,
                },
            })
        })

        const comboBox = screen.getAllByRole('combobox', {
            name: 'linked rate (required)',
        })[0]
        expect(comboBox).toBeInTheDocument()

        await userEvent.click(comboBox)

        await waitFor(() => {
            expect(
                screen.getByText('No rate certifications found')
            ).toBeInTheDocument()
        })
    })
})
