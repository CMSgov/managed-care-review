describe('new submission', () => {
    it('can navigate to and from new page', () => {
        cy.logInAsStateUser()

        // Navigate to new page
        cy.visit(`/submissions/new`)

        // Navigate to dashboard page by clicking cancel
        cy.findByRole('button', { name: /Cancel/ }).click()
        cy.findByRole('heading', { level: 1, name: /Dashboard/ })

        // Navigate to new page
        cy.visit(`/submissions/new`)

        cy.fillOutContractActionOnly()

        // Navigate to contract details page by clicking continue for contract only submission
        cy.navigateForm('Continue')
        cy.findByRole('heading', { level: 4, name: /Contract details/ })
    })
})
