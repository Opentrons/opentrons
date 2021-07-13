// E2E Test Suite 06 for Opentrons App - Validate the Resources Tab on More Page
import 'cypress-wait-until'

// Ensures that the site is opened in the browser before each test case
describe('Test Suite 06 - Validate the Resources Tab on More Page', () => {
  before(() => {
    cy.visit('http://localhost:8090')

    // Navigate to More page
    cy.get('.cOCwJn > .iqXzje').click({ force: true })

    // Navigate to Custom Labware tab
    cy.get(':nth-child(4) > .styles__menu_item__11nPC').click()
  })

  // Confirm text on page is correct
  it('Confirm text on page is correct', () => {
    cy.get('.structure__title__3nJ-D').should('have.text', 'Resources')

    // Validate Support Articles section
    cy.get(
      ':nth-child(1) > .Card__Section-r4iqug-0 > .Card__Title-r4iqug-1'
    ).should('have.text', 'Support Articles')
    cy.get(
      ':nth-child(1) > .Card__Section-r4iqug-0 > .styles__card_content__3vhqE > .styles__link_label__25ZPJ'
    ).should('have.text', 'Visit our walkthroughs and FAQs')
    cy.get(
      ':nth-child(1) > .Card__Section-r4iqug-0 > .styles__card_content__3vhqE > .buttons__button_outline__3z7qv'
    ).should('exist')

    // Validate Protocol Library section
    cy.get(
      ':nth-child(2) > .Card__Section-r4iqug-0 > .Card__Title-r4iqug-1'
    ).should('have.text', 'Protocol Library')
    cy.get(
      ':nth-child(2) > .Card__Section-r4iqug-0 > .styles__card_content__3vhqE > .styles__link_label__25ZPJ'
    ).should('have.text', 'Download a protocol to run on your robot')
    cy.get(
      ':nth-child(2) > .Card__Section-r4iqug-0 > .styles__card_content__3vhqE > .buttons__button_outline__3z7qv'
    ).should('exist')

    // Validate Python Protocol API Documentation section
    cy.get(
      ':nth-child(3) > .Card__Section-r4iqug-0 > .Card__Title-r4iqug-1'
    ).should('have.text', 'Python Protocol API Documentation')
    cy.get(
      ':nth-child(3) > .Card__Section-r4iqug-0 > .styles__card_content__3vhqE > .styles__link_label__25ZPJ'
    ).should(
      'have.text',
      'Browse documentation for the OT-2 Python Protocol API'
    )
    cy.get(
      ':nth-child(3) > .Card__Section-r4iqug-0 > .styles__card_content__3vhqE > .buttons__button_outline__3z7qv'
    ).should('exist')
  })
})
