import {
  CompositeSetupSteps,
  SetupSteps,
  SetupVerifications,
} from '../support/SetupSteps'
import { StepBuilder } from '../support/StepBuilder'
import { UniversalSteps } from '../support/UniversalSteps'

describe('Transfer stepform testing Single Channel P1000uL', () => {
  beforeEach(() => {
    console.log('enablePrereleaseMode()')
    cy.visit('/')
    cy.verifyHomePage()
    cy.closeAnalyticsModal()
    cy.window().then(win => {
      if (typeof win.enablePrereleaseMode === 'function') {
        console.log('Calling enablePrereleaseMode()') // Optional: Keep the console log for visual confirmation in the test runner
        win.enablePrereleaseMode()
      } else {
        console.warn(
          'Warning: enablePrereleaseMode function not found on the window object.'
        )
      }
    })
  })

  const getAllWells = (): string[] => {
    const allWells: string[] = []
    const rows = 'ABCDEFGH'
    const cols = Array.from({ length: 12 }, (_, i) => i + 1)
    for (const row of rows) {
      for (const col of cols) {
        allWells.push(`${row}${col}`)
      }
    }
    return allWells
  }

  const GenerateMultipleTransferSteps = (steps: StepBuilder) => {
    const liquidClasses = ['Aqueous', 'Viscous', 'Volatile']
    const tips = ['50', '200', '1000']
    const allWells = getAllWells()
    let wellIndex = 0

    for (const liquidClass of liquidClasses) {
      for (const tip of tips) {
        let volumes: string[] = []
        if (tip === '50') {
          volumes = ['5', '10', '50']
        } else if (tip === '200') {
          volumes = ['5', '50', '200']
        } else if (tip === '1000') {
          volumes = ['10', '100', '1000']
        }

        for (const volume of volumes) {
          const sourceWell = allWells[wellIndex % allWells.length]
          const destWell = allWells[(wellIndex + 1) % allWells.length]

          steps.add(
            CompositeSetupSteps.Test_LC(
              'Bio-Rad 96 Well Plate', // sourceLabware
              sourceWell,
              'Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt', // destinationLabware
              destWell,
              volume,
              liquidClass,
              tip // Using the current tip value
            )
          )
          wellIndex += 2
        }
      }
    }
  }

  it('Goes through onboarding flow and then runs multiple transfer steps with sequential well changes', () => {
    cy.openSettingsPage()
    cy.get('[aria-label="Settings_OT_PD_ENABLE_LIQUID_CLASSES"]').click()
    cy.openSettingsPage()
    cy.clickCreateNew()
    cy.verifyCreateNewHeader()
    const steps = new StepBuilder()
    steps.add(SetupVerifications.OnStep1())
    steps.add(SetupVerifications.FlexSelected())
    steps.add(SetupVerifications.OnStep2())
    steps.add(SetupSteps.SinglePipette1000())
    // steps.add(SetupVerifications.StepTwo50uL())
    // steps.add(SetupSteps.SinglePipette1000())
    // steps.add(UniversalSteps.Snapshot())
    steps.add(SetupSteps.Save())
    // steps.add(SetupVerifications.StepTwoPart3())
    // steps.add(UniversalSteps.Snapshot())
    // steps.add(SetupVerifications.OnStep3())
    steps.add(SetupSteps.YesGripper())
    steps.add(SetupSteps.NoThermocycler())
    steps.add(SetupSteps.NoWasteChute())
    steps.add(SetupSteps.Confirm())
    steps.add(SetupSteps.Confirm())
    steps.add(SetupSteps.Confirm())
    steps.add(SetupSteps.EditProtocolA())
    steps.add(
      CompositeSetupSteps.AddLabwareToDeckSlot('C1', 'Bio-Rad 96 Well Plate')
    )
    steps.add(SetupSteps.ChoseDeckSlotC1Labware())
    steps.add(SetupSteps.AddLiquid())
    steps.add(SetupSteps.ClickLiquidButton())
    steps.add(SetupSteps.DefineLiquid())
    steps.add(SetupSteps.LiquidSaveWIP())
    const allWellsForLiquid: string[] = getAllWells()
    steps.add(SetupSteps.WellSelector(allWellsForLiquid))
    steps.add(SetupSteps.LiquidDropdown())
    steps.add(SetupVerifications.LiquidPage())
    steps.add(UniversalSteps.Snapshot())
    steps.add(SetupSteps.SelectLiquidWells())
    steps.add(SetupSteps.SetVolumeAndSaveForWells('150'))
    steps.add(
      CompositeSetupSteps.AddLabwareToDeckSlot(
        'C3',
        'Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt'
      )
    )
    GenerateMultipleTransferSteps(steps)
    steps.execute()
    // ToDo fix typo Tiprack -> Tip rack
    /*
    cy.contains('Opentrons Flex 96 Filter Tip Rack').click()
    const slotToUse = 'Tip Rack '
    cy.contains(slotToUse + '200').click()
    */
  })
})
