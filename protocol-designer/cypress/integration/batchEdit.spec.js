//Enter batch (shift + step) — select multiple steps - flow rate in advance settings -
//save it in a step - duplicate the selection - exit batch edit via button

describe('Batch Edit Transfo', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnnouncementModal()
    // cy.wait(30000)
  })

  // import the batchEdit.json to PD
  it('title', () => {
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

    // Goto Design tab and verify the page

    cy.get('button[id=NavTab_design]').click()
    cy.get('button').contains('ok').click()

    // Verify the Design Page
    cy.get('#TitleBar_main > h1').contains('Multi select banner test protocol')
    cy.get('#TitleBar_main > h2').contains('STARTING DECK STATE')
    cy.get('button[id=StepCreationButton]').contains('+ Add Step')

    // enter into the batch edit mode
    cy.get('[data-test="StepItem_1"]').click({
      ctrlKey: true,
    })

    // Range selection with shift
    cy.get('[data-test="StepItem_3"]').click({
      shiftKey: true,
    })

    //Change the Flowrate to 100 and Save
    cy.get('[name="aspirate_flowRate"]').click()
    cy.get('input[name="aspirate_flowRate_customFlowRate"]').type('100')
    cy.get('button').contains('Done').click()
    cy.get('button').contains('save').click()

    //Dublicate the selected steps
    // cy.get

    //Exit batch edit mode
    cy.get('button').contains('exit batch edit').click()
  })
})
