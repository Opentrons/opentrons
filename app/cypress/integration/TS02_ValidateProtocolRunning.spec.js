// E2E Test Suite 02 for Opentrons App - Validate Protocol Running
import 'cypress-wait-until'
import 'cypress-file-upload'

describe('Test Suite 02 - Validate Protocol Running', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8090')

    // Connect to the robot
    cy.get('.buttons__button_flat__1YVfe > .Svg-sc-1lpozsw-0 > path')
      .click({ force: true })
      .then(() => {
        cy.waitUntil(() =>
          cy
            .get('.alerts__title_bar__Pad5-')
            .should('exist')
            .then(() => {
              // Navigate to the Protocol page once it is confirmed that the robot is successfully connected
              cy.get(
                '[aria-describedby="Tooltip__2"] > .Svg-sc-1lpozsw-0 > path'
              ).click({ force: true })
            })
        )
      })
  })

  // Run JSON protocol named TestAutomationProtocol1.json
  // Uses 2 modules (magnetic and temperature)
  it('Run JSON protocol using magnetic and temperature modules', () => {
    // Load the protocol file and clear the confirmation modal
    const filePath = 'TestAutomationProtocol1.json'
    cy.get('.upload-panel__file_input__1Mo7Z')
      .attachFile(filePath)
      .then(() => {
        cy.get('.modals__alert_modal_buttons__2GQHd > :nth-child(2)')
          .click({ force: true })
          .then(() => {
            // Wait for simulation to finish before navigating to the Run page
            cy.waitUntil(() => cy.get('.kIChyh').should('be.visible')).then(
              () => {
                cy.get(
                  '[aria-describedby="Tooltip__4"] > .Svg-sc-1lpozsw-0 > path'
                )
                  .click()
                  .then(() => {
                    // Make sure modules populate before hitting the Start Run button
                    cy.waitUntil(() =>
                      cy
                        .get(':nth-child(2) > .lists__title_bar__3n-Et')
                        .should('be.visible')
                    ).then(() => {
                      cy.get('.buttons__button_outline__3z7qv')
                        .click()
                        .then(() => {
                          // Confirm the protocol run finished successfully
                          cy.get('.alerts__title_bar__Pad5-', {
                            timeout: 45000,
                          })
                            .should(
                              'have.text',
                              'Run complete! Reset run to run protocol again.'
                            )
                            .then(() => {
                              // Click the Reset Run button to clear it for the next test run
                              cy.get('.buttons__button_outline__3z7qv').click()
                            })
                        })
                    })
                  })
              }
            )
          })
      })
  })

  // Run JSON protocol named TestAutomationProtocol2.json
  // Uses NO modules
  it('Run JSON protocol using no modules', () => {
    // Load the protocol file and clear the confirmation modal
    const filePath = 'TestAutomationProtocol2.json'
    cy.get('.upload-panel__file_input__1Mo7Z')
      .attachFile(filePath)
      .then(() => {
        cy.get('.modals__alert_modal_buttons__2GQHd > :nth-child(2)')
          .click({ force: true })
          .then(() => {
            // Wait for simulation to finish before navigating to the Run page
            cy.waitUntil(() => cy.get('.kIChyh').should('be.visible')).then(
              () => {
                cy.get(
                  '[aria-describedby="Tooltip__4"] > .Svg-sc-1lpozsw-0 > path'
                )
                  .click()
                  .then(() => {
                    cy.get('.buttons__button_outline__3z7qv')
                      .click()
                      .then(() => {
                        // Confirm the protocol run finished successfully
                        cy.get('.alerts__title_bar__Pad5-', { timeout: 140000 })
                          .should(
                            'have.text',
                            'Run complete! Reset run to run protocol again.'
                          )
                          .then(() => {
                            // Click the Reset Run button to clear it for the next test run
                            cy.get('.buttons__button_outline__3z7qv').click()
                          })
                      })
                  })
              }
            )
          })
      })
  })
})
