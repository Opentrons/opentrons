// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { StepThunk } from './StepBuilder'
import { UniversalSteps } from './UniversalSteps' // Adjust the path

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      chooseDeckSlot: (slot: string) => Cypress.Chainable<void>
    }
  }
}

export enum SetupContent {
  Step1Title = 'Step 1',
  Step2Title = 'Step 2',
  Step3Title = 'Step3',
  Step4Title = 'Step4',
  Cancel = 'Cancel',
  AddPipette = 'Add a pipette',
  NinetySixChannel = '96-Channel',
  SingleChannel = '1-Channel',
  EightChannel = '8-Channel',
  TipRack = 'Filter Tip Rack 50 µL',
  FullP1000SingleName = 'Flex 1-Channel 1000 µL',
  Volume200 = '200 µL',
  FilterTiprack1000 = 'Filter Tip Rack 1000 µL',
  Tiprack1000 = 'Tip Rack 1000 µL',
  FilterTiprack200 = 'Filter Tip Rack 200 µL',
  Tiprack200 = 'Tip Rack 200 µL',
  PipetteType = 'Pipette type',
  PipetteVolume = 'Pipette volume',
  FullP50SingleName = 'Flex 1-Channel 50 µL',
  FullP50TiprackName = 'Opentrons Flex 96 Filter Tip Rack 50 µL',
  GoBack = 'Go back',
  Confirm = 'Confirm',
  OpentronsFlex = 'Opentrons Flex',
  OpentronsOT2 = 'Opentrons OT-2',
  LetsGetStarted = 'Let’s start with the basics',
  WhatKindOfRobot = 'What kind of robot do you have?',
  Volume50 = '50 µL',
  Volume1000 = '1000 µL',
  FilterTiprack50 = 'Filter Tip Rack 50 µL',
  Tiprack50 = 'Tip Rack 50 µL',
  Yes = 'Yes',
  No = 'No',
  Thermocycler = 'Thermocycler Module GEN2',
  HeaterShaker = 'Heater-Shaker Module GEN1',
  Tempdeck2 = 'Temperature Module GEN2',
  MagBlock = 'Magnetic Block GEN1',
  PlateReader = 'Absorbance Plate Reader Module GEN1',
  ModulePageH = 'Configure your deck hardware',
  ModulePageB = 'Place the modules and fixtures that you are using for this protocol onto the deck.',
  EditProtocol = 'Edit protocol',
  EditSlot = 'Edit slot',
  AddLabwareToDeck = 'Add labware',
  EditHardwareLabwareOnDeck = 'Edit labware',
  LabwareH = 'Labware',
  WellPlatesCat = 'Well plates',
  AddLiquid = 'Add liquid',
  DefineALiquid = 'Define a liquid',
  LiquidButton = 'Liquids',
  SampleLiquidName = 'My liquid!',
  ProtocolSteps = 'Protocol steps',
  AddStep = 'Add Step',
  NestDeepWell = 'NEST 96 Deep Well Plate 2mL',
  Save = 'Save',
}

export enum SetupLocators {
  Confirm = 'button:contains("Confirm")',
  GoBack = 'button:contains("Go back")',
  Step1Indicator = 'p:contains("Step 1")',
  Step2Indicator = 'p:contains("Step 2")',
  FlexOption = 'button:contains("Opentrons Flex")',
  OT2Option = 'button:contains("Opentrons OT-2")',
  NinetySixChannel = 'div:contains("96-Channel")',
  ThermocyclerImage = 'img[alt="thermocyclerModuleType"]',
  MagblockImage = 'img[alt="magneticBlockType"]',
  HeaterShakerImage = 'img[alt="heaterShakerModuleType"]',
  TemperatureModuleImage = 'img[alt="temperatureModuleType"]',
  LiquidNameInput = 'input[name="displayName"]',
  ModalShellArea = 'div[aria-label="ModalShell_ModalArea"]',
  SaveButton = 'button[type="submit"]',
  LiquidsDropdown = '[data-testid="dropdownMenu"]',
  Div = 'div',
  Button = 'button',
  TempdeckTempInput = 'input[name="targetTemperature"]',
  DoneButtonLabwareSelection = '[data-testid="Toolbox_confirmButton"]',
  AspirateWells = 'input[name="aspirate_wells"]',
  div = 'div',
  button = 'button',
  svg = 'svg',
  exist = 'exist',
  StepOptionsTestIDThreeDots = 'button.Btn-sc-o3dtr1-0.OverflowBtn___StyledBtn-sc-1mslfxo-0',
  AspirateCheckbox = 'div.Checkbox___StyledFlex3-sc-1mvp7vt-0.gZwGCw.btdgeU',
}

export const RegexSetupContent = {
  slotText: /Edit (slot|labware)/i,
}
/*
Might be 
export const RegexSetupContent = {
  slotText: /(Add|Edit) labware/i,
}
*/

/**
 * Helper function to select a labware by display name.
 * No longer clicks "Done" after selecting.
 */
function selectLabwareByDisplayName(displayName: string): void {
  cy.contains(displayName).click({ force: true })
}
/**
 * chooseDeckSlot is a helper returning a chainable
 * that finds the correct deck slot based on x,y coords in your markup.
 */
function chooseDeckSlot(slot: string): Cypress.Chainable<JQuery<HTMLElement>> {
  const deckSlots: Record<
    | 'A1'
    | 'A2'
    | 'A3'
    | 'B1'
    | 'B2'
    | 'B3'
    | 'C1'
    | 'C2'
    | 'C3'
    | 'D1'
    | 'D2'
    | 'D3',
    () => Cypress.Chainable<JQuery<HTMLElement>>
  > = {
    A1: () => cy.contains('[data-testid="A1"]', RegexSetupContent.slotText),
    A2: () => cy.contains('[data-testid="A2"]', RegexSetupContent.slotText),
    A3: () => cy.contains('[data-testid="A3"]', RegexSetupContent.slotText),
    B1: () => cy.contains('[data-testid="B1"]', RegexSetupContent.slotText),
    B2: () => cy.contains('[data-testid="B2"]', RegexSetupContent.slotText),
    B3: () => cy.contains('[data-testid="B3"]', RegexSetupContent.slotText),
    C1: () => cy.contains('[data-testid="C1"]', RegexSetupContent.slotText),
    C2: () => cy.contains('[data-testid="C2"]', RegexSetupContent.slotText),
    C3: () => cy.contains('[data-testid="C3"]', RegexSetupContent.slotText),
    D1: () => cy.contains('[data-testid="D1"]', RegexSetupContent.slotText),
    D2: () => cy.contains('[data-testid="D2"]', RegexSetupContent.slotText),
    D3: () => cy.contains('[data-testid="D3"]', RegexSetupContent.slotText),
  }

  const slotAction = deckSlots[slot as keyof typeof deckSlots]

  if (typeof slotAction === 'function') {
    return slotAction()
  } else {
    throw new Error(`Slot ${slot} not found in deck slots.`)
  }
}

