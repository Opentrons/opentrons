// Common Variables and Selectors
const protocolTitle = 'Thermocrycelr Test Protocol'
const leftPipette = '[data-test="PipetteNameItem_p300SingleChannelGen2"]'
const rightPipette = '[data-test="PipetteNameItem_p300MultiChannelGen2"]'
const tipRack = 'Opentrons 96 Tip Rack 300 µL'
const editThermocycler = '[name="editThermocyclerModuleType"]'
const removeThermocycler = '[name="removeThermocyclerModuleType"]'
const addThermocycler = '[name="addThermocyclerModuleType"]'
const tipRackWithoutUnit = 'Opentrons 96 Tip Rack 300'
const sidePanel = '[class*="SidePanel__panel_contents"]'
const deckMap = '[class*="DeckSetup"]'
const designPageModal = '#main-page-modal-portal-root'
const thermocyclerFormOption = '[class*="StepEditForm__tc_step_option"]'
const thermocyclerToggleGroups = '[class*="toggle_form_group"]'
const temperatureFieldInput = '[class*="toggle_temperature_field"] input'
const thermocyclerWellBlock = 'TC Well'
const acceptableBlockTemp = 'Must be between 4 and 99'
const acceptableLidTemp = 'Must be between 37 and 110'
const profileSettingsGroup = '[class*="profile_settings_group"]'
const profileStepRow = '[class*="profile_step_row"]'
const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const editModuleModal = 'div[class*="EditModules__modal_contents"]'
const moduleModelDropdown =
  'div[class*="EditModules__option_model"] select[class*="forms__dropdown"]'
// Slots
const thermocyclerSlot = 'foreignObject[x="12"][y="267"]'
const slotSeven = 'foreignObject[x="0"][y="181"]'

