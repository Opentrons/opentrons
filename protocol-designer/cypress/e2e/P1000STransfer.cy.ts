import { CompositeSetupSteps, SetupSteps } from '../support/SetupSteps'
import { StepBuilder } from '../support/StepBuilder'
import { getTestFile, TestFilePath } from '../support/TestFiles'

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

  /**
   * Generates multiple transfer steps for a single-channel pipette,
   * covering combinations of liquid classes, tip sizes, and volumes.
   * It iterates through wells sequentially (A1, A2, A3, etc.) and
   * alternates between two predefined sets of source and destination labware
   * for each transfer step, mimicking the provided spreadsheet.
   *
   * @param steps The StepBuilder instance to add steps to.
   * @param sourceLabware1 The first source labware name (e.g., 'Thermo Scientific Nunc 96 Well Plate 2000 µL').
   * @param destinationLabware1 The first destination labware name (e.g., 'USA Scientific 96 Deep Well Plate 2.4 mL').
   * @param sourceLabware2 The second source labware name (e.g., 'Thermo Scientific Nunc 96 Well Plate 1300 µL').
   * @param destinationLabware2 The second destination labware name (e.g., 'NEST 96 Deep Well Plate 2mL').
   */
  const GenerateMultipleTransferStepsForSingleChannel = (
    steps: StepBuilder,
    sourceLabware1: string,
    destinationLabware1: string,
    sourceLabware2: string,
    destinationLabware2: string
  ) => {
    const liquidClasses: string[] = [
      "Don't use a liquid class",
      'Aqueous',
      'Viscous',
      'Volatile',
    ]
    const tips = ['50', '200', '1000']

    // Helper function to get all A1-H12 wells
    const getAllWells = (): string[] => {
      const wells: string[] = []
      const rows = 'ABCDEFGH'
      const cols = Array.from({ length: 12 }, (_, i) => i + 1)
      for (const row of rows) {
        for (const col of cols) {
          wells.push(`${row}${col}`)
        }
      }
      return wells
    }

    const allWells = getAllWells()

    // Define the two labware pairs as per the spreadsheet's alternating pattern
    const labwarePairs = [
      { source: sourceLabware1, dest: destinationLabware1 },
      { source: sourceLabware2, dest: destinationLabware2 },
    ]

    let transferCounter = 0 // This counter will control well indexing and labware alternation

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
          // Determine which labware pair to use for this specific transfer
          // (0 for the first pair, 1 for the second, then back to 0, etc.)
          const currentLabwarePair = labwarePairs[transferCounter % 2]

          // Determine the current well for both source and destination
          // The spreadsheet shows source and destination wells incrementing sequentially
          // and being the same for a given transfer (e.g., A1 -> A1, A2 -> A2).
          const currentWell = allWells[transferCounter]

          // Ensure we don't go out of bounds if somehow more combinations
          // are generated than there are wells (though for 36 steps and 96 wells, this won't happen).
          if (currentWell) {
            // Check if the well exists in our allWells array
            steps.add(
              CompositeSetupSteps.Test_LC_new_rectangle(
                // Using Test_LC as per your last full function
                currentLabwarePair.source,
                currentWell,
                currentLabwarePair.dest,
                currentWell,
                volume,
                liquidClass,
                tip,
                'circle', // Assuming source wells are circles as per the spreadsheet's context
                'rect' // Assuming destination wells are rectangles as per the spreadsheet's context
              )
            )
            transferCounter++ // Increment the counter for the next transfer
          } else {
            cy.log(
              `Warning: Ran out of wells. Skipping transfers after ${transferCounter} steps.`
            )
            break // Exit the volumes loop if we run out of wells
          }
        }
      }
    }
  }

  it('Goes through onboarding flow and then runs multiple transfer steps with sequential well changes', () => {
    const protocol = getTestFile(TestFilePath.P1000STransferSingle)
    cy.importProtocol(protocol.path)
    cy.contains('Confirm').click()
    cy.openSettingsPage()
    cy.get('[aria-label="Settings_OT_PD_ENABLE_LIQUID_CLASSES"]').click()
    cy.openSettingsPage()
    cy.contains('Edit protocol').click()
    /*
    // WORKS FOR REMOVING UNUSED TIP RACKS 
    cy.contains('Add Step').click()
    cy.contains('Move').click()
    // source
    cy.contains('p', 'Select labware')
      .parent()
      .parent()
      .contains('Choose option')
      .click()
    cy.contains('B2').click()
    // destination
    cy.contains('p', 'New location')
      .parent()
      .parent()
      .contains('Choose option')
      .click()
    cy.contains('D3').click()
    cy.contains('Save').click({ force: true })
    // BACK THE REGULARLY SCHEDULED PROGRAMMING
    */
    const steps = new StepBuilder()

    // New Transfer form

    // THIS IS THE NEW TRANSFER FORM PLEASE USE
    GenerateMultipleTransferStepsForSingleChannel(
      steps,
      'Thermo Scientific Nunc 96 Well Plate 2000 µL',
      'USA Scientific 96 Deep Well Plate 2.4 mL',
      'Thermo Scientific Nunc 96 Well Plate 1300 µL',
      'NEST 96 Deep Well Plate 2mL'
    )

    steps.execute()
    // ToDo fix running out of tips
    /*
    cy.contains('Opentrons Flex 96 Filter Tip Rack').click()
    const slotToUse = 'Tip Rack '
    cy.contains(slotToUse + '200').click()
    */
  })
})
