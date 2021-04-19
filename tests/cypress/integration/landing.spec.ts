describe('Landing Page', () => {
  it('displays at root path', () => {
    cy.visit('/')
    cy.findByRole('heading', {
      name: /How it works/i,
      level: 2,
    })
  })

  it('display expected headings that describe how Managed Care Review works' , () => {
    cy.visit('/')
    cy.get('#App').should('exist');
    cy.findByRole('heading', {
      name: /How it works/i,
      level: 2,
    })
    cy.findByRole('heading', {
        name: /You can submit capitation rates and contracts/i,
        level: 2,
    })
  })

})
