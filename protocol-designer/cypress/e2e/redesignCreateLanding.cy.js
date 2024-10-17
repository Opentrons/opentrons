describe('The Redesigned Create Protocol Landing Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.enableRedesign()
  })

  it('step 1 flow works', () => {
    cy.contains('button', 'Create a protocol').click()
    cy.contains('p', 'Step 1').should('be.visible').should('be.visible')
    cy.contains('p', 'Let’s start with the basics').should('be.visible')
    cy.contains('p', 'What kind of robot do you have?').should('be.visible')
    // Flex is the default
    cy.contains('Opentrons Flex').should(
      'have.css',
      'background-color',
      'rgb(0, 108, 250)'
    )

    cy.contains('Opentrons OT-2').should('be.visible').click()

    cy.contains('Opentrons OT-2').should(
      'have.css',
      'background-color',
      'rgb(0, 108, 250)'
    )

    cy.contains('Opentrons Flex').should('be.visible').click()

    cy.contains('Opentrons Flex').should(
      'have.css',
      'background-color',
      'rgb(0, 108, 250)'
    )

    cy.contains('Confirm').should('be.visible').click()
    // a couple validations to validate the click of the confirm button
    // takes us to STEP 2
    cy.contains('p', 'Step 2').should('be.visible')
    cy.contains('Add a pipette').should('be.visible')
    // since Flex was selected, validate the 96 channel pipette is visible
    cy.contains('96-Channel').should('be.visible')
    cy.contains('Go back').should('be.visible').click()
    // validate we are back at the landing page
    cy.contains('p', 'Step 1').should('be.visible')
    // now select the OT-2
    cy.contains('Opentrons OT-2').click()
    cy.contains('Confirm').click()
    // validate we are at step 2
    cy.contains('p', 'Step 2').should('be.visible')
    cy.contains('96-Channel').should('not.exist')
  })
})
