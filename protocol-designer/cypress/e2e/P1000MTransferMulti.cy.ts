import { CompositeSetupSteps } from '../support/SetupSteps'
import { StepBuilder } from '../support/StepBuilder'
import { getTestFile, TestFilePath } from '../support/TestFiles'

// import { UniversalSteps } from '../support/UniversalSteps'

describe('Transfer stepform testing P1000M', () => {
  // This is the SINGLE beforeEach block for this describe suite.
  beforeEach(() => {
    console.log('enablePrereleaseMode()')
    cy.visit('/')
    cy.verifyHomePage()
    cy.closeAnalyticsModal()

    // This is the "COMMON SETUP FOR IT BLOCKS" that should run once
    // before each 'it' block, directly within this beforeEach.
    const protocol = getTestFile(TestFilePath.P1000MTransferMulti)
    cy.importProtocol(protocol.path)
    cy.contains('Confirm').click()
    cy.openSettingsPage()
    cy.contains('Edit protocol').click()
    // Add an assertion to confirm we are in the expected state, e.g.,
    cy.contains('Add Step').should('be.visible')
  }) // <--- The beforeEach block ends here. No nested beforeEach.

  /**
   * Generates multiple transfer steps for a P1000 8-channel pipette.
   * ... (rest of your function remains the same) ...
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
    const row = 'A'

    const labwareSets = [
      { source: sourceLabware1, dest: destinationLabware1 },
      { source: sourceLabware2, dest: destinationLabware2 },
    ]

    const colsLength = 12
    let transferCounter = 0

    for (const liquidClass of liquidClasses) {
      for (const tip of tips) {
        let volumes: string[] = []
        if (tip === '50') {
          volumes = ['7', '14', '48']
        } else if (tip === '200') {
          volumes = ['8', '44', '199']
        } else if (tip === '1000') {
          volumes = ['11', '101', '999']
        }

        for (const volume of volumes) {
          const currentLabwareSetIndex =
            Math.floor(transferCounter / colsLength) % labwareSets.length
          const currentLabwarePair = labwareSets[currentLabwareSetIndex]

          const colIndex = (transferCounter % colsLength) + 1
          const well = `${row}${colIndex}`

          steps.add(
            CompositeSetupSteps.Test_LC_new_rectangle(
              currentLabwarePair.source,
              well,
              currentLabwarePair.dest,
              well,
              volume,
              liquidClass,
              tip,
              'circle',
              'rect'
            )
          )

          transferCounter++
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
    // This 'it' block will now start with the application already in the
    // protocol editing state, due to the single beforeEach above.
    const steps = new StepBuilder()

    GenerateMultipleTransferStepsForP10008Channel(
      steps,
      'Thermo Scientific Nunc 96 Well Plate 2000 µL',
      'Thermo Scientific Nunc 96 Well Plate 1300 µL',
      'USA Scientific 96 Deep Well Plate 2.4 mL',
      'NEST 96 Deep Well Plate 2mL'
    )

    steps.execute()
    // Add relevant assertions here to confirm the transfer steps were successfully added.
  })
})
