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
  cy.get('button')
    .contains('Got It!')
    .click()
})

//
// File Page Actions
//
Cypress.Commands.add('openFilePage', () => {
  cy.get('button')
    .contains('FILE')
    .click()
})

//
// Pipette Page Actions
//
Cypress.Commands.add('choosePipettes', (left, right) => {
  cy.contains('Left Pipette')
    .next()
    .contains('None')
    .click()
  cy.contains('Left Pipette')
    .next()
    .contains(left)
    .click()
  cy.contains('Right Pipette')
    .next()
    .contains('None')
    .click()
  cy.contains('Right Pipette')
    .next()
    .contains(right)
    .click()
})

Cypress.Commands.add('selectTipRacks', (left, right) => {
  cy.get("select[name*='left.tiprack']").select(left)
  cy.get("select[name*='right.tiprack']").select(right)
})

//
// Liquid Page Actions
//
Cypress.Commands.add(
  'addLiquid',
  (liquidName, liquidDesc, serializeLiquid = false) => {
    cy.get('button')
      .contains('New Liquid')
      .click()
    cy.get("input[name='name']").type(liquidName)
    cy.get("input[name='description']").type(liquidDesc)
    if (serializeLiquid) {
      cy.get("input[name='serialize']").check({ force: true })
    }
    cy.get('button')
      .contains('save')
      .click()
  }
)

//
// Design Page Actions
//
Cypress.Commands.add('openDesignPage', () => {
  cy.get("button[class*='navbar__tab__']")
    .contains('DESIGN')
    .parent()
    .click()
})
Cypress.Commands.add('addStep', stepName => {
  cy.get('button')
    .contains('Add Step')
    .click()
  cy.get('button')
    .contains(stepName, { matchCase: false })
    .click()
})

//
// Settings Page Actions
//
Cypress.Commands.add('openSettingsPage', () => {
  cy.get('button')
    .contains('Settings')
    .click()
})
