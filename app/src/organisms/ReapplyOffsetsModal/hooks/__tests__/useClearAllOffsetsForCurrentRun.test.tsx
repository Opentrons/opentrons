import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { renderHook } from '@testing-library/react-hooks'
import { useCreateLabwareOffsetMutation } from '@opentrons/react-api-client'
import { IDENTITY_VECTOR } from '@opentrons/shared-data'
import { useProtocolDetailsForRun } from '../../../Devices/hooks'
import { useCurrentRunId } from '../../../ProtocolUpload/hooks'
import { useClearAllOffsetsForCurrentRun } from '../useClearAllOffsetsForCurrentRun'

import type { ProtocolAnalysisFile } from '@opentrons/shared-data'
import type { ProtocolDetails } from '../../../Devices/hooks'

import _uncastedProtocolWithTC from '@opentrons/shared-data/protocol/fixtures/6/multipleTipracksWithTC.json'

const protocolWithTC = (_uncastedProtocolWithTC as unknown) as ProtocolAnalysisFile<{}>

jest.mock('@opentrons/react-api-client')
jest.mock('../../../ProtocolUpload/hooks')
jest.mock('../../../Devices/hooks')

const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseCreateLabwareOffsetMutation = useCreateLabwareOffsetMutation as jest.MockedFunction<
  typeof useCreateLabwareOffsetMutation
>

const MOCK_RUN_ID = 'fakeRunId'
const mockProtocolDetails: ProtocolDetails = {
  protocolData: {
    commands: protocolWithTC.commands,
    modules: protocolWithTC.modules,
    labware: [
      {
        id: 'fixedTrash',
        loadName: 'opentrons_1_trash_1100ml_fixed',
        displayName: 'Trash',
        definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
      },
      {
        id:
          '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1',
        loadName: 'opentrons_96_tiprack_300ul',
        displayName: 'Opentrons 96 Tip Rack 300 µL',
        definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
      },
      {
        id:
          '9fbc1db0-0042-11ec-8258-f7ffdf5ad45a:opentrons/nest_12_reservoir_15ml/1',
        loadName: 'nest_12_reservoir_15ml',
        displayName: 'NEST 12 Well Reservoir 15 mL',
        definitionUri: 'opentrons/nest_12_reservoir_15ml/1',
      },
      {
        id: 'e24818a0-0042-11ec-8258-f7ffdf5ad45a',
        loadName: 'opentrons_96_tiprack_300ul',
        displayName: 'Opentrons 96 Tip Rack 300 µL (1)',
        definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
      },
      {
        id:
          '1dc0c050-0122-11ec-88a3-f1745cf9b36c:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
        loadName: 'nest_96_wellplate_100ul_pcr_full_skirt',
        displayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
        definitionUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
      },
    ],
    labwareDefinitions: protocolWithTC.labwareDefinitions,
  } as any,
  displayName: 'fake protocol name',
  protocolKey: 'fakeProtocolKey',
  robotType: 'OT-2 Standard',
}

describe('useClearAllOffsetsForCurrentRun', () => {
  let mockCreateOffset: jest.MockedFunction<
    ReturnType<typeof useCreateLabwareOffsetMutation>['createLabwareOffset']
  >
  beforeEach(() => {
    mockCreateOffset = jest.fn().mockReturnValue(Promise.resolve())
    when(mockUseCreateLabwareOffsetMutation)
      .calledWith()
      .mockReturnValue({ createLabwareOffset: mockCreateOffset } as any)
    when(mockUseCurrentRunId).calledWith().mockReturnValue(MOCK_RUN_ID)
    when(mockUseProtocolDetailsForRun)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue(mockProtocolDetails)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('creates an identity labware offset for every labware listed in protocol details', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <div>{children}</div>
    )
    const { result } = renderHook(useClearAllOffsetsForCurrentRun, { wrapper })
    result.current()
    expect(mockCreateOffset).toHaveBeenCalledTimes(
      Object.keys(mockProtocolDetails?.protocolData?.labware ?? {}).length
    )
    expect(mockCreateOffset.mock.calls).toEqual([
      [
        {
          runId: MOCK_RUN_ID,
          data: {
            definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
            location: { slotName: '12' },
            vector: IDENTITY_VECTOR,
          },
        },
      ],
      [
        {
          runId: MOCK_RUN_ID,
          data: {
            definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
            location: { slotName: '1' },
            vector: IDENTITY_VECTOR,
          },
        },
      ],
      [
        {
          runId: MOCK_RUN_ID,
          data: {
            definitionUri: 'opentrons/nest_12_reservoir_15ml/1',
            location: { slotName: '6' },
            vector: IDENTITY_VECTOR,
          },
        },
      ],
      [
        {
          runId: MOCK_RUN_ID,
          data: {
            definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
            location: { slotName: '2' },
            vector: IDENTITY_VECTOR,
          },
        },
      ],
      [
        {
          runId: MOCK_RUN_ID,
          data: {
            definitionUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
            location: { slotName: '7', moduleModel: 'thermocyclerModuleV1' },
            vector: IDENTITY_VECTOR,
          },
        },
      ],
    ])
  })
})
