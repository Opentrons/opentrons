import * as React from 'react'
import { UseQueryResult } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import { when, resetAllWhenMocks } from 'jest-when'

import {
  useProtocolAnalysesQuery,
  useInstrumentsQuery,
  useModulesQuery,
} from '@opentrons/react-api-client'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'
import { useRequiredProtocolLabware, useMissingProtocolHardware } from '..'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'

import type { ProtocolAnalyses } from '@opentrons/api-client'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../organisms/Devices/hooks')

const PROTOCOL_ID = 'fake_protocol_id'

const mockUseProtocolAnalysesQuery = useProtocolAnalysesQuery as jest.MockedFunction<
  typeof useProtocolAnalysesQuery
>
const mockUseModulesQuery = useModulesQuery as jest.MockedFunction<
  typeof useModulesQuery
>
const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>

const mockLabwareDef = fixture_tiprack_300_ul as LabwareDefinition2
const PROTOCOL_ANALYSIS = {
  id: 'fake analysis',
  status: 'completed',
  labware: [],
  pipettes: [{ id: 'pipId', pipetteName: 'p1000_multi_flex', mount: 'left' }],
  modules: [
    {
      id: 'modId',
      model: 'heaterShakerModuleV1',
      location: { slotName: '1' },
      serialNumber: 'serialNum',
    },
  ],
  commands: [
    {
      key: 'CommandKey0',
      commandType: 'loadLabware',
      params: {
        labwareId: 'firstLabwareId',
        location: { slotName: '1' },
        displayName: 'first labware nickname',
      },
      result: {
        labwareId: 'firstLabwareId',
        definition: mockLabwareDef,
        offset: { x: 0, y: 0, z: 0 },
      },
      id: 'CommandId0',
      status: 'succeeded',
      error: null,
      createdAt: 'fakeCreatedAtTimestamp',
      startedAt: 'fakeStartedAtTimestamp',
      completedAt: 'fakeCompletedAtTimestamp',
    },
  ],
} as any

const NULL_COMMAND = {
  id: '97ba49a5-04f6-4f91-986a-04a0eb632882',
  createdAt: '2022-09-07T19:47:42.781065+00:00',
  commandType: 'loadPipette',
  key: '0feeecaf-3895-46d7-ab71-564601265e35',
  status: 'succeeded',
  params: {
    pipetteName: 'p20_single_gen2',
    mount: 'left',
    pipetteId: '90183a18-a1df-4fd6-9636-be3bcec63fe4',
  },
  result: {
    pipetteId: '90183a18-a1df-4fd6-9636-be3bcec63fe4',
  },
  startedAt: '2022-09-07T19:47:42.782665+00:00',
  completedAt: '2022-09-07T19:47:42.785061+00:00',
}
const NULL_PROTOCOL_ANALYSIS = {
  ...PROTOCOL_ANALYSIS,
  commands: [NULL_COMMAND],
} as any

describe('useRequiredProtocolLabware', () => {
  beforeEach(() => {
    when(mockUseProtocolAnalysesQuery)
      .calledWith(PROTOCOL_ID, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: [PROTOCOL_ANALYSIS as any] },
      } as UseQueryResult<ProtocolAnalyses>)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return LabwareSetupItem array', () => {
    const { result } = renderHook(() => useRequiredProtocolLabware(PROTOCOL_ID))
    expect(result.current.length).toBe(1)
    expect(result.current[0].nickName).toEqual('first labware nickname')
    expect(result.current[0].definition.dimensions.xDimension).toBe(127.76)
    expect(result.current[0].definition.metadata.displayName).toEqual(
      '300ul Tiprack FIXTURE'
    )
  })

  it('should return empty array when there is no match with protocol id', () => {
    when(mockUseProtocolAnalysesQuery)
      .calledWith(PROTOCOL_ID, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: [NULL_PROTOCOL_ANALYSIS as any] },
      } as UseQueryResult<ProtocolAnalyses>)
    const { result } = renderHook(() => useRequiredProtocolLabware(PROTOCOL_ID))
    expect(result.current.length).toBe(0)
  })
})

describe('useMissingProtocolHardware', () => {
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    mockUseInstrumentsQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
    } as any)
    mockUseModulesQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
    } as any)
    mockUseProtocolAnalysesQuery.mockReturnValue({
      data: { data: [PROTOCOL_ANALYSIS as any] },
    } as UseQueryResult<ProtocolAnalyses>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should return 1 pipette and 1 module', () => {
    const { result } = renderHook(
      () => useMissingProtocolHardware(PROTOCOL_ANALYSIS.id),
      { wrapper }
    )
    expect(result.current).toEqual({
      isLoading: false,
      missingProtocolHardware: [
        {
          hardwareType: 'pipette',
          pipetteName: 'p1000_multi_flex',
          mount: 'left',
          connected: false,
        },
        {
          hardwareType: 'module',
          moduleModel: 'heaterShakerModuleV1',
          slot: '1',
          connected: false,
        },
      ],
    })
  })
  it('should return empty array when the correct modules and pipettes are attached', () => {
    mockUseInstrumentsQuery.mockReturnValue({
      data: {
        data: [
          {
            mount: 'left',
            instrumentType: 'pipette',
            instrumentName: 'p1000_multi_flex',
            ok: true,
          },
        ],
      },
      isLoading: false,
    } as any)

    mockUseModulesQuery.mockReturnValue({
      data: { data: [mockHeaterShaker] },
      isLoading: false,
    } as any)
    const { result } = renderHook(
      () => useMissingProtocolHardware(PROTOCOL_ANALYSIS.id),
      { wrapper }
    )
    expect(result.current).toEqual({
      missingProtocolHardware: [],
      isLoading: false,
    })
  })
})
