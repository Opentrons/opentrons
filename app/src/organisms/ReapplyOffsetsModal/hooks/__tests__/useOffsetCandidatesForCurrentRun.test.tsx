import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { renderHook } from '@testing-library/react-hooks'
import { useOffsetCandidatesForCurrentRun } from '../useOffsetCandidatesForCurrentRun'
import { mockRunningRun } from '../../../RunTimeControl/__fixtures__'
import { useProtocolDetailsForRun } from '../../../Devices/hooks'
import { useCurrentRunId } from '../../../ProtocolUpload/hooks'

import type { ProtocolAnalysisFile } from '@opentrons/shared-data'
import type { LabwareOffset } from '@opentrons/api-client'
import type { ProtocolDetails } from '../../../Devices/hooks'
import { useHistoricRunDetails } from '../useHistoricRunDetails'

import _uncastedProtocolWithTC from '@opentrons/shared-data/protocol/fixtures/6/multipleTipracksWithTC.json'

const protocolWithTC = (_uncastedProtocolWithTC as unknown) as ProtocolAnalysisFile<{}>

jest.mock('@opentrons/react-api-client')
jest.mock('../../../ProtocolUpload/hooks')
jest.mock('../../../Devices/hooks')
jest.mock('../useHistoricRunDetails')

const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseHistoricRunDetails = useHistoricRunDetails as jest.MockedFunction<
  typeof useHistoricRunDetails
>

const MOCK_RUN_ID = 'fakeRunId'
const mockProtocolDetails: ProtocolDetails = {
  protocolData: {
    commands: protocolWithTC.commands,
    modules: protocolWithTC.modules,
    labware: [
      {
        id: 'fixedTrash',
        displayName: 'Trash',
        definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
        loadName: 'opentrons_1_trash_1100ml_fixed',
      },
      {
        id:
          '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1',
        displayName: 'Opentrons 96 Tip Rack 300 µL',
        definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
        loadName: 'opentrons_96_tiprack_300ul',
      },
      {
        id:
          '9fbc1db0-0042-11ec-8258-f7ffdf5ad45a:opentrons/nest_12_reservoir_15ml/1',
        displayName: 'NEST 12 Well Reservoir 15 mL',
        definitionUri: 'opentrons/nest_12_reservoir_15ml/1',
        loadName: 'nest_12_reservoir_15ml',
      },
      {
        id: 'e24818a0-0042-11ec-8258-f7ffdf5ad45a',
        displayName: 'Opentrons 96 Tip Rack 300 µL (1)',
        definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
        loadName: 'opentrons_96_tiprack_300ul',
      },
      {
        id:
          '1dc0c050-0122-11ec-88a3-f1745cf9b36c:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
        displayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
        definitionUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
        loadName: 'nest_96_wellplate_100ul_pcr_full_skirt',
      },
    ],
    labwareDefinitions: protocolWithTC.labwareDefinitions,
  } as any,
  displayName: 'fake protocol name',
  protocolKey: 'fakeProtocolKey',
  robotType: 'OT-2 Standard',
}
const FAKE_OFFSET_TIPRACK_IN_2: LabwareOffset = {
  id: 'fakeOffsetId',
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  location: { slotName: '2' },
  vector: { x: 1, y: 2, z: 3 },
  definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
}
const FAKE_OFFSET_PLATE_ON_TC: LabwareOffset = {
  id: 'fakeOffsetIdOnTC',
  createdAt: '2021-09-06T18:44:49.366581+00:00',
  location: { slotName: '7', moduleModel: 'thermocyclerModuleV1' },
  vector: { x: 4, y: 5, z: 6 },
  definitionUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
}

