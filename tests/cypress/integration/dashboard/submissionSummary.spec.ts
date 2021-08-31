describe('submission summary', () => {
    it('user can complete a submission, load dashboard with default program, and see submission summary', () => {
        cy.loginAsStateUser()
        cy.startNewContractAndRatesSubmission()

        // Fill out contract details
        cy.findByLabelText('Base contract').safeClick()
        cy.findByLabelText('Start date').type('04/01/2024')
        cy.findByLabelText('End date').type('03/31/2025').blur()
        cy.findByLabelText('Managed Care Organization (MCO)').safeClick()
        cy.findByLabelText('1932(a) State Plan Authority').safeClick()
        cy.findAllByTestId('errorMessage').should('have.length', 0)
        cy.navigateForm('Continue')

        //Fill out rate details
        cy.findByLabelText('New rate certification').safeClick()
        cy.findByLabelText('Start date').type('02/29/2024')
        cy.findByLabelText('End date').type('02/28/2025')
        cy.findByLabelText('Date certified').type('03/01/2024')
        cy.navigateForm('Continue')

        // fill out state contacts
        cy.findAllByLabelText('Name').eq(0).type('Test Person')
        cy.findAllByLabelText('Title/Role').eq(0).type('Fancy Title')
        cy.findAllByLabelText('Email').eq(0).type('test@test.com')

        // add actuary contact
        cy.findAllByLabelText('Name').eq(1).type('Act Person')
        cy.findAllByLabelText('Title/Role').eq(1).type('Act Title')
        cy.findAllByLabelText('Email').eq(1).type('act@test.com')
        cy.findByLabelText('Mercer').safeClick()

        // actuary communication preference
        cy.findByLabelText(
            `OACT can communicate directly with the state’s actuary but should copy the state on all written communication and all appointments for verbal discussions.`
        ).safeClick()

        // Continue button navigates to documents page
        cy.findByRole('button', {
            name: 'Continue',
        }).safeClick()

        // Add documents
        cy.findByTestId('file-input-input').attachFile(
            'documents/trussel-guide.pdf'
        )
        cy.findByText('Upload failed').should('not.exist')
        cy.findByText('Duplicate file').should('not.exist')
        cy.waitForDocumentsToLoad()

        // Navigate review and submit page
        cy.navigateForm('Continue')

        // Store submission name for reference later

        let submissionId = ''
        cy.location().then((fullUrl) => {
            const { pathname } = fullUrl
            const pathnameArray = pathname.split('/')
            submissionId = pathnameArray[2]
        })

        // Submit, sent to dashboard
        cy.navigateForm('Submit')
        cy.findByRole('dialog').should('exist')
        cy.navigateForm('Confirm submit')
        cy.findByRole('progressbar', { name: 'Loading' }).should('not.exist')
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
