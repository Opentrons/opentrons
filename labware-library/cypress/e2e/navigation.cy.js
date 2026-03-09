import { navigateToUrl } from '../support/e2e'

describe('Desktop Navigation', () => {
  beforeEach(() => {
    navigateToUrl('/')
  })

  it('contains the subdomain nav bar', () => {
    cy.get("div[class*='_subdomain_nav_wrapper_']")
      .contains('Python API')
      .should('have.prop', 'href')
      .and('equal', 'https://docs.opentrons.com/')
    cy.get("div[class*='_subdomain_nav_wrapper_']")
      .contains('Labware Library')
      .should('have.prop', 'href')
    cy.get("div[class*='_subdomain_nav_wrapper_']")
      .contains('Protocol Library')
      .should('have.prop', 'href')
      .and('equal', 'https://library.opentrons.com/')
    cy.get("div[class*='_subdomain_nav_wrapper_']")
      .contains('Protocol Designer')
      .should('have.prop', 'href')
      .and('equal', 'https://designer.opentrons.com/')
  })

  it('contains the main nav bar', () => {
    cy.get("div[class*='_main_nav_wrapper_']")
      .find('a')
      .should('have.prop', 'href')
      .and('equal', 'https://opentrons.com/')
    cy.get("div[class*='_main_nav_wrapper_']").contains('About')
    cy.get("div[class*='_main_nav_wrapper_']").contains('Products')
    cy.get("div[class*='_main_nav_wrapper_']").contains('Applications')
    cy.get("div[class*='_main_nav_wrapper_']").contains('Protocols')
    cy.get("div[class*='_main_nav_wrapper_']").contains('Support & Sales')
  })

  it('displays correct about links', () => {
    cy.get("div[class*='_main_nav_wrapper_']")
      .contains('About')
      .parent()
      .click()
    cy.get("div[class*='_main_nav_wrapper_']")
      .contains('About')
      .next()
      .within(() => {
        cy.contains('Mission')
          .should('have.prop', 'href')
          .and('equal', 'https://opentrons.com/about')
        cy.contains('Our Team')
          .should('have.prop', 'href')
          .and('equal', 'https://opentrons.com/team')
        cy.contains('Blog')
          .should('have.prop', 'href')
          .and('equal', 'https://blog.opentrons.com/')
      })
  })
})
