// E2E Test Suite 05 for Opentrons App - Validate the Network & System Tab on More Page
import 'cypress-wait-until'

// Ensures that the site is opened in the browser before each test case
describe('Test Suite 05 - Validate the Network & System Tab on More Page', () => {
  before(() => {
    cy.visit('http://localhost:8090')

    // Navigate to More page
    cy.get('.cOCwJn > .iqXzje').click({ force: true })

    // Navigate to Custom Labware tab
    cy.get(':nth-child(3) > .styles__menu_item__11nPC').click()
  })

  // Confirm text on page is correct
  it('Confirm text on page is correct', () => {
    cy.get('.structure__title__3nJ-D').should('have.text', 'Network & System')
    cy.get(':nth-child(1) > .Card__Title-r4iqug-1').should(
      'have.text',
      'Network Settings'
    )
    cy.get(
      ':nth-child(2) > .styles__labeled_control__WeQhH > .styles__labeled_control_label__3UyR9'
    ).should('have.text', 'Manually Add Robot Network Addresses')
    cy.get(':nth-child(2) > .styles__control_info__2Q2Rd > p').should(
      'have.text',
      'If your app is unable to automatically discover your robot, you can manually add its IP address or hostname here'
    )
    cy.get(
      ':nth-child(2) > .styles__labeled_control__WeQhH > .buttons__button_outline__3z7qv'
    ).should('exist')
    cy.get(
      ':nth-child(3) > .styles__labeled_control__WeQhH > .styles__labeled_control_label__3UyR9'
    ).should('have.text', 'Disable robot caching')
    cy.get(
      ':nth-child(3) > .styles__control_info__2Q2Rd > :nth-child(1)'
    ).should(
      'have.text',
      'NOTE: This will clear cached robots when switched ON.'
    )
    cy.get('.styles__control_info__2Q2Rd > :nth-child(2)').should(
      'have.text',
      'Disable caching of previously seen robots. Enabling this setting may improve overall networking performance in environments with many OT-2s, but may cause initial OT-2 discovery on app launch to be slower and more susceptible to failures.'
    )
    cy.get('.buttons__button_flat__1YVfe > .Svg-sc-1lpozsw-0 > path').should(
      'exist'
    )
    cy.get(
      ':nth-child(4) > .styles__labeled_control__WeQhH > .styles__labeled_control_label__3UyR9'
    ).should('have.text', 'Clear Discovered Robots List')
    cy.get(':nth-child(4) > .styles__control_info__2Q2Rd > p').should(
      'have.text',
      'If your app has unused robots in its list, click to clear the cache & remove them.'
    )
    cy.get(
      ':nth-child(4) > .styles__labeled_control__WeQhH > .buttons__button_outline__3z7qv'
    ).should('exist')
    cy.get(':nth-child(2) > .Card__Title-r4iqug-1').should(
      'have.text',
      'System Information'
    )
    cy.get('.gMJmPo').should('have.text', 'USB-to-Ethernet Adapter Information')
    cy.get('.isfRLh').should(
      'have.text',
      "The OT-2 uses a USB-to-Ethernet adapter for its wired connection. When you plug the OT-2 into your computer, this adapter will be added to your computer's device list."
    )

    // Confirm correct text appears if no USB-to-Ethernet cable is connected
    cy.log('NEXT STEP WILL FAIL IF USB-TO-ETHERNET IS CONNECTED')
    cy.get('.iipDXD').should(
      'have.text',
      'No OT-2 USB-to-Ethernet adapter detected'
    )
  })

  // Confirm able to manage network settings
  it('Confirm able to manage network settings', () => {
    // Click on Manage button
    cy.get(
      ':nth-child(2) > .styles__labeled_control__WeQhH > .buttons__button_outline__3z7qv'
    )
      .click()
      .then(() => {
        // Confirm correct text on the pop-up modal
        cy.get('.modals__alert_modal_heading__hnOW-').should(
          'have.text',
          'Manually Add Robot Network Addresses'
        )
        cy.get('.modals__alert_modal_contents__I7cuT > p').should(
          'have.text',
          'Enter an IP address or hostname to connect to your robot if automatic discovery is not working. For this feature to work reliably, you (or your network administrator) should assign a static IP address to your robot.'
        )

        // Add an IP address to the list
        cy.get('.styles__ip_field__2KTwr')
          .type('10.0.0.1')
          .then(() => {
            cy.get('.styles__ip_field__2KTwr').click('right', { force: true })
          })
          .then(() => {
            cy.get(
              '.modals__alert_modal_buttons__2GQHd > .buttons__button_outline__3z7qv'
            ).click()
          })
      })
  })
})
