import { StepIndicator, StepIndicatorStep } from '@trussworks/react-uswds'

import { PageTitlesRecord, RouteTWithUnknown } from '../../constants/routes'

export type DynamicStepIndicatorProps = {
    formPages: RouteTWithUnknown[]
    currentFormPage: RouteTWithUnknown
}

type formStepStatusT = 'current' | 'complete' | undefined

export const DynamicStepIndicator = ({
    formPages,
    currentFormPage,
}: DynamicStepIndicatorProps): React.ReactElement | null => {
    if (
        currentFormPage === 'UNKNOWN_ROUTE' ||
        !formPages.includes(currentFormPage)
    ) {
        return null
    }

    let formStepCompleted = true
    const formPagesWithStatus: {
        name: RouteTWithUnknown
        status: formStepStatusT
    }[] = formPages.map((formPageName) => {
        let status: formStepStatusT = undefined

        if (formPageName === currentFormPage) {
            formStepCompleted = false
            status = 'current'
        } else if (formStepCompleted) {
            status = 'complete'
        }

        return { name: formPageName, status: status }
    })

    return (
        <StepIndicator headingLevel="h2">
            {formPagesWithStatus.map((formPage) => {
                return (
                    <StepIndicatorStep
                        label={PageTitlesRecord[formPage.name]}
                        status={formPage.status}
                        key={PageTitlesRecord[formPage.name]}
                    />
                )
            })}
        </StepIndicator>
    )
}
