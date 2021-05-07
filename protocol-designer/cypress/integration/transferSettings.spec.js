const isMacOSX = Cypress.platform === 'darwin'

describe('Advanced Settings for Transfer Form', () => {
  before(() => {
    cy.visit('/')
    cy.closeAnnouncementModal()
    importProtocol()
    openDesignTab()
  })

  xit('Verify functionality of advance settings with different pipette and labware', () => {
    enterBatchEdit()

    // Different Pipette diabales aspirate and dispense Flowrate and Mix settings

    // step 6 has different pipette than step 1
    cy.get('[data-test="StepItem_6"]').click({
      [isMacOSX ? 'metaKey' : 'ctrlKey']: true,
    })

    // Pre-wet tip is always enabled
    cy.get('input[name="preWetTip"]').should('be.enabled')

    // well-order is always enabled
    cy.get('[id=WellOrderField_button_aspirate]').click()

    // Aspirate Flowrate and mix disabled
    cy.get('input[name="aspirate_flowRate"]').should('be.disabled')
    cy.get('input[name="aspirate_mix_checkbox"]').should('be.disabled')

    // Dispense Flowrate and mix diabled
    cy.get('input[name="dispense_flowRate"]').should('be.disabled')
    cy.get('input[name="dispense_mix_checkbox"]').should('be.disabled')

    // Save button is disabled
    cy.get('button').contains('save').should('not.be.enabled')

    // enable pre-wet tip
    cy.prewettip()
    cy.get('input[name="preWetTip"]').should('be.visible')

    // mouse-over action to be performed here
    cy.get('input[name="preWetTip"]').invoke('show').trigger('mouseover')

    // save the changes
    cy.get('button').contains('save').click()

    // Deselecting step 6, to test steps with same pipette and labware
    cy.get('[data-test="StepItem_6"]').click({
      [isMacOSX ? 'metaKey' : 'ctrlKey']: true,
    })
  })

  it('Verify functionality of advance settings with same pipette and labware', () => {
    // click on step 2 in batch edit mode
    cy.get('[data-test="StepItem_2"]').click({
      [isMacOSX ? 'metaKey' : 'ctrlKey']: true,
    })
    // click on step 3 , as step 2 & 3 have same pipette and labware
    cy.get('[data-test="StepItem_3"]').click({
      [isMacOSX ? 'metaKey' : 'ctrlKey']: true,
    })
    // Aspirate Flowrate and mix are enabled
    cy.get('input[name="aspirate_flowRate"]').should('be.enabled')
    cy.get('input[name="aspirate_mix_checkbox"]').should('be.enabled')

    // Dispense Flowrate and mix are enabled
    cy.get('input[name="dispense_flowRate"]').should('be.enabled')
    cy.get('input[name="dispense_mix_checkbox"]').should('be.enabled')

    // Delay in aspirate and Dispense settings is enabled
    cy.get('input[name="aspirate_delay_checkbox"]').should('be.enabled')
    cy.get('input[name="dispense_delay_checkbox"]').should('be.enabled')

    // Touchtip in aspirate and Dispense settings is enabled
    cy.get('input[name="aspirate_touchTip_checkbox"]').should('be.enabled')
    cy.get('input[name="dispense_touchTip_checkbox"]').should('be.enabled')

    // Blowout in dispense settings is enabled
    cy.get('input[name="blowout_checkbox"]').should('be.enabled')
  })

  it('verify functionality of flowrate in batch edit transfer', () => {
    // Batch editing the Flowrate value
    cy.get('input[name="aspirate_flowRate"]').click()
    cy.get('div[class*=FlowRateInput__description]').contains(
      'Our default aspirate speed is optimal for a P1000 Single-Channel GEN2 aspirating liquids with a viscosity similar to water'
    )
    cy.get('input[name="aspirate_flowRate_customFlowRate"]').type('100')
    cy.get('button').contains('Done').click()

    // Click save button to save the changes
    cy.get('button').contains('save').click()

    // Exit batch edit mode
    cy.get('button').contains('exit batch edit').click()

    // Click on step 2 to verify that flowrate is updated to 100
    cy.get('[data-test="StepItem_2"]').click()
    // cy.get('button[id="AspDispSection_settings_button_aspirate"]').click()

    // Verify that flowrate value
    // cy.get('input[name="aspirate_flowRate"]').should('have.value', 100)

    // Click on step 3 to verify that flowrate is updated to 100
    // cy.get('[data-test="StepItem_3"]').click()
    // cy.get('button[id="AspDispSection_settings_button_aspirate"]').click()

    // Verify that flowrate value
    // cy.get('input[name="aspirate_flowRate"]').should('have.value', 100)
  })

  it('verify flowrate indeterminate value', () => {
    // click on step 2 in batch edit mode
    cy.get('[data-test="StepItem_2"]').click({
      [isMacOSX ? 'metaKey' : 'ctrlKey']: true,
    })
    cy.get('input[name="aspirate_flowRate"]').click()
    cy.get('div[class*=FlowRateInput__description]').contains(
      'Our default aspirate speed is optimal for a P1000 Single-Channel GEN2 aspirating liquids with a viscosity similar to water'
    )
    cy.get('[type="radio"]').first().check()
    cy.get('button').contains('Done').click()

    // Click save button to save the changes
    cy.get('button').contains('save').click()

    // Click on step 3 as it has flowrate set to 100 from previous testcase
    cy.get('[data-test="StepItem_3"]').click({
      [isMacOSX ? 'metaKey' : 'ctrlKey']: true,
    })

    // indeterminate state in flowrate is displayed with "-"
    cy.get('input[name="aspirate_flowRate"]').should('have.value', '-')
  })
})

function importProtocol() {
  cy.fixture('../../fixtures/protocol/5/transferSettings.json').then(
    fileContent => {
      cy.get('input[type=file]').upload({
        fileContent: JSON.stringify(fileContent),
        fileName: 'fixture.json',
        mimeType: 'application/json',
        encoding: 'utf8',
      })
      cy.get('[data-test="ComputingSpinner"]').should('exist')
      // wait until computation is done before proceeding, with generous timeout
      cy.get('[data-test="ComputingSpinner"]', { timeout: 30000 }).should(
        'not.exist'
      )
    }
  )
}

function openDesignTab() {
  cy.get('button[id=NavTab_design]').click()
  cy.get('button').contains('ok').click()

  // Verify the Design Page
  cy.get('#TitleBar_main > h1').contains('Multi select banner test protocol')
  cy.get('#TitleBar_main > h2').contains('STARTING DECK STATE')
  cy.get('button[id=StepCreationButton]').contains('+ Add Step')
}

function enterBatchEdit() {
  const isMacOSX = Cypress.platform === 'darwin'
  cy.get('[data-test="StepItem_1"]').click({
    [isMacOSX ? 'metaKey' : 'ctrlKey']: true,
  })

  cy.get('button').contains('exit batch edit').should('exist')
}
