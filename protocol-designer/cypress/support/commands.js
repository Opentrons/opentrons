// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
import 'cypress-file-upload'
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

//
// General Custom Commands
//
Cypress.Commands.add('closeAnnouncementModal', () => {
  // ComputingSpinner sometimes covers the announcement modal button and prevents the button click
  // this will retry until the ComputingSpinner does not exist
  cy.get('[data-test="ComputingSpinner"]', { timeout: 30000 }).should(
    'not.exist'
  )
  cy.get('button')
    .contains('Got It!')
    .should('be.visible')
    .click({ force: true })
})

Cypress.Commands.add('enableRedesign', () => {
  cy.window().then(win => {
    win.enablePrereleaseMode()
  })
  // You select using the mouse thing on the upper right corner of
  // The inspector window
  // Use the element name and what's inside it
  cy.get('button')
    .contains('Got It!')
    .should('be.visible')
    .click({ force: true })
  cy.openSettingsPage()
  //
  cy.contains('Enable redesign').next().click()
  cy.contains('button', 'Continue').click()
})
//
// File Page Actions
//
Cypress.Commands.add('openFilePage', () => {
  cy.get('button[id="NavTab_file"]').contains('FILE').click()
})

//
// Pipette Page Actions
//
Cypress.Commands.add(
  'choosePipettes',
  (left_pipette_selector, right_pipette_selector) => {
    cy.get('[id="PipetteSelect_left"]').click()
    cy.get(left_pipette_selector).click()
    cy.get('[id="PipetteSelect_right"]').click()
    cy.get(right_pipette_selector).click()
  }
)

Cypress.Commands.add('selectTipRacks', (left, right) => {
  if (left) {
    cy.get("select[name*='left.tiprack']").select(left)
  }
  if (right) {
    cy.get("select[name*='right.tiprack']").select(right)
  }
})

//
// Liquid Page Actions
//
Cypress.Commands.add(
  'addLiquid',
  (liquidName, liquidDesc, serializeLiquid = false) => {
    cy.get('button').contains('New Liquid').click()
    cy.get("input[name='name']").type(liquidName)
    cy.get("input[name='description']").type(liquidDesc)
    if (serializeLiquid) {
      // force option used because checkbox is hidden
      cy.get("input[name='serialize']").check({ force: true })
    }
    cy.get('button').contains('save').click()
  }
)

//
// Design Page Actions
//
Cypress.Commands.add('openDesignPage', () => {
  cy.get('button[id="NavTab_design"]').contains('DESIGN').parent().click()
})
Cypress.Commands.add('addStep', stepName => {
  cy.get('button').contains('Add Step').click()
  cy.get('button').contains(stepName, { matchCase: false }).click()
})

//
// Settings Page Actions
//
Cypress.Commands.add('openSettingsPage', () => {
  cy.get('button').contains('Settings').click()
})

// Advance Settings for Transfer Steps

// Pre-wet tip enable/disable
Cypress.Commands.add('togglePreWetTip', () => {
  cy.get('input[name="preWetTip"]').click({ force: true })
})

// Mix settings select/deselect
Cypress.Commands.add('mixaspirate', () => {
  cy.get('input[name="aspirate_mix_checkbox"]').click({ force: true })
})
