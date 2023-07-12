import { when, resetAllWhenMocks } from 'jest-when'
import { UseQueryResult } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'

import {
  useProtocolAnalysesQuery,
  useProtocolQuery,
  useRunQuery,
} from '@opentrons/react-api-client'

import { useProtocolDetailsForRun } from '..'

import { RUN_ID_2 } from '../../../../organisms/RunTimeControl/__fixtures__'

import type { Protocol, Run, ProtocolAnalyses } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')

const mockUseProtocolQuery = useProtocolQuery as jest.MockedFunction<
  typeof useProtocolQuery
>
const mockUseProtocolAnalysesQuery = useProtocolAnalysesQuery as jest.MockedFunction<
  typeof useProtocolAnalysesQuery
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>

const PROTOCOL_RESPONSE = {
  data: {
    protocolType: 'json',
    createdAt: 'now',
    id: '1',
    metadata: { protocolName: 'fake protocol' },
    analysisSummaries: [{ id: 'fake analysis', status: 'completed' }],
    key: 'fakeProtocolKey',
  },
} as Protocol

describe('useProtocolDetailsForRun hook', () => {
  beforeEach(() => {
    when(mockUseRunQuery)
      .calledWith(null, { staleTime: Infinity })
      .mockReturnValue({} as UseQueryResult<Run>)
    when(mockUseProtocolQuery)
      .calledWith(null, { staleTime: Infinity })
      .mockReturnValue({} as UseQueryResult<Protocol>)
    when(mockUseProtocolAnalysesQuery)
      .calledWith(null, { staleTime: Infinity }, true)
      .mockReturnValue({
        data: { data: [] } as any,
      } as UseQueryResult<ProtocolAnalyses>)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns null when given a null run id', async () => {
    const { result } = renderHook(() => useProtocolDetailsForRun(null))
    expect(result.current).toStrictEqual({
      displayName: null,
      protocolData: null,
      protocolKey: null,
      isProtocolAnalyzing: false,
      robotType: 'OT-2 Standard',
    })
  })

  it('returns the protocol file when given a run id', async () => {
    const PROTOCOL_ID = 'fake_protocol_id'
    const PROTOCOL_ANALYSIS = {
      id: 'fake analysis',
      status: 'completed',
      labware: [],
    } as any
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: { protocolId: PROTOCOL_ID } } as any,
      } as UseQueryResult<Run>)
    when(mockUseProtocolQuery)
      .calledWith(PROTOCOL_ID, { staleTime: Infinity })
      .mockReturnValue({ data: PROTOCOL_RESPONSE } as UseQueryResult<Protocol>)
    when(mockUseProtocolAnalysesQuery)
      .calledWith(PROTOCOL_ID, { staleTime: Infinity }, expect.any(Boolean))
      .mockReturnValue({
        data: { data: [PROTOCOL_ANALYSIS as any] },
      } as UseQueryResult<ProtocolAnalyses>)

    const { result } = renderHook(() => useProtocolDetailsForRun(RUN_ID_2))

    expect(result.current).toStrictEqual({
      displayName: 'fake protocol',
      protocolData: { id: 'fake analysis', status: 'completed', labware: [] },
      protocolKey: 'fakeProtocolKey',
      isProtocolAnalyzing: false,
      robotType: 'OT-2 Standard',
    })
  })
})
