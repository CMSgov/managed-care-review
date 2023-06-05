import { screen, render } from '@testing-library/react'
import { DynamicStepIndicator } from './DynamicStepIndicator'

import { STATE_SUBMISSION_FORM_ROUTES } from '@managed-care-review/common-code/constants'

describe('DynamicStepIndicator', () => {
    it('renders without errors', () => {
        render(
            <DynamicStepIndicator
                formPages={STATE_SUBMISSION_FORM_ROUTES}
                currentFormPage={STATE_SUBMISSION_FORM_ROUTES[2]}
            />
        )
        expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
        const steps = screen.getAllByRole('listitem')

        expect(steps).toHaveLength(STATE_SUBMISSION_FORM_ROUTES.length)

        expect(steps[1]).toHaveClass('usa-step-indicator__segment--complete')
        expect(steps[2]).toHaveClass('usa-step-indicator__segment--current')
        expect(steps[3]).toHaveClass('usa-step-indicator__segment', {
            exact: true,
        })
    })

    it('displays nothing when the current form page is passed an unknown route', () => {
        render(
            <div data-testid="container">
                <DynamicStepIndicator
                    formPages={STATE_SUBMISSION_FORM_ROUTES}
                    currentFormPage={'UNKNOWN_ROUTE'}
                />
            </div>
        )

        expect(screen.getByTestId('container')).toBeEmptyDOMElement()
    })
})
