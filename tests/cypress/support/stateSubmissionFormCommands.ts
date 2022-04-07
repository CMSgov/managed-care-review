import { aliasQuery, aliasMutation } from '../utils/graphql-test-utils'
Cypress.Commands.add('startNewContractOnlySubmission', () => {
    // Must be on '/submissions/new'
    cy.findByTestId('dashboard-page').should('exist')
    cy.findByRole('link', { name: 'Start new submission' }).click({
        force: true,
    })
    cy.findByRole('heading', { level: 1, name: /New submission/ })

    cy.fillOutContractActionOnly()

    cy.navigateForm('CONTINUE_FROM_START_NEW')
    cy.findByRole('heading', { level: 2, name: /Contract details/ })
})

Cypress.Commands.add('startNewContractAndRatesSubmission', () => {
    // Must be on '/submissions/new'
    cy.findByTestId('dashboard-page').should('exist')
    cy.findByRole('link', { name: 'Start new submission' }).click({
        force: true,
    })
    cy.findByRole('heading', { level: 1, name: /New submission/ })

    cy.fillOutContractActionAndRateCertification()

    cy.navigateForm('CONTINUE_FROM_START_NEW')
    cy.findByRole('heading', { level: 2, name: /Contract details/ })
})

Cypress.Commands.add('fillOutContractActionOnly', () => {
    // Must be on '/submissions/new'
    cy.findByRole('combobox', { name: 'programs (required)' }).click({
        force: true,
    })
    cy.findByText('PMAP').click()
    cy.findByText('Contract action only').click()
    cy.findByRole('textbox', { name: 'Submission description' }).type(
        'description of contract only submission'
    )
})

Cypress.Commands.add('fillOutContractActionAndRateCertification', () => {
    // Must be on '/submissions/new'
    cy.findByRole('combobox', { name: 'programs (required)' }).click({
        force: true,
    })
    cy.findByText('PMAP').click()
    cy.findByText('Contract action and rate certification').click()
    cy.findByRole('textbox', { name: 'Submission description' }).type(
        'description of contract and rates submission'
    )
})

Cypress.Commands.add('fillOutBaseContractDetails', () => {
    // Must be on '/submissions/:id/contract-details'
    cy.findByText('Base contract').click()
    cy.findByText('Fully executed').click()
    cy.wait(2000)
    cy.findByLabelText('Start date').type('04/01/2024')
    cy.findByLabelText('End date').type('03/31/2025').blur()
    cy.findByLabelText('Managed Care Organization (MCO)').safeClick()
    cy.findByLabelText('1932(a) State Plan Authority').safeClick()
    cy.findByTestId('file-input-input').attachFile(
        'documents/trussel-guide.pdf'
    )

    cy.verifyDocumentsHaveNoErrors()
    cy.waitForDocumentsToLoad()
    cy.findAllByTestId('errorMessage').should('have.length', 0)
})

Cypress.Commands.add('fillOutAmendmentToBaseContractDetails', () => {
    // Must be on '/submissions/:id/contract-details'
    cy.findByText('Amendment to base contract').click()
    cy.findByText('Unexecuted by some or all parties').click()
    cy.wait(2000)
    cy.findByLabelText('Start date').type('04/01/2024')
    cy.findByLabelText('End date').type('03/31/2025').blur()
    cy.findByLabelText('Managed Care Organization (MCO)').safeClick()
    cy.findByLabelText('1932(a) State Plan Authority').safeClick()
    cy.findByLabelText('Benefits provided').safeClick()
    cy.findByLabelText('Financial incentives').safeClick()
    cy.findByText('No').click()
    cy.findByTestId('file-input-input').attachFile(
        'documents/trussel-guide.pdf'
    )

    cy.verifyDocumentsHaveNoErrors()
    cy.waitForDocumentsToLoad()
    cy.findAllByTestId('errorMessage').should('have.length', 0)
})

Cypress.Commands.add('fillOutNewRateCertification', () => {
    // Must be on '/submissions/:id/rate-details'
    // Must be a contract and rates submission
    cy.findByText('New rate certification').click()
    cy.wait(2000)
    cy.findByLabelText('Start date').type('02/29/2024')
    cy.findByLabelText('End date').type('02/28/2025')
    cy.findByLabelText('Date certified').type('03/01/2024')
    cy.findByTestId('file-input-input').attachFile(
        'documents/trussel-guide.pdf'
    )

    cy.verifyDocumentsHaveNoErrors()
    cy.waitForDocumentsToLoad()
    cy.findAllByTestId('errorMessage').should('have.length', 0)
})

Cypress.Commands.add('fillOutAmendmentToPriorRateCertification', () => {
    // Must be on '/submissions/:id/rate-details'
    // Must be a contract and rates submission
    cy.findByText('Amendment to prior rate certification').click()
    cy.wait(2000)
    cy.findAllByLabelText('Start date').eq(0).type('02/29/2024')
    cy.findAllByLabelText('End date').eq(0).type('02/28/2025')
    cy.findAllByLabelText('Start date').eq(1).type('03/01/2024')
    cy.findAllByLabelText('End date').eq(1).type('03/01/2025')
    cy.findByLabelText('Date certified for rate amendment').type('03/01/2024')
    cy.findByTestId('file-input-input').attachFile(
        'documents/trussel-guide.pdf'
    )

    cy.verifyDocumentsHaveNoErrors()
    cy.waitForDocumentsToLoad()
    cy.findAllByTestId('errorMessage').should('have.length', 0)
})

