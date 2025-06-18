import { CompositeSetupSteps } from '../support/SetupSteps'
import { StepBuilder } from '../support/StepBuilder'
import { getTestFile, TestFilePath } from '../support/TestFiles'

describe('Transfer stepform testing Single Channel - Spicy Sequential Wells', () => {
  beforeEach(() => {
    console.log('enablePrereleaseMode()')
    cy.visit('/')
    cy.verifyHomePage()
    cy.closeAnalyticsModal()
  })
  /**
   * Generates multiple transfer steps specifically for a P50 8-channel pipette.
   * It covers all combinations of the predefined liquid classes and volumes (12 total transfers).
   * Each transfer uses a sequential well from A1 to A12.
   * The source and destination labware sets alternate for each transfer.
   *
   * @param steps The StepBuilder instance to add steps to.
   * @param sourceLabware1 The first source labware name (e.g., 'Thermo Scientific Nunc 96 Well Plate 2000 µL').
   * @param sourceLabware2 The second source labware name (e.g., 'Thermo Scientific Nunc 96 Well Plate 1300 µL').
   * @param destinationLabware1 The first destination labware name (e.g., 'USA Scientific 96 Deep Well Plate 2.4 mL').
   * @param destinationLabware2 The second destination labware name (e.g., 'NEST 96 Deep Well Plate 2mL').
   */
  const GenerateMultipleTransferStepsForP508Channel = (
    steps: StepBuilder,
    sourceLabware1: string,
    sourceLabware2: string,
    destinationLabware1: string,
    destinationLabware2: string
  ) => {
    const tip: string = '50' // Fixed tip for P50
    const volumes: string[] = ['4', '19', '49'] // Fixed volumes for P50
    const liquidClasses: string[] = [
      "Don't use a liquid class",
      'Aqueous',
      'Viscous',
      'Volatile',
    ]

    const row: string = 'A' // Fixed row for 8-channel operation
    const colsLength: number = 12 // Max columns in a row (A1-A12)

    // Define the two labware pairs for alternation
    const labwarePairs = [
      { source: sourceLabware1, dest: destinationLabware1 }, // Pair for odd-indexed transfers
      { source: sourceLabware2, dest: destinationLabware2 }, // Pair for even-indexed transfers
    ]

    let transferCounter = 0 // This counter will go from 0 to 11 (for 12 total transfers)

    for (const liquidClass of liquidClasses) {
      for (const volume of volumes) {
        // Determine which labware pair to use for this specific transfer
        // (0 for the first pair, 1 for the second, then back to 0, etc.)
        const currentLabwarePair = labwarePairs[transferCounter % 2]

        // Determine the current well within the 'A' row (A1, A2, ..., A12)
        const colIndex = (transferCounter % colsLength) + 1
        const currentWell = `${row}${colIndex}`

        // Add the transfer step
        steps.add(
          CompositeSetupSteps.Test_LC_new_rectangle(
            // Use Test_LC (assuming it's the updated version with shape params)
            currentLabwarePair.source,
            currentWell,
            currentLabwarePair.dest,
            currentWell,
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
    // After these loops, transferCounter will be 12, indicating 12 steps were added.
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
    const protocol = getTestFile(TestFilePath.P50MTransferMulti)
    cy.importProtocol(protocol.path)
    cy.contains('Confirm').click()
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
