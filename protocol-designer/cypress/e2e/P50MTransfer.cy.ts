import { CompositeSetupSteps } from '../support/SetupSteps'
import { StepBuilder } from '../support/StepBuilder'
import { getTestFile, TestFilePath } from '../support/TestFiles'

describe('Transfer stepform testing Single Channel - Spicy Sequential Wells', () => {
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
    const tip: string = '50' // Explicitly typed as string
    const volumes: string[] = ['5', '20', '50'] // Explicitly typed as string array
    const liquidClasses: string[] = [
      "Don't use a liquid class",
      'Aqueous',
      'Viscous',
      'Volatile',
    ] // Explicitly typed as string array
    const row: string = 'A'
    const colsLength: number = 12
    let colCounter: number = 0

    for (const liquidClass of liquidClasses) {
      for (const volume of volumes) {
        if (colCounter >= 0 && colCounter < colsLength) {
          // Adjusted condition to start from the beginning
          const sourceWell1: string = `${row}${colCounter + 1}`
          const destWell1: string = `${row}${colCounter + 1}`

          steps.add(
            CompositeSetupSteps.Test_LC_new_rectangle(
              sourceLabware1,
              sourceWell1,
              destinationLabware1,
              destWell1,
              volume,
              liquidClass,
              tip,
              'circle',
              'rect'
            )
          )
          colCounter++
        }

        if (colCounter >= colsLength && colCounter < 2 * colsLength) {
          const sourceWell2: string = `${row}${colCounter - colsLength}`
          const destWell2: string = `${row}${colCounter - colsLength}`

          steps.add(
            CompositeSetupSteps.Test_LC(
              sourceLabware2,
              sourceWell2,
              destinationLabware2,
              destWell2,
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
    const protocol = getTestFile(TestFilePath.P50MultiImportTransferLiquid)
    cy.importProtocol(protocol.path)
    cy.contains('Confirm').click()
    cy.openSettingsPage()
    cy.get('[aria-label="Settings_OT_PD_ENABLE_LIQUID_CLASSES"]').click()
    cy.openSettingsPage()
    cy.contains('Edit protocol').click()

    const steps = new StepBuilder()
    /* Commenting out for now for E2E
    steps.add(SetupVerifications.OnStep1())
    steps.add(SetupVerifications.FlexSelected())
    steps.add(SetupVerifications.OnStep2())
    steps.add(SetupSteps.EightChannelPipette50())
    steps.add(SetupSteps.Save())
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
        'Thermo Scientific Nunc 96 Well Plate 1300 µL'
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
    steps.add(SetupSteps.SetVolumeAndSaveForWells('1000'))

    steps.add(
      CompositeSetupSteps.AddLabwareToDeckSlot(
        'D2',
        'Armadillo 96 Well Plate 200 µL PCR Full Skirt'
      )
    )
    steps.add(
      CompositeSetupSteps.AddLabwareToDeckSlot(
        'D1',
        'Armadillo 96 Well Plate 200 µL PCR Full Skirt'
      )
    )

    steps.add(
      CompositeSetupSteps.AddLabwareToDeckSlot(
        'D2',
        'Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt'
      )
    )
    */

    GenerateMultipleTransferStepsForP508Channel(
      steps,
      'Thermo Scientific Nunc 96 Well Plate 2000 µL',
      'Thermo Scientific Nunc 96 Well Plate 1300 µL',
      'USA Scientific 96 Deep Well Plate 2.4 mL',
      'NEST 96 Deep Well Plate 2mL'
    )

    // Add the multiple transfer steps using the custom function with sequential wells

    steps.execute()
  })
})
