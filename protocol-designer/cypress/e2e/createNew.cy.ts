import { SetupSteps, SetupVerifications } from '../support/SetupSteps'
import { StepExecutor } from '../support/StepBuilder'
import { UniversalSteps } from '../support/UniversalSteps'

describe('The Redesigned Create Protocol Landing Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnalyticsModal()
  })

  it('Checks onboarding flow for OT-2', () => {
    cy.verifyCreateNewHeader()
    cy.clickCreateNew()
    const se: StepExecutor = new StepExecutor()
    se.execute(SetupVerifications.OnStep1())
    se.execute(SetupVerifications.FlexSelected())
    se.execute(UniversalSteps.Snapshot())
    se.execute(SetupSteps.SelectOT2())
    se.execute(SetupVerifications.OT2Selected())
    se.execute(UniversalSteps.Snapshot())
    se.execute(SetupSteps.SelectFlex())
    se.execute(SetupVerifications.FlexSelected())
    se.execute(UniversalSteps.Snapshot())
    se.execute(SetupVerifications.OnStep2())
    se.execute(SetupVerifications.NinetySixChannel())
    se.execute(UniversalSteps.Snapshot())
    se.execute(SetupSteps.Cancel())
    se.execute(SetupSteps.SelectOT2())
    se.execute(SetupVerifications.OnStep2())
    se.execute(SetupVerifications.NotNinetySixChannel())
    se.execute(UniversalSteps.Snapshot())
  })
})
