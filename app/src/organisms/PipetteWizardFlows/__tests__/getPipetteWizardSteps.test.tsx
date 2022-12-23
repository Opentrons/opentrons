import {
  LEFT,
  SINGLE_MOUNT_PIPETTES,
  NINETY_SIX_CHANNEL,
} from '@opentrons/shared-data'
import {
  mockAttachedPipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { FLOWS, SECTIONS } from '../constants'
import { getPipetteWizardSteps } from '../getPipetteWizardSteps'
import type {
  AttachedPipette,
  AttachedPipettesByMount,
} from '../../../redux/pipettes/types'
import type { PipetteWizardStep } from '../types'

const mockPipette: AttachedPipette = {
  ...mockAttachedPipette,
  modelSpecs: mockGen3P1000PipetteSpecs,
}

const mockAttachedPipettesEmpty: AttachedPipettesByMount = {
  left: null,
  right: null,
}
const mockAttachedPipettesNotEmpty: AttachedPipettesByMount = {
  left: mockPipette,
  right: null,
}
describe('getPipetteWizardSteps', () => {
  it('returns the correct array of info when the flow is calibrate single channel', () => {
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

    expect(
      getPipetteWizardSteps(
        FLOWS.CALIBRATE,
        LEFT,
        SINGLE_MOUNT_PIPETTES,
        false,
        mockAttachedPipettesNotEmpty
      )
    ).toStrictEqual(mockCalibrateFlowSteps)
  })
  it('returns the correct array of info for attach pipette flow single channel', () => {
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
      {
        section: SECTIONS.ATTACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.DETACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.RESULTS,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
    ] as PipetteWizardStep[]

    expect(
      getPipetteWizardSteps(
        FLOWS.ATTACH,
        LEFT,
        SINGLE_MOUNT_PIPETTES,
        false,
        mockAttachedPipettesEmpty
      )
    ).toStrictEqual(mockAttachPipetteFlowSteps)
  })

  it('returns the correct array of info for detach pipette single channel', () => {
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

    expect(
      getPipetteWizardSteps(
        FLOWS.DETACH,
        LEFT,
        SINGLE_MOUNT_PIPETTES,
        false,
        mockAttachedPipettesNotEmpty
      )
    ).toStrictEqual(mockDetachPipetteFlowSteps)
  })

  it('returns the corect array of info for attach pipette 96 channel', () => {
    const mockAttachPipetteFlowSteps = [
      {
        section: SECTIONS.BEFORE_BEGINNING,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.CARRIAGE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.MOUNTING_PLATE,
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
      {
        section: SECTIONS.ATTACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.DETACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.RESULTS,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
    ] as PipetteWizardStep[]

    expect(
      getPipetteWizardSteps(
        FLOWS.ATTACH,
        LEFT,
        NINETY_SIX_CHANNEL,
        true,
        mockAttachedPipettesEmpty
      )
    ).toStrictEqual(mockAttachPipetteFlowSteps)
  })

  it('returns the corect array of info for detach pipette 96 channel', () => {
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
        section: SECTIONS.MOUNTING_PLATE,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
      {
        section: SECTIONS.CARRIAGE,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
      {
        section: SECTIONS.RESULTS,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
    ] as PipetteWizardStep[]

    expect(
      getPipetteWizardSteps(
        FLOWS.DETACH,
        LEFT,
        NINETY_SIX_CHANNEL,
        true,
        mockAttachedPipettesNotEmpty
      )
    ).toStrictEqual(mockDetachPipetteFlowSteps)
  })
  it('returns the correct array when 96-channel is going to be attached and there is a pipette already on the mount', () => {
    const mockAttachPipetteFlowSteps = [
      {
        section: SECTIONS.BEFORE_BEGINNING,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.DETACH_PIPETTE,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.DETACH },
      {
        section: SECTIONS.CARRIAGE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.MOUNTING_PLATE,
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
      {
        section: SECTIONS.ATTACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.DETACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.RESULTS,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
    ] as PipetteWizardStep[]

    expect(
      getPipetteWizardSteps(
        FLOWS.ATTACH,
        LEFT,
        NINETY_SIX_CHANNEL,
        false,
        mockAttachedPipettesNotEmpty
      )
    ).toStrictEqual(mockAttachPipetteFlowSteps)
  })
  //  TODO(jr, 12/5/22): fix this test when the calibrate steps are added
  it('returns the corect array of info for calibrate pipette 96 channel', () => {
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

    expect(
      getPipetteWizardSteps(
        FLOWS.CALIBRATE,
        LEFT,
        NINETY_SIX_CHANNEL,
        false,
        mockAttachedPipettesNotEmpty
      )
    ).toStrictEqual(mockCalibrateFlowSteps)
  })
})
