describe('The Redesigned Home Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.enableRedesign()
  })

  it('successfully loads', () => {
    cy.title().should('equal', 'Opentrons Protocol Designer')
    cy.document().should('have.property', 'charset').and('eq', 'UTF-8')
    cy.contains('Welcome to Protocol Designer!')
    cy.contains('button', 'Create a protocol').should('be.visible')
    cy.contains('label', 'Edit existing protocol').should('be.visible')
  })
})
