import { LEFT } from '@opentrons/shared-data'
import { FLOWS, SECTIONS } from '../constants'
import { getPipetteWizardSteps } from '../getPipetteWizardSteps'
import type { PipetteWizardStep } from '../types'

describe('getPipetteWizardSteps', () => {
  it('returns the correct array of info when the flow is calibrate', () => {
    const mockCalibrateFlowSteps = [
      {
        section: SECTIONS.BEFORE_BEGINNING,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
      {
        section: SECTIONS.ATTACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
      {
        section: SECTIONS.DETACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
      {
        section: SECTIONS.RESULTS,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
    ] as PipetteWizardStep[]

    expect(getPipetteWizardSteps(FLOWS.CALIBRATE, LEFT)).toStrictEqual(
      mockCalibrateFlowSteps
    )
  })
  it('returns the correct array of info for attach pipette flow', () => {
    const mockAttachPipetteFlowSteps = [
      {
        section: SECTIONS.BEFORE_BEGINNING,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.MOUNT_PIPETTE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.RESULTS,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
    ] as PipetteWizardStep[]

    expect(getPipetteWizardSteps(FLOWS.ATTACH, LEFT)).toStrictEqual(
      mockAttachPipetteFlowSteps
    )
  })

  it('returns the correct array of info for detach pipette', () => {
    const mockDetachPipetteFlowSteps = [
      {
        section: SECTIONS.BEFORE_BEGINNING,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
      {
        section: SECTIONS.DETACH_PIPETTE,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
      {
        section: SECTIONS.RESULTS,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
    ] as PipetteWizardStep[]

    expect(getPipetteWizardSteps(FLOWS.DETACH, LEFT)).toStrictEqual(
      mockDetachPipetteFlowSteps
    )
  })
})
