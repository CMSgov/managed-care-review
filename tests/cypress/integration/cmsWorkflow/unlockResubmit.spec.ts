import * as path from 'path'

describe('dashboard', () => {
    it('can unlock and resubmit', () => {
        cy.logInAsStateUser()

        // a submitted submission
        cy.startNewContractOnlySubmission()

        cy.fillOutBaseContractDetails()
        cy.navigateForm('Continue')

        // cy.fillOutNewRateCertification()
        // cy.navigateForm('Continue')

        cy.fillOutStateContact()
        // cy.fillOutActuaryContact()
        cy.navigateForm('Continue')

        // cy.fillOutSupportingDocuments()
        cy.findByRole('heading', {name: /Supporting documents/}).should('exist')
        cy.navigateForm('Continue')
        cy.findByRole('heading', {name: /Review and submit/}).should('exist')

        // Store submission url for reference later
        cy.location().then((fullUrl) => {

            const reviewURL = fullUrl.toString()
            fullUrl.pathname = path.dirname(fullUrl)
            const summaryURL = fullUrl.toString()

            // Submit, sent to dashboard
            cy.intercept('POST', '*/graphql').as('gqlRequest')
            cy.submitStateSubmissionForm()
            cy.wait('@gqlRequest')
            cy.findByText('Dashboard').should('exist')
            cy.findByText('Programs').should('exist')

            // visit the url as a CMS User
            cy.findByRole('button', {name: 'Sign out'}).click()
            cy.findByText('Medicaid and CHIP Managed Care Reporting and Review System')
            cy.logInAsCMSUser({initialURL: reviewURL})

            // click on the unlock button
            cy.findByRole('button', { name: 'Unlock submission' }).click()
            // and then the modal
            cy.findByRole('button', { name: 'Submit' }).click()

            cy.findByRole('button', { name: 'Unlock submission' }).should('be.disabled')


            // login as the state user again
            cy.findByRole('button', {name: 'Sign out'}).click()
            cy.wait(10000)


            cy.findByText('Medicaid and CHIP Managed Care Reporting and Review System')

            cy.logInAsStateUser()

            cy.visit(reviewURL)

            // Submit, sent to dashboard
            cy.intercept('POST', '*/graphql').as('gqlRequest2')
            cy.submitStateSubmissionForm()
            cy.wait('@gqlRequest2')
            cy.findByText('Dashboard').should('exist')
            cy.findByText('Programs').should('exist')

        })
        // View submission summary
        
    })
})