/**
 * Helper function to select multiple wells (like A1, B3, H12).
 */
function selectWells(wells: string[]): void {
  const wellSelectors: Record<
    string,
    () => Cypress.Chainable<JQuery<HTMLElement>>
  > = {}

  // Dynamically populate (A1..H12)
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const columns = Array.from({ length: 12 }, (_, i) => (i + 1).toString())

  rows.forEach(row => {
    columns.forEach(column => {
      const wellName = `${row}${column}`
      wellSelectors[wellName] = () =>
        cy.get(`circle[data-wellname="${wellName}"]`).click({ force: true })
    })
  })

  wells.forEach(well => {
    const wellAction = wellSelectors[well]
    if (typeof wellAction === 'function') {
      wellAction()
    } else {
      throw new Error(`Well ${well} not found.`)
    }
  })
}

// For Rectangular wells
function selectRectWells(wells: string[]): void {
  const wellSelectors: Record<
    string,
    () => Cypress.Chainable<JQuery<HTMLElement>>
  > = {}

  // Dynamically populate (A1..H12)
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const columns = Array.from({ length: 12 }, (_, i) => (i + 1).toString())

  rows.forEach(row => {
    columns.forEach(column => {
      const wellName = `${row}${column}`
      // *** MODIFICATION HERE: Changed 'circle' to 'rect' ***
      wellSelectors[wellName] = () =>
        cy.get(`rect[data-wellname="${wellName}"]`).click({ force: true })
    })
  })

  wells.forEach(well => {
    const wellAction = wellSelectors[well]
    if (typeof wellAction === 'function') {
      wellAction()
    } else {
      // This error will occur if a well name outside A1-H12 is passed
      // or if the wellSelectors map somehow doesn't get populated correctly.
      throw new Error(`Well ${well} not found in the generated well selectors.`)
    }
  })
}
/**
 * Each function returns a StepThunk
 * Add a comment to all records
 */
