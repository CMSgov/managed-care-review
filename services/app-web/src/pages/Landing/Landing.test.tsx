import { screen } from '@testing-library/react'
import {
    ldUseClientSpy,
    renderWithProviders,
} from '../../testHelpers/jestHelpers'
import { Landing } from './Landing'

describe('Landing', () => {
    afterAll(() => jest.clearAllMocks())

    it('displays session expired when query parameter included', async () => {
        ldUseClientSpy({ 'site-maintenance-banner': false })
        renderWithProviders(<Landing />, {
            routerProvider: { route: '/?session-timeout' },
        })
        expect(
            screen.queryByRole('heading', { name: 'Session expired' })
        ).toBeNull()
        expect(
            screen.queryByText(/You have been logged out due to inactivity/)
        ).toBeNull()
    })
    it('does not display session expired by default', async () => {
        ldUseClientSpy({ 'site-maintenance-banner': false })
        renderWithProviders(<Landing />, {
            routerProvider: { route: '/' },
        })
        expect(
            screen.queryByRole('heading', {
                name: 'Session expired',
            })
        ).toBeNull()
        expect(
            screen.queryByText(/You have been logged out due to inactivity/)
        ).toBeNull()
    })
})
