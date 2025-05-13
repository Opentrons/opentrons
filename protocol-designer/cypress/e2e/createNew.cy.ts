import { SetupSteps, SetupVerifications } from '../support/SetupSteps'
import { StepBuilder } from '../support/StepBuilder'
import { UniversalSteps } from '../support/UniversalSteps'

describe('The Redesigned Create Protocol Landing Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnalyticsModal()
  })

  it('Checks onboarding flow for OT-2', () => {
    cy.verifyCreateNewHeader()
    cy.clickCreateNew()
    const steps: StepBuilder = new StepBuilder()
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
    steps.add(SetupVerifications.NinetySixChannel())
    steps.add(UniversalSteps.Snapshot())
    steps.add(SetupSteps.Cancel())
    steps.add(SetupSteps.SelectOT2())
    steps.add(SetupVerifications.OnStep2())
    steps.add(SetupVerifications.NotNinetySixChannel())
    steps.add(UniversalSteps.Snapshot())
    steps.execute()
  })
})
