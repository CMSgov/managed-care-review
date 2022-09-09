// ***********************************************************
// support/index.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
import '@cypress/code-coverage/support'
import './loginCommands'
import './stateSubmissionFormCommands'
import './submissionCommands'
import './launchDarklyCommands'
import { FeatureFlagTypes, FlagValueTypes } from '../../../services/app-web/src/common-code/featureFlags';

type FormButtonKey =
    | 'CONTINUE_FROM_START_NEW'
    | 'CONTINUE'
    | 'SAVE_DRAFT'
    | 'BACK'

declare global {
    namespace Cypress {
        interface Chainable<Subject = any> {
            // commands
            safeClick(): void

            // login commands
            logInAsStateUser(): void
            logInAsCMSUser(args?: { initialURL?: string }): void

            // state submission form commands
            waitForDocumentsToLoad(): void
            startNewContractOnlySubmission(): void
            startNewContractAndRatesSubmission(): void
            fillOutContractActionOnly(): void
            fillOutContractActionAndRateCertification(): void
            fillOutBaseContractDetails(): void
            fillOutAmendmentToBaseContractDetails(): void
            fillOutNewRateCertification(): void
            fillOutAmendmentToPriorRateCertification(): void
            fillOutStateContact(): void
            fillOutActuaryContact(): void
            fillOutSupportingDocuments(): void
            waitForDocumentsToLoad(): void
            verifyDocumentsHaveNoErrors(): void
            submitStateSubmissionForm(
                success?: boolean,
                resubmission?: boolean
            ): void
            navigateForm(buttonName: FormButtonKey, waitForLoad?: boolean): void
            navigateToSubmissionByUserInteraction(testId: string): void
            stubFeatureFlags(): void
            interceptFeatureFlags(toggleFlags?: Partial<Record<FeatureFlagTypes, FlagValueTypes>>): void
            getFeatureFlagStore(featureFlag?: FeatureFlagTypes[]): Promise<Partial<Record<FeatureFlagTypes, FlagValueTypes>>>
        }
    }
}
