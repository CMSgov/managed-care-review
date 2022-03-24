describe('contacts', () => {
    it('can navigate to and from contacts page', () => {
        cy.logInAsStateUser()
        cy.startNewContractOnlySubmission()

        // Navigate to contacts page
        cy.location().then((fullUrl) => {
            const { pathname } = fullUrl
            const pathnameArray = pathname.split('/')
            const draftSubmissionId = pathnameArray[2]
            cy.visit(`/submissions/${draftSubmissionId}/contacts`)

            // Navigate to contract details page by clicking back for contract only submission
            cy.navigateForm('BACK')
            cy.findByRole('heading', { level: 2, name: /Contract details/ })

            // Navigate to type page to switch to contract and rates submission
            cy.visit(`/submissions/${draftSubmissionId}/type`)
            cy.findByText('Contract action and rate certification').click()
            cy.navigateForm('CONTINUE')

            // Navigate to contacts page
            cy.visit(`/submissions/${draftSubmissionId}/contacts`)

            // Navigate to rate details page by clicking back for contract and rates submission
             cy.navigateForm('BACK')
            cy.findByRole('heading', { level: 2, name: /Rate details/ })

            // Navigate to contacts page
            cy.visit(`/submissions/${draftSubmissionId}/contacts`)

            // Navigate to dashboard page by clicking save as draft
           cy.navigateForm('SAVE_DRAFT')
            cy.findByRole('heading', { level: 1, name: /Dashboard/ })

            // Navigate to contacts page
            cy.visit(`/submissions/${draftSubmissionId}/contacts`)

            cy.fillOutStateContact()
            cy.fillOutActuaryContact()

            // Navigate to documents page by clicking continue
            cy.navigateForm('CONTINUE')
            // HM-TODO: Why doesn't level attribute work here?
            cy.findByRole('heading', { name: /Supporting documents/ })

            // check accessibility of filled out contacts page
           cy.navigateForm('BACK')
            cy.findByRole('heading', { name: /Contacts/ })
            cy.pa11y({
                actions: ['wait for element #form-guidance to be visible'],
                hideElements: '.usa-step-indicator',
            })
        })
    })

    it('can add and remove additional state and actuary contacts', () => {
        cy.logInAsStateUser()
        cy.startNewContractAndRatesSubmission()

        // Navigate to contacts page
        cy.location().then((fullUrl) => {
            const { pathname } = fullUrl
            const pathnameArray = pathname.split('/')
            const draftSubmissionId = pathnameArray[2]
            cy.visit(`/submissions/${draftSubmissionId}/contacts`)

            cy.fillOutStateContact()
            cy.fillOutActuaryContact()

            // Add additional state contact
            cy.findByRole('button', {
                name: /Add another state contact/,
            }).click()
            cy.findAllByLabelText('Name').eq(1).type('State Contact Person 2')
            cy.findAllByLabelText('Title/Role')
                .eq(1)
                .type('State Contact Title 2')
            cy.findAllByLabelText('Email').eq(1).type('statecontact2@test.com')

            // Add additional actuary contact
            cy.findByRole('button', {
                name: /Add another actuary contact/,
            }).click()
            cy.findAllByLabelText('Name').eq(3).type('Actuary Contact Person 2')
            cy.findAllByLabelText('Title/Role')
                .eq(3)
                .type('Actuary Contact Title 2')
            cy.findAllByLabelText('Email')
                .eq(3)
                .type('actuarycontact2@test.com')

            // Select additional actuarial firm
            cy.findAllByLabelText('Mercer').eq(1).safeClick()

            // Navigate to documents page by clicking continue
            cy.navigateForm('CONTINUE')
            // HM-TODO: Why doesn't level attribute work here?
            cy.findByRole('heading', { name: /Supporting documents/ })

            // Navigate to contacts page
            cy.visit(`/submissions/${draftSubmissionId}/contacts`)

            // Remove additional state contact
            cy.findAllByRole('button', { name: /Remove contact/ })
                .eq(0)
                .click()
            cy.findByText('State contacts 2').should('not.exist')

            // Remove additional actuary contact
            cy.findAllByRole('button', { name: /Remove contact/ })
                .eq(0)
                .click()
            cy.findByText('Additional actuary contact 1').should('not.exist')
        })
    })
})