Cypress.Commands.add('fillOutStateContact', () => {
    // Must be on '/submissions/:id/contacts'
    cy.findAllByLabelText('Name').eq(0).type('State Contact Person')
    cy.findAllByLabelText('Title/Role').eq(0).type('State Contact Title')
    cy.findAllByLabelText('Email').eq(0).type('statecontact@test.com')
    cy.findAllByTestId('errorMessage').should('have.length', 0)
})

Cypress.Commands.add('fillOutActuaryContact', () => {
    // Must be on '/submissions/:id/contacts'
    // Must be a contract and rates submission
    cy.findAllByLabelText('Name').eq(1).type('Actuary Contact Person')
    cy.findAllByLabelText('Title/Role').eq(1).type('Actuary Contact Title')
    cy.findAllByLabelText('Email').eq(1).type('actuarycontact@test.com')

    // Actuarial firm
    cy.findAllByLabelText('Mercer').eq(0).safeClick()

    // Actuary communication preference
    cy.findByText(
        `OACT can communicate directly with the state’s actuary but should copy the state on all written communication and all appointments for verbal discussions.`
    ).click()
    cy.findAllByTestId('errorMessage').should('have.length', 0)
})

Cypress.Commands.add('fillOutSupportingDocuments', () => {
    // Must be on '/submissions/:id/documents'
    cy.findByTestId('file-input-input').attachFile(
        'documents/trussel-guide.pdf'
    )

    cy.findByTestId('file-input-input').attachFile(
        'documents/testing.csv'
    )
   
    cy.verifyDocumentsHaveNoErrors()

    cy.findAllByRole('checkbox', {
            name: 'contract-supporting',
        }).eq(1).click({ force: true })

    cy.findAllByRole('checkbox', {
        name: 'rate-supporting',
    }).eq(0).click({ force: true })

    // twice because there could be validation errors with checkbox
    cy.verifyDocumentsHaveNoErrors()

    cy.findAllByTestId('upload-finished-indicator', {timeout: 120000}).should('have.have.length', 2)
    cy.findAllByTestId('errorMessage').should('have.length', 0)
})

Cypress.Commands.add('waitForDocumentsToLoad', () => {
    const authMode = Cypress.env('AUTH_MODE')
    if (authMode !== 'LOCAL') {
        // Must wait for scanning to complete in AWS environments
        cy.wait(20000)
    }
    cy.findAllByTestId('file-input-preview-image', {
        timeout: 40000,
    }).should('not.have.class', 'is-loading')
})

Cypress.Commands.add('verifyDocumentsHaveNoErrors', () => {
    cy.findByText(/Upload failed/).should('not.exist')
    cy.findByText('Duplicate file, please remove').should('not.exist')
    cy.findByText('Failed security scan, please remove').should('not.exist')
    cy.findByText('Remove files with errors').should('not.exist')
})

Cypress.Commands.add('submitStateSubmissionForm', (success = true, resubmission = false) => {
      cy.intercept('POST', '*/graphql', (req) => {
          aliasMutation(req, 'submitDraftSubmission')
          aliasQuery(req, 'indexSubmissions2')
      })
    cy.findByRole('heading', { level: 2, name: /Review and submit/ })
    cy.findByRole('button', {
        name: 'Submit'
    }).safeClick()

    cy.findAllByTestId('modalWindow')
        .should('exist')
        .within(($modal) => {
            if (resubmission) {
                cy.get('#submittedReasonCharacterCount').type('Resubmission summary')
            }
            cy.findByTestId('review-and-submit-modal-submit').click()
        })
    cy.wait('@submitDraftSubmissionMutation', { timeout: 50000 })
    if (success) {
        cy.wait('@indexSubmissions2Query', { timeout: 50000 })
    }
})

type FormButtonKey =  'CONTINUE_FROM_START_NEW'| 'CONTINUE' | 'SAVE_DRAFT' | 'BACK'
type FormButtons = { [key in FormButtonKey]: string }
const buttonsWithLabels: FormButtons = {
    CONTINUE: 'Continue',
    CONTINUE_FROM_START_NEW: 'Continue',
    SAVE_DRAFT: 'Save as draft',
    BACK: 'Back',
}

Cypress.Commands.add(
    'navigateForm',
    (buttonKey: FormButtonKey, waitForLoad = true) => {
        cy.intercept('POST', '*/graphql', (req) => {
            aliasQuery(req, 'indexSubmissions2')
            aliasQuery(req, 'fetchSubmission2')
            aliasMutation(req, 'createSubmission2')
            aliasMutation(req, 'updateHealthPlanFormData')
        })

        cy.findByRole('button', {
            name: buttonsWithLabels[buttonKey],
        }).safeClick()

        if (buttonKey === 'SAVE_DRAFT') {
            if (waitForLoad) cy.wait('@indexSubmissions2Query', { timeout: 20000 })
            cy.findByTestId('dashboard-page').should('exist')

        } else if (buttonKey === 'CONTINUE_FROM_START_NEW') {
                 if (waitForLoad){
                    cy.wait('@createSubmission2Mutation', { timeout: 50000 })
                    cy.wait('@fetchSubmission2Query')
                 }
            cy.findByTestId('state-submission-form-page').should(
                'exist'
            ) 
        } else if (buttonKey === 'CONTINUE'){
            if (waitForLoad){
                cy.wait('@updateHealthPlanFormDataMutation')
                cy.wait('@fetchSubmission2Query')
            }
            cy.findByTestId('state-submission-form-page').should('exist')
        } else {
            // don't wait for api on BACK
              cy.findByTestId('state-submission-form-page').should('exist')
        }

    }
)
