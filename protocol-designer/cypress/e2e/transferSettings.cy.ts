import {
  CompositeSetupSteps,
  SetupSteps,
  SetupVerifications,
} from '../support/SetupSteps'
import { StepBuilder } from '../support/StepBuilder'
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
    const volumes = ['1', '20', '50']
    const liquidClasses = ['Aqueous', 'Viscous', 'Volatile']
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
            liquidClass
          )
        )
        wellIndex += 2
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
    steps.add(UniversalSteps.Snapshot())
    steps.add(SetupSteps.SelectOT2())
    steps.add(SetupVerifications.OT2Selected())
    steps.add(UniversalSteps.Snapshot())
    steps.add(SetupSteps.SelectFlex())
    steps.add(SetupVerifications.FlexSelected())
    steps.add(UniversalSteps.Snapshot())
    steps.add(SetupVerifications.OnStep2())
    steps.add(SetupSteps.SingleChannelPipette50())
    steps.add(SetupVerifications.StepTwo50uL())
    steps.add(UniversalSteps.Snapshot())
    steps.add(SetupSteps.Save())
    steps.add(SetupVerifications.StepTwoPart3())
    steps.add(UniversalSteps.Snapshot())
    steps.add(SetupVerifications.OnStep3())
    steps.add(SetupSteps.YesGripper())
    steps.add(SetupSteps.NoThermocycler())
    steps.add(SetupSteps.NoWasteChute())
    steps.add(SetupSteps.Confirm())
    steps.add(SetupVerifications.Step4Verification())
    steps.add(SetupSteps.AddThermocycler())
    steps.add(SetupSteps.AddHeaterShaker())
    steps.add(SetupSteps.AddMagBlock())
    steps.add(SetupSteps.AddTempdeck2())
    steps.add(SetupSteps.Confirm())
    steps.add(SetupSteps.Confirm())
    steps.add(SetupSteps.EditProtocolA())
    steps.add(SetupSteps.ChoseDeckSlot('C2'))
    steps.add(SetupSteps.AddHardwareLabware())
    steps.add(SetupSteps.OpenSelectLabwareModal())
    steps.add(SetupSteps.ClickWellPlatesSection())
    steps.add(SetupSteps.SelectLabwareByDisplayName('Bio-Rad 96 Well Plate'))
    steps.add(SetupSteps.ChoseDeckSlotC2Labware())
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

    // Add the multiple transfer steps using the custom function with sequential wells
    GenerateMultipleTransferSteps(steps)

    steps.execute()
  })
})
