describe('Desktop Navigation', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnnouncementModal()
  })

  it('contains a working file button', () => {
    cy.get("button[id='NavTab_file']")
      .contains('FILE')
      .parent()
      .should('have.prop', 'disabled')
      .and('equal', false)
  })

  it('contains a disabled liquids button', () => {
    cy.get("button[id='NavTab_liquids']")
      .contains('LIQUIDS')
      .parent()
      .should('have.prop', 'disabled')
  })

  it('contains a disabled design button', () => {
    cy.get("button[id='NavTab_design']")
      .contains('DESIGN')
      .parent()
      .should('have.prop', 'disabled')
  })

  it('contains a help button with external link', () => {
    cy.get('a')
      .contains('HELP')
      .parent()
      .should('have.prop', 'href')
      .and('equal', 'https://support.opentrons.com/s/protocol-designer')
  })

  it('contains a settings button', () => {
    cy.get('button').contains('Settings').should('exist')
  })

  it('returns to the file controls when the file button is clicked', () => {
    cy.get("button[id='NavTab_file']").contains('FILE').click()
    cy.contains('Protocol File')
  })
})
