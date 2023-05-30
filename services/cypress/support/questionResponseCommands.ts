import {aliasMutation, aliasQuery} from '../utils/graphql-test-utils';

Cypress.Commands.add(
    'addQuestion',
    ({ documentPath }: { documentPath: string }) => {
    cy.intercept('POST', '*/graphql', (req) => {
            aliasQuery(req, 'fetchHealthPlanPackageWithQuestions')
            aliasMutation(req, 'createQuestion')
    })
        // Find Add questions button and click
        cy.findByRole('link', { name: /Add questions/ })
            .should('exist')
            .click()
        // Check we are on the Add questions page
        cy.findByRole('heading', { level: 2, name: /Add questions/ }).should(
            'exist'
        )

        // Add document to question form
        cy.findByTestId('file-input-input').attachFile(documentPath)
        cy.waitForDocumentsToLoad()

        // Submit question
        cy.findByRole('button', { name: 'Add questions' })
            .should('exist')
            .click()

        // Wait for re-fetching of health plan package.
        cy.wait('@createQuestionMutation', { timeout: 20000 })
        cy.wait('@fetchHealthPlanPackageWithQuestionsQuery', { timeout: 20000 })
    }
)

Cypress.Commands.add(
    'addResponse',
    ({ documentPath }: { documentPath: string }) => {
        // Find Upload response button in DMCO section and click
        cy.findByTestId('dmco-qa-section').within(() => {
            cy.findByRole('link', { name: /Upload response/ })
                .should('exist')
                .click()
        })

        // Check we are on the Add questions page
        cy.findByRole('heading', { level: 2, name: /New response/ }).should(
            'exist'
        )

        // Add document to question form
        cy.findByTestId('file-input-input').attachFile(documentPath)
        cy.waitForDocumentsToLoad()

        // Submit question
        cy.findByRole('button', { name: 'Send response' })
            .should('exist')
            .click()

        // Wait for re-fetching of health plan package.
        cy.wait('@fetchHealthPlanPackageWithQuestionsQuery', { timeout: 20000 })
    }
)
