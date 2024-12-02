import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, testS3Client } from '../../testHelpers'
import {
    fetchCurrentUserMock,
    fetchRateMockSuccess,
    fetchContractMockSuccess,
    iterableCmsUsersMockData,
    mockValidStateUser,
    mockContractPackageSubmitted,
} from '@mc-review/mocks'
import { RateSummary } from './RateSummary'
import { RoutesRecord } from '@mc-review/constants'
import { Route, Routes } from 'react-router-dom'
import { RateEdit } from '../RateEdit/RateEdit'
import { rateWithHistoryMock } from '@mc-review/mocks'

// Wrap test component in some top level routes to allow getParams to be tested
const wrapInRoutes = (children: React.ReactNode) => {
    return (
        <Routes>
            <Route path={RoutesRecord.RATES_SUMMARY} element={children} />
        </Routes>
    )
}

describe('RateSummary', () => {
    describe.each(iterableCmsUsersMockData)(
        'Viewing RateSummary as a $userRole',
        ({ userRole, mockUser }) => {
            const contract = mockContractPackageSubmitted()

            it('renders without errors', async () => {
                const contract = mockContractPackageSubmitted()
                renderWithProviders(wrapInRoutes(<RateSummary />), {
                    apolloProvider: {
                        mocks: [
                            fetchCurrentUserMock({
                                user: mockUser(),
                                statusCode: 200,
                            }),
                            fetchContractMockSuccess({ contract }),
                            fetchRateMockSuccess({
                                id: '7a',
                                parentContractID: contract.id,
                            }),
                            fetchContractMockSuccess({ contract }),
                        ],
                    },
                    routerProvider: {
                        route: '/rates/7a',
                    },
                })

                expect(
                    await screen.findByText(
                        'Rates this rate certification covers'
                    )
                ).toBeInTheDocument()
            })

            it('displays withdrawn banner on a withdrawn rate', async () => {
                renderWithProviders(wrapInRoutes(<RateSummary />), {
                    apolloProvider: {
                        mocks: [
                            fetchCurrentUserMock({
                                user: mockUser(),
                                statusCode: 200,
                            }),
                            fetchContractMockSuccess({ contract }),
                            fetchRateMockSuccess({
                                id: '1337',
                                parentContractID: contract.id,
                                withdrawInfo: {
                                    __typename: 'UpdateInformation',
                                    updatedAt: new Date('2024-01-01'),
                                    updatedBy: {
                                        email: 'admin@example.com',
                                        role: 'ADMIN_USER',
                                        familyName: 'Hotman',
                                        givenName: 'Iroh',
                                    },
                                    updatedReason:
                                        'Admin as withdrawn this rate.',
                                },
                            }),
                        ],
                    },
                    routerProvider: {
                        route: '/rates/1337',
                    },
                    featureFlags: { 'rate-edit-unlock': true },
                })

                await waitFor(() => {
                    expect(
                        screen.queryByTestId('rate-summary')
                    ).toBeInTheDocument()
                })

                expect(
                    await screen.findByText(
                        'Rates this rate certification covers'
                    )
                ).toBeInTheDocument()

                expect(screen.getByRole('alert')).toHaveClass('usa-alert--info')
                expect(
                    screen.getByTestId('rateWithdrawnBanner')
                ).toHaveTextContent(/Withdrawn by: Administrator/)
                // API returns UTC timezone, we display timestamped dates in PT timezone so 1 day before on these tests.
                expect(
                    screen.getByText('12/31/2023 4:00pm PT')
                ).toBeInTheDocument()
                expect(
                    screen.getByText('Admin as withdrawn this rate.')
                ).toBeInTheDocument()
            })

            it('renders document download warning banner when download fails', async () => {
                const error = vi
                    .spyOn(console, 'error')
                    .mockImplementation(vi.fn())

                const s3Provider = {
                    ...testS3Client(),
                    getBulkDlURL: async (
                        keys: string[],
                        fileName: string
                    ): Promise<string | Error> => {
                        return new Error(
                            'Error: getBulkDlURL encountered an error'
                        )
                    },
                }
                renderWithProviders(wrapInRoutes(<RateSummary />), {
                    apolloProvider: {
                        mocks: [
                            fetchCurrentUserMock({
                                user: mockUser(),
                                statusCode: 200,
                            }),
                            fetchRateMockSuccess({
                                id: '7a',
                                parentContractID: contract.id,
                            }),
                            fetchContractMockSuccess({ contract }),
                        ],
                    },
                    routerProvider: {
                        route: '/rates/7a',
                    },
                    s3Provider,
                })

                await waitFor(() => {
                    expect(
                        screen.getByTestId('warning-alert')
                    ).toBeInTheDocument()
                    expect(screen.getByTestId('warning-alert')).toHaveClass(
                        'usa-alert--warning'
                    )
                    expect(
                        screen.getByTestId('warning-alert')
                    ).toHaveTextContent('Document download unavailable')
                    expect(error).toHaveBeenCalled()
                })
            })
        }
    )

    describe('Viewing RateSummary as a State user', () => {
        const contract = mockContractPackageSubmitted()

        it('renders SingleRateSummarySection component without errors for locked rate', async () => {
            const rate = rateWithHistoryMock()
            rate.parentContractID = contract.id
            renderWithProviders(wrapInRoutes(<RateSummary />), {
                apolloProvider: {
                    mocks: [
                        fetchCurrentUserMock({
                            user: mockValidStateUser(),
                            statusCode: 200,
                        }),
                        fetchRateMockSuccess(rate),
                        fetchContractMockSuccess({ contract }),
                    ],
                },
                routerProvider: {
                    route: '/rates/r-01',
                },
                featureFlags: { 'rate-edit-unlock': true },
            })

            await waitFor(() => {
                expect(screen.queryByTestId('rate-summary')).toBeInTheDocument()
            })

            expect(
                await screen.findByText('Rates this rate certification covers')
            ).toBeInTheDocument()
        })

        it('displays withdrawn banner on a withdrawn rate', async () => {
            renderWithProviders(wrapInRoutes(<RateSummary />), {
                apolloProvider: {
                    mocks: [
                        fetchCurrentUserMock({
                            user: mockValidStateUser(),
                            statusCode: 200,
                        }),
                        fetchContractMockSuccess({ contract }),
                        fetchRateMockSuccess({
                            id: '1337',
                            parentContractID: contract.id,
                            withdrawInfo: {
                                __typename: 'UpdateInformation',
                                updatedAt: new Date('2024-01-01'),
                                updatedBy: {
                                    email: 'admin@example.com',
                                    role: 'ADMIN_USER',
                                    familyName: 'Hotman',
                                    givenName: 'Iroh',
                                },
                                updatedReason: 'Admin as withdrawn this rate.',
                            },
                        }),
                    ],
                },
                routerProvider: {
                    route: '/rates/1337',
                },
                featureFlags: { 'rate-edit-unlock': true },
            })

            await waitFor(() => {
                expect(screen.queryByTestId('rate-summary')).toBeInTheDocument()
            })

            expect(
                await screen.findByText('Rates this rate certification covers')
            ).toBeInTheDocument()

            expect(screen.getByRole('alert')).toHaveClass('usa-alert--info')
            expect(screen.getByTestId('rateWithdrawnBanner')).toHaveTextContent(
                /Withdrawn by: Administrator/
            )
            // API returns UTC timezone, we display timestamped dates in PT timezone so 1 day before on these tests.
            expect(screen.getByText('12/31/2023 4:00pm PT')).toBeInTheDocument()
            expect(
                screen.getByText('Admin as withdrawn this rate.')
            ).toBeInTheDocument()
        })

        it('redirects to RateEdit component from RateSummary without errors for unlocked rate', async () => {
            renderWithProviders(
                <Routes>
                    <Route
                        path={RoutesRecord.RATES_SUMMARY}
                        element={<RateSummary />}
                    />
                    <Route
                        path={RoutesRecord.RATE_EDIT}
                        element={<RateEdit />}
                    />
                </Routes>,
                {
                    apolloProvider: {
                        mocks: [
                            fetchCurrentUserMock({
                                user: mockValidStateUser(),
                                statusCode: 200,
                            }),
                            fetchRateMockSuccess({
                                id: '1337',
                                parentContractID: contract.id,
                                status: 'UNLOCKED',
                            }),
                            fetchContractMockSuccess({ contract }),
                        ],
                    },
                    routerProvider: {
                        route: '/rates/1337',
                    },
                    featureFlags: {
                        'rate-edit-unlock': true,
                    },
                }
            )

            await waitFor(() => {
                expect(
                    screen.queryByTestId('single-rate-edit')
                ).toBeInTheDocument()
            })
        })

        it('renders expected error page when rate ID is invalid', async () => {
            const consoleWarnMock = vi
                .spyOn(console, 'warn')
                .mockImplementation(vi.fn())

            renderWithProviders(wrapInRoutes(<RateSummary />), {
                apolloProvider: {
                    mocks: [
                        fetchCurrentUserMock({
                            user: mockValidStateUser(),
                            statusCode: 200,
                        }),
                        fetchRateMockSuccess({
                            id: '1337',
                            parentContractID: contract.id,
                        }),
                        fetchContractMockSuccess({ contract }),
                    ],
                },
                //purposefully attaching invalid id to url here
                routerProvider: {
                    route: '/rates/133',
                },
                featureFlags: { 'rate-edit-unlock': true },
            })
            expect(consoleWarnMock).toHaveBeenCalled() // apollo testing mocks will console warn that your query is invalid - this is intentional
            expect(await screen.findByText('System error')).toBeInTheDocument()
        })

        it('renders back to dashboard link for state users', async () => {
            renderWithProviders(wrapInRoutes(<RateSummary />), {
                apolloProvider: {
                    mocks: [
                        fetchCurrentUserMock({
                            user: mockValidStateUser(),
                            statusCode: 200,
                        }),
                        fetchRateMockSuccess({
                            id: '7a',
                            parentContractID: contract.id,
                        }),
                        fetchContractMockSuccess({ contract }),
                    ],
                },
                routerProvider: {
                    route: '/rates/7a',
                },
                featureFlags: { 'rate-edit-unlock': true },
            })

            const backLink = await screen.findByRole('link', {
                name: /Back to dashboard/,
            })
            expect(backLink).toBeInTheDocument()

            expect(backLink).toHaveAttribute('href', '/dashboard')
        })
    })
})
