describe('The Settings Page', () => {
  const exptlSettingText = 'Disable module placement restrictions'

  before(() => {
    cy.visit('/')
  })

  it('displays the announcement modal and clicks "GOT IT!" to close it', () => {
    cy.closeAnnouncementModal()
  })

  it('contains a working settings button', () => {
    cy.get("button[class*='navbar__tab__']")
      .contains('Settings')
      .click()
    cy.contains('App Settings')
  })

  it('contains an information section', () => {
    cy.get('h3')
      .contains('Information')
      .should('exist')
  })

  it('contains version information', () => {
    cy.contains('Protocol Designer Version').should('exist')
  })

  it('contains a hints section', () => {
    cy.get('h3')
      .contains('Hints')
      .should('exist')
  })

  it('contains a privacy section', () => {
    cy.get('h3')
      .contains('Privacy')
      .should('exist')
  })

  it('contains a share settings button in the pivacy section', () => {
    // It's toggled off by default
    cy.contains('Share sessions')
      .next()
      .should('have.attr', 'class')
      .and('match', /toggled_off/)
    // Click it
    cy.contains('Share sessions')
      .next()
      .click()
    // Now it's toggled on
    cy.contains('Share sessions')
      .next()
      .should('have.attr', 'class')
      .and('match', /toggled_on/)
    // Click it again
    cy.contains('Share sessions')
      .next()
      .click()
    // Now it's toggled off again
    cy.contains('Share sessions')
      .next()
      .should('have.attr', 'class')
      .and('match', /toggled_off/)
  })

  it('contains an experimental settings section', () => {
    cy.get('h3')
      .contains('Experimental Settings')
      .should('exist')
  })

  it("contains a 'disable module placement restrictions' experimental feature", () => {
    // It's toggled off by default
    cy.contains(exptlSettingText)
      .next()
      .should('have.attr', 'class')
      .and('match', /toggled_off/)
    // Click it
    cy.contains(exptlSettingText)
      .next()
      .click()
    // We have to confirm this one
    cy.contains('Switching on an experimental feature').should('exist')
    cy.get('button')
      .contains('Cancel')
      .should('exist')
    cy.get('button')
      .contains('Continue')
      .should('exist')
    // Abort!
    cy.get('button')
      .contains('Cancel')
      .click()
    // Still toggled off
    cy.contains(exptlSettingText)
      .next()
      .should('have.attr', 'class')
      .and('match', /toggled_off/)
    // Click it again and confirm
    cy.contains(exptlSettingText)
      .next()
      .click()
    cy.get('button')
      .contains('Continue')
      .click()
    // Now it's toggled on
    cy.contains(exptlSettingText)
      .next()
      .should('have.attr', 'class')
      .and('match', /toggled_on/)
    // Click it again
    cy.contains(exptlSettingText)
      .next()
      .click()
    // We have to confirm to turn it off?
    // TODO That doesn't seem right...
    cy.get('button')
      .contains('Continue')
      .click()
    // Now it's toggled off again
    cy.contains(exptlSettingText)
      .next()
      .should('have.attr', 'class')
      .and('match', /toggled_off/)
  })

  it('remembers when we enable things', () => {
    // Enable a button
    // We're not using the privacy button because that
    // interacts with analytics libraries, which might
    // not be accessible in a headless environment
    cy.contains(exptlSettingText)
      .next()
      .click()
    cy.get('button')
      .contains('Continue')
      .click()
    // Leave the settings page
    cy.get("button[class*='navbar__tab__']").contains('FILE')
    // Go back to settings
    cy.get("button[class*='navbar__tab__']")
      .contains('Settings')
      .click()
    // The toggle is still on
    cy.contains(exptlSettingText)
      .next()
      .should('have.attr', 'class')
      .and('match', /toggled_on/)
  })

  it('remembers when we disable things', () => {
    // Disable a button
    // We're not using the privacy button because that
    // interacts with analytics libraries, which might
    // not be accessible in a headless environment
    cy.contains(exptlSettingText)
      .next()
      .click()
    cy.get('button')
      .contains('Continue')
      .click()
    // Leave the settings page
    cy.get("button[class*='navbar__tab__']").contains('FILE')
    // Go back to settings
    cy.get("button[class*='navbar__tab__']")
      .contains('Settings')
      .click()
    // The toggle is still off
    cy.contains(exptlSettingText)
      .next()
      .should('have.attr', 'class')
      .and('match', /toggled_off/)
  })
})
