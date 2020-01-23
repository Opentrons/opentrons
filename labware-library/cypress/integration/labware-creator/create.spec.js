// Scrolling seems wonky, so I disabled checking to see if
// an element is in view before clicking or checking with
// { force: true }

context('The Labware Creator Landing Page', () => {
  before(() => {
    cy.visit('/create')
    cy.viewport('macbook-15')
    cy.contains('NO').click({ force: true })
  })

  describe('The initial text', () => {
    it('contains a link back', () => {
      cy.contains('Back to Labware Library').should('have.prop', 'href')
    })

    it('contains a button to the labware guide', () => {
      cy.contains('read the custom labware guide')
        .should('have.prop', 'href')
        .and(
          'equal',
          'https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions'
        )
    })

    it('contains a second link to the labware library', () => {
      cy.contains('Labware Library').should('have.prop', 'href')
    })

    it('contains a link to the request form', () => {
      cy.contains('request form')
        .should('have.prop', 'href')
        .and('equal', 'https://opentrons-ux.typeform.com/to/xi8h0W')
    })

    it('contains a second link to the labware guide', () => {
      cy.contains('this guide')
        .should('have.prop', 'href')
        .and(
          'equal',
          'https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions'
        )
    })
  })
})
