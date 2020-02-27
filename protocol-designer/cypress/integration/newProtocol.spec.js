describe('Desktop Navigation', () => {
  before(() => {
    cy.visit('/')
    cy.viewport('macbook-15')
  })

  describe('the setup form', () => {
    it('clicks the "CREATE NEW" button', () => {
      cy.get('button')
        .contains('Create New')
        .click()
    })

    it('displays the setup form', () => {
      // Check to make sure all the form elements are present
      cy.get("input[placeholder='Untitled']").should('exist')
      cy.contains('Left Pipette')
        .next()
        .contains('None')
        .should('exist')
      cy.contains('Right Pipette')
        .next()
        .contains('None')
        .should('exist')
      cy.contains('Left Tiprack')
        .next()
        .get('select')
        .should('be.disabled')
      cy.contains('Right Tiprack')
        .next()
        .get('select')
        .should('be.disabled')
      cy.get('button')
        .contains('save')
        .should('be.disabled')
      cy.get('button')
        .contains('cancel')
        .should('not.be.disabled')
    })

    it('cancel the setup form', () => {
      // Click cancel
      cy.get('button')
        .contains('cancel')
        .click()
      // The form goes away
      cy.contains('Create New Protocol').should('not.exist')
    })

    it('completes the setup form', () => {
      // Get the form back
      cy.get('button')
        .contains('Create New')
        .click()
      // Give it a name
      cy.get("input[placeholder='Untitled']").type('Cypress Test Protocol')
      // Choose pipette types
      cy.contains('Left Pipette')
        .next()
        .contains('None')
        .click()
      cy.contains('Left Pipette')
        .next()
        .contains('P20')
        .click()
      cy.contains('Right Pipette')
        .next()
        .contains('None')
        .click()
      cy.contains('Right Pipette')
        .next()
        .contains('P300')
        .click()
      // Diagrams of the pipettes are displayed
      cy.get("div[class*='FilePipettesModal__left_pipette__']")
        .get('img')
        .should('exist')
      cy.get("div[class*='FilePipettesModal__right_pipette__']")
        .get('img')
        .should('exist')
      // The tiprack dropdowns are now available
      cy.contains('Left Tiprack')
        .next()
        .get('select')
        .should('not.be.disabled')
      cy.contains('Right Tiprack')
        .next()
        .get('select')
        .should('not.be.disabled')
      // Select some tipracks
      cy.get("select[name*='left.tiprack']").select(
        'Opentrons 96 Filter Tip Rack 200 µL'
      )
      cy.get("select[name*='right.tiprack']").select(
        'Opentrons 96 Filter Tip Rack 20 µL'
      )
      // Diagrams of the tip racks are displayed
      cy.get("div[class*='FilePipettesModal__tiprack_labware__']")
        .first()
        .get('svg')
        .should('exist')
      cy.get("div[class*='FilePipettesModal__tiprack_labware__']")
        .last()
        .get('svg')
        .should('exist')
      // The save button is now available...
      cy.get('button')
        .contains('save')
        .should('not.be.disabled')
      // ...so click it
      cy.get('button')
        .contains('save')
        .click()
      // And now the "file details" form is displayed
      cy.contains('File Details').should('exist')
    })
  })

  describe('the file details form', () => {
    it('displays the file details form', () => {
      // Check to make sure all the form elements are present
      const todaysDate = Cypress.moment().format('MMM DD, YYYY')
      cy.contains(todaysDate).should('exist')
      cy.contains('Last Exported')
        .next()
        .should('not.exist')
      cy.get("input[value='Cypress Test Protocol']").should('exist')
      cy.get("input[name='author']").should('exist')
      cy.get("input[name='description']").should('exist')
      cy.get('button')
        .contains('UPDATED')
        .should('be.disabled')
      // We should see the pipette info we entered earlier
      cy.contains('left pipette')
        .next()
        .contains('P20 Single-Channel GEN2')
        .should('exist')
      cy.contains('right pipette')
        .next()
        .contains('P300 Single-Channel GEN2')
        .should('exist')
      cy.contains('left pipette')
        .parent()
        .parent()
        .contains('tip rack')
        .next()
        .contains('Opentrons 96 Filter Tip Rack 200 µL')
        .should('exist')
      cy.contains('right pipette')
        .parent()
        .parent()
        .contains('tip rack')
        .next()
        .contains('Opentrons 96 Filter Tip Rack 20 µL')
        .should('exist')
      cy.get('button')
        .contains('edit')
        .should('exist')
      cy.get('button')
        .contains('swap')
        .should('exist')
      cy.get('button')
        .contains('Continue to Liquids')
        .should('exist')
    })

    it('fills out the file details form', () => {
      // There's only two fields, so fill them out
      cy.get("input[name='author']").type('Opentrons Automated Testing')
      cy.get("input[name='description']").type(
        'This protocol was created via automated cypress.io tests'
      )
      cy.get('button')
        .contains('UPDATE')
        .should('not.be.disabled')
      cy.get('button')
        .contains('UPDATE')
        .click()
    })

    describe('exporting what we have got', () => {
      it('displays a warning modal', () => {
        cy.get('button')
          .contains('Export')
          .click()
        // We are shown a warning modal
        cy.contains('Your protocol has no steps').should('exist')
        // It has a link to help
        cy.get('a')
          .contains('here')
          .should('have.prop', 'href')
          .and(
            'equal',
            'https://intercom.help/opentrons-protocol-designer/en/collections/1606688-building-a-protocol#steps'
          )
        // And buttons to get out
        cy.get('button')
          .contains('CANCEL')
          .should('exist')
        cy.get('button')
          .contains('CONTINUE WITH EXPORT')
          .should('exist')
      })

      it('goes away when we click cancel', () => {
        cy.get('button')
          .contains('CANCEL')
          .click()
        // No more modal
        cy.contains('Your protocol has no steps').should('not.exist')
      })

      it('downloads a file when we continue', () => {
        cy.get('button')
          .contains('Export')
          .click()
        cy.get('button')
          .contains('CONTINUE WITH EXPORT')
          .click()
        //
        // TODO Cypress doesn't handle file downloads very well.
        // Perhaps the app can be modified to react more directly
        // with cypress. See https://github.com/cypress-io/cypress/issues/949
        //
        // No more modal
        cy.contains('Your protocol has no steps').should('not.exist')
      })
    })
  })

  describe('editing the pipettes', () => {
    // Use the edit button to make changes to our pipettes
    it('edits the pipettes', () => {
      cy.get('button')
        .contains('edit')
        .click()
      cy.contains('Right Pipette')
        .next()
        .contains('P300')
        .click()
      cy.contains('Right Pipette')
        .next()
        .contains('P1000')
        .click()
      cy.get("select[name*='right.tiprack']").select(
        'Opentrons 96 Filter Tip Rack 10 µL'
      )
    })

    it('cancels the edits', () => {
      cy.get('button')
        .contains('cancel')
        .click()
      // Our tentative edits were not saved
      cy.contains('left pipette')
        .next()
        .contains('P20 Single-Channel GEN2')
        .should('exist')
      cy.contains('right pipette')
        .next()
        .contains('P300 Single-Channel GEN2')
        .should('exist')
      cy.contains('left pipette')
        .parent()
        .parent()
        .contains('tip rack')
        .next()
        .contains('Opentrons 96 Filter Tip Rack 200 µL')
        .should('exist')
      cy.contains('right pipette')
        .parent()
        .parent()
        .contains('tip rack')
        .next()
        .contains('Opentrons 96 Filter Tip Rack 20 µL')
        .should('exist')
    })

    it('edits the pipettes again', () => {
      // Same edits as above
      cy.get('button')
        .contains('edit')
        .click()
      cy.contains('Right Pipette')
        .next()
        .contains('P300')
        .click()
      cy.contains('Right Pipette')
        .next()
        .contains('P1000')
        .click()
      cy.get("select[name*='right.tiprack']").select(
        'Opentrons 96 Filter Tip Rack 10 µL'
      )
    })

    it('saves the edits', () => {
      cy.get('button')
        .contains('save')
        .click()
    })

    it('displays a confirmation modal', () => {
      // We need to confirm our changes
      cy.contains('Are you sure you want to make this change?').should('exist')
      cy.get("ul[class*='StepChangesConfirmModal__cause_effect_list__']")
        .next()
        .contains('cancel')
        .should('exist')
      cy.get('button')
        .contains('continue')
        .should('exist')
    })

    it('cancels the changes from the confirmation modal', () => {
      // No, let's go back
      cy.get("ul[class*='StepChangesConfirmModal__cause_effect_list__']")
        .next()
        .contains('cancel')
        .click({ force: true })
      cy.contains('Change Pipette Selection').should('exist')
    })

    it('saves the changes for real', () => {
      // Click save
      cy.get('button')
        .contains('save')
        .click()
      // Click continue
      cy.get('button')
        .contains('continue')
        .click({ force: true })
      // See our edits
      cy.contains('left pipette')
        .next()
        .contains('P20 Single-Channel GEN2')
        .should('exist')
      cy.contains('left pipette')
        .parent()
        .parent()
        .contains('tip rack')
        .next()
        .contains('Opentrons 96 Filter Tip Rack 200 µL')
        .should('exist')
      cy.contains('right pipette')
        .next()
        .contains('P1000 Single-Channel GEN2')
        .should('exist')
      cy.contains('right pipette')
        .parent()
        .parent()
        .contains('tip rack')
        .next()
        .contains('Opentrons 96 Filter Tip Rack 10 µL')
        .should('exist')
    })
  })

  describe('pipette swapping', () => {
    it('swaps the pipettes', () => {
      // Click the swap button
      cy.get('button')
        .contains('swap')
        .click()
      // What was left is now right and vice versa
      cy.contains('left pipette')
        .next()
        .contains('P1000 Single-Channel GEN2')
        .should('exist')
      cy.contains('left pipette')
        .parent()
        .parent()
        .contains('tip rack')
        .next()
        .contains('Opentrons 96 Filter Tip Rack 10 µL')
        .should('exist')
      cy.contains('right pipette')
        .next()
        .contains('P20 Single-Channel GEN2')
        .should('exist')
      cy.contains('right pipette')
        .parent()
        .parent()
        .contains('tip rack')
        .next()
        .contains('Opentrons 96 Filter Tip Rack 200 µL')
        .should('exist')
    })
  })

  describe('the new liquid form', () => {
    it('displays the new liquid form', () => {
      // Check to make sure all the form elements are present
      cy.get('button')
        .contains('Continue to Liquids')
        .click()
      cy.get('button')
        .contains('New Liquid')
        .should('exist')
        .and('not.be.disabled')
      cy.get('button')
        .contains('New Liquid')
        .click()
      cy.get("input[name='name']").should('exist')
      cy.get("input[name='description']").should('exist')
      cy.get("input[name='serialize']").should('exist')
      cy.get('button')
        .contains('delete')
        .should('be.disabled')
      cy.get('button')
        .contains('cancel')
        .should('not.be.disabled')
      cy.get('button')
        .contains('save')
        .should('be.disabled')
    })

    it('fills out the new liquid form', () => {
      // No error message yet
      cy.contains('Liquid name is required').should('not.exist')
      // Touch the name and leave to trigger an error message
      cy.get("input[name='name']")
        .focus()
        .blur()
      cy.contains('Liquid name is required').should('exist')
      // Type a name to see the error message go away
      cy.get("input[name='name']").type('Water')
      cy.contains('Liquid name is required').should('not.exist')
      // Fill out the rest of the form
      cy.get("input[name='description']").type('It is just water')
      cy.get("input[name='serialize']").check({ force: true })
      cy.get('button')
        .contains('save')
        .click()
    })

    it('adds a second liquid', () => {
      // Make another. Why not?
      cy.get('button')
        .contains('New Liquid')
        .click()
      cy.get("input[name='name']").type('Orange Juice')
      cy.get("input[name='description']").type('Mmmmm... orange juice!')
      cy.get('button')
        .contains('save')
        .click()
    })

    it('adds a third liquid', () => {
      // We're on a roll
      cy.get('button')
        .contains('New Liquid')
        .click()
    })

    it('cancels the third liquid', () => {
      // Never mind
      cy.get('button')
        .contains('cancel')
        .click()
      // The form goes away
      cy.contains('Define your liquids').should('exist')
    })
  })

  describe('design page', () => {
    it('moves on to the design step', () => {
      cy.get("button[class*='navbar__tab__']")
        .contains('DESIGN')
        .parent()
        .click()
      cy.get('button')
        .contains('ok')
        .click()
    })
  })
})