export const SetupSteps = {
  SelectTipStrategy: (tipsy: string): StepThunk => ({
    call: () => {
      cy.contains('Always').click()
      cy.contains(tipsy).click()
    },
  }),

  SelecTip: (tip: string): StepThunk => ({
    call: () => {
      cy.contains('Opentrons Flex 96 Filter Tip Rack').click()
      const slotToUse = 'Tip Rack '
      cy.contains(slotToUse + tip).click()
    },
  }),
  /**
   * Defines a step to move labware from a source deck slot to a destination deck slot.
   * This involves clicking "Add Step", selecting "Move", and then choosing
   * the source labware and its new destination using dropdowns.
   *
   * @param sourceDeckSlot The name of the source deck slot (e.g., 'A1').
   * @param destDeckSlot The name of the destination deck slot (e.g., 'B2').
   * @param trashLabwareFirstTime (Optional) If true, an additional 'Confirm' click is performed,
   * typically used when moving labware to a trash location that requires confirmation.
   * Defaults to `false`.
   * @returns A StepThunk object that, when its `call` method is invoked,
   * executes the Cypress commands to perform the labware move.
   */

  MoveLabware: (
    sourceDeckSlot: string,
    destDeckSlot: string,
    trashLabwareFirstTime: boolean = false // Default trashLabware to false
  ): StepThunk => ({
    call: () => {
      cy.contains('Add Step').click({ force: true })
      cy.contains(/^Move$/).click()
      // Source Labware Selection
      cy.contains('p', 'Select labware') // Find the paragraph with "Select labware"
        .parent() // Go up one level
        .parent() // Go up another level (to the common container that has the dropdown)
        .contains('Choose option') // Find the "Choose option" text within that container
        .click() // Click to open the dropdown
      cy.contains(sourceDeckSlot).click() // Select the source deck slot

      // Destination Location Selection
      cy.contains('p', 'New location') // Find the paragraph with "New location"
        .parent() // Go up one level
        .parent() // Go up another level (to the common container that has the dropdown)
        .contains('Choose option') // Find the "Choose option" text within that container
        .click() // Click to open the dropdown
      cy.contains(destDeckSlot).click() // Select the destination deck slot

      cy.contains('Save').click({ force: true })

      // Conditional Confirm click for trashing labware the first time
      // There is a worning modal
      if (trashLabwareFirstTime) {
        cy.contains('Confirm').click({ force: true })
      }
    },
  }),

  MoveLabwareNoGripper: (
    sourceDeckSlot: string,
    destDeckSlot: string,
    trashLabwareFirstTime: boolean = false // Default trashLabware to false
  ): StepThunk => ({
    call: () => {
      cy.contains('Add Step').click({ force: true })
      cy.contains(/^Move$/).click()
      // Source Labware Selection
      cy.contains('Use gripper').click()
      cy.contains('p', 'Select labware') // Find the paragraph with "Select labware"
        .parent() // Go up one level
        .parent() // Go up another level (to the common container that has the dropdown)
        .contains('Choose option') // Find the "Choose option" text within that container
        .click() // Click to open the dropdown
      cy.contains(sourceDeckSlot).click() // Select the source deck slot

      // Destination Location Selection
      cy.contains('p', 'New location') // Find the paragraph with "New location"
        .parent() // Go up one level
        .parent() // Go up another level (to the common container that has the dropdown)
        .contains('Choose option') // Find the "Choose option" text within that container
        .click() // Click to open the dropdown
      cy.contains(destDeckSlot).click() // Select the destination deck slot

      cy.contains('Save').click({ force: true })
    },
  }),

  SelectLiquidClassT: (LiquidClass: string): StepThunk => ({
    call: () => {
      // eslint-disable-next-line no-template-curly-in-string
      // cy.get(`#${LiquidClass}`).click({ force: true })
      // eslint-disable-next-line no-template-curly-in-string
      cy.get(`label[for="${LiquidClass}"]`).click()
    },
  }),
  /**
   * Select a labware by display name, then click "Done".
   */
  SelectLabwareByDisplayName: (displayName: string): StepThunk => ({
    call: () => {
      selectLabwareByDisplayName(displayName)
      cy.get('button[data-testid="SelectLabwareModal_confirm"]').click()
      cy.get(SetupLocators.DoneButtonLabwareSelection).click({ force: true })
    },
  }),

  selectDropdownLabware: (displayName: string): StepThunk => ({
    call: () => {
      selectLabwareByDisplayName(displayName)
    },
  }),

  /**
   * Select the Opentrons Flex option.
   */
  SelectFlex: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.OpentronsFlex).should('be.visible').click()
    },
  }),

  /**
   * Select the Opentrons OT-2 option.
   */
  SelectOT2: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.OpentronsOT2).should('be.visible').click()
    },
  }),

  /**
   * Click "Confirm".
   */
  Confirm: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.Confirm).should('be.visible').click()
    },
  }),

  /**
   * Click "Go back".
   */
  GoBack: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.GoBack).should('be.visible').click()
    },
  }),

  /**
   * Select a single-channel pipette with volume 50 µL.
   */
  SingleChannelPipette50: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.AddPipette).click()
      cy.contains('label', SetupContent.SingleChannel)
        .should('exist')
        .and('be.visible')
        .click()
      cy.contains(SetupContent.Volume50).click()
      cy.contains(SetupContent.Tiprack50).click()
      // optional: cy.contains(SetupContent.FilterTiprack50).click()
    },
  }),

  EightChannelPipette50: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.AddPipette).click()
      cy.contains('label', SetupContent.EightChannel)
        .should('exist')
        .and('be.visible')
        .click()
      cy.contains(SetupContent.Volume50).click()
      cy.contains(SetupContent.Tiprack50).click()
      // optional: cy.contains(SetupContent.FilterTiprack50).click()
    },
  }),
  EightChannelPipette1000: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.AddPipette).click()
      cy.contains('label', SetupContent.EightChannel)
        .should('exist')
        .and('be.visible')
        .click()
      cy.contains(SetupContent.Volume1000).click()
      cy.contains(SetupContent.Tiprack50).click()
      cy.contains(SetupContent.Tiprack200).click()
      cy.contains(SetupContent.Tiprack1000).click()
      // optional: cy.contains(SetupContent.FilterTiprack50).click()
    },
  }),

  SinglePipette1000: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.AddPipette).click()
      cy.contains('label', SetupContent.SingleChannel)
        .should('exist')
        .and('be.visible')
        .click()
      cy.contains(SetupContent.Volume1000).click()
      cy.contains(SetupContent.Tiprack50).click()
      cy.contains(SetupContent.Tiprack200).click()
      cy.contains(SetupContent.Tiprack1000).click()
      // optional: cy.contains(SetupContent.FilterTiprack50).click()
    },
  }),

  /**
   * Add a Thermocycler Module GEN2.
   */
  AddThermocycler: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.Thermocycler)
      cy.get('button[data-testid="Thermocycler Module GEN2"]').click()
    },
  }),

  /**
   * Add a Heater-Shaker Module GEN1.
   */
  AddHeaterShaker: (): StepThunk => ({
    call: () => {
      // cy.get('button[data-testid="D1"]').click()
      cy.get('button[data-testid="cutoutD1"]').click()
      cy.get('button[data-testid="Modules"]').click()
      cy.contains(SetupContent.HeaterShaker).click()
      cy.get('button[data-testid="Heater-Shaker Module GEN1"]').click()
    },
  }),

  /**
   * Add a Temperature Module GEN2.
   */
  AddTempdeck2: (): StepThunk => ({
    call: () => {
      cy.get('button[data-testid="cutoutC1"]').click()
      cy.get('button[data-testid="Modules"]').click()
      cy.contains(SetupContent.Tempdeck2).click()
      cy.get('button[data-testid="Temperature Module GEN2"]').click()
    },
  }),

  /**
   * Add a Magnetic Block GEN1.
   */
  AddMagBlock: (): StepThunk => ({
    call: () => {
      cy.get('button[data-testid="cutoutB2"]').click()
      cy.contains(SetupContent.MagBlock).click()
      cy.get('button[data-testid="Magnetic Block GEN1"]').click()
    },
  }),

  /**
   * Click "Yes" for gripper.
   */
  YesGripper: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.Yes).click()
    },
  }),

  /**
   * Click "No" for gripper.
   */
  NoGripper: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.No).click()
    },
  }),

  /**
   * Click "No" for thermocycler.
   */
  NoThermocycler: (): StepThunk => ({
    call: () => {
      cy.get('[data-testid="BasicsButtons_thermocycler_no"]').click()
    },
  }),

  /**
   * Click "No" for wasteChute.
   */
  NoWasteChute: (): StepThunk => ({
    call: () => {
      cy.get('[data-testid="BasicsButtons_wasteChute_no"]').click()
    },
  }),

  AddPlateReader: (): StepThunk => ({
    call: () => {
      cy.get('button[data-testid="cutoutD3"]').click()
      cy.get('button[data-testid="Modules"]').click()
      cy.contains(SetupContent.PlateReader).click()
      cy.get(
        'button[data-testid="Absorbance Plate Reader Module GEN1"]'
      ).click()
    },
  }),

  /**
   * Click "Edit protocol".
   */
  EditProtocolA: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.EditProtocol).click()
    },
  }),

  /**
   * Choose deck slot A1.
   */
  ChoseDeckSlotA1: (): StepThunk => ({
    call: () => {
      chooseDeckSlot('A1').click()
    },
  }),

  /**
   * Choose deck slot A2.
   */
  ChoseDeckSlotA2: (): StepThunk => ({
    call: () => {
      chooseDeckSlot('A2').click()
    },
  }),

  /**
   * Choose deck slot A3.
   */
  ChoseDeckSlotA3: (): StepThunk => ({
    call: () => {
      chooseDeckSlot('A3').click()
    },
  }),

  ChoseDeckSlotC2Labware: (): StepThunk => ({
    call: () => {
      chooseDeckSlot('C2')
        .find('.Box-sc-8ozbhb-0.kIDovv')
        .find('a[role="button"]')
        .contains(RegexSetupContent.slotText)
        .click({ force: true })
    },
  }),
  /**
   * Choose deck slot.
   */
  ChoseDeckSlot: (deckSlot: string): StepThunk => ({
    call: () => {
      chooseDeckSlot(deckSlot).click()
    },
  }),

  /**
   * Adds labware to a deck slot.
   */
  AddHardwareLabware: (): StepThunk => ({
    call: () => {
      cy.get('button[data-testid="SlotOverflowMenu_openTools"]').click()
    },
  }),

  EditHardwareLabwareOnDeck: (): StepThunk => ({
    call: () => {
      cy.get('button[data-testid="SlotOverflowMenu_openTools"]').click()
    },
  }),

  /**
   * Clicks the "Labware" header.
   */
  ClickLabwareHeader: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.LabwareH).click()
    },
  }),

  /**
   * Clicks the "Well plates" section.
   */
  ClickWellPlatesSection: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.WellPlatesCat).click()
    },
  }),

  ClickTiprack: (): StepThunk => ({
    call: () => {
      cy.contains('Tip racks').click()
    },
  }),

  /**
   * Open SelectLabwareModal to a deck slot.
   */
  OpenSelectLabwareModal: (): StepThunk => ({
    call: () => {
      cy.get('button[data-testid="EmptySelectorButton_click"]').click()
    },
  }),

  /**
   * Choose deck slot C2 with a labware-locating approach.
   */

  ChoseDeckSlotLabware: (deckslot: string): StepThunk => ({
    call: () => {
      chooseDeckSlot(deckslot).click({ force: true })
    },
  }),

  ChoseDeckSlotWithLabware: (deckslot: string): StepThunk => ({
    call: () => {
      chooseDeckSlot(deckslot)
        .contains(RegexSetupContent.slotText)
        .click({ force: true })
    },
  }),

  /**
   * Clicks the "Add liquid" button.
   */
  AddLiquid: (): StepThunk => ({
    call: () => {
      cy.get('button[data-testid="LabwareCard_addLiquid_button"]').click({
        force: true,
      })
    },
  }),
  /**
   * Start making a move step
   */

  AddMoveStep: (): StepThunk => ({
    call: () => {
      cy.contains('button', 'Move').should('be.visible').click()
    },
  }),
  /**
   * Select gripper to move with
   */

  UseGripperinMove: (): StepThunk => ({
    call: () => {
      cy.contains('button', 'Use gripper').should('be.visible').click()
    },
  }),
  /**
   * Select gripper to move labware
   */

  MoveToPlateReader: (): StepThunk => ({
    call: () => {
      cy.contains('button', 'Use gripper').should('be.visible').click()
    },
  }),

  /**
   * Clicks the "Liquid" button.
   */
  ClickLiquidButton: (): StepThunk => ({
    call: () => {
      cy.contains('button', SetupContent.LiquidButton).click()
    },
  }),

  /**
   * Clicks the "Define a liquid" button.
   */
  DefineLiquid: (): StepThunk => ({
    call: () => {
      cy.contains('button', SetupContent.DefineALiquid).click()
    },
  }),

  /**
   * Type a sample liquid name, then save.
   */
  LiquidSaveWIP: (): StepThunk => ({
    call: () => {
      cy.get(SetupLocators.LiquidNameInput).type(SetupContent.SampleLiquidName)

      cy.get(SetupLocators.ModalShellArea)
        .find('form')
        .invoke('submit', (e: SubmitEvent) => {
          e.preventDefault()
        })

      cy.get(SetupLocators.ModalShellArea)
        .find(SetupLocators.SaveButton)
        .contains(SetupContent.Save)
        .click({ force: true })
    },
  }),

  /**
   * Select an array of wells (A1, B2, etc.)
   */
  WellSelector: (wells: string[]): StepThunk => ({
    call: () => {
      if (Array.isArray(wells) && wells.length > 0) {
        selectWells(wells)
      } else {
        throw new Error('Wells must be a non-empty array of strings.')
      }
    },
  }),
  RectWellSelector: (wells: string[]): StepThunk => ({
    call: () => {
      if (Array.isArray(wells) && wells.length > 0) {
        selectRectWells(wells)
      } else {
        throw new Error('Wells must be a non-empty array of strings.')
      }
    },
  }),

  /**
   * Opens the liquids dropdown.
   */
  LiquidDropdown: (): StepThunk => ({
    call: () => {
      cy.get(SetupLocators.LiquidsDropdown).should('be.visible').click()
    },
  }),

  selectLiquidbyname: (liquidName: string): StepThunk => ({
    call: () => {
      cy.contains(liquidName).click()
    },
  }),

  /**
   * Select "My liquid!" from the dropdown.
   */
  SelectLiquidWells: (): StepThunk => ({
    call: () => {
      cy.contains('My liquid!').click()
    },
  }),

  /**
   * Sets volume then saves and clicks "Done".
   */
  SetVolumeAndSaveForWells: (volume: string): StepThunk => ({
    call: () => {
      cy.get('input[name="volume"]').type(volume, { force: true })
      cy.contains('button', SetupContent.Save).click()
      cy.contains('button', 'Done').click({ force: true })
    },
  }),

  /**
   * Clicks "Protocol steps" header.
   */
  ProtocolStepsH: (): StepThunk => ({
    call: () => {
      cy.contains('button', SetupContent.ProtocolSteps).click()
    },
  }),

  /**
   * Click the "Add Step" button.
   */
  AddStep: (): StepThunk => ({
    call: () => {
      cy.contains('button', SetupContent.AddStep).click({ force: true })
    },
  }),

  /**
   * Clicks "Adapters" (presumably in a labware context).
   */
  AddAdapters: (): StepThunk => ({
    call: () => {
      cy.contains('Adapters').click()
    },
  }),

  /**
   * Selects "Opentrons 96 Deep Well Temperature Module Adapter".
   */
  DeepWellTempModAdapter: (): StepThunk => ({
    call: () => {
      cy.contains('Opentrons 96 Deep Well Temperature Module Adapter').click()
    },
  }),

  /**
   * Adds "NEST 96 Deep Well Plate 2mL".
   */
  AddNest96DeepWellPlate: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.NestDeepWell).click()
    },
  }),

  /**
   * Click "Done" on a step form.
   */
  SelectDone: (): StepThunk => ({
    call: () => {
      cy.get(SetupLocators.DoneButtonLabwareSelection)
        .contains('Done')
        .click({ force: true })
    },
  }),

  /**
   * Click "Cancel".
   */
  Cancel: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.Cancel).should('be.visible').click()
    },
  }),

  /**
   * Chose source labware on a step form
   */
  ChoseSourceLabware: (): StepThunk => ({
    call: () => {
      cy.contains('p', 'Choose option').closest('div[tabindex="0"]').click()
    },
  }),

  // Chose source to move labware on a stepform
  ChoseSourceMoveLabware: (): StepThunk => ({
    call: () => {
      cy.contains('Choose option').eq(0).click()
    },
  }),
  // Chose destination to move labware
  ChoseDestinationMoveLabware: (): StepThunk => ({
    call: () => {
      cy.contains('Choose option').click()
    },
  }),
  // Chose labware being moved to
  ChoseDestinationLabware: (): StepThunk => ({
    call: () => {
      cy.contains('Choose option').click()
    },
  }),
  // Add source labware on stepform
  AddSourceLabwareDropdown: (): StepThunk => ({
    call: () => {
      cy.contains('Source labware')
        .parents()
        .contains('Choose option')
        .should('be.visible')
        .click()
    },
  }),

  // Select destination wells
  SelectSourceWells: (): StepThunk => ({
    call: () => {
      cy.get('input[name="aspirate_wells"]')
        .should('have.value', 'Choose wells')
        .click({ force: true })
    },
  }),

  // Select destination wells
  SelectDestinationWells: (): StepThunk => ({
    call: () => {
      cy.get('input[name="dispense_wells"]')
        .should('have.value', 'Choose wells')
        .click({ force: true })
    },
  }),
  // Save selected wells
  SaveSelectedWells: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.Save).click({ force: true })
    },
  }),
  // Generic save button
  Save: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.Save).click({ force: true })
    },
  }),
  // ToDo Refactor to input any volume

  InputTransferVolume: (TransferVolume: string): StepThunk => ({
    call: () => {
      cy.get('input[name="volume"]').type(TransferVolume)
    },
  }),
  // Continue to the next part of the transfer form
  Continue: (): StepThunk => ({
    call: () => {
      cy.contains('Continue').click({ force: true })
    },
  }),

  // ToDo @alexjoel42, please combine into one transfer

  // Step 1 Transfer form prewet checkbox
  PrewetAspirate: (): StepThunk => ({
    call: () => {
      cy.contains('Pre-wet tip')
        .closest('div.Flex-sc-1qhp8l7-0.fJriNr')
        .find(SetupLocators.AspirateCheckbox)
        .click()
    },
  }),
  // Step 1 Transfer form Delay

  Delay: (): StepThunk => ({
    call: () => {
      cy.contains('Delay')
        .closest('div')
        .find(SetupLocators.AspirateCheckbox)
        .click()
    },
  }),
  // Step 1 Transfer form touch tip
  TouchTipAspirate: (): StepThunk => ({
    call: () => {
      cy.contains('Touch tip')
        .closest('div')
        .find(SetupLocators.AspirateCheckbox)
        .click()
    },
  }),
  // Step 1 Transfer form mix checkbox
  MixAspirate: (): StepThunk => ({
    call: () => {
      cy.contains('Mix')
        .closest('div')
        .find(SetupLocators.AspirateCheckbox)
        .click()
    },
  }),
  // Step 1 Transfer form airgap checkbox
  AirGap: (): StepThunk => ({
    call: () => {
      cy.contains('Air gap')
        .closest('div')
        .find(SetupLocators.AspirateCheckbox)
        .click()
    },
  }),
  // Step 1 Transfer form mix volume
  AspirateMixVolume: (MixAspirateVolume: string): StepThunk => ({
    call: () => {
      cy.get('input[name = "aspirate_mix_volume"]').type(MixAspirateVolume)
    },
  }),

  AspirateMixTimes: (MixTimesAspirate: string): StepThunk => ({
    call: () => {
      cy.get('input[name = "aspirate_mix_times"]').type(MixTimesAspirate)
    },
  }),

  AspirateAirGapVolume: (AirGapAspirateVolume: string): StepThunk => ({
    call: () => {
      cy.get('input[name = "aspirate_airGap_volume"]').type(
        AirGapAspirateVolume
      )
    },
  }),
  // Select dispense on the transfer form

  SelectDispense: (): StepThunk => ({
    call: () => {
      cy.contains('Dispense').click()
    },
  }),
  // Dispense mix volume
  DispenseMixVolume: (DispenseMixVolume: string): StepThunk => ({
    call: () => {
      cy.get('input[name = "dispense_mix_volume"]').type(DispenseMixVolume)
    },
  }),

  DispenseMixTimes: (): StepThunk => ({
    call: () => {
      cy.get('input[name = "dispense_mix_times"]').type('2')
    },
  }),

  DispenseAirGapVolume: (DispenseAirGapVolume: string): StepThunk => ({
    call: () => {
      cy.get('input[name = "dispense_airGap_volume"]').type(
        DispenseAirGapVolume
      )
    },
  }),

  BlowoutTransferDestination: (): StepThunk => ({
    call: () => {
      cy.contains('Blowout')
        .closest('div.Flex-sc-1qhp8l7-0.ckuVEF')
        .find('button[type="button"]')
        .click()
      cy.contains('Choose option').click()
      cy.contains('Destination Well').click()
    },
  }),

  DeleteSteps: (): StepThunk => ({
    call: () => {
      cy.get(SetupLocators.StepOptionsTestIDThreeDots).click()
      cy.contains('Delete step').click()
      cy.contains('button', 'Delete step').click()
    },
  }),
}

