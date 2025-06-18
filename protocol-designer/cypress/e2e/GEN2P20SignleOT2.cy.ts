import { CompositeSetupSteps, SetupSteps } from '../support/SetupSteps'
import { StepBuilder } from '../support/StepBuilder'
import { getTestFile, TestFilePath } from '../support/TestFiles'

describe('P20 single-channel OT-2 Transfers', () => {
  /**
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
  const GenerateMultipleTransferStepsForP20SingleChannel = (
    steps: StepBuilder,
    sourceLabware1: string,
    sourceLabware2: string,
    destinationLabware1: string,
    destinationLabware2: string
  ) => {
    const tip: string = '20' // Fixed tip for P20
    const volumes: string[] = ['1', '10', '20'] // Fixed volumes for P20

    const row: string = 'A' // Fixed row for 8-channel operation
    const colsLength: number = 12 // Max columns in a row (A1-A12)

    // Define the two labware pairs for alternation
    const labwarePairs = [
      { source: sourceLabware1, dest: destinationLabware1 }, // Pair for odd-indexed transfers
      { source: sourceLabware2, dest: destinationLabware2 }, // Pair for even-indexed transfers
    ]

    let transferCounter = 0 // This counter will go from 0 to 11 (for 12 total transfers)

    for (const volume of volumes) {
      // Determine which labware pair to use for this specific transfer
      // (0 for the first pair, 1 for the second, then back to 0, etc.)
      const currentLabwarePair = labwarePairs[transferCounter % 2]

      // Determine the current well within the 'A' row (A1, A2, ..., A12)
      const colIndex = (transferCounter % colsLength) + 1
      const currentWell = `${row}${colIndex}`

      // Add the transfer step
      steps.add(
        CompositeSetupSteps.Test_LC_new_rectangleOT2(
          // Use Test_LC (assuming it's the updated version with shape params)
          currentLabwarePair.source,
          currentWell,
          currentLabwarePair.dest,
          currentWell,
          volume,
          tip,
          'circle', // Assuming source wells are circles for this test
          'rect' // Assuming destination wells are rectangles for this test
        )
      )
      transferCounter++ // Increment the counter for the next transfer
    }
  }

  // Additional transfer command

  const GenerateMultipleTransferStepsForP300SingleChannel = (
    steps: StepBuilder,
    sourceLabware1: string,
    sourceLabware2: string,
    destinationLabware1: string,
    destinationLabware2: string
  ) => {
    const tip: string = '300' // Fixed tip for P20
    const volumes: string[] = ['20', '150', '300'] // Fixed volumes for P20

    const row: string = 'A' // Fixed row for 8-channel operation
    const colsLength: number = 12 // Max columns in a row (A1-A12)

    // Define the two labware pairs for alternation
    const labwarePairs = [
      { source: sourceLabware1, dest: destinationLabware1 }, // Pair for odd-indexed transfers
      { source: sourceLabware2, dest: destinationLabware2 }, // Pair for even-indexed transfers
    ]

    let transferCounter = 0 // This counter will go from 0 to 11 (for 12 total transfers)

    for (const volume of volumes) {
      // Determine which labware pair to use for this specific transfer
      // (0 for the first pair, 1 for the second, then back to 0, etc.)
      const currentLabwarePair = labwarePairs[transferCounter % 2]

      // Determine the current well within the 'A' row (A1, A2, ..., A12)
      const colIndex = (transferCounter % colsLength) + 1
      const currentWell = `${row}${colIndex}`

      // Add the transfer step
      steps.add(
        CompositeSetupSteps.Test_LC_new_rectangleOT2(
          // Use Test_LC (assuming it's the updated version with shape params)
          currentLabwarePair.source,
          currentWell,
          currentLabwarePair.dest,
          currentWell,
          volume,
          tip,
          'circle', // Assuming source wells are circles for this test
          'rect' // Assuming destination wells are rectangles for this test
        )
      )
      transferCounter++ // Increment the counter for the next transfer
    }
  }

  const GenerateMultipleTransferStepsForP1000SingleChannel = (
    steps: StepBuilder,
    sourceLabware1: string,
    sourceLabware2: string,
    destinationLabware1: string,
    destinationLabware2: string
  ) => {
    const tip: string = '1000' // Fixed tip for P20
    const volumes: string[] = ['100', '500', '1000'] // Fixed volumes for P20

    const row: string = 'A' // Fixed row for 8-channel operation
    const colsLength: number = 12 // Max columns in a row (A1-A12)

    // Define the two labware pairs for alternation
    const labwarePairs = [
      { source: sourceLabware1, dest: destinationLabware1 }, // Pair for odd-indexed transfers
      { source: sourceLabware2, dest: destinationLabware2 }, // Pair for even-indexed transfers
    ]

    let transferCounter = 0 // This counter will go from 0 to 11 (for 12 total transfers)

    for (const volume of volumes) {
      // Determine which labware pair to use for this specific transfer
      // (0 for the first pair, 1 for the second, then back to 0, etc.)
      const currentLabwarePair = labwarePairs[transferCounter % 2]

      // Determine the current well within the 'A' row (A1, A2, ..., A12)
      const colIndex = (transferCounter % colsLength) + 1
      const currentWell = `${row}${colIndex}`

      // Add the transfer step
      steps.add(
        CompositeSetupSteps.Test_LC_new_rectangleOT2(
          // Use Test_LC (assuming it's the updated version with shape params)
          currentLabwarePair.source,
          currentWell,
          currentLabwarePair.dest,
          currentWell,
          volume,
          tip,
          'circle', // Assuming source wells are circles for this test
          'rect' // Assuming destination wells are rectangles for this test
        )
      )
      transferCounter++ // Increment the counter for the next transfer
    }
  }

  it('Goes through onboarding flow and then runs multiple transfer steps with sequential well changes', () => {
    /*
    const protocol = getTestFile(TestFilePath.GEN2P20SingleOT2)
    cy.importProtocol(protocol.path)
    cy.contains('Confirm').click()
    cy.openSettingsPage()
    cy.get('[aria-label="Settings_OT_PD_ENABLE_LIQUID_CLASSES"]').click()
    cy.openSettingsPage()
    cy.contains('Edit protocol').click()
    const steps = new StepBuilder()
   
    GenerateMultipleTransferStepsForP20SingleChannel(
      steps,
      'Thermo Scientific Nunc 96 Well Plate 2000 µL',
      'Thermo Scientific Nunc 96 Well Plate 1300 µL',
      'USA Scientific 96 Deep Well Plate 2.4 mL',
      'NEST 96 Deep Well Plate 2mL'
    )
    steps.add(SetupSteps.ExportProtocol())
    */

    const protocol = getTestFile(TestFilePath.GEN2P300SingleOT2)
    cy.importProtocol(protocol.path)
    cy.contains('Confirm').click()
    cy.contains('Edit protocol').click()
    const steps = new StepBuilder()

    GenerateMultipleTransferStepsForP300SingleChannel(
      steps,
      'Thermo Scientific Nunc 96 Well Plate 2000 µL',
      'Thermo Scientific Nunc 96 Well Plate 1300 µL',
      'USA Scientific 96 Deep Well Plate 2.4 mL',
      'NEST 96 Deep Well Plate 2mL'
    )
    /* 
    TestFilePath.GEN2p1000SingleOT2

    GenerateMultipleTransferStepsForP1000SingleChannel(steps,
      'Thermo Scientific Nunc 96 Well Plate 2000 µL',
      'Thermo Scientific Nunc 96 Well Plate 1300 µL',
      'USA Scientific 96 Deep Well Plate 2.4 mL',
      'NEST 96 Deep Well Plate 2mL')
    */

    // Add the multiple transfer steps using the custom function with sequential wells

    steps.execute()
  })
})
