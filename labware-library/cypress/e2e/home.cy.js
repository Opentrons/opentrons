import { navigateToUrl } from '../support/e2e'

describe('The Desktop Home Page', () => {
  beforeEach(() => {
    navigateToUrl('/')
  })

  it('successfully loads', () => {
    cy.title().should('equal', 'Labware Library')
  })

  it('has the right charset', () => {
    cy.document().should('have.property', 'charset').and('eq', 'UTF-8')
  })
})
