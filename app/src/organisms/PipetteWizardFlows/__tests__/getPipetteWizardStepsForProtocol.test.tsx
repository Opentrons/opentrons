import { LEFT, RIGHT, LoadedPipette } from '@opentrons/shared-data'
import {
  mock96ChannelAttachedPipetteInformation,
  mockAttachedPipetteInformation,
} from '../../../redux/pipettes/__fixtures__'
import { FLOWS, SECTIONS } from '../constants'
import { getPipetteWizardStepsForProtocol } from '../getPipetteWizardStepsForProtocol'

import type { PipetteWizardStep } from '../types'

const mockPipetteInfo = [
  { id: '123', pipetteName: 'p1000_96', mount: 'left' },
] as LoadedPipette[]

const mockPipettesInProtocolNotEmpty = [
  { id: '123', pipetteName: 'p1000_single_flex', mount: 'left' },
]
const mockPipettesInProtocolMulti = [
  { id: '123', pipetteName: 'p1000_multi_flex', mount: 'left' },
]
const mockSingleMountPipetteAttached = {
  left: mockAttachedPipetteInformation,
  right: null,
}

describe('getPipetteWizardStepsForProtocol', () => {
  it('returns an empty array of info when the attached pipette matches required pipette', () => {
    const mockFlowSteps = [] as PipetteWizardStep[]
    expect(
      getPipetteWizardStepsForProtocol(
        mockSingleMountPipetteAttached,
        [
          {
            id: '123',
            pipetteName: 'p1000_single_flex',
            mount: 'left',
          },
        ],
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
  it('returns an empty array when there is no pipette attached and no pipette is needed', () => {
    const mockFlowSteps = [] as PipetteWizardStep[]
    expect(
      getPipetteWizardStepsForProtocol({ left: null, right: null }, [], LEFT)
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
        {
          left: null,
          right: {
            ...mockAttachedPipetteInformation,
            data: { calibratedOffset: undefined as any },
          } as any,
        },
        [{ id: '123', pipetteName: 'p1000_single_flex', mount: 'right' }],
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
        section: SECTIONS.MOUNT_PIPETTE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.FIRMWARE_UPDATE,
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
        section: SECTIONS.MOUNT_PIPETTE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.FIRMWARE_UPDATE,
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
        { left: mock96ChannelAttachedPipetteInformation, right: null },
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
        section: SECTIONS.FIRMWARE_UPDATE,
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
        { left: mockAttachedPipetteInformation, right: null },
        mockPipetteInfo as any,
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
        section: SECTIONS.FIRMWARE_UPDATE,
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
        { left: null, right: mockAttachedPipetteInformation },
        mockPipetteInfo as any,
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
        section: SECTIONS.DETACH_PIPETTE,
        mount: RIGHT,
        flowType: FLOWS.DETACH,
      },
      { section: SECTIONS.RESULTS, mount: RIGHT, flowType: FLOWS.DETACH },
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
        section: SECTIONS.FIRMWARE_UPDATE,
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
        {
          left: mockAttachedPipetteInformation,
          right: mockAttachedPipetteInformation,
        },
        mockPipetteInfo as any,
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
      {
        section: SECTIONS.FIRMWARE_UPDATE,
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
      {
        section: SECTIONS.FIRMWARE_UPDATE,
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
        mockPipetteInfo as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
})
