import React from 'react'
import { screen, waitFor } from '@testing-library/react'

import { getCurrentUserMock } from '../../utils/apolloUtils'
import { renderWithProviders } from '../../utils/jestUtils'
import { StateSubmissionForm } from './StateSubmissionForm'

describe('StateSubmissionForm', () => {
    it('loads Submission type step for /submissions/new', async () => {
        renderWithProviders(<StateSubmissionForm />, {
            apolloProvider: {
                mocks: [
                    getCurrentUserMock({ statusCode: 200 }),
                    getCurrentUserMock({ statusCode: 200 }),
                ],
            },
            routerProvider: { route: '/submissions/new' },
        })

        await waitFor(() =>
            expect(
                screen.getByRole('heading', { name: 'Submission type' })
            ).toBeInTheDocument()
        )
    })

    it('loads Submission type step for /submissions/:id/type', async () => {
        renderWithProviders(<StateSubmissionForm />, {
            apolloProvider: {
                mocks: [getCurrentUserMock({ statusCode: 200 })],
            },
            routerProvider: { route: '/submissions/15/type' },
        })

        await waitFor(() =>
            expect(
                screen.getByRole('heading', { name: 'Submission type' })
            ).toBeInTheDocument()
        )
    })

    it('loads Contract details step for /submissions/:id/contract-details', async () => {
        renderWithProviders(<StateSubmissionForm />, {
            apolloProvider: {
                mocks: [getCurrentUserMock({ statusCode: 200 })],
            },
            routerProvider: { route: '/submissions/12/contract-details' },
        })

        await waitFor(() =>
            expect(
                screen.getByRole('heading', { name: 'Contract details' })
            ).toBeInTheDocument()
        )
    })
})
