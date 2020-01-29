describe('The Home Page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('successfully loads', () => {
    cy.title().should('equal', 'Opentrons Protocol Designer BETA')
  })

  it('has the right charset', () => {
    cy.document()
      .should('have.property', 'charset')
      .and('eq', 'UTF-8')
  })

  it('displays all the expected text', () => {
    cy.contains('Protocol File')
    cy.contains('Create New')
    cy.contains('Import')
    cy.contains('Export')
    cy.contains('FILE')
    cy.contains('LIQUIDS')
    cy.contains('DESIGN')
    cy.contains('HELP')
    cy.contains('Settings')
    cy.contains('Protocol Designer')
    cy.contains('beta')
  })

  it('displays all the expected images', () => {})
})
