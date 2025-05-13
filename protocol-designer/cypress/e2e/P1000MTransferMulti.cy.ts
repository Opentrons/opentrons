import {
  CompositeSetupSteps,
  SetupSteps,
  SetupVerifications,
} from '../support/SetupSteps'
import { StepBuilder } from '../support/StepBuilder'
import { UniversalSteps } from '../support/UniversalSteps'

describe('Transfer stepform testing P1000M', () => {
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
  const GenerateMultipleTransferStepsForP508Channel = (
    steps: StepBuilder,
    sourceLabware1: string,
    sourceLabware2: string,
    destinationLabware1: string,
    destinationLabware2: string
  ) => {
    const tips = ['50', '200', '1000']
    const liquidClasses: string[] = ['Aqueous', 'Viscous', 'Volatile']
    const row = 'A'
    const colsLength = 12
    let colCounter = 0

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
          if (colCounter < 2 * colsLength) {
            // Prevent overflow
            const isFirstLabware = colCounter < colsLength

            const sourceLabware = isFirstLabware
              ? sourceLabware1
              : sourceLabware2
            const destLabware = isFirstLabware
              ? destinationLabware1
              : destinationLabware2

            const colIndex = (colCounter % colsLength) + 1
            const well = `${row}${colIndex}`

            steps.add(
              CompositeSetupSteps.Test_LC(
                sourceLabware,
                well,
                destLabware,
                well,
                volume,
                liquidClass,
                tip
              )
            )

            colCounter++
          }
        }
      }
    }
  }

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
    steps.add(SetupSteps.EightChannelPipette1000())
    steps.add(SetupSteps.Save())
    steps.add(SetupSteps.YesGripper())
    steps.add(SetupSteps.NoThermocycler())
    steps.add(SetupSteps.NoWasteChute())
    steps.add(SetupSteps.Confirm())
    steps.add(SetupSteps.Confirm())
    steps.add(SetupSteps.Confirm())
    steps.add(SetupSteps.EditProtocolA())
    steps.add(
      CompositeSetupSteps.AddTiprackToDeckSlot(
        'A1',
        'Opentrons Flex 96 Filter Tip Rack 1000 µL'
      )
    )
    steps.add(
      CompositeSetupSteps.AddTiprackToDeckSlot(
        'B1',
        'Opentrons Flex 96 Filter Tip Rack 200 µL'
      )
    )

    steps.add(
      CompositeSetupSteps.AddTiprackToDeckSlot(
        'B3',
        'Opentrons Flex 96 Filter Tip Rack 50 µL'
      )
    )

    steps.add(
      CompositeSetupSteps.AddLabwareToDeckSlot(
        'C1',
        'Thermo Scientific Nunc 96 Well Plate 1300 µL'
      )
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
    steps.add(SetupSteps.SetVolumeAndSaveForWells('1100'))

    steps.add(
      CompositeSetupSteps.AddLabwareToDeckSlot(
        'C3',
        'Thermo Scientific Nunc 96 Well Plate 2000 µL'
      )
    )
    steps.add(SetupSteps.ChoseDeckSlotWithLabware('C3'))
    steps.add(SetupSteps.AddLiquid())
    steps.add(SetupSteps.ClickLiquidButton())
    steps.add(SetupSteps.WellSelector(allWellsForLiquid))
    steps.add(SetupSteps.LiquidDropdown())
    steps.add(SetupVerifications.LiquidPage())
    steps.add(UniversalSteps.Snapshot())
    steps.add(SetupSteps.SelectLiquidWells())
    // steps.add(SetupSteps.LiquidDropdown())
    // steps.add(SetupVerifications.LiquidPage())
    // steps.add(UniversalSteps.Snapshot())
    steps.add(SetupSteps.selectLiquidbyname('My liquid!'))
    steps.add(SetupSteps.SetVolumeAndSaveForWells('1100'))

    steps.add(
      CompositeSetupSteps.AddLabwareToDeckSlot(
        'D2',
        'Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt'
      )
    )
    steps.add(
      CompositeSetupSteps.AddLabwareToDeckSlot(
        'D1',
        'Armadillo 96 Well Plate 200 µL PCR Full Skirt'
      )
    )

    GenerateMultipleTransferStepsForP508Channel(
      steps,
      'Thermo Scientific Nunc 96 Well Plate 2000 µL',
      'Thermo Scientific Nunc 96 Well Plate 1300 µL',
      'Armadillo 96 Well Plate 200 µL PCR Full Skirt',
      'Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt'
    )

    // Add the multiple transfer steps using the custom function with sequential wells

    steps.execute()
  })
})
