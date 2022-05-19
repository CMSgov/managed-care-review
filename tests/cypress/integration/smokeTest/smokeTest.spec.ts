describe('smoke test', () => {
    it('can log in as a state user', () => {
        cy.logInAsStateUser()
        cy.location('pathname', { timeout: 10_000 }).should('eq', '/')
        cy.findByRole('heading', { level: 1, name: /Dashboard/ })
    })

    it('can log in as a CMS user', () => {
        cy.logInAsCMSUser({ initialURL: '/submissions/test/summary' })
        cy.url({ timeout: 10_000 }).should('contain', '/submissions/test/summary')
    })

    it('can contact the API and connect to the database', () => {
        cy.logInAsStateUser()
        cy.startNewContractOnlySubmission()
    })
})
