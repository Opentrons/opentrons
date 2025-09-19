import {
  CompositeSetupSteps,
  SetupSteps,
  SetupVerifications,
} from '../support/SetupSteps'
import { StepExecutor } from '../support/StepBuilder'
import { UniversalSteps } from '../support/UniversalSteps'

describe('Create new Flex', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnalyticsModal()
  })

  it('Goes through onboarding workflow for Flex', () => {
    cy.clickCreateNew()
    cy.verifyCreateNewHeader()

    const se = new StepExecutor()
    se.execute(
      CompositeSetupSteps.FlexSetup({
        thermocycler: true,
        heatershaker: true,
        magblock: true,
        tempdeck: true,
      })
    )
    se.execute(
      CompositeSetupSteps.AddLabwareToDeckSlot('C2', 'Bio-Rad 96 Well Plate')
    )
    se.execute(SetupSteps.ChoseDeckSlotWithLabware('C2'))
    se.execute(SetupSteps.AddHardwareLabware())
    se.execute(SetupSteps.AddLiquid())
    se.execute(SetupSteps.ClickLiquidButton())
    se.execute(SetupSteps.DefineLiquid())
    se.execute(SetupSteps.LiquidSaveWIP())
    se.execute(SetupSteps.WellSelector(['A1', 'A2']))
    se.execute(SetupSteps.LiquidDropdown())
    se.execute(SetupVerifications.LiquidPage())
    se.execute(UniversalSteps.Snapshot())
    se.execute(SetupSteps.SelectLiquidWells())
    se.execute(SetupSteps.SetVolumeAndSaveForWells('150'))
    se.execute(SetupSteps.SelectDone())
    se.execute(
      CompositeSetupSteps.AddLabwareToDeckSlot(
        'C3',
        'Armadillo 96 Well Plate 200 µL'
      )
    )
  })
})
