describe('Batch Edit Transform', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnnouncementModal()
  })

  // import the batchEdit.json to PD
  it('Verify Flowrate, dublicate, delete functionality in Batch Edit Mode', () => {
    importProtocol()
    openDesignTab()

    // enter into the batch edit mode
    cy.get('[data-test="StepItem_1"]').click({
      ctrlKey: true,
    })

    // Range selection with shift
    cy.get('[data-test="StepItem_3"]').click({
      shiftKey: true,
    })

    // Change the Flowrate to 100 and Save
    cy.get('[name="aspirate_flowRate"]').click()
    cy.get('input[name="aspirate_flowRate_customFlowRate"]').type('100')
    cy.get('button').contains('Done').click()
    cy.get('button').contains('save').click()

    // Verify that transfer and other step selection does not support multistep editing
    cy.get('[data-test="StepItem_4"]').click({
      ctrlKey: true,
    })
    cy.get('[id=Text_noSharedSettings]').contains(
      'No editable settings shared between selected steps',
      {
        matchCase: false,
      }
    )

    // Dublicate the selected steps
    cy.get('#ClickableIcon_duplicate').click()

    // Expand ALL steps
    cy.get('#ClickableIcon_expand').click()

    // Delete the dublicated steps
    cy.get('#ClickableIcon_delete').click()
    cy.get('button').contains('delete steps').click()

    // Exit batch edit mode
    cy.get('button').contains('exit batch edit').click()
  })
})

function importProtocol() {
  cy.fixture('../../fixtures/protocol/4/batchEdit.json').then(fileContent => {
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
