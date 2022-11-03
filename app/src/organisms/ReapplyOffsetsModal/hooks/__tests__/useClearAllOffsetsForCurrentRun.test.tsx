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
    labware: protocolWithTC.labware,
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
