import {
  verifyImportProtocolPage,
  verifyOldProtocolModal,
} from '../support/Import'
import { StepExecutor } from '../support/StepBuilder'
import { getTestFile, TestFilePath } from '../support/TestFiles'
import {
  ThermocyclerEditor,
  ThermoProfile,
  ThermoProfileSteps,
  ThermoState,
  ThermoVerifications,
} from '../support/Thermocycler'
import { TimelineSteps } from '../support/Timeline'

describe('Redesigned Thermocycler Set Up Steps - Happy Path', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnalyticsModal()
    cy.closeReleaseNotesModal()
    const protocol = getTestFile(TestFilePath.DoItAllV8)
    cy.importProtocol(protocol.path)
    verifyImportProtocolPage(protocol)
    verifyOldProtocolModal()
    cy.contains('Edit protocol').click()
  })

  it('It should verify the working function of thermocycler set up', () => {
    const se = new StepExecutor()
    se.execute(
      TimelineSteps.SelectItemMenuOption(1, 'Thermocycler', 'Edit step')
    )
    se.execute(ThermoVerifications.VerifyPartOne())
    se.execute(ThermocyclerEditor.SelectProfileOrState('state'))
    se.execute(ThermoVerifications.VerifyThermoState())
    se.execute(ThermocyclerEditor.BlockTempOnOff('on'))
    se.execute(ThermoState.BlockTempInput('99'))
    se.execute(ThermocyclerEditor.BlockTempOnOff('off'))
    se.execute(ThermocyclerEditor.BlockTempOnOff('on'))
    se.execute(ThermoState.BlockTempInput('15'))
    se.execute(ThermocyclerEditor.LidTempOnOff('on'))
    se.execute(ThermoState.LidTempInput('37'))
    se.execute(ThermocyclerEditor.LidTempOnOff('off'))
    se.execute(ThermocyclerEditor.LidTempOnOff('on'))
    se.execute(ThermoState.LidTempInput('110'))
    se.execute(ThermocyclerEditor.LidOpenClosed('closed'))
    se.execute(ThermocyclerEditor.LidOpenClosed('open'))
    se.execute(ThermocyclerEditor.LidOpenClosed('closed'))
    se.execute(ThermocyclerEditor.BackButton())
    se.execute(ThermocyclerEditor.SelectProfileOrState('state'))
    se.execute(ThermoVerifications.VerifyOptionsPersist('state'))
    se.execute(ThermocyclerEditor.BackButton())
    se.execute(ThermocyclerEditor.SelectProfileOrState('profile'))
    se.execute(ThermoVerifications.VerifyThermoProfile())
    se.execute(ThermoProfile.WellVolumeInput('99'))
    se.execute(ThermoProfile.LidTempInput('40'))
    se.execute(ThermocyclerEditor.BlockTempOnOff('on'))
    se.execute(ThermoProfile.BlockTempHoldInput('90'))
    se.execute(ThermocyclerEditor.LidTempOnOff('on'))
    se.execute(ThermoProfile.LidTempHoldInput('40'))
    se.execute(ThermocyclerEditor.LidOpenClosed('open'))
    se.execute(ThermocyclerEditor.BackButton())
    se.execute(ThermocyclerEditor.SelectProfileOrState('profile'))
    se.execute(ThermoVerifications.VerifyOptionsPersist('profile'))
    se.execute(ThermoVerifications.VerifyProfileSteps())
    se.execute(ThermoProfileSteps.AddCycle())
    se.execute(ThermoProfileSteps.DeleteCycle(0))
    se.execute(ThermoProfileSteps.AddCycle())
    se.execute(ThermoProfileSteps.SetCycleCount(0, '3'))
    se.execute(ThermoProfileSteps.AddCycleStep(0))
    se.execute(
      ThermoProfileSteps.FillCycleStep({
        cycle: 0,
        step: 0,
        stepName: 'cycle test 1',
        temp: '50',
        time: '05:00',
      })
    )
    se.execute(ThermoProfileSteps.AddCycleStep(0))
    se.execute(
      ThermoProfileSteps.FillCycleStep({
        cycle: 0,
        step: 1,
        stepName: 'cycle test 2',
        temp: '45',
        time: '05:55',
      })
    )
    se.execute(ThermoProfileSteps.AddCycleStep(0))
    se.execute(ThermoProfileSteps.DeleteCycleStep(0, 2))
    se.execute(ThermoProfileSteps.AddCycleStep(0))
    se.execute(
      ThermoProfileSteps.FillCycleStep({
        cycle: 0,
        step: 2,
        stepName: 'cycle test 3',
        temp: '35',
        time: '03:33',
      })
    )
    se.execute(ThermoProfileSteps.SaveCycle(0))
    se.execute(ThermoProfileSteps.AddStep())
    se.execute(
      ThermoProfileSteps.FillThermocyclerStep({
        step: 0,
        stepName: 'Thermocycler Step 1',
        temp: '30',
        time: '03:01',
      })
    )
    se.execute(ThermoProfileSteps.DeleteThermocyclerStep(0))
    se.execute(ThermoProfileSteps.AddStep())
    se.execute(
      ThermoProfileSteps.FillThermocyclerStep({
        step: 0,
        stepName: 'Thermocycler step 2',
        temp: '25',
        time: '02:02',
      })
    )
    se.execute(ThermoProfileSteps.SaveThermocyclerStep(0))
    se.execute(ThermoProfileSteps.AddStep())
    se.execute(
      ThermoProfileSteps.FillThermocyclerStep({
        step: 1,
        stepName: 'Thermocycler Step 3',
        temp: '49',
        time: '01:59',
      })
    )
    se.execute(ThermoProfileSteps.SaveThermocyclerStep(1))
    se.execute(ThermocyclerEditor.SaveProfileSteps())
    se.execute(ThermocyclerEditor.SaveButton())
  })
})
