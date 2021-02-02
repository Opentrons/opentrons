describe('The Desktop Home Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.viewport('macbook-15')
  })

  it('successfully loads', () => {
    cy.title().should('equal', 'Labware Library')
  })

  it('has the right charset', () => {
    cy.document()
      .should('have.property', 'charset')
      .and('eq', 'UTF-8')
  })
})
