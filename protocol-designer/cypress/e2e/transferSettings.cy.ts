import {
  CompositeSetupSteps,
  SetupSteps,
  SetupVerifications,
} from '../support/SetupSteps'
import { StepBuilder } from '../support/StepBuilder'
import { getTestFile, TestFilePath } from '../support/TestFiles'
import { UniversalSteps } from '../support/UniversalSteps'

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
    const tip = '50'
    const volumes = ['1', '20', '50']
    const liquidClasses = [
      "Don't use a liquid class",
      'Aqueous',
      'Viscous',
      'Volatile',
    ]
    const allWells = getAllWells()
    let wellIndex = 0

    for (const liquidClass of liquidClasses) {
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
            '50'
          )
        )
        wellIndex += 2
      }
    }
  }

  it('Goes through onboarding flow and then runs multiple transfer steps with sequential well changes', () => {
    const protocol = getTestFile(TestFilePath.P50_Single_Import_T_Liquid)
    cy.importProtocol(protocol.path)
    cy.contains('Confirm').click()
    cy.openSettingsPage()
    cy.get('[aria-label="Settings_OT_PD_ENABLE_LIQUID_CLASSES"]').click()
    cy.openSettingsPage()
    cy.contains('Edit protocol').click()
    /*
    cy.contains('Add Step').click()
    cy.contains('Transfer').click()
    cy.contains('Always').click()
    cy.contains('Once')
    */

    // cy.clickCreateNew()
    // cy.verifyCreateNewHeader()
    const steps = new StepBuilder()

    // steps.add(SetupSteps.EditProtocolA())
    GenerateMultipleTransferSteps(steps)
    steps.execute()
  })
})
