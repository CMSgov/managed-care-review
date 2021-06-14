import { screen, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { createMemoryHistory } from 'history'
import userEvent from '@testing-library/user-event'

import {
    mockDraft,
    fetchCurrentUserMock,
    updateDraftSubmissionMock,
} from '../../../testHelpers/apolloHelpers'
import { renderWithProviders } from '../../../testHelpers/jestHelpers'

import {
    ContractType,
    SubmissionType,
    FederalAuthority,
    CapitationRatesAmendmentReason,
} from '../../../gen/gqlClient'

import { ContractDetails } from './ContractDetails'

describe('ContractDetails', () => {
    it('progressively discloses options for capitation rates', async () => {
        // mount an empty form

        const emptyDraft = mockDraft()
        emptyDraft.id = '12'
        const history = createMemoryHistory()

        renderWithProviders(<ContractDetails draftSubmission={emptyDraft} />, {
            apolloProvider: {
                mocks: [
                    fetchCurrentUserMock({ statusCode: 200 }),
                    updateDraftSubmissionMock({
                        id: '12',
                        updates: {
                            programID: 'snbc',
                            submissionType: 'CONTRACT_ONLY' as SubmissionType,
                            submissionDescription: 'A real submission',
                            documents: [],
                            contractType: 'AMENDMENT' as ContractType,
                            contractDateStart: '2021-06-14',
                            contractDateEnd: '2021-06-14',
                            federalAuthorities: [
                                FederalAuthority.Voluntary,
                                FederalAuthority.Benchmark,
                                FederalAuthority.Waiver_1115,
                            ],
                            managedCareEntities: ['MCO'],
                            contractAmendmentInfo: {
                                itemsBeingAmended: ['CAPITATION_RATES'],
                                capitationRatesAmendedInfo: {
                                    reason: 'OTHER' as CapitationRatesAmendmentReason,
                                    reasonOther: 'x',
                                },
                                itemsBeingAmendedOther: null,
                                relatedToCovid19: false,
                                relatedToVaccination: null,
                            },
                        },
                        statusCode: 200,
                    }),
                ],
            },
            routerProvider: {
                route: '/submissions/12/contract-details',
                routerProps: { history: history },
            },
        })

        expect(
            await screen.findByRole('heading', { name: 'Contract details' })
        ).toBeInTheDocument()

        // should not be able to find hidden things
        // "Items being amended"
        expect(screen.queryByText('Items being amended')).toBeNull()
        expect(
            screen.queryByText(
                'Is this contract action related to the COVID-19 public health emergency?'
            )
        ).toBeNull()

        // click amendment
        const amendmentRadio = screen.getByLabelText(
            'Amendment to base contract'
        )
        amendmentRadio.click()

        // check that now we can see hidden things
        expect(screen.queryByText('Items being amended')).toBeInTheDocument()
        expect(
            screen.queryByText(
                'Is this contract action related to the COVID-19 public health emergency?'
            )
        ).toBeInTheDocument()

        // click "next"
        const continueButton = screen.getByRole('button', { name: 'Continue' })
        await act(async () => {
            continueButton.click()
        })

        // select some things to narrow down which errors we are looking for
        // these options have to be selected no matter which type of contract it is
        await act(async () => {
            screen.getByLabelText('Managed Care Organization (MCO)').click()
            screen.getByLabelText('1115 Waiver Authority').click()
        })

        // check that there are the errors we expect
        expect(
            screen.queryByText('You must select at least one item')
        ).toBeInTheDocument()

        // click capRates
        await act(async () => {
            screen.getByLabelText('Capitation rates').click()
        })
        expect(
            screen.queryByText('You must select at least one item')
        ).toBeNull()

        // check error for not selected
        expect(
            screen.getByText(
                'You must select why capitation rates are changing'
            )
        ).toBeInTheDocument()

        // click annual rate
        await act(async () => {
            screen.getByLabelText('Mid-year update').click()
        })

        // error should be gone
        expect(
            screen.queryByText(
                'You must select why capitation rates are changing'
            )
        ).toBeNull()

        // click other,
        await act(async () => {
            screen.getByLabelText('Other (please describe)').click()
        })

        // other is displayed, error is back
        expect(
            screen.getByText('You must enter the other reason')
        ).toBeInTheDocument()

        // click "NO" for the Covid question so we can submit
        await act(async () => {
            const otherBox = screen.getByLabelText(
                'Other capitation rate description'
            )
            userEvent.type(otherBox, 'x')
            screen.getByLabelText('No').click()
        })

        // click continue. If our mock is configured correctly we should advance.
        await act(async () => {
            const continueButton = screen.getByRole('button', {
                name: 'Continue',
            })
            console.log('CLICKING CONTINUE')
            continueButton.click()
        })

        await waitFor(() => {
            expect(history.location.pathname).toBe(
                '/submissions/12/rate-details'
            )
        })
    })

    it('progressively discloses option for amended items', async () => {
        // mount an empty form

        const emptyDraft = mockDraft()

        renderWithProviders(<ContractDetails draftSubmission={emptyDraft} />, {
            apolloProvider: {
                mocks: [fetchCurrentUserMock({ statusCode: 200 })],
            },
        })

        // click amendment
        const amendmentRadio = screen.getByLabelText(
            'Amendment to base contract'
        )
        amendmentRadio.click()

        // click "next"
        const continueButton = screen.getByRole('button', { name: 'Continue' })
        await act(async () => {
            continueButton.click()
        })

        // select some things to narrow down which errors we are looking for
        // these options have to be selected no matter which type of contract it is
        await act(async () => {
            screen.getByLabelText('Managed Care Organization (MCO)').click()
            screen.getByLabelText('1115 Waiver Authority').click()
        })

        // click other
        await act(async () => {
            screen.getByLabelText('Other (please describe)').click()
        })

        // check error for not selected
        expect(
            screen.getByText('You must enter the other item')
        ).toBeInTheDocument()

        // click annual rate
        await act(async () => {
            const other = screen.getByLabelText('Other item description')
            userEvent.type(other, 'foo bar')
        })

        // error should be gone
        expect(screen.queryByText('You must enter the other item')).toBeNull()
    })

    it('progressively discloses option for covid', async () => {
        // mount an empty form

        const emptyDraft = mockDraft()
        emptyDraft.id = '12'
        const history = createMemoryHistory()

        renderWithProviders(<ContractDetails draftSubmission={emptyDraft} />, {
            apolloProvider: {
                mocks: [
                    fetchCurrentUserMock({ statusCode: 200 }),
                    updateDraftSubmissionMock({
                        id: '12',
                        updates: {
                            programID: 'snbc',
                            submissionType: 'CONTRACT_ONLY' as SubmissionType,
                            submissionDescription: 'A real submission',
                            documents: [],
                            contractType: 'AMENDMENT' as ContractType,
                            contractDateStart: '2021-06-14',
                            contractDateEnd: '2021-06-14',
                            federalAuthorities: [
                                FederalAuthority.Voluntary,
                                FederalAuthority.Benchmark,
                                FederalAuthority.Waiver_1115,
                            ],
                            managedCareEntities: ['MCO'],
                            contractAmendmentInfo: {
                                itemsBeingAmended: ['FINANCIAL_INCENTIVES'],
                                relatedToCovid19: true,
                                relatedToVaccination: false,
                            },
                        },
                        statusCode: 200,
                    }),
                ],
            },
            routerProvider: {
                route: '/submissions/12/contract-details',
                routerProps: { history: history },
            },
        })

        // click amendment
        const amendmentRadio = screen.getByLabelText(
            'Amendment to base contract'
        )
        amendmentRadio.click()

        // click "next"
        const continueButton = screen.getByRole('button', { name: 'Continue' })
        await act(async () => {
            continueButton.click()
        })

        // select some things to narrow down which errors we are looking for
        // these options have to be selected no matter which type of contract it is
        await act(async () => {
            screen.getByLabelText('Managed Care Organization (MCO)').click()
            screen.getByLabelText('1115 Waiver Authority').click()
            screen.getByLabelText('Financial incentives').click()
        })

        // check on the covid error
        expect(
            screen.queryByText('You must select yes or no')
        ).toBeInTheDocument()

        // click other
        await act(async () => {
            screen.getByLabelText('Yes').click()
        })

        // check error for not selected
        expect(
            screen.getByText(
                'Is this related to coverage and reimbursement for vaccine administration?'
            )
        ).toBeInTheDocument()
        expect(
            screen.queryByText('You must select yes or no')
        ).toBeInTheDocument()

        // click annual rate
        await act(async () => {
            const vaccieneNo = screen.getAllByLabelText('No')[1]
            vaccieneNo.click()
        })

        // error should be gone
        expect(screen.queryByText('You must select yes or no')).toBeNull()

        await act(async () => {
            const continueButton = screen.getByRole('button', {
                name: 'Continue',
            })
            continueButton.click()
        })

        await waitFor(() => {
            expect(history.location.pathname).toBe(
                '/submissions/12/rate-details'
            )
        })
    })
})