/**
 * Each function returns a StepThunk
 * Add a comment to all records
 */
export const SetupVerifications = {
  /**
   * Verify we are on Step 1.
   */
  OnStep1: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.Step1Title).should('be.visible')
    },
  }),

  /**
   * Verify we are on Step 2, and the "Add a pipette" prompt is visible.
   */
  OnStep2: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.AddPipette).should('be.visible')
    },
  }),

  /**
   * Verify the Opentrons Flex button is selected (blue background).
   */
  FlexSelected: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.OpentronsFlex).click()
      cy.contains(SetupContent.OpentronsFlex).should(
        'have.css',
        'background-color',
        'rgb(0, 108, 250)'
      )
    },
  }),

  /**
   * Verify the Opentrons OT-2 button is selected (blue background).
   */
  OT2Selected: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.OpentronsOT2).should(
        'have.css',
        'background-color',
        'rgb(0, 108, 250)'
      )
    },
  }),

  /**
   * Verify 96-Channel option is visible.
   */
  NinetySixChannel: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.AddPipette).click()
      cy.contains(SetupContent.NinetySixChannel).should('be.visible')
    },
  }),

  /**
   * Verify 96-Channel option is *not* visible.
   */
  NotNinetySixChannel: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.NinetySixChannel).should('not.exist')
    },
  }),

  /**
   * After selecting 50 µL, verify the volume/rack info is present.
   */
  StepTwo50uL: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.PipetteVolume)
      cy.contains(SetupContent.Volume50).should('be.visible')
      cy.contains(SetupContent.Volume1000).should('be.visible')
      cy.contains(SetupContent.Tiprack50).should('be.visible')
      cy.contains(SetupContent.FilterTiprack50).should('be.visible')
    },
  }),

  /**
   * Verify we see the fully named pipette and tiprack, etc.
   */
  StepTwoPart3: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.FullP50SingleName).should('be.visible')
      cy.contains(SetupContent.FullP50TiprackName).should('be.visible')
      cy.contains('Left Mount').should('be.visible')
      cy.contains(SetupContent.AddPipette)
    },
  }),

  /**
   * Verify we are on Step 3: "Do you want to move labware automatically with the gripper?"
   */
  OnStep3: (): StepThunk => ({
    call: () => {
      cy.contains(
        'Do you want to move labware automatically with the gripper?'
      ).should('be.visible')
      cy.contains(SetupContent.Yes).should('be.visible')
      cy.contains(SetupContent.No).should('be.visible')
    },
  }),

  /**
   * Verify Step 4: Module page is visible, with modules listed.
   */
  Step4Verification: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.ModulePageH).should('be.visible')
      cy.contains(SetupContent.ModulePageB).should('be.visible')
      cy.get('button[data-testid="cutoutB1"]').click()
      cy.get('button[data-testid="Modules"]').click()
      cy.contains(SetupContent.Thermocycler).should('be.visible')
      cy.contains(SetupContent.HeaterShaker).should('be.visible')
      cy.contains(SetupContent.MagBlock).should('be.visible')
      cy.contains(SetupContent.Tempdeck2).should('be.visible')
    },
  }),

  /**
   * Verify the Thermocycler image is visible.
   */
  ThermocyclerImg: (): StepThunk => ({
    call: () => {
      cy.get(SetupLocators.ThermocyclerImage).should('be.visible')
    },
  }),

  /**
   * Verify the Heater-Shaker image is visible.
   */
  HeaterShakerImg: (): StepThunk => ({
    call: () => {
      cy.get(SetupLocators.HeaterShakerImage).should('be.visible')
    },
  }),

  /**
   * Verify the Temperature Module GEN2 content is visible.
   */
  Tempdeck2Img: (): StepThunk => ({
    call: () => {
      cy.contains(SetupContent.Tempdeck2).should('be.visible')
    },
  }),

  /**
   * Verify the Liquid page content is visible.
   */
  LiquidPage: (): StepThunk => ({
    call: () => {
      cy.contains('Liquid').should('be.visible')
      cy.contains('Add liquid').should('be.visible')
      cy.contains('Liquid volume by well').should('be.visible')
      cy.contains('Cancel').should('be.visible')
    },
  }),

  AbsorbanceNotSelectable: (): StepThunk => ({
    call: () => {
      cy.get('button[data-testid="cutoutD3"]').click()
      cy.get('button[data-testid="Modules"]').click()
      cy.contains(SetupContent.PlateReader)
      cy.get('[data-testid="ModalHeader_icon_close_Add to slot D3"]').click()
    },
  }),

  /**
   * Verify you can open the "Transfer" pop-out panel.
   */
  TransferPopOut: (): StepThunk => ({
    call: () => {
      cy.contains('button', 'Transfer').should('be.visible').click()
      cy.contains('Source labware')
      cy.contains('Select source wells')
      cy.contains('Destination labware')
      cy.contains('Volume per well')
      cy.contains('Tip management')
      cy.contains('Tip drop location')
    },
  }),

  Delay: (): StepThunk => ({
    // Verifies that the "Delay" button has an associated SVG icon with proper attributes
    call: () => {
      cy.contains('Delay')
        .closest('div[data-testid="ListItem_default"]')
        .find('path[aria-roledescription="ot-checkbox"]')
    },
  }),

  PreWet: (): StepThunk => ({
    // Verifies that the "Pre-wet tip" button has an associated SVG icon with proper attributes
    call: () => {
      cy.contains('PreWet')
        .closest('div[data-testid="ListButton_default"]')
        .find('path[aria-roledescription="ot-checkbox"]')
    },
  }),

  TouchTip: (): StepThunk => ({
    // Verifies that the "Touch tip" button has an associated SVG icon with proper attributes
    call: () => {
      cy.contains('Touch tip')
        .closest('div[data-testid="ListItem_default"]')
        .find('path[aria-roledescription="ot-checkbox"]')
    },
  }),

  MixT: (): StepThunk => ({
    // Verifies that the "Mix" button has an associated SVG icon with proper attributes
    call: () => {
      cy.contains('Mix')
        .closest('div[data-testid="ListItem_default"]')
        .find('path[aria-roledescription="ot-checkbox"]')
    },
  }),

  AirGap: (): StepThunk => ({
    // Verifies that the "Air gap" button has an associated SVG icon with proper attributes
    call: () => {
      cy.contains('Air gap')
        .closest('div[data-testid="ListItem_default"]')
        .find('path[aria-roledescription="ot-checkbox"]')
    },
  }),

  ExtraDispenseTransfer: (): StepThunk => ({
    // Verifies that all key elements related to "Blowout" in transfer settings are present
    call: () => {
      cy.contains('Blowout location')
      cy.contains('Blowout flow rate')
      // cy.contains('Blowout position from top')
    },
  }),

  /**
   * Verify the Magnetic Block image is visible.
   */
  MagBlockImg: (): StepThunk => ({
    call: () => {
      cy.get(SetupLocators.MagblockImage).should('be.visible')
    },
  }),
}

