describe('submission summary', () => {
    it('can complete a submission, load dashboard with default program, and see submission summary', () => {
        cy.logInAsStateUser()
        cy.startNewContractAndRatesSubmission()

        // Fill out contract details
        cy.fillOutBaseContractDetails()
        cy.navigateForm('Continue')

        cy.fillOutNewRateCertification()
        cy.navigateForm('Continue')

        cy.fillOutStateContact()
        cy.fillOutActuaryContact()
        cy.navigateForm('Continue')

        cy.fillOutDocuments()
        cy.navigateForm('Continue')

        // Store submission name for reference later
        let submissionId = ''
        cy.location().then((fullUrl) => {
            const { pathname } = fullUrl
            const pathnameArray = pathname.split('/')
            submissionId = pathnameArray[2]
        })

        // Submit, sent to dashboard
        cy.submitStateSubmissionForm()
        cy.waitForLoadingToComplete()
        cy.findByText('Dashboard').should('exist')
        cy.findByText('PMAP').should('exist')

        // View submission summary
        cy.location().then((loc) => {
            expect(loc.search).to.match(/.*justSubmitted=*/)
            const submissionName = loc.search.split('=').pop()
            cy.findByText(`${submissionName} was sent to CMS`).should('exist')
            cy.findByText(submissionName).should('exist').click()
            cy.url({ timeout: 10_000 }).should('contain', submissionId)
            cy.findByTestId('submission-summary').should('exist')
            cy.findByRole('heading', {
                name: `Minnesota ${submissionName}`,
            }).should('exist')
            cy.findByText('Rate details').should('exist')
            cy.findByText('New rate certification').should('exist')
            cy.findByText('02/29/2024 - 02/28/2025').should('exist')
            // Link back to dashboard, submission visible in default program
            cy.findByText('Back to state dashboard').should('exist').click()
            cy.findByText('Dashboard').should('exist')
            cy.findByText('PMAP').should('exist')
        })
    })
})