describe('useOffsetCandidatesForCurrentRun', () => {
  const wrapper: React.FunctionComponent<{}> = ({ children }) => (
    <div>{children}</div>
  )
  beforeEach(() => {
    when(mockUseCurrentRunId).calledWith().mockReturnValue(MOCK_RUN_ID)
    when(mockUseProtocolDetailsForRun)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue(mockProtocolDetails)
    when(mockUseHistoricRunDetails)
      .calledWith()
      .mockReturnValue([
        {
          ...mockRunningRun,
          labwareOffsets: [FAKE_OFFSET_TIPRACK_IN_2],
        },
      ])
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns candidate offset if available', () => {
    const { result } = renderHook(useOffsetCandidatesForCurrentRun, {
      wrapper,
    })
    expect(result.current).toEqual([
      {
        ...FAKE_OFFSET_TIPRACK_IN_2,
        labwareDisplayName: 'Opentrons 96 Tip Rack 300 µL',
        runCreatedAt: mockRunningRun.createdAt,
      },
    ])
  })
  it('returns first candidate offset if multiple available', () => {
    when(mockUseHistoricRunDetails)
      .calledWith()
      .mockReturnValue([
        {
          ...mockRunningRun,
          createdAt: '2021-10-07T18:44:30.366581+00:00',
          labwareOffsets: [
            {
              ...FAKE_OFFSET_TIPRACK_IN_2,
              createdAt: '2021-10-07T18:44:38.366581+00:00',
              id: 'third',
            },
            {
              ...FAKE_OFFSET_TIPRACK_IN_2,
              createdAt: '2021-10-07T18:44:49.366581+00:00',
              id: 'fourth',
            },
          ],
        },
        {
          ...mockRunningRun,
          createdAt: '2021-09-06T18:44:30.366581+00:00',
          labwareOffsets: [
            {
              ...FAKE_OFFSET_TIPRACK_IN_2,
              createdAt: '2021-09-06T18:44:38.366581+00:00',
              id: 'first',
            },
            {
              ...FAKE_OFFSET_TIPRACK_IN_2,
              createdAt: '2021-09-06T18:44:49.366581+00:00',
              id: 'second',
            },
          ],
        },
      ])

    const { result } = renderHook(useOffsetCandidatesForCurrentRun, {
      wrapper,
    })
    expect(result.current).toEqual([
      {
        ...FAKE_OFFSET_TIPRACK_IN_2,
        createdAt: '2021-10-07T18:44:49.366581+00:00',
        id: 'fourth',
        labwareDisplayName: 'Opentrons 96 Tip Rack 300 µL',
        runCreatedAt: '2021-10-07T18:44:30.366581+00:00',
      },
    ])
  })
  it('returns candidate offset from module location', () => {
    when(mockUseHistoricRunDetails)
      .calledWith()
      .mockReturnValue([
        {
          ...mockRunningRun,
          labwareOffsets: [FAKE_OFFSET_PLATE_ON_TC],
        },
      ])

    const { result } = renderHook(useOffsetCandidatesForCurrentRun, {
      wrapper,
    })
    expect(result.current).toEqual([
      {
        ...FAKE_OFFSET_PLATE_ON_TC,
        labwareDisplayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
        runCreatedAt: mockRunningRun.createdAt,
      },
    ])
  })
  it('returns no candidate offset if location does not match', () => {
    when(mockUseHistoricRunDetails)
      .calledWith()
      .mockReturnValue([
        {
          ...mockRunningRun,
          labwareOffsets: [
            { ...FAKE_OFFSET_TIPRACK_IN_2, location: { slotName: '11' } },
          ],
        },
      ])

    const { result } = renderHook(useOffsetCandidatesForCurrentRun, {
      wrapper,
    })
    expect(result.current).toEqual([])
  })
  it('returns no candidate offset if defURI does not match', () => {
    when(mockUseHistoricRunDetails)
      .calledWith()
      .mockReturnValue([
        {
          ...mockRunningRun,
          labwareOffsets: [
            { ...FAKE_OFFSET_TIPRACK_IN_2, definitionUri: 'someBogusDefURI' },
          ],
        },
      ])

    const { result } = renderHook(useOffsetCandidatesForCurrentRun, {
      wrapper,
    })
    expect(result.current).toEqual([])
  })
})
