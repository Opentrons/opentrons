// Completely covered by other tests
// Marking this file for complete removal

describe('Batch Edit Transform', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnnouncementModal()
  })

  // import the batchEdit.json to PD
  it('Verify Flowrate, duplicate, delete functionality in Batch Edit Mode', () => {
    importProtocol()
    openDesignTab()
    const isMacOSX = Cypress.platform === 'darwin'

    // enter into the batch edit mode

    cy.get('[data-test="StepItem_1"]').click({
      [isMacOSX ? 'metaKey' : 'ctrlKey']: true,
    })

    cy.get('button').contains('exit batch edit').should('exist')

    ///////////////////////////////////////////////////////////////////
    // E2E Test Name: Range selection with shift
    // Existing Coverage: True
    // Existing Coverage File: protocol-designer/src/containers/__tests__/ConnectedStepItem.test.tsx
    // Existing Coverage Test Case: when PD in batch edit mode -> it should select multiple steps

    cy.get('[data-test="StepItem_3"]').click({
      shiftKey: true,
    })

    cy.get('#StepSelectionBannerComponent_numberStepsSelected')
      .contains('3 steps selected')
      .should('exist')
    ///////////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////////////
    // E2E Test Name: Change the Flowrate to 100 and Save
    // Existing Coverage: True
    // Existing Coverage File: protocol-designer/src/components/BatchEditForm/__tests__/makeBatchEditFieldProps.test.ts
    // Existing Coverage Test Case: makeBatchEditFieldProps -> should create correct props for all fields with the given MultiselectFieldValues obj

    cy.get('[name="aspirate_flowRate"]').click()
    cy.get('input[name="aspirate_flowRate_customFlowRate"]').type('100')
    cy.get('button').contains('Done').click()
    cy.get('button').contains('save').click()

    // Verify that transfer step 1 has Flowrate value 100
    cy.get('[data-test="StepItem_1"]').click({
      shiftKey: true,
    })
    cy.get('input[name="aspirate_flowRate"]').should('have.value', 100)
    ///////////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////////////
    // E2E Test Name: Verify that transfer and other step selection does not support multistep editing
    // Existing Coverage: True
    // Existing Coverage File: protocol-designer/src/components/BatchEditForm/__tests__/makeBatchEditFieldProps.test.tsall steps
    // Existing Coverage Test Case: makeBatchEditFieldProps -> should make field disabled if it is represented in disabledFields, and show disabled explanation tooltip
    cy.get('[data-test="StepItem_4"]').click({
      [isMacOSX ? 'metaKey' : 'ctrlKey']: true,
    })
    cy.get('#StepSelectionBannerComponent_numberStepsSelected')
      .contains('2 steps selected')
      .should('exist')

    cy.get('[id=Text_noSharedSettings]').contains(
      'Batch editing of settings is only available for Transfer or Mix steps'
    )
    ///////////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////////////   
    // E2E Test Name: Expanding / Selecting / Deselecting / Deleting / Duplicating 
    // Existing Coverage: True
    // Existing Coverage File: protocol-designer/src/components/steplist/__tests__/MultiSelectToolbar.test.tsx
    // Existing Coverage Test Cases: 
    //  MultiSelectToolbar -> 
    //    should have a checked checkbox when all steps are selected, and deselect them all when clicked
    //    should have a minus box when not all steps are selected, and select them all when clicked
    //    when clicking on expand/collapse -> 
    //      should expand/collapse all steps
    //      should toggle the expand/collapse icon

    // Expand ALL steps
    cy.get('#ClickableIcon_expand').click()
    cy.get('[data-test="SubstepRow_aspirateWell"]')
      .contains('A1')
      .should('exist')

    // Select all the steps
    cy.get('#ClickableIcon_select').click()
    cy.get('#StepSelectionBannerComponent_numberStepsSelected')
      .contains('9 steps selected')
      .should('exist')

    // Duplicate the selected steps
    cy.get('#ClickableIcon_duplicate').click()
    cy.get('#ClickableIcon_select').click()
    cy.get('#StepSelectionBannerComponent_numberStepsSelected')
      .contains('18 steps selected')
      .should('exist')

    cy.get('[data-test="StepItem_9"]').click({
      shiftKey: true,
    })

    // Delete the duplicated steps
    cy.get('#ClickableIcon_delete').click()
    cy.get('button').contains('delete steps').click()
    cy.get('#StepSelectionBannerComponent_numberStepsSelected')
      .contains('1 steps selected')
      .should('exist')

    // Exit batch edit mode
    cy.get('button').contains('exit batch edit').click()
    cy.get('button').contains('+ Add Step').should('not.be.disabled')
    ///////////////////////////////////////////////////////////////////
  })
})

function importProtocol() {
  cy.fixture('../../fixtures/protocol/5/batchEdit.json').then(fileContent => {
    cy.get('input[type=file]').upload({
      fileContent: JSON.stringify(fileContent),
      fileName: 'fixture.json',
      mimeType: 'application/json',
      encoding: 'utf8',
    })
    cy.get('[data-test="ComputingSpinner"]').should('exist')
    cy.get('div')
      .contains(
        'Your protocol will be automatically updated to the latest version.'
      )
      .should('exist')
    cy.get('button').contains('ok', { matchCase: false }).click()
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
