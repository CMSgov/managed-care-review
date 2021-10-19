import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import * as CognitoAuthApi from '../../pages/Auth/cognitoAuth'
import { renderWithProviders } from '../../testHelpers/jestHelpers'
import { fetchCurrentUserMock } from '../../testHelpers/apolloHelpers'
import { Header } from './Header'

describe('Header', () => {
    it('renders without errors', async () => {
        renderWithProviders(<Header authMode={'AWS_COGNITO'} />)

        expect(screen.getByRole('banner')).toBeInTheDocument()
        expect(screen.getByRole('heading')).toBeInTheDocument()
    })

    describe('when logged out', () => {
        it('displays Medicaid logo image link that redirects to /dashboard', async () => {
            renderWithProviders(<Header authMode={'AWS_COGNITO'} />)
            const logoImage = screen.getByRole('img')
            const logoLink = screen.getByRole('link', {
                name: /One Mac/i,
            })
            expect(logoLink).toBeVisible()
            expect(logoLink).toHaveAttribute('href', '/dashboard')
            expect(logoLink).toContainElement(logoImage)
        })

        it('displays Medicaid and CHIP Managed Care Reporting heading', async () => {
            renderWithProviders(<Header authMode={'AWS_COGNITO'} />)

            await waitFor(() => {
                expect(screen.getByRole('heading')).toHaveTextContent(
                    'Medicaid and CHIP Managed Care Reporting and Review System'
                )
            })
        })

        it('displays signin link when logged out', async () => {
            renderWithProviders(<Header authMode={'AWS_COGNITO'} />)
            await waitFor(() => {
                const signInButton = screen.getByRole('link', {
                    name: /Sign In/i,
                })
                expect(signInButton).toBeVisible()
                expect(signInButton).toHaveAttribute('href', '/auth')
            })
        })

        it('redirects when signin Link is clicked', async () => {
            renderWithProviders(<Header authMode={'AWS_COGNITO'} />)
            await waitFor(() => {
                const signInButton = screen.getByRole('link', {
                    name: /Sign In/i,
                })
                userEvent.click(signInButton)
                expect(signInButton).toHaveAttribute('href', '/auth')
            })
        })
    })

    describe('when logged in', () => {
        it('displays Medicaid logo image link that redirects to /dashboard', () => {
            renderWithProviders(<Header authMode={'AWS_COGNITO'} />, {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            })
            const logoImage = screen.getByRole('img')
            const logoLink = screen.getByRole('link', {
                name: /One Mac/i,
            })
            expect(logoLink).toBeVisible()
            expect(logoLink).toHaveAttribute('href', '/dashboard')
            expect(logoLink).toContainElement(logoImage)
        })

        it('displays heading with users state', async () => {
            renderWithProviders(<Header authMode={'AWS_COGNITO'} />, {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            })
            await waitFor(() =>
                expect(screen.getByRole('heading')).toHaveTextContent(
                    'Minnesota'
                )
            )
        })

        it('displays heading with the current page', async () => {
            renderWithProviders(<Header authMode={'AWS_COGNITO'} />, {
                routerProvider: { route: '/submissions/new' },
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            })
            await waitFor(() =>
                expect(screen.getByRole('heading')).toHaveTextContent(
                    /Minnesota/
                )
            )
        })

        it('displays sign out button', async () => {
            renderWithProviders(<Header authMode={'AWS_COGNITO'} />, {
                apolloProvider: {
                    mocks: [fetchCurrentUserMock({ statusCode: 200 })],
                },
            })

            await waitFor(() => {
                const signOutButton = screen.getByRole('button', {
                    name: /Sign out/i,
                })
                expect(signOutButton).toBeInTheDocument()
            })
        })

        it('calls logout api when Sign Out button is clicked', async () => {
            const spy = jest
                .spyOn(CognitoAuthApi, 'signOut')
                .mockResolvedValue(null)

            renderWithProviders(<Header authMode={'AWS_COGNITO'} />, {
                apolloProvider: {
                    mocks: [
                        fetchCurrentUserMock({ statusCode: 200 }),
                        fetchCurrentUserMock({ statusCode: 403 }),
                    ],
                },
            })

            await waitFor(() => {
                const signOutButton = screen.getByRole('button', {
                    name: /Sign out/i,
                })
                expect(signOutButton).toBeInTheDocument()
                userEvent.click(signOutButton)
            })

            await waitFor(() => expect(spy).toHaveBeenCalledTimes(1))
        })

        it('calls setAlert when logout is unsuccessful', async () => {
            const spy = jest
                .spyOn(CognitoAuthApi, 'signOut')
                .mockRejectedValue('This logout failed!')
            const mockAlert = jest.fn()

            renderWithProviders(
                <Header authMode={'AWS_COGNITO'} setAlert={mockAlert} />,
                {
                    apolloProvider: {
                        mocks: [
                            fetchCurrentUserMock({ statusCode: 200 }),
                            fetchCurrentUserMock({ statusCode: 403 }),
                        ],
                    },
                }
            )

            await waitFor(() => {
                const signOutButton = screen.getByRole('button', {
                    name: /Sign out/i,
                })

                expect(signOutButton).toBeInTheDocument()
                userEvent.click(signOutButton)
            })

            await waitFor(() => expect(spy).toHaveBeenCalledTimes(1))
            await waitFor(() => expect(mockAlert).toHaveBeenCalled())
        })

        it('shows signin link when logout is successful', async () => {
            const spy = jest
                .spyOn(CognitoAuthApi, 'signOut')
                .mockResolvedValue(null)

            renderWithProviders(<Header authMode={'AWS_COGNITO'} />, {
                apolloProvider: {
                    mocks: [
                        fetchCurrentUserMock({ statusCode: 200 }),
                        fetchCurrentUserMock({ statusCode: 403 }),
                    ],
                },
            })

            await waitFor(() => {
                const signOutButton = screen.getByRole('button', {
                    name: /Sign out/i,
                })

                expect(signOutButton).toBeInTheDocument()
                userEvent.click(signOutButton)
            })

            await waitFor(() => {
                expect(spy).toHaveBeenCalledTimes(1)
                expect(
                    screen.getByRole('link', { name: /Sign In/i })
                ).toBeVisible()
            })
        })
    })
})
