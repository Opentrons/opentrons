// E2E Test Suite 04 for Opentrons App - Validate the Custom Labware Tab on More Page
import 'cypress-wait-until'

// Ensures that the site is opened in the browser before each test case
describe('Test Suite 04 - Validate the Custom Labware Tab on More Page', () => {
  before(() => {
    cy.visit('http://localhost:8090')

    // Navigate to More page
    cy.get('.cOCwJn > .iqXzje').click({ force: true })

    // Navigate to Custom Labware tab
    cy.get(':nth-child(2) > .styles__menu_item__11nPC').click()
  })

  // Confirm text on page is correct
  it('Confirm text on page is correct', () => {
    cy.get('.structure__title__3nJ-D').should('have.text', 'Custom Labware')
    cy.get(
      ':nth-child(1) > .Card__Section-r4iqug-0 > .Card__Title-r4iqug-1'
    ).should('have.text', 'Labware Management')
    cy.get('.styles__card_copy__3nzb4').should(
      'have.text',
      'Manage custom labware definitions for use in your Python Protocol API Version 2 protocols.'
    )
    cy.get(
      ':nth-child(3) > .styles__labeled_control__WeQhH > .styles__labeled_control_label__3UyR9'
    ).should('have.text', 'Custom Labware Definitions Folder')
    cy.get('.forms__input_field__1ppsZ').should('exist')
    cy.get(
      ':nth-child(3) > .styles__labeled_control__WeQhH > .buttons__button_outline__3z7qv'
    ).should('exist')
    cy.get('[name="change-source"] > span').should('exist')
    cy.get('[name="reset-source"] > span').should('exist')
    cy.get(
      ':nth-child(4) > .styles__labeled_control__WeQhH > .styles__labeled_control_label__3UyR9'
    ).should('have.text', 'Add New Labware Definitions')
    cy.get(
      ':nth-child(4) > .styles__control_info__2Q2Rd > :nth-child(1)'
    ).should(
      'have.text',
      'Add labware definitions to your Custom Labware Definitions folder for use on any OT-2 robot.'
    )
    cy.get(
      ':nth-child(4) > .styles__labeled_control__WeQhH > .buttons__button_outline__3z7qv'
    ).should('exist')
    cy.get(
      ':nth-child(4) > .styles__control_info__2Q2Rd > :nth-child(2)'
    ).should(
      'have.text',
      'Use the Custom Labware Creator to generate new labware definitions'
    )
    cy.get(
      ':nth-child(2) > .Card__Section-r4iqug-0 > .Card__Title-r4iqug-1'
    ).should('have.text', 'Custom Labware List')
  })

  // Reset Source for Custom Labware Definitions Folder
  it('Confirm able to reset source for Custom Labware Definitions Folder', () => {
    // Click Reset Source but concel before actually doing it
    cy.get('[name="reset-source"] > span').then(() => {
      cy.get('[name="reset-source"] > span').click()

      // Confirm contents on the modal
      cy.get('.modals__alert_modal_heading__hnOW-').should(
        'have.text',
        'Reset Custom Labware source directory?'
      )
      cy.get('.modals__alert_modal_contents__I7cuT > :nth-child(1)').should(
        'have.text',
        'Click "Reset Source" to reset your custom labware directory to its default location.'
      )
      cy.get('.modals__alert_modal_contents__I7cuT > :nth-child(2)').should(
        'have.text',
        'Labware in your current source directory will not be moved nor deleted.'
      )

      // Cancel out of the modal
      cy.get('[name="cancel"]').click()
    })

    // Actually reset source and do not cancel
    cy.get('[name="reset-source"] > span').then(() => {
      cy.get('[name="reset-source"] > span').click()
      cy.get(
        '.modals__alert_modal_buttons__2GQHd > [name="reset-source"]'
      ).click()
    })
  })
})
