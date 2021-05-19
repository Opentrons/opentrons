const isMacOSX = Cypress.platform === 'darwin'
const invalidInput = 'abcdefghijklmnopqrstuvwxyz!@#$%^&*()<>?,-'

describe('Advanced Settings for Mix Form', () => {
  before(() => {
    cy.visit('/')
    cy.closeAnnouncementModal()
    importProtocol()
    openDesignTab()
  })
  it('Verify functionality of mix settings with different labware', () => {
    enterBatchEdit()

    // Different Pipette diabales aspirate and dispense Flowrate and Mix settings
    // step 6 has different pipette than step 1
    cy.get('[data-test="StepItem_6"]').click({
      [isMacOSX ? 'metaKey' : 'ctrlKey']: true,
    })
  })
  it('Verify functionality of mix settings with same labware', () => {
    enterBatchEdit()

    // Different Pipette diabales aspirate and dispense Flowrate and Mix settings
    // step 6 has different pipette than step 1
    cy.get('[data-test="StepItem_6"]').click({
      [isMacOSX ? 'metaKey' : 'ctrlKey']: true,
    })
  })
  it('verify flowrate indeterminate value and batch editing flowrate', () => {
    // click on step 2 in batch edit mode
    cy.get('[data-test="StepItem_2"]').click({
      [isMacOSX ? 'metaKey' : 'ctrlKey']: true,
    })
  })
})

function importProtocol() {
  cy.fixture('../../fixtures/protocol/5/mixSettings.json').then(fileContent => {
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
  })
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