/**
 * Helper function that verifies the initial "Create Protocol" page content.
 */
export const verifyCreateProtocolPage = (): void => {
  cy.contains(SetupContent.Step1Title).should('exist').should('be.visible')
  cy.contains(SetupContent.LetsGetStarted).should('exist').should('be.visible')
  cy.contains(SetupContent.WhatKindOfRobot).should('exist').should('be.visible')
  cy.contains(SetupContent.OpentronsFlex).should('exist').should('be.visible')
  cy.contains(SetupContent.OpentronsOT2).should('exist').should('be.visible')
  cy.contains(SetupContent.Confirm).should('exist').should('be.visible')
}

/**
 * Composite, multi-step operations bundled as individual StepThunks
 */
export const CompositeSetupSteps = {
  /**
   * Sets up a Flex protocol with optional modules
   */
  FlexSetup: (options: {
    thermocycler?: boolean
    heatershaker?: boolean
    magblock?: boolean
    tempdeck?: boolean
    plateReader?: boolean
  }): StepThunk => ({
    call: () => {
      const thermocycler = options.thermocycler ?? false
      const heatershaker = options.heatershaker ?? false
      const magblock = options.magblock ?? false
      const tempdeck = options.tempdeck ?? false
      const plateReader = options.plateReader ?? false
      cy.log(`Running FlexSetup with options: ${JSON.stringify(options)}`)
      SetupVerifications.OnStep1().call()
      SetupVerifications.FlexSelected().call()
      UniversalSteps.Snapshot().call()
      SetupSteps.SelectOT2().call()
      SetupVerifications.OT2Selected().call()
      UniversalSteps.Snapshot().call()
      SetupSteps.SelectFlex().call()
      SetupVerifications.FlexSelected().call()
      UniversalSteps.Snapshot().call()
      SetupVerifications.OnStep2().call()
      SetupSteps.SingleChannelPipette50().call()
      SetupVerifications.StepTwo50uL().call()
      UniversalSteps.Snapshot().call()
      SetupSteps.Save().call()
      SetupVerifications.StepTwoPart3().call()
      UniversalSteps.Snapshot().call()
      SetupVerifications.OnStep3().call()
      SetupSteps.YesGripper().call()
      SetupSteps.NoThermocycler().call()
      SetupSteps.NoWasteChute().call()
      SetupSteps.Confirm().call()
      SetupVerifications.Step4Verification().call()

      if (thermocycler) {
        SetupSteps.AddThermocycler().call()
      }

      if (heatershaker) {
        SetupSteps.AddHeaterShaker().call()
      }

      if (magblock) {
        SetupSteps.AddMagBlock().call()
      }

      if (tempdeck) {
        SetupSteps.AddTempdeck2().call()
      }

      if (plateReader) {
        SetupSteps.AddPlateReader().call()
      }

      SetupSteps.Confirm().call()
      SetupSteps.Confirm().call()
      SetupSteps.EditProtocolA().call()
    },
  }),
  /**
   * Adds labware to a specific deck slot
   */
  AddLabwareToDeckSlot: (
    deckSlot?: string | undefined,
    labwareName?: string | undefined
  ): StepThunk => ({
    call: () => {
      const slotToUse = deckSlot ?? 'C3'
      const labwareToUse = labwareName ?? 'Bio-Rad 96 Well Plate'
      cy.log(
        `Running AddLabwareToDeckSlot with slot ${deckSlot} and labware ${labwareName}`
      )
      SetupSteps.ChoseDeckSlotWithLabware(slotToUse).call()
      // SetupSteps.AddHardwareLabware().call()
      SetupSteps.OpenSelectLabwareModal().call()
      SetupSteps.ClickWellPlatesSection().call()
      SetupSteps.SelectLabwareByDisplayName(labwareToUse).call()
    },
  }),
  AddTiprackToDeckSlot: (
    deckSlot?: string | undefined,
    labwareName?: string | undefined
  ): StepThunk => ({
    call: () => {
      const slotToUse = deckSlot ?? 'C3'
      const labwareToUse = labwareName ?? 'Bio-Rad 96 Well Plate'
      cy.log(
        `Running AddLabwareToDeckSlot with slot ${deckSlot} and labware ${labwareName}`
      )
      SetupSteps.ChoseDeckSlotWithLabware(slotToUse).call()
      SetupSteps.AddHardwareLabware().call()
      SetupSteps.OpenSelectLabwareModal().call()
      SetupSteps.ClickTiprack().call()
      SetupSteps.SelectLabwareByDisplayName(labwareToUse).call()
    },
  }),

  /**
   * @function Test_LC
   * @description Creates a StepThunk to perform a liquid handling transfer operation.
   * It takes optional parameters for source and destination labware and wells,
   * transfer volume, and liquid class, and orchestrates the necessary SetupSteps
   * to configure the transfer in the application UI.
   *
   * @param {string | undefined} sourceLabware - The name or identifier of the source labware.
   * @param {string | undefined} sourcewell - The identifier of the source well (e.g., 'A1').
   * @param {string | undefined} destinationLabware - The name or identifier of the destination labware.
   * @param {string | undefined} destWell - The identifier of the destination well (e.g., 'B2').
   * @param {string | undefined} volume - The volume to transfer as a string (e.g., '50').
   * @param {string | undefined} liquidClass - The name or identifier of the liquid class to use.
   * @returns {StepThunk} A StepThunk object containing the 'call' function that executes the transfer setup steps.
   */

  Test_LC: (
    sourceLabware?: string | undefined,
    sourceWell?: string | undefined,
    destinationLabware?: string | undefined,
    destWell?: string | undefined,
    volume?: string | undefined,
    liquidClass?: string | undefined,
    tip?: string | undefined
  ): StepThunk => ({
    call: () => {
      const Tip = tip ?? '50'
      const volumeToUse = volume ?? '1'
      const sourceLabwareToUse = sourceLabware ?? 'Bio-Rad 96 Well Plate'
      const sourceWellToUse = sourceWell ?? 'A1'
      const destinationLabwareToUse =
        destinationLabware ??
        'Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt'
      const destWellToUse = destWell ?? 'A1'
      const liquidClassToUse = liquidClass ?? 'Aqueous'

      cy.log('Executing Test_LC step with the following parameters:')
      cy.log(`  tip: ${tip}`)
      cy.log(`  Source Labware: ${sourceLabwareToUse}`)
      cy.log(`  Source Well: ${sourceWellToUse}`)
      cy.log(`  Destination Labware: ${destinationLabwareToUse}`)
      cy.log(`  Destination Well: ${destWellToUse}`)
      cy.log(`  Volume: ${volumeToUse}`)
      cy.log(`  Liquid Class: ${liquidClassToUse}`)
      SetupSteps.AddStep().call()
      SetupVerifications.TransferPopOut().call()
      UniversalSteps.Snapshot()
      SetupSteps.SelecTip(Tip)
      SetupSteps.InputTransferVolume(volumeToUse).call()
      SetupSteps.ChoseSourceLabware().call()
      SetupSteps.selectDropdownLabware(sourceLabwareToUse).call()
      SetupSteps.SelectSourceWells().call()
      SetupSteps.WellSelector([sourceWellToUse]).call()
      SetupSteps.WellSelector([sourceWellToUse]).call()
      SetupSteps.Save().call()
      SetupSteps.ChoseDestinationLabware().call()
      SetupSteps.selectDropdownLabware(destinationLabwareToUse).call()
      SetupSteps.SelectDestinationWells().call()
      SetupSteps.WellSelector([destWellToUse]).call()
      SetupSteps.WellSelector([destWellToUse]).call()
      SetupSteps.Save().call()
      SetupSteps.Continue().call()
      SetupSteps.SelectLiquidClassT(liquidClassToUse).call()
      SetupSteps.Continue().call()
      SetupSteps.Save().call()
    },
  }),

  /**
   * Executes a liquid transfer step within the Cypress automation framework.
   * This step configures pipette tip, transfer volume, source labware and wells,
   * destination labware and wells, and the liquid class.
   *
   * It supports selecting wells that are represented as either 'circle' or 'rect'
   * SVG elements, defaulting to 'circle' if no shape is specified.
   *
   * @param sourceLabware (Optional) The name of the source labware. Defaults to 'Bio-Rad 96 Well Plate'.
   * @param sourceWell (Optional) The specific well (e.g., 'A1') on the source labware. Defaults to 'A1'.
   * @param destinationLabware (Optional) The name of the destination labware. Defaults to 'Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt'.
   * @param destWell (Optional) The specific well (e.g., 'A1') on the destination labware. Defaults to 'A1'.
   * @param volume (Optional) The volume of liquid to transfer. Defaults to '1'.
   * @param liquidClass (Optional) The liquid class to use for the transfer. Defaults to 'Aqueous'.
   * @param tip (Optional) The pipette tip size to use. Defaults to '50'.
   * @param sourceWellShape (Optional) The SVG element shape for the source well selector. Can be 'circle' or 'rect'. Defaults to 'circle'.
   * @param destWellShape (Optional) The SVG element shape for the destination well selector. Can be 'circle' or 'rect'. Defaults to 'circle'.
   * @returns A StepThunk object containing the 'call' method to execute the step.
   *
   * @remarks
   * This function relies on `SetupSteps.WellSelector` for 'circle' well selection
   * and `SetupSteps.RectWellSelector` for 'rect' well selection. Ensure both functions
   * are defined and accessible in the same file or imported appropriately.
   *
   * Note: The intentional double call to `WellSelector` (or `RectWellSelector`) for both
   * source and destination wells addresses a specific bug in the application under test.
   */
  Test_LC_new_rectangle: (
    sourceLabware?: string | undefined,
    sourceWell?: string | undefined,
    destinationLabware?: string | undefined,
    destWell?: string | undefined,
    volume?: string | undefined,
    liquidClass?: string | undefined,
    tip?: string | undefined,
    sourceWellShape?: 'circle' | 'rect',
    destWellShape?: 'circle' | 'rect'
  ): StepThunk => ({
    call: () => {
      const Tip = tip ?? '50'
      const volumeToUse = volume ?? '1'
      const sourceLabwareToUse = sourceLabware ?? 'Bio-Rad 96 Well Plate'
      const sourceWellToUse = sourceWell ?? 'A1'
      const destinationLabwareToUse =
        destinationLabware ??
        'Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt'
      const destWellToUse = destWell ?? 'A1'
      const liquidClassToUse = liquidClass ?? 'Aqueous'
      const sourceShapeToUse = sourceWellShape ?? 'circle'
      const destShapeToUse = destWellShape ?? 'circle'

      cy.log('Executing Test_LC step with the following parameters:')
      cy.log(`  tip: ${Tip}`) // Using Tip directly after default is applied
      cy.log(`  Source Labware: ${sourceLabwareToUse}`)
      cy.log(`  Source Well: ${sourceWellToUse} (Shape: ${sourceShapeToUse})`)
      cy.log(`  Destination Labware: ${destinationLabwareToUse}`)
      cy.log(`  Destination Well: ${destWellToUse} (Shape: ${destShapeToUse})`)
      cy.log(`  Volume: ${volumeToUse}`)
      cy.log(`  Liquid Class: ${liquidClassToUse}`)

      SetupSteps.AddStep().call()
      SetupVerifications.TransferPopOut().call()
      UniversalSteps.Snapshot()
      SetupSteps.SelecTip(Tip)
      SetupSteps.InputTransferVolume(volumeToUse).call()

      // --- Source Well Selection Logic ---
      SetupSteps.ChoseSourceLabware().call()
      SetupSteps.selectDropdownLabware(sourceLabwareToUse).call()
      SetupSteps.SelectSourceWells().call()

      if (sourceShapeToUse === 'circle') {
        SetupSteps.WellSelector([sourceWellToUse]).call()
        SetupSteps.WellSelector([sourceWellToUse]).call() // Intentional double call
      } else if (sourceShapeToUse === 'rect') {
        SetupSteps.RectWellSelector([sourceWellToUse]).call()
        SetupSteps.RectWellSelector([sourceWellToUse]).call() // Intentional double call
      } else {
        throw new Error(
          `Invalid sourceWellShape: ${sourceShapeToUse}. Expected 'circle' or 'rect'.`
        )
      }

      SetupSteps.Save().call()

      // --- Destination Well Selection Logic ---
      SetupSteps.ChoseDestinationLabware().call()
      SetupSteps.selectDropdownLabware(destinationLabwareToUse).call()
      SetupSteps.SelectDestinationWells().call()

      if (destShapeToUse === 'circle') {
        SetupSteps.WellSelector([destWellToUse]).call()
        SetupSteps.WellSelector([destWellToUse]).call() // Intentional double call
      } else if (destShapeToUse === 'rect') {
        SetupSteps.RectWellSelector([destWellToUse]).call()
        SetupSteps.RectWellSelector([destWellToUse]).call() // Intentional double call
      } else {
        throw new Error(
          `Invalid destWellShape: ${destShapeToUse}. Expected 'circle' or 'rect'.`
        )
      }

      SetupSteps.Save().call()
      SetupSteps.Continue().call()
      SetupSteps.SelectLiquidClassT(liquidClassToUse).call()
      SetupSteps.Continue().call()
      SetupSteps.Save().call()
    },
  }),

  /**
   * @function Test_LC_tipsy
   * @description Creates a StepThunk to perform a liquid handling transfer operation with explicit tip and strategy selection.
   * It takes optional parameters for source and destination labware and wells,
   * transfer volume, liquid class, the specific tip to use, and the tip strategy.
   * It orchestrates the necessary SetupSteps to configure the transfer in the application UI,
   * including selecting the tip and tip strategy.
   *
   * @param {string | undefined} sourceLabware - The name or identifier of the source labware.
   * @param {string | undefined} sourceWell - The identifier of the source well (e.g., 'A1').
   * @param {string | undefined} destinationLabware - The name or identifier of the destination labware.
   * @param {string | undefined} destWell - The identifier of the destination well (e.g., 'B2').
   * @param {string | undefined} volume - The volume to transfer as a string (e.g., '50').
   * @param {string | undefined} liquidClass - The name or identifier of the liquid class to use (e.g., 'Aqueous').
   * @param {string | undefined} tip - The specific tip to use for the transfer (e.g., '50'). Defaults to '50' if not provided.
   * @param {string | undefined} tipstrat - The strategy for tip handling (e.g., 'Always', 'Once'). If you use never, modify the function to do once first
   * @returns {StepThunk} A StepThunk object containing the 'call' function that executes the transfer setup steps in the UI.
   */

  Test_LC_tipsy: (
    sourceLabware?: string | undefined,
    sourceWell?: string | undefined,
    destinationLabware?: string | undefined,
    destWell?: string | undefined,
    volume?: string | undefined,
    liquidClass?: string | undefined,
    tip?: string | undefined,
    tipstrat?: string | undefined
  ): StepThunk => ({
    // Corrected return type annotation: StepThunk before =>
    call: () => {
      const Tip = tip ?? '50'
      const volumeToUse = volume ?? '1'
      const sourceLabwareToUse = sourceLabware ?? 'Bio-Rad 96 Well Plate'
      const sourceWellToUse = sourceWell ?? 'A1'
      const destinationLabwareToUse =
        destinationLabware ??
        'Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt'
      const destWellToUse = destWell ?? 'A1'
      const liquidClassToUse = liquidClass ?? 'Aqueous'
      const tipstratToUse = tipstrat ?? 'Always'
      cy.log('Executing Test_LC_tipsy step with the following parameters:')
      cy.log(`  tip: ${Tip}`)
      cy.log(`  Source Labware: ${sourceLabwareToUse}`)
      cy.log(`  Source Well: ${sourceWellToUse}`)
      cy.log(`  Destination Labware: ${destinationLabwareToUse}`)
      cy.log(`  Destination Well: ${destWellToUse}`)
      cy.log(`  Volume: ${volumeToUse}`)
      cy.log(`  Liquid Class: ${liquidClassToUse}`)
      SetupSteps.AddStep().call()
      SetupVerifications.TransferPopOut().call()
      UniversalSteps.Snapshot()
      SetupSteps.SelecTip(Tip).call()
      SetupSteps.SelectTipStrategy(tipstratToUse).call()
      SetupSteps.InputTransferVolume(volumeToUse).call()
      SetupSteps.ChoseSourceLabware().call()
      SetupSteps.selectDropdownLabware(sourceLabwareToUse).call()
      SetupSteps.SelectSourceWells().call()
      SetupSteps.WellSelector([sourceWellToUse]).call()
      SetupSteps.WellSelector([sourceWellToUse]).call()
      // console.log('We will fix this eventually need to double click for now')
      // SetupSteps.WellSelector([sourceWellToUse]).call(); // Removed likely redundant call
      SetupSteps.Save().call()
      SetupSteps.ChoseDestinationLabware().call()
      SetupSteps.selectDropdownLabware(destinationLabwareToUse).call()
      SetupSteps.SelectDestinationWells().call()
      SetupSteps.WellSelector([destWellToUse]).call()
      SetupSteps.WellSelector([destWellToUse]).call()
      // ToDo fix this bug please
      // SetupSteps.WellSelector([destWellToUse]).call(); // Removed likely redundant call
      SetupSteps.Save().call()
      SetupSteps.Continue().call()
      SetupSteps.SelectLiquidClassT(liquidClassToUse).call()
      SetupSteps.Continue().call()
      SetupSteps.Save().call()
    },
  }),
}
