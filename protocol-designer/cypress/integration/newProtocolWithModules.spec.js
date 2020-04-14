// Common Variables and Selectors
const protocolTitle = 'Modules Test Protocol'
const tipRack = 'Opentrons 96 Tip Rack 300 µL'
const tipRackWithoutUnit = 'Opentrons 96 Tip Rack 300'
const sidePanel = '[class*="SidePanel__panel_contents"]'
const designPageModal = '#main-page-modal-portal-root'
const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const defaultTextInput = 'input[type="text"]'
const alertTitleContainer = '[class*="alerts__title"]'
const editModuleModal = 'div[class*="EditModules__modal_contents"]'
const moduleModelDropdown =
  'div[class*="EditModules__option_model"] select[class*="forms__dropdown"]'
// Slots
const slotOne = 'foreignObject[x="0"][y="0"]'
const slotThree = 'foreignObject[x="265"][y="0"]'
const slotFive = 'foreignObject[x="132.5"][y="90.5"]'

describe('Protocols with Modules', () => {
  beforeEach(() => {
    cy.viewport('macbook-15')
  })
  before(() => {
    cy.visit('/')
    cy.closeAnnouncementModal()
  })

  describe('build a new protocol with mag deck', () => {
    it('sets up pipettes, tips, and modules', () => {
      cy.get('button')
        .contains('Create New')
        .click()
      // Give it a name
      cy.get("input[placeholder='Untitled']").type(protocolTitle)
      // Choose pipette types and tip racks
      cy.contains('Left Pipette')
        .next()
        .contains('None')
        .click()
      cy.contains('Left Pipette')
        .next()
        .contains('P300')
        .click()
      cy.contains('Right Pipette')
        .next()
        .contains('None')
        .click()
      cy.get('div[id*="select-3-option-2-5"]').click()
      cy.selectTipRacks(tipRack, tipRack)

      // Add modules
      cy.contains('Magnetic').should('exist')
      cy.contains('Temperature').should('exist')
      // force option used because checkbox is hidden
      cy.get('input[name="modulesByType.magneticModuleType.onDeck"]').click({
        force: true,
      })
      cy.get('select[name="modulesByType.magneticModuleType.model"]').select(
        'GEN1'
      )
      // force option used because checkbox is hidden
      cy.get('input[name="modulesByType.temperatureModuleType.onDeck"]').click({
        force: true,
      })
      cy.get('select[name="modulesByType.temperatureModuleType.model"]').select(
        'GEN2'
      )
      cy.get('button')
        .contains('save')
        .click()

      // Verify modules were added
      cy.contains('File Details').should('exist')
      cy.contains('Modules').should('exist')
      var modulesSection = 'div[class*="modules_card_content"]'
      cy.get(modulesSection).within(() => {
        cy.contains('Magnetic').should('exist')
        cy.contains('GEN1').should('exist')
        cy.contains('Slot 1').should('exist')

        cy.contains('Temperature').should('exist')
        cy.contains('GEN2').should('exist')
        cy.contains('Slot 3').should('exist')
      })

      // Edit modules
      cy.get(modulesSection)
        .contains('Edit')
        .click()
      cy.get(editModuleModal).within(() => {
        cy.contains('GEN1')
        cy.get('select[disabled]')
          .contains('Slot 1')
          .should('exist')
        cy.get(moduleModelDropdown).select('GEN2')
        cy.get('button')
          .contains('save')
          .click()
      })
      cy.get(editModuleModal).should('not.exist')
      cy.contains('existing engage heights will be cleared').should('exist')
      cy.get('button')
        .contains('Continue')
        .click()
      cy.get(modulesSection).contains('GEN2')
      cy.get(modulesSection)
        .contains('Edit')
        .click()
      cy.get(editModuleModal).within(() => {
        cy.get(moduleModelDropdown).select('GEN1')
        cy.get('button')
          .contains('save')
          .click()
      })
    })

    it('adds two liquids', () => {
      cy.get('button')
        .contains('Continue to Liquids')
        .click()
      cy.addLiquid('Water', 'pure H2O', true)
      cy.addLiquid('Reagent', 'tasty chemicals')
    })

    it('design protocol with mag and temp decks', () => {
      // Avoid failing the test on uncaught exception
      // Happens when writing a nickname for the labware
      Cypress.on('uncaught:exception', (err, runnable) => {
        console.log(err.name)
        return false
      })

      cy.openDesignPage()
      // close "setting up" modal
      cy.contains('Setting up your protocol').should('exist')
      // force option used because checkbox is hidden
      cy.get('input[type="checkbox"]').click({ force: true })
      cy.get('button')
        .contains('ok')
        .click()
      // verify design tab contents
      cy.get('[class*="list_selected"] h3')
        .contains('STARTING DECK STATE')
        .should('exist')
      cy.get('[class*="list_selected"] h3')
        .contains('FINAL DECK STATE')
        .should('not.exist')
      cy.get('h3')
        .contains('FINAL DECK STATE')
        .should('exist')
      cy.get('button[class*="button_primary"]')
        .contains('Add Step')
        .should('exist')
      cy.get('header')
        .contains(protocolTitle)
        .should('exist')
      // verify deckmap contents
      cy.get('[class*="DeckSetup"]').within(() => {
        cy.contains('Magnetic').should('exist')
        cy.contains('disengaged').should('exist')
        cy.contains(tipRackWithoutUnit).should('exist')
        cy.contains('Temperature').should('exist')
        cy.contains('deactivated').should('exist')
        cy.contains('No GEN1 8-Channel access').should('exist')
      })

      // Add tip rack to slot 5
      cy.get(slotFive).click()
      cy.get(designPageModal).within(() => {
        cy.contains('Slot 5 Labware').should('exist')
        cy.get('h3')
          .contains('Tip Rack')
          .click()
        cy.contains(tipRack).click()
      })
      cy.get(slotFive).within(() => {
        cy.contains(tipRackWithoutUnit)
      })

      // Add labware to Mag Deck
      cy.get(slotOne).click()
      cy.get(designPageModal).within(() => {
        cy.contains('Slot 1, Magnetic module Labware').should('exist')
        cy.contains('Show only recommended labware').should('exist')
        cy.contains('Upload custom labware').should('exist')
        cy.get('ul')
          .should('have.length', 1)
          .contains('Well Plate')
          .should('exist')
          .click()
        cy.get('ul').within(() => {
          cy.get('li')
            .should('have.length', 1)
            .contains('Nest 96 Well Plate', { matchCase: false })
        })
        cy.get('[class*="forms__checkbox_icon"]').click()
        cy.get('ul > div')
          .should('have.length', 1)
          .contains('Well Plate')
          .should('exist')
        cy.get('ul').within(() => {
          cy.get('li').should('have.length.greaterThan', 1)
          cy.contains('Nest 96 Well Plate', { matchCase: false }).click()
        })
      })
      cy.get('input[class*="LabwareOverlays__name_input"]').type(
        'Mag Deck Well'
      )

      // Add labware to Temp Deck
      cy.get(slotThree).click()
      var aluminumWellBlock =
        'Opentrons 96 Well Aluminum Block with Generic PCR Strip 200'
      cy.get(designPageModal).within(() => {
        cy.contains('Slot 3, Temperature module Labware').should('exist')
        cy.contains('Show only recommended labware').should('exist')
        cy.contains('Upload custom labware').should('exist')
        cy.get('ul > div')
          .should('have.length', 1)
          .contains('Aluminum Block')
          .should('exist')
        cy.get('[class*="forms__checkbox_icon"]').click()
        cy.get('ul > div').should('have.length', 3)
        cy.contains('Well Plate').should('exist')
        cy.contains('Reservoir').should('exist')
        cy.contains('Aluminum Block')
          .should('exist')
          .click()
        cy.get('ul').within(() => {
          cy.contains(aluminumWellBlock, { matchCase: false }).click()
        })
      })
      cy.contains(aluminumWellBlock, { matchCase: false })
      cy.get('input[class*="LabwareOverlays__name_input"]').type(
        'Temp Deck Block'
      )

      // Add first liquid
      cy.get(slotOne)
        .contains('Name & Liquids')
        .click()
      rowLetters.forEach(element => {
        cy.get(`[data-wellname="${element}1"]`).click()
      })
      cy.get('[name="selectedLiquidId"]').select('Water')
      cy.get('[name="volume"]').type('50')
      cy.get('button')
        .contains('save')
        .click()
      cy.get('button')
        .contains('Deck')
        .click()

      // Add second liquid
      cy.get(slotThree)
        .contains('Name & Liquids')
        .click()
      rowLetters.forEach(element => {
        cy.get(`[data-wellname="${element}1"]`).click()
      })
      cy.get('[name="selectedLiquidId"]').select('Reagent')
      cy.get('[name="volume"]').type('50')
      cy.get('button')
        .contains('save')
        .click()
      cy.get('button')
        .contains('Deck')
        .click()

      // Add Temperature Step w/out Pause
      cy.addStep('temperature')
      cy.get(sidePanel)
        .contains('temperature')
        .should('exist')
      cy.get(designPageModal).within(() => {
        cy.get('[class*="section_header"]')
          .contains('temperature')
          .should('exist')
        cy.contains('Change to temperature').click()
        cy.get(defaultTextInput).should('exist')
        cy.contains('Deactivate').click()
        cy.get(defaultTextInput).should('not.exist')
        cy.contains('Change to temperature').click()
        cy.get(defaultTextInput)
          .focus()
          .blur()
        cy.get(alertTitleContainer)
          .contains('error')
          .should('exist')
        cy.get('button[disabled]')
          .contains('Save')
          .should('exist')
        cy.get(defaultTextInput).type('non-numerical')
        cy.get('button[disabled]')
          .contains('Save')
          .should('exist')
        cy.get(defaultTextInput)
          .clear()
          .type('100')
          .blur()
        cy.get(alertTitleContainer)
          .contains('warning')
          .should('exist')
        cy.get('button[disabled]')
          .contains('Save')
          .should('exist')
        cy.contains('Max is 95')
        cy.get(defaultTextInput)
          .clear()
          .type('37')
          .blur()
        cy.get(alertTitleContainer).should('not.exist')
        cy.get('button')
          .contains('Save')
          .click()
        cy.get('button')
          .contains('pause later')
          .click()
      })
      cy.get(sidePanel).within(() => {
        cy.contains('2.').should('not.exist')
        cy.contains('Temperature module').should('exist')
        cy.contains('Go To', { matchCase: false }).should('exist')
      })

      // Add Pause Step until Temp
      cy.addStep('pause')
      cy.get(sidePanel)
        .contains('pause')
        .should('exist')
      cy.get(designPageModal).within(() => {
        // force option used because this radio input is hidden
        cy.get('input[value="untilTemperature"]').click({ force: true })
        cy.contains('Module', { matchCase: false }).should('exist')
        cy.contains('Temp', { matchCase: false }).should('exist')
        cy.get(defaultTextInput)
          .focus()
          .blur()
        cy.get(alertTitleContainer)
          .contains('error')
          .should('exist')
        cy.get('button[disabled]')
          .contains('Save')
          .should('exist')
        cy.get(defaultTextInput)
          .type('37')
          .blur()
        cy.get(alertTitleContainer).should('not.exist')
        cy.get('button[disabled]').should('not.exist')
        cy.get('textarea').type('heating up')
        cy.get('button')
          .contains('Save')
          .click()
      })
      cy.get(sidePanel).within(() => {
        cy.contains('2.').should('exist')
        cy.contains('Pause Until', { matchCase: false }).should('exist')
        cy.contains('heating up').should('exist')
      })

      // Add First Transfer Step
      cy.addStep('transfer')
      cy.get(sidePanel)
        .contains('transfer')
        .should('exist')
      cy.get(designPageModal).within(() => {
        cy.get('[class*="StepEditForm__form_row"]')
          .contains('pipette')
          .next()
          .within(() => {
            cy.get('select').select('P300 8-Channel GEN1')
          })
        cy.get('[class*="StepEditForm__form_row"]')
          .contains('volume')
          .next()
          .within(() => {
            cy.get('input[type="text"]').type('50')
          })
        // Aspirate
        cy.get(
          '[class*="StepEditForm__section_column"]:first-child select'
        ).select('TEMP Temp Deck Block')
        cy.get('input[name="aspirate_wells"]').click()
        cy.get('[data-wellname="A1"]').click()
        cy.get('button')
          .contains('save selection', { matchCase: false })
          .click()
        // Dispense
        cy.get('[class*="StepEditForm__section_column"]:nth-child(2)').within(
          () => {
            cy.get('select').select('MAG Mag Deck Well')
            cy.get('button[class*="StepEditForm__advanced_settings"]').click()
          }
        )
        cy.get(
          `[class*="StepEditForm__advanced_settings_panel"] 
          [class*="StepEditForm__section_column"]:nth-child(2)`
        )
          .contains('mix', { matchCase: false })
          .click({ force: true }) // force option used because checkbox is hidden
        cy.get('input[name="dispense_wells"]').click()
        cy.get('[data-wellname="A1"]').click()
        cy.get('button')
          .contains('save selection', { matchCase: false })
          .click()
        cy.get('button')
          .contains('Save')
          .click()
      })
      cy.get(sidePanel).within(() => {
        cy.contains('3.').should('exist')
        cy.contains('Aspirate', { matchCase: false }).should('exist')
        cy.contains('Dispense', { matchCase: false }).should('exist')
        cy.contains('Temp Deck Block', { matchCase: false }).should('exist')
        cy.contains('Mag Deck Well', { matchCase: false }).should('exist')
        cy.contains('A1:H1').should('exist')
      })

      // Add Engage Magnet Step
      cy.addStep('magnet')
      cy.get(sidePanel)
        .contains('magnet')
        .should('exist')
      cy.get(designPageModal).within(() => {
        cy.contains('Module', { matchCase: false }).should('exist')
        cy.contains('Magnet', { matchCase: false }).should('exist')
        cy.get(defaultTextInput)
          .clear()
          .blur()
        cy.get(alertTitleContainer)
          .contains('error')
          .should('exist')
        cy.get('button[disabled]')
          .contains('Save')
          .should('exist')
        cy.get(defaultTextInput)
          .type('16')
          .blur()
        cy.get(alertTitleContainer).should('not.exist')
        cy.get('button[disabled]').should('not.exist')
        cy.get('button')
          .contains('Save')
          .click()
      })
      cy.get(sidePanel).within(() => {
        cy.contains('4.').should('exist')
        cy.contains('Magnet', { matchCase: false }).should('exist')
        cy.contains('Engage', { matchCase: false }).should('exist')
      })

      // Add Pause Step for Time
      cy.addStep('pause')
      cy.get(designPageModal).within(() => {
        // force option used because radio input is hidden
        cy.get('input[value="untilTime"]').click({ force: true })
        cy.contains('h').should('exist')
        cy.contains('m').should('exist')
        cy.contains('s').should('exist')
        cy.get(
          '[class*="StepEditForm__small_field"]:nth-child(2) input[type="text"]'
        )
          .type('2')
          .blur()
        cy.get('button[disabled]').should('not.exist')
        cy.get('button')
          .contains('Save')
          .click()
      })
      cy.get(sidePanel).within(() => {
        cy.contains('5.').should('exist')
      })
      cy.get('[data-test="ModuleTag_magneticModuleType"]')
        .contains('engaged')
        .should('exist')

      // Add Second Transfer Step
      cy.addStep('transfer')
      cy.get(designPageModal).within(() => {
        cy.get('[class*="StepEditForm__form_row"]')
          .contains('pipette')
          .next()
          .within(() => {
            cy.get('select').select('P300 8-Channel GEN1')
          })
        cy.get('[class*="StepEditForm__form_row"]')
          .contains('volume')
          .next()
          .within(() => {
            cy.get('input[type="text"]').type('100')
          })
        // Aspirate
        cy.get(
          '[class*="StepEditForm__section_column"]:first-child select'
        ).select('MAG Mag Deck Well')
        cy.get('input[name="aspirate_wells"]').click()
        cy.get('[data-wellname="A1"]').click()
        cy.get('button')
          .contains('save selection', { matchCase: false })
          .click()
        // Dispense
        cy.get('[class*="StepEditForm__section_column"]:nth-child(2)').within(
          () => {
            cy.get('select').select('TEMP Temp Deck Block')
            cy.get('button[class*="StepEditForm__advanced_settings"]').click()
          }
        )
        cy.get(
          `[class*="StepEditForm__advanced_settings_panel"] 
          [class*="StepEditForm__section_column"]:nth-child(2)`
        )
          .contains('mix', { matchCase: false })
          .click({ force: true }) // force option used because checkbox is hidden
        cy.get('input[name="dispense_wells"]').click()
        cy.get('[data-wellname="A2"]').click()
        cy.get('button')
          .contains('save selection', { matchCase: false })
          .click()
        cy.get('button')
          .contains('Save')
          .click()
      })

      // Add Disengage Magnet Step
      cy.addStep('magnet')
      cy.get(designPageModal).within(() => {
        cy.get('input[value="disengage"][checked]').should('exist')
        cy.get('button[disabled]').should('not.exist')
        cy.get('button')
          .contains('Save')
          .click()
      })

      // Add Temperature Step w/ Pause
      cy.addStep('temperature')
      cy.get(designPageModal).within(() => {
        cy.contains('Change to temperature').click()
        cy.get(defaultTextInput)
          .clear()
          .type('4')
          .blur()
        cy.get('button')
          .contains('Save')
          .click()
        cy.get('button')
          .contains('Pause protocol now')
          .click()
      })
      cy.get(sidePanel).within(() => {
        cy.contains('8.').should('exist')
        cy.contains('9.').should('exist')
      })
    })

    it('deletes and replaces modules', () => {
      // Delete Magnetic Module
      cy.openFilePage()
      cy.get('h4')
        .contains('Magnetic')
        .parent()
        .within(() => {
          cy.get('button')
            .contains('remove')
            .click()
          cy.contains('Slot 1').should('not.exist')
          cy.contains('add').should('exist')
        })
      cy.openDesignPage()
      cy.get('h3')
        .contains('4. magnet', { matchCase: false })
        .click()
      cy.get(designPageModal).within(() => {
        cy.get(alertTitleContainer)
          .contains('error')
          .should('exist')
        cy.get('button[disabled]')
          .contains('Save')
          .should('exist')
      })
      cy.get('h3')
        .contains('7. magnet', { matchCase: false })
        .click()
      cy.get(designPageModal).within(() => {
        cy.get(alertTitleContainer)
          .contains('error')
          .should('exist')
        cy.get('button[disabled]')
          .contains('Save')
          .should('exist')
      })

      // Replace Magnetic Module
      cy.openFilePage()
      cy.get('h4')
        .contains('Magnetic')
        .parent()
        .within(() => {
          cy.get('button')
            .contains('add')
            .click()
        })
      cy.get(editModuleModal).within(() => {
        cy.get('select[disabled]')
          .contains('Slot 1')
          .should('exist')
        cy.get(moduleModelDropdown).select('GEN2')
        cy.get('select[disabled]').should('not.exist')
        cy.get('button')
          .contains('save')
          .click()
      })
      cy.get('h4')
        .contains('Magnetic')
        .parent()
        .within(() => {
          cy.contains('Slot 1').should('exist')
          cy.contains('remove').should('exist')
          cy.contains('Edit').should('exist')
        })

      // Verify timeline errors resolved
      cy.openDesignPage()
      cy.get('h3')
        .contains('4. magnet', { matchCase: false })
        .click()
      cy.get(designPageModal).within(() => {
        cy.get(alertTitleContainer).should('not.exist')
        cy.get('button[disabled]').should('not.exist')
      })
      cy.get('h3')
        .contains('7. magnet', { matchCase: false })
        .click()
      cy.get(designPageModal).within(() => {
        cy.get(alertTitleContainer).should('not.exist')
        cy.get('button[disabled]').should('not.exist')
      })

      // Delete Temperature Module
      cy.openFilePage()
      cy.get('h4')
        .contains('Temperature')
        .parent()
        .within(() => {
          cy.get('button')
            .contains('remove')
            .click()
          cy.contains('Slot 3').should('not.exist')
          cy.contains('add').should('exist')
        })
      cy.openDesignPage()
      cy.get('h3')
        .contains('1. temperature', { matchCase: false })
        .click()
      cy.get(designPageModal).within(() => {
        cy.get(alertTitleContainer)
          .contains('error')
          .should('exist')
        cy.get('select option').should('be.empty')
        cy.get('button[disabled]')
          .contains('Save')
          .should('exist')
      })
      cy.get('h3')
        .contains('2. pause', { matchCase: false })
        .click()
      cy.get(designPageModal).within(() => {
        cy.get(alertTitleContainer)
          .contains('error')
          .should('exist')
        cy.get('input[value="untilTemperature"][checked]').should('exist')
        cy.get('select option').should('be.empty')
        cy.get(defaultTextInput + '[value="37"]').should('exist')
        cy.get('button[disabled]')
          .contains('Save')
          .should('exist')
      })
      cy.get('h3')
        .contains('8. temperature', { matchCase: false })
        .click()
      cy.get(designPageModal).within(() => {
        cy.get(alertTitleContainer)
          .contains('error')
          .should('exist')
        cy.get('button[disabled]')
          .contains('Save')
          .should('exist')
      })
      cy.get('h3')
        .contains('9. pause', { matchCase: false })
        .click()
      cy.get(designPageModal).within(() => {
        cy.get(alertTitleContainer)
          .contains('error')
          .should('exist')
        cy.get('button[disabled]')
          .contains('Save')
          .should('exist')
      })

      // Replace Temperature Module
      cy.openFilePage()
      cy.get('h4')
        .contains('Temperature')
        .parent()
        .within(() => {
          cy.get('button')
            .contains('add')
            .click()
        })
      cy.get(editModuleModal).within(() => {
        cy.get('select[disabled]')
          .contains('Slot 3')
          .should('exist')
        cy.get(moduleModelDropdown).select('GEN2')
        cy.get('select[disabled]').should('not.exist')
        cy.get('button')
          .contains('save')
          .click()
      })
      cy.get('h4')
        .contains('Temperature')
        .parent()
        .within(() => {
          cy.contains('Slot 3').should('exist')
          cy.contains('remove').should('exist')
          cy.contains('Edit').should('exist')
        })

      // Resolve Timeline Errors
      cy.openDesignPage()
      cy.get('h3')
        .contains('1. temperature', { matchCase: false })
        .click()
      cy.get(designPageModal).within(() => {
        cy.get('select').select('TEMP Temp Deck Block')
        cy.get(alertTitleContainer).should('not.exist')
        cy.get('button[disabled]').should('not.exist')
        cy.get(defaultTextInput + '[value="37"]').should('exist')
        cy.get('button')
          .contains('Save')
          .click()
      })
      cy.get('h3')
        .contains('2. pause', { matchCase: false })
        .click()
      cy.get(designPageModal).within(() => {
        cy.get('select').select('TEMP Temp Deck Block')
        cy.get(alertTitleContainer).should('not.exist')
        cy.get('button[disabled]').should('not.exist')
        cy.get(defaultTextInput + '[value="37"]').should('exist')
        cy.get('button')
          .contains('Save')
          .click()
      })
      cy.get('h3')
        .contains('8. temperature', { matchCase: false })
        .click()
      cy.get(designPageModal).within(() => {
        cy.get('select').select('TEMP Temp Deck Block')
        cy.get(alertTitleContainer).should('not.exist')
        cy.get('button[disabled]').should('not.exist')
        cy.get(defaultTextInput + '[value="4"]').should('exist')
        cy.get('button')
          .contains('Save')
          .click()
      })
      cy.get('h3')
        .contains('9. pause', { matchCase: false })
        .click()
      cy.get(designPageModal).within(() => {
        cy.get('select').select('TEMP Temp Deck Block')
        cy.get(alertTitleContainer).should('not.exist')
        cy.get('button[disabled]').should('not.exist')
        cy.get(defaultTextInput + '[value="4"]').should('exist')
        cy.get('button')
          .contains('Save')
          .click()
      })
    })
  })
})
