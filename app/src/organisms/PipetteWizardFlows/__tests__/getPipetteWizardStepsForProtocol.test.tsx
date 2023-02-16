import { LEFT, RIGHT } from '@opentrons/shared-data'
import {
  mockAttachedGen3Pipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { FLOWS, SECTIONS } from '../constants'
import { getPipetteWizardStepsForProtocol } from '../getPipetteWizardStepsForProtocol'

import type { AttachedPipette } from '../../../redux/pipettes/types'
import type { PipetteInfo } from '../../Devices/hooks'
import type { PipetteWizardStep } from '../types'

const mockPipetteInfo = {
  requestedPipetteMatch: 'incompatible',
  pipetteCalDate: null,
  pipetteSpecs: {
    displayName: 'pipette 1',
    name: 'p1000_96',
  },
} as PipetteInfo

const mockPipettesInProtocolNotEmpty = {
  left: { ...mockPipetteInfo, pipetteSpecs: { name: 'p1000_single_gen3' } },
  right: null,
}
const mockPipettesInProtocolMulti = {
  left: { ...mockPipetteInfo, pipetteSpecs: { name: 'p1000_multi_gen3' } },
  right: null,
}
const mockPipettesInProtocol96Channel = {
  left: mockPipetteInfo,
  right: null,
}
const mockPipette: AttachedPipette = {
  ...mockAttachedGen3Pipette,
  modelSpecs: {
    ...mockGen3P1000PipetteSpecs,
    displayName: 'mock pipette display name',
  },
}
const mockSingleMountPipetteAttached = { left: mockPipette, right: null }

describe('getPipetteWizardStepsForProtocol', () => {
  it('returns an empty array of info when the attached pipette matches required pipette', () => {
    const mockFlowSteps = [] as PipetteWizardStep[]
    expect(
      getPipetteWizardStepsForProtocol(
        mockSingleMountPipetteAttached,
        {
          left: {
            pipetteCalDate: 'cal date',
            requestedPipetteMatch: 'match',
            pipetteSpecs: { name: 'p1000_single_gen3' },
          },
          right: null,
        } as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
  it('returns an empty array when there is no pipette attached and no pipette is needed', () => {
    const mockFlowSteps = [] as PipetteWizardStep[]
    expect(
      getPipetteWizardStepsForProtocol(
        { left: null, right: null },
        {
          left: null,
          right: null,
        } as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
  it('returns the calibration flow only when correct pipette is attached but there is no pip cal data', () => {
    const mockFlowSteps = [
      {
        section: SECTIONS.BEFORE_BEGINNING,
        mount: RIGHT,
        flowType: FLOWS.CALIBRATE,
      },
      {
        section: SECTIONS.ATTACH_PROBE,
        mount: RIGHT,
        flowType: FLOWS.CALIBRATE,
      },
      {
        section: SECTIONS.DETACH_PROBE,
        mount: RIGHT,
        flowType: FLOWS.CALIBRATE,
      },
      { section: SECTIONS.RESULTS, mount: RIGHT, flowType: FLOWS.CALIBRATE },
    ] as PipetteWizardStep[]
    expect(
      getPipetteWizardStepsForProtocol(
        { left: null, right: mockPipette },
        {
          left: null,
          right: {
            pipetteCalDate: null,
            requestedPipetteMatch: 'match',
            pipetteSpecs: { name: 'p1000_single_gen3' },
          },
        } as any,
        RIGHT
      )
    ).toStrictEqual(mockFlowSteps)
  })
  it('returns the correct array of info when the attached pipette needs to be switched out for single mount', () => {
    const mockFlowSteps = [
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
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.DETACH },
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
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.ATTACH },
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
      getPipetteWizardStepsForProtocol(
        mockSingleMountPipetteAttached,
        mockPipettesInProtocolMulti as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
  it('returns the correct array of info when the attached 96-channel pipette needs to be switched out for single mount', () => {
    const mockFlowSteps = [
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
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.DETACH },
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
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.ATTACH },
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
      getPipetteWizardStepsForProtocol(
        { left: { ...mockPipette, name: 'p1000_96' }, right: null },
        mockPipettesInProtocolNotEmpty as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
  it('returns the correct array of info when the attached pipette on left mount needs to be switched out for 96-channel', () => {
    const mockFlowSteps = [
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
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.DETACH },
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
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.ATTACH },
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
      getPipetteWizardStepsForProtocol(
        { left: mockPipette, right: null },
        mockPipettesInProtocol96Channel as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
  it('returns the correct array of info when the attached pipette on right mount needs to be switched out for 96-channel', () => {
    const mockFlowSteps = [
      {
        section: SECTIONS.BEFORE_BEGINNING,
        mount: RIGHT,
        flowType: FLOWS.DETACH,
      },
      {
        section: SECTIONS.DETACH_PIPETTE,
        mount: RIGHT,
        flowType: FLOWS.DETACH,
      },
      { section: SECTIONS.RESULTS, mount: RIGHT, flowType: FLOWS.DETACH },
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
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.ATTACH },
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
      getPipetteWizardStepsForProtocol(
        { left: null, right: mockPipette },
        mockPipettesInProtocol96Channel as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
  it('returns the correct array of info when the attached pipette on both mounts need to be switched out for 96-channel', () => {
    const mockFlowSteps = [
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
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.DETACH },
      {
        section: SECTIONS.BEFORE_BEGINNING,
        mount: RIGHT,
        flowType: FLOWS.DETACH,
      },
      {
        section: SECTIONS.DETACH_PIPETTE,
        mount: RIGHT,
        flowType: FLOWS.DETACH,
      },
      { section: SECTIONS.RESULTS, mount: RIGHT, flowType: FLOWS.DETACH },
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
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.ATTACH },
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
      getPipetteWizardStepsForProtocol(
        { left: mockPipette, right: mockPipette },
        mockPipettesInProtocol96Channel as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
  it('returns the correct array of info when gantry is empty and a single mount needs to be attached', () => {
    const mockFlowSteps = [
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
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.ATTACH },
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
      getPipetteWizardStepsForProtocol(
        { left: null, right: null },
        mockPipettesInProtocolNotEmpty as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
  it('returns the correct array of info when gantry is empty and 96-channel needs to be attached', () => {
    const mockFlowSteps = [
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
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.ATTACH },
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
      getPipetteWizardStepsForProtocol(
        { left: null, right: null },
        mockPipettesInProtocol96Channel as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
})
