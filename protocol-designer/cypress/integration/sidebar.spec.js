describe('Desktop Navigation', () => {
  before(() => {
    cy.visit('/')
    cy.viewport('macbook-15')
  })

  it('contains a working file button', () => {
    cy.get("button[class*='navbar__tab__']")
      .contains('FILE')
      .parent()
      .should('have.prop', 'disabled')
      .and('equal', false)
  })

  it('contains a disabled liquids button', () => {
    cy.get("button[class*='navbar__tab__']")
      .contains('LIQUIDS')
      .parent()
      .should('have.prop', 'disabled')
  })

  it('contains a disabled design button', () => {
    cy.get("button[class*='navbar__tab__']")
      .contains('DESIGN')
      .parent()
      .should('have.prop', 'disabled')
  })

  it('contains a help button with external link', () => {
    cy.get("a[class*='navbar__tab__']")
      .contains('HELP')
      .parent()
      .should('have.prop', 'href')
      .and('equal', 'https://intercom.help/opentrons-protocol-designer')
  })

  it('contains a settings button', () => {
    cy.get("button[class*='navbar__tab__']")
      .contains('Settings')
      .should('exist')
  })

  it('returns to the file controls when the file button is clicked', () => {
    cy.get("button[class*='navbar__tab__']")
      .contains('FILE')
      .click()
    cy.contains('Protocol File')
  })
})
