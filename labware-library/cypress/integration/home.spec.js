/* eslint-disable no-undef */
describe('The Desktop Home Page', function() {
  beforeEach(() => {
    cy.visit('/')
    cy.viewport('macbook-15')
  })

  it('successfully loads', function() {
    cy.title().should('equal', 'Labware Library')
  })

  it('has the right charset', () => {
    cy.document()
      .should('have.property', 'charset')
      .and('eq', 'UTF-8')
  })
})
