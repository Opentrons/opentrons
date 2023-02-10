import { LEFT, RIGHT } from '@opentrons/shared-data'
import protocolData from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'
import { FLOWS, SECTIONS } from '../constants'
import { getPipetteWizardStepsForProtocol } from '../getPipetteWizardStepsForProtocol'
import { getRequiredPipetteForProtocol } from '../getRequiredPipetteForProtocol'

import type { PipetteInfo, StoredProtocolAnalysis } from '../../Devices/hooks'
import type { PipetteWizardStep } from '../types'

jest.mock('../getRequiredPipetteForProtocol')

const mockGetRequiredPipetteForProtocol = getRequiredPipetteForProtocol as jest.MockedFunction<
  typeof getRequiredPipetteForProtocol
>

const mockProtocolData = ({
  ...protocolData,
  commands: [
    {
      commandType: 'loadPipette',
      id: '0abc123',
      params: {
        pipetteId: 'pipetteId',
        mount: 'left',
        pipetteName: 'p1000_single_gen3',
      },
    },
  ],
} as unknown) as StoredProtocolAnalysis

const mockPipetteInfo = {
  requestedPipetteMatch: 'incompatible',
  pipetteCalDate: null,
  pipetteSpecs: {
    displayName: 'pipette 1',
    name: 'p1000_96',
  },
} as PipetteInfo

const mockAttachedPipettesEmpty = {
  left: null,
  right: null,
}
const mockAttachedPipettesNotEmpty = {
  left: { ...mockPipetteInfo, pipetteSpecs: { name: 'p1000_single_gen3' } },
  right: null,
}
const mockAttachedPipettesMulti = {
  left: { ...mockPipetteInfo, pipetteSpecs: { name: 'p1000_multi_gen3' } },
  right: null,
}
const mockAttachedPipette96Channel = {
  left: mockPipetteInfo,
  right: null,
}

describe('getPipetteWizardStepsForProtocol', () => {
  mockGetRequiredPipetteForProtocol.mockReturnValue(null)
  it('returns an empty array of info when the attached pipette matches required pipette', () => {
    const mockFlowSteps = [] as PipetteWizardStep[]
    expect(
      getPipetteWizardStepsForProtocol(
        mockProtocolData,
        mockAttachedPipettesNotEmpty as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
  it('returns the correct array of info when the attached pipette needs to be switched out for single mount', () => {
    mockGetRequiredPipetteForProtocol.mockReturnValue('p1000_single_gen3')
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
        mockProtocolData,
        mockAttachedPipettesMulti as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
  it('returns the correct array of info when the attached 96-channel pipette needs to be switched out for single mount', () => {
    mockGetRequiredPipetteForProtocol.mockReturnValue('p1000_single_gen3')
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
        mockProtocolData,
        mockAttachedPipette96Channel as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
  it('returns the correct array of info when the attached pipette on left mount needs to be switched out for 96-channel', () => {
    mockGetRequiredPipetteForProtocol.mockReturnValue('p1000_96')
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
        mockProtocolData,
        mockAttachedPipettesNotEmpty as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
  it('returns the correct array of info when the attached pipette on right mount needs to be switched out for 96-channel', () => {
    mockGetRequiredPipetteForProtocol.mockReturnValue('p1000_96')
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
        mockProtocolData,
        {
          left: null,
          right: {
            ...mockPipetteInfo,
            pipetteSpecs: { name: 'p1000_single_gen3' },
          },
        } as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
  it('returns the correct array of info when the attached pipette on both mounts need to be switched out for 96-channel', () => {
    mockGetRequiredPipetteForProtocol.mockReturnValue('p1000_96')
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
        mockProtocolData,
        {
          left: {
            ...mockPipetteInfo,
            pipetteSpecs: { name: 'p1000_single_gen3' },
          },
          right: {
            ...mockPipetteInfo,
            pipetteSpecs: { name: 'p1000_single_gen3' },
          },
        } as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
  it('returns the correct array of info when gantry is empty and a single mount needs to be attached', () => {
    mockGetRequiredPipetteForProtocol.mockReturnValue('p1000_single_gen3')
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
        mockProtocolData,
        mockAttachedPipettesEmpty as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
  it('returns the correct array of info when gantry is empty and 96-channel needs to be attached', () => {
    mockGetRequiredPipetteForProtocol.mockReturnValue('p1000_96')
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
        mockProtocolData,
        mockAttachedPipettesEmpty as any,
        LEFT
      )
    ).toStrictEqual(mockFlowSteps)
  })
})
