import {
  CompositeSetupSteps,
  SetupSteps,
  SetupVerifications,
} from '../support/SetupSteps'
import { StepBuilder } from '../support/StepBuilder'
import { getTestFile, TestFilePath } from '../support/TestFiles'
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
  /**
   * Generates multiple transfer steps for a P1000 8-channel pipette.
   * It iterates through all combinations of liquid classes, tip sizes, and volumes (36 total).
   * For wells, it uses row 'A' and increments columns (A1, A2,...A12, then loops back to A1 for the next set).
   * It alternates between two predefined source/destination labware sets every 12 transfers,
   * simulating switching labware for subsequent 'columns' of transfers.
   *
   * @param steps The StepBuilder instance to add steps to.
   * @param sourceLabware1 The first source labware name.
   * @param sourceLabware2 The second source labware name.
   * @param destinationLabware1 The first destination labware name.
   * @param destinationLabware2 The second destination labware name.
   */
  const GenerateMultipleTransferStepsForP10008Channel = (
    steps: StepBuilder,
    sourceLabware1: string,
    sourceLabware2: string,
    destinationLabware1: string,
    destinationLabware2: string
  ) => {
    const tips = ['50', '200', '1000']
    const liquidClasses: string[] = [
      "Don't use a liquid class",
      'Aqueous',
      'Viscous',
      'Volatile',
    ]
    const row = 'A' // P1000 8-channel typically operates on a single row (or all rows simultaneously)

    // Define the two labware sets to alternate between
    const labwareSets = [
      { source: sourceLabware1, dest: destinationLabware1 },
      { source: sourceLabware2, dest: destinationLabware2 },
    ]

    const colsLength = 12 // Number of columns in a 96-well plate row
    let transferCounter = 0 // This will count from 0 to 35 (for 36 total steps)

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
          // --- Logic for labware alternation and well indexing ---
          // Determine which labware set to use based on blocks of 'colsLength' transfers
          // (e.g., transfers 0-11 use set 0, transfers 12-23 use set 1, transfers 24-35 use set 0)
          const currentLabwareSetIndex =
            Math.floor(transferCounter / colsLength) % labwareSets.length
          const currentLabwarePair = labwareSets[currentLabwareSetIndex]

          // Determine the column index for the well within the current row 'A'
          const colIndex = (transferCounter % colsLength) + 1
          const well = `${row}${colIndex}` // Well will be A1, A2, ..., A12, then A1, A2, ... A12 again, etc.

          steps.add(
            CompositeSetupSteps.Test_LC_new_rectangle(
              // Assuming Test_LC is the updated function you're using
              currentLabwarePair.source,
              well,
              currentLabwarePair.dest,
              well,
              volume,
              liquidClass,
              tip,
              'circle', // Assuming source wells are circles for this test
              'rect' // Assuming destination wells are rectangles for this test
            )
          )

          transferCounter++ // Increment the counter for the next transfer
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
    const protocol = getTestFile(TestFilePath.P1000MTransferMulti)
    cy.importProtocol(protocol.path)
    cy.contains('Confirm').click()
    cy.openSettingsPage()
    cy.get('[aria-label="Settings_OT_PD_ENABLE_LIQUID_CLASSES"]').click()
    cy.openSettingsPage()
    cy.contains('Edit protocol').click()
    const steps = new StepBuilder()
    /* 
    Old E2E version of the test
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
    */

    GenerateMultipleTransferStepsForP10008Channel(
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