describe('Protocols with Modules', () => {
  beforeEach(() => {
    cy.viewport('macbook-15')
  })
  before(() => {
    cy.visit('/')
    cy.closeAnnouncementModal()
  })

  describe('builds a new protocol with mag deck', () => {
    it('sets up pipettes, tips, and module', () => {
      cy.get('button')
        .contains('Create New')
        .click()
      // Give it a name
      cy.get("input[placeholder='Untitled']").type(protocolTitle)
      // Choose pipette types and tip racks
      cy.choosePipettes(leftPipette, rightPipette)
      cy.selectTipRacks(tipRack, tipRack)

      // Add Thermocycler
      cy.contains('Thermocycler').should('exist')
      // force option used because checkbox is hidden
      cy.get('input[name="modulesByType.thermocyclerModuleType.onDeck"]').click(
        {
          force: true,
        }
      )
      cy.get('select[name="modulesByType.thermocyclerModuleType.model"]')
        .contains('GEN1')
        .should('exist')
      cy.get('button')
        .contains('save', { matchCase: false })
        .click()

      // Verify modules were added
      cy.contains('File Details').should('exist')
      cy.contains('Modules').should('exist')
      const modulesSection = 'div[class*="modules_card_content"]'
      cy.get(modulesSection).within(() => {
        cy.contains('Thermocycler').should('exist')
        cy.contains('GEN1').should('exist')
        cy.contains('Slot 7').should('exist')
      })

      // Edit Thermocycler module (should not have slot option or other gen)
      cy.get(editThermocycler).click()
      cy.get(editModuleModal).within(() => {
        cy.contains('Position').should('not.exist')
        cy.get(moduleModelDropdown)
          .contains('GEN2')
          .should('not.exist')
        cy.get('button')
          .contains('cancel', { matchCase: false })
          .click()
      })

      // Remove thermocycler
      cy.get(removeThermocycler).click()
      cy.get(editThermocycler).should('not.exist')
      cy.get(removeThermocycler).should('not.exist')

      // Re-add thermocycler
      cy.get(addThermocycler).click()
      cy.get('button')
        .contains('save', { matchCase: false })
        .click()
    })

    it('adds two liquids', () => {
      cy.get('button')
        .contains('Continue to Liquids')
        .click()
      cy.addLiquid('Water', 'pure H2O', true)
    })

    it('designs protocol with thermocycler', () => {
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
      cy.get(deckMap).within(() => {
        cy.contains('Thermocycler').should('exist')
        cy.contains('deactivated').should('exist')
        cy.contains(tipRackWithoutUnit).should('exist')
      })

      // Add labware to Thermocycler
      cy.get(thermocyclerSlot).click()
      cy.get(designPageModal).within(() => {
        cy.contains('Slot 7, Thermocycler module Labware').should('exist')
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
        thermocyclerWellBlock
      )

      // Add Thermocycler State Step
      cy.addStep('thermocycler')
      cy.get(sidePanel)
        .contains('thermocycler')
        .should('exist')
      cy.get(designPageModal).within(() => {
        cy.get('[class*="section_header"]')
          .contains('thermocycler')
          .should('exist')
        // Verify acceptable block temperature range
        cy.get(thermocyclerFormOption)
          .first()
          .within(() => {
            cy.get('input[type="radio"]').check({ force: true })
          })
        cy.get(thermocyclerToggleGroups + ':first-child').within(() => {
          cy.get('input[type="checkbox"]').click({ force: true })
          cy.get(temperatureFieldInput)
            .type('1')
            .blur()
          cy.contains(acceptableBlockTemp).should('exist')
          cy.get(temperatureFieldInput)
            .clear()
            .type('110')
            .blur()
          cy.contains(acceptableBlockTemp).should('exist')
          cy.get(temperatureFieldInput)
            .clear()
            .type('50')
            .blur()
        })
        // Verify acceptable lid temperature range
        cy.get(thermocyclerToggleGroups + ':nth-child(2)').within(() => {
          cy.get('input[type="checkbox"]').click({ force: true })
          cy.get(temperatureFieldInput)
            .type('10')
            .blur()
          cy.contains(acceptableLidTemp).should('exist')
          cy.get(temperatureFieldInput)
            .clear()
            .type('135')
            .blur()
          cy.contains(acceptableLidTemp).should('exist')
          cy.get(temperatureFieldInput)
            .clear()
            .type('50')
            .blur()
        })
        // Open Lid
        cy.get(thermocyclerToggleGroups + ':last-child').within(() => {
          cy.get('input[type="checkbox"]').click({ force: true })
        })
        cy.get('button')
          .contains('save')
          .click()
      })
      // Verify State Added
      cy.get(sidePanel).within(() => {
        cy.contains('Thermocycler module').should('exist')
        cy.contains(thermocyclerWellBlock, { matchCase: false }).should('exist')
        cy.contains('Lid (open)').should('exist')
      })
      cy.get(deckMap).within(() => {
        cy.contains('Thermocycler').should('exist')
        cy.contains('deactivated').should('exist')
      })

      // Verify thermocycler block settings
      cy.get('[data-test="StepItem_1"]')
        .children()
        .first()
        .click()
      cy.get(designPageModal).within(() => {
        cy.get(thermocyclerFormOption)
          .first()
          .within(() => {
            cy.get('input[type="radio"]').check({ force: true })
          })
        cy.get(thermocyclerToggleGroups + ':first-child').within(() => {
          cy.get('input[type="checkbox"][checked]').should('exist')
          cy.get(temperatureFieldInput + '[value="50"]').should('exist')
        })

        // Verify acceptable lid temperature range
        cy.get(thermocyclerToggleGroups + ':nth-child(2)').within(() => {
          cy.get('input[type="checkbox"][checked]').should('exist')
          cy.get(temperatureFieldInput + '[value="50"]').should('exist')
        })
      })

      // Add another Thermocycler State Step
      cy.addStep('thermocycler')
      cy.get(designPageModal).within(() => {
        cy.get(thermocyclerFormOption)
          .first()
          .within(() => {
            cy.get('input[type="radio"]').check({ force: true })
          })
        // Close Lid
        cy.get(thermocyclerToggleGroups + ':last-child').within(() => {
          cy.get('input[type="checkbox"]').click({ force: true })
        })
        cy.get('button')
          .contains('save')
          .click()
      })
      // Verify Second State Added
      cy.get(sidePanel).within(() => {
        cy.contains('Lid (closed)').should('exist')
      })
      cy.get(deckMap).within(() => {
        cy.contains('Thermocycler').should('exist')
        cy.contains('50 °C').should('exist')
      })

      // Delete Thermocycler
      cy.openFilePage()
      cy.get(removeThermocycler).click()
      cy.openDesignPage()
      cy.get('[class*="alert_title"]')
        .contains('Missing module')
        .should('exist')
      cy.get('[class*="error_icon"]').should('exist')

      // Re-add Thermocycler
      cy.get('h3')
        .contains('starting deck state', { matchCase: false })
        .click()
      cy.get(slotSeven)
        .contains('Delete')
        .click()
      cy.openFilePage()
      cy.get(addThermocycler).click()
      cy.get('button')
        .contains('save', { matchCase: false })
        .click()
      cy.openDesignPage()
      cy.get('[class*="alert_title"]').should('not.exist')
      cy.get('[class*="error_icon"]').should('not.exist')
      // Re-add TC well
      cy.get(thermocyclerSlot).click()
      cy.get(designPageModal).within(() => {
        cy.get('ul')
          .contains('Well Plate')
          .click()
        cy.get('ul').within(() => {
          cy.get('li')
            .contains('Nest 96 Well Plate', { matchCase: false })
            .click()
        })
      })
      cy.get('input[class*="LabwareOverlays__name_input"]').type(
        thermocyclerWellBlock
      )

      // Add Thermocycler Profile Step
      cy.addStep('thermocycler')
      cy.get(designPageModal).within(() => {
        // Reused profile step elements
        const profileCycleAddStepButton =
          '[class*="profile_cycle_group"] button'
        const profileCycleFields =
          '[class*="cycle_row"] [class*="profile_step_row"]'
        const title = ' input[name="title"]'
        const temperature = ' input[name="temperature"]'
        const minutes = ' input[name="durationMinutes"]'
        const seconds = ' input[name="durationSeconds"]'

        cy.get('input[value="thermocyclerProfile"]').click({ force: true })
        cy.get('[class*="profile_settings_lid"]')
          .contains('Closed')
          .should('exist')
        cy.get(profileSettingsGroup + ':first-child').type('20')
        cy.get(profileSettingsGroup + ':nth-child(2)').type('40')
        // Add Step
        cy.get('button')
          .contains('Step')
          .click()
        cy.get(profileStepRow + title).type('initial step')
        cy.get(profileStepRow + temperature).type('60')
        cy.get(profileStepRow + minutes).type('5')
        cy.get(profileStepRow + seconds).type('30')
        // Add Cycle (should have 1 step by default)
        cy.get('button')
          .contains('Cycle')
          .click()
        cy.get(profileCycleFields + title).type('cycle step 1')
        cy.get(profileCycleFields + temperature).type('30')
        cy.get(profileCycleFields + minutes).type('1')
        cy.get(profileCycleFields + seconds).type('20')
        cy.get('input[name="repetitions"]').type('3')
        cy.get(profileCycleAddStepButton).click()
        cy.get(profileCycleFields + ':nth-child(2)' + title).type(
          'cycle step 2'
        )
        cy.get(profileCycleFields + ':nth-child(2)' + temperature).type('50')
        cy.get(profileCycleFields + ':nth-child(2)' + seconds).type('30')
        // Verify and Set Ending Hold
        cy.get(thermocyclerToggleGroups + ':first-child').within(() => {
          cy.get('input[type="checkbox"]').click({ force: true })
          cy.get(temperatureFieldInput).type('5')
        })
        cy.get(thermocyclerToggleGroups + ':nth-child(2)').within(() => {
          cy.get('input[type="checkbox"][checked]').should('not.exist')
        })
        cy.get(thermocyclerToggleGroups + ':last-child').within(() => {
          cy.get('input[type="checkbox"][checked]').should('not.exist')
        })

        // Add second step to the cycle, giving us one top-level step and 2 cycle steps
        cy.get(profileCycleAddStepButton).click()
        cy.get(profileCycleFields).should('have.length', 3)

        // Delete that new cycle step
        cy.get('[class*=cycle_step_delete]')
          .last()
          .click()
        cy.get(profileCycleFields).should('have.length', 2)

        // save form
        cy.get('button')
          .contains('save')
          .click()
      })
      // Verify Profile Step Added
      cy.get(sidePanel).within(() => {
        cy.contains('Profile steps').should('exist')
        cy.contains('Ending hold').should('exist')
        // TODO(SA 2020/06/24): Add check for items in expanded steps when data attrs exist
      })

      // Add liquids to well
      cy.get('h3')
        .contains('starting deck state', { matchCase: false })
        .click()
      cy.get(thermocyclerSlot)
        .contains('Name & Liquids')
        .click()
      rowLetters.forEach(element => {
        cy.get(`[data-wellname="${element}1"]`).click()
      })
      cy.get('[name="selectedLiquidId"]').select('Water')
      cy.get('[name="volume"]').type('50')
      cy.get('button')
        .contains('save', { matchCase: false })
        .click()
      cy.get('button')
        .contains('Deck')
        .click()

      // Add transfer step
      cy.addStep('transfer')
      cy.get(designPageModal).within(() => {
        cy.get('[class*="StepEditForm__form_row"]')
          .contains('volume')
          .next()
          .within(() => {
            cy.get('input[type="text"]').type('25')
          })
        // Aspirate
        cy.get(
          '[class*="StepEditForm__section_column"]:first-child select'
        ).select('THERMO TC Well')
        cy.get('input[name="aspirate_wells"]').click()
        cy.get('[data-wellname="A1"]').click()
        cy.get('button')
          .contains('save selection', { matchCase: false })
          .click()
        // Dispense
        cy.get('[class*="StepEditForm__section_column"]:nth-child(2)').within(
          () => {
            cy.get('select').select('THERMO ' + thermocyclerWellBlock)
          }
        )
        cy.get('input[name="dispense_wells"]').click()
        cy.get('[data-wellname="A2"]').click()
        cy.get('button')
          .contains('save selection', { matchCase: false })
          .click()
        cy.get('button')
          .contains('save', { matchCase: false })
          .click()
      })
      // Verify error message
      cy.get('[class*="alert_title"]')
        .contains('Thermocycler lid is closed')
        .should('exist')
    })
  })
})
