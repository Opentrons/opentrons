import {
  CompositeSetupSteps
} from '../support/SetupSteps'
import { StepBuilder } from '../support/StepBuilder'
import { getTestFile, TestFilePath } from '../support/TestFiles'

describe('Transfer stepform testing Single Channel - Spicy Sequential Wells', () => {
  beforeEach(() => {
    console.log('enablePrereleaseMode()')
    cy.visit('/')
    cy.verifyHomePage()
    cy.closeAnalyticsModal()
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

  const GenerateMultipleTransferSteps = (steps: StepBuilder):void => {
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
    cy.contains('Edit protocol').click()
    const steps = new StepBuilder()
    GenerateMultipleTransferSteps(steps)
    steps.execute()
  })
})
