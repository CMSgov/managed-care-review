describe('login', () => {
    it('can log in and log out as expected', () => {
        cy.logInAsStateUser()

        cy.url().should('eq', Cypress.config().baseUrl + '/')
        cy.findByRole('button', { name: /Sign out/i }).safeClick()

        cy.location('pathname').should('eq', '/')
        cy.findByRole('link', { name: /Sign In/i }).should('exist')
    })

    it('can log in and see personal dashboard for their state', () => {
        cy.logInAsStateUser()

        cy.findByText('aang@dhs.state.mn.us').should('exist')
        cy.findByRole('heading', { name: 'Minnesota Dashboard' }).should(
            'exist'
        )
        cy.findAllByRole('tab', { name: 'MSHO' }).should('exist')
        cy.findAllByRole('tab', { name: 'PMAP' }).should('exist')
        cy.findAllByRole('tab', { name: 'SNBC' }).should('exist')
    })
})
