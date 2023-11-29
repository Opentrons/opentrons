describe('Visual Smoke Test', () => {
  describe('The Home Page', () => {

    before(() => {
      cy.visit('/')
      cy.closeAnnouncementModal()
      cy.get("div[class*='navbar__top']").as('top-nav')
      cy.get("div[class*='navbar__bottom']").as('bottom-nav')
    })
    it('should have the following elements on the home page', () => {
      cy.title().should('equal', 'Opentrons Protocol Designer BETA')
      cy.document().should('have.property', 'charset').and('eq', 'UTF-8')

      cy.contains('Protocol File')
      cy.contains('Create New')
      cy.contains('Import')
      cy.contains('Export')
      cy.contains('Settings')
      cy.contains('Protocol Designer')

      cy.get("@top-nav").contains("button[class*='navbar__tab__']", 'FILE')
      .should('not.be.disabled')

      cy.get("@top-nav").contains("button[class*='navbar__tab__']", 'LIQUIDS')
      .should('be.disabled')

      cy.get("@top-nav").contains("button[class*='navbar__tab__']", 'DESIGN')
      .should('be.disabled')

      cy.get("@bottom-nav").contains("a[class*='navbar__tab__']", 'HELP')
      .should('not.be.disabled')
      .should('have.prop', 'href', 'https://support.opentrons.com/s/protocol-designer')

      cy.get("@bottom-nav").contains("button[class*='navbar__tab__']", 'Settings')
      .should('not.be.disabled')
    })

  })

  describe('The Settings Page', () => {
    const exptlSettingText = 'Disable module placement restrictions'

    before(() => {
      cy.visit('/')
      cy.closeAnnouncementModal()
      cy.openSettingsPage()
      cy.get('h3').contains('Information').as('info-section')
      cy.get('h3').contains('Hints').as('hints-section')
      cy.get('h3').contains('Privacy').as('privacy-section')
      cy.get('h3').contains('Experimental Settings').as('experimental-section')
    })
  
    it('should have the following elements', () => {
      cy.get('@info-section').should('exist')
        .next().contains('Protocol Designer Version').should('exist')

      cy.get('@hints-section').should('exist')
        .next().contains('Restore all hints').should('exist')

      cy.get('@privacy-section').should('exist')
      .next().contains("p", "Share sessions").should('exist')
      .next().should('exist').and('have.attr', 'class').and('match', /toggle/)

      cy.get('@experimental-section').should('exist')
      .siblings().contains("p", "Allow all tip rack options").should('exist')
      .next().should('exist').and('have.attr', 'class').and('match', /toggle/)
      
      cy.get('@experimental-section')
      .siblings().contains(exptlSettingText).should('exist')
      .next().should('exist').and('have.attr', 'class').and('match', /toggle/)
    })
  
    it('remembers when we enable things', () => {
      // Enable a button
      // We're not using the privacy button because that
      // interacts with analytics libraries, which might
      // not be accessible in a headless environment
      cy.contains(exptlSettingText).next().click()
      cy.get('button').contains('Continue').click()
      // Leave the settings page
      cy.get("button[class*='navbar__tab__']").contains('FILE').click()
      // Go back to settings
      cy.openSettingsPage()
      // The toggle is still on
      cy.contains(exptlSettingText)
        .next()
        .should('have.attr', 'class')
        .and('match', /toggled_on/)
    })
  })

})

