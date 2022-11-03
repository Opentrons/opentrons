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
        section: SECTIONS.ATTACH_STEM,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
      {
        section: SECTIONS.DETACH_STEM,
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
})
