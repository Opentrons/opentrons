// Scrolling seems wonky, so I disabled checking to see if
// an element is in view before clicking or checking with
// { force: true }

/* eslint-disable no-undef */
context('The Labware Creator Landing Page', function() {
  before(() => {
    cy.visit('/create')
    cy.viewport('macbook-15')
    cy.contains('NO').click({ force: true })
  })

  describe('The initial text', () => {
    it('contains a link back', function() {
      cy.contains('Back to Labware Library').should('have.prop', 'href')
    })

    it('contains a button to the labware guide', function() {
      cy.contains('read the custom labware guide')
        .should('have.prop', 'href')
        .and(
          'equal',
          'https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions'
        )
    })

    it('contains a second link to the labware library', function() {
      cy.contains('Labware Library').should('have.prop', 'href')
    })

    it('contains a link to the request form', function() {
      cy.contains('request form')
        .should('have.prop', 'href')
        .and('equal', 'https://opentrons-ux.typeform.com/to/xi8h0W')
    })

    it('contains a second link to the labware guide', function() {
      cy.contains('this guide')
        .should('have.prop', 'href')
        .and(
          'equal',
          'https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions'
        )
    })
  })
})
