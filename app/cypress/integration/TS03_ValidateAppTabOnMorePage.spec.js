// E2E Test Suite 03 for Opentrons App - Validate More Page
import 'cypress-wait-until'

// Ensures that the site is opened in the browser before each test case
describe('Test Suite 03 - Validate App tab on More Page', () => {
  before(() => {
    cy.visit('http://localhost:8090')

    // Clear the version update modal
    // cy.get('.dIbOfO').find('.bbkbLa').click()

    // Navigate to More page
    cy.get('.cOCwJn > .iqXzje').click({ force: true })
  })

  // Confirm text on page is correct
  it('Confirm text on page is correct', () => {
    cy.get('.structure__title__3nJ-D').should('have.text', 'App')
    cy.get(
      ':nth-child(2) > .Card__Section-r4iqug-0 > .Card__Title-r4iqug-1'
    ).should('have.text', 'App Software Settings')
    cy.get('.structure__labeled_value_label__3TJ0y').should(
      'have.text',
      'Software Version:'
    )
    cy.get('.kWaShj > .Btn-o3dtr1-0').should('exist')
    cy.get('.structure__labeled_value_value__rgaIu').should('exist')
    cy.get(':nth-child(3) > .Flex-sc-1qhp8l7-0 > .hClIVw').should(
      'have.text',
      'App Update AlertsGet notified when Opentrons has an app update ready for you.'
    )
    cy.get(
      ':nth-child(4) > .Flex-sc-1qhp8l7-0 > .Box-sc-8ozbhb-0 > .jsVRdR'
    ).should('have.text', 'Restore Different Software Version')
    cy.get('.cwssSN').should(
      'have.text',
      'Need to restore a different version of Opentrons OT-2 or App software? While Opentrons does not recommend to reverting to older software versions, you can access previous releases here.'
    )
    cy.get('.isfRLh').should(
      'have.text',
      'For best results, uninstall the existing app and remove its configuration files before installing the older version.'
    )
    cy.get(
      ':nth-child(3) > .Card__Section-r4iqug-0 > .Card__Title-r4iqug-1'
    ).should('have.text', 'Privacy Settings')
    cy.get(
      ':nth-child(3) > .Card__Section-r4iqug-0 > .styles__labeled_control_wrapper__Ur1yQ > .styles__labeled_control__WeQhH > .styles__labeled_control_label__3UyR9'
    ).should('have.text', 'Share robot & app analytics with Opentrons')
    cy.get(
      ':nth-child(3) > .Card__Section-r4iqug-0 > .styles__labeled_control_wrapper__Ur1yQ > .styles__control_info__2Q2Rd > :nth-child(1)'
    ).should(
      'have.text',
      'Help Opentrons improve its products and services by automatically sending anonymous diagnostic and usage data.'
    )
    cy.get('.styles__control_info__2Q2Rd > :nth-child(2)').should(
      'have.text',
      'This will allow us to learn things such as which features get used the most, which parts of the process are taking longest to complete, and how errors are generated. You can change this setting at any time.'
    )
    cy.get(':nth-child(4) > :nth-child(1) > .Card__Title-r4iqug-1').should(
      'have.text',
      'Advanced Settings'
    )
    cy.get('.styles__stacked_labeled_control_label__1FihW').should(
      'have.text',
      'Tip Length Calibration Settings'
    )
    cy.get('.styles__stacked_control_info__3Bt0R > p').should(
      'have.text',
      "An Opentrons Calibration Block makes tip length calibration easier. Contact us to request a calibration block. If you don't have one, use the Trash Bin."
    )
    cy.get(':nth-child(1) > .forms__label_text__32dAo').should(
      'have.text',
      'Always use Calibration Block to calibrate'
    )
    cy.get(':nth-child(2) > .forms__label_text__32dAo').should(
      'have.text',
      'Always use Trash Bin to calibrate'
    )
    cy.get(':nth-child(3) > .forms__label_text__32dAo').should(
      'have.text',
      'Always show prompt to choose Calibration Block or Trash Bin'
    )
    cy.get(
      ':nth-child(1) > :nth-child(3) > .styles__labeled_control__WeQhH > .styles__labeled_control_label__3UyR9'
    ).should('have.text', 'Update Channel')
    cy.get('.forms__dropdown__3-opf').should('exist')
    cy.get(':nth-child(3) > .styles__control_info__2Q2Rd > p').should(
      'have.text',
      'Sets the update channel of your app. "Stable" receives the latest stable releases. "Beta" is updated more frequently so you can try out new features, but the releases may be less well tested than "Stable".'
    )
    cy.get(
      ':nth-child(4) > .styles__labeled_control__WeQhH > .styles__labeled_control_label__3UyR9'
    ).should('have.text', 'Enable Developer Tools')
    cy.get(':nth-child(4) > .styles__control_info__2Q2Rd > p').should(
      'have.text',
      "Requires restart. Turns on the app's developer tools, which provide access to the inner workings of the app and additional logging."
    )
    cy.get(
      ':nth-child(4) > .styles__labeled_control__WeQhH > .buttons__button_flat__1YVfe > .Svg-sc-1lpozsw-0'
    ).should('exist')
    cy.get(':nth-child(2) > .Card__Title-r4iqug-1').should(
      'have.text',
      'Developer Only (unstable)'
    )
    cy.get(
      ':nth-child(2) > :nth-child(2) > .styles__labeled_control__WeQhH > .styles__labeled_control_label__3UyR9'
    ).should('exist')
    cy.get(
      ':nth-child(2) > :nth-child(2) > .styles__labeled_control__WeQhH > .buttons__button_flat__1YVfe > .Svg-sc-1lpozsw-0'
    ).should('exist')
    cy.get(
      ':nth-child(2) > :nth-child(3) > .styles__labeled_control__WeQhH > .styles__labeled_control_label__3UyR9'
    ).should('exist')
    cy.get(
      ':nth-child(3) > .styles__labeled_control__WeQhH > .buttons__button_flat__1YVfe > .Svg-sc-1lpozsw-0'
    ).should('exist')
  })

  // Confirm the View Available Update button works correct
  it('Confirm View Available Update button works', () => {
    cy.get('.structure__labeled_value_value__rgaIu').then($versionObj => {
      const version = $versionObj.text()
      if (version !== '4.4.0') {
        cy.get('.kWaShj > .Btn-o3dtr1-0')
          .click({ force: true })
          .then(() => {
            // Confirm contents on version update modal
            cy.get('.fQyeVu > .Text-sc-1wb1h0f-0').should(
              'have.text',
              'App Version 4.4.0 Available'
            )
            cy.get('.styles__release_notes__33nZE > h1').should(
              'have.text',
              'Opentrons App Changes in 4.4.0'
            )
            cy.get('.bbkbLa').click()
          })
      }
    })
  })

  // Confirm able to change the Update Channel dropdown menu
  it('Confirm able to change Update Channel dropdown', () => {
    cy.get('.forms__dropdown__3-opf').select('Beta')
    cy.get('.forms__dropdown__3-opf').select('Alpha')
    cy.get('.forms__dropdown__3-opf').select('Stable')
  })
})
