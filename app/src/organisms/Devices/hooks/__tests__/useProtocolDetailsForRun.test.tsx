import { when, resetAllWhenMocks } from 'jest-when'
import { UseQueryResult } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'

import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
  useRunQuery,
} from '@opentrons/react-api-client'

import { useProtocolDetailsForRun } from '..'

import { RUN_ID_2 } from '../../../../organisms/RunTimeControl/__fixtures__'

import type { Protocol, Run } from '@opentrons/api-client'
import {
  CompletedProtocolAnalysis,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

jest.mock('@opentrons/react-api-client')

const mockUseProtocolQuery = useProtocolQuery as jest.MockedFunction<
  typeof useProtocolQuery
>
const mockUseProtocolAnalysisAsDocumentQuery = useProtocolAnalysisAsDocumentQuery as jest.MockedFunction<
  typeof useProtocolAnalysisAsDocumentQuery
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>

const PROTOCOL_ID = 'fake_protocol_id'
const PROTOCOL_ANALYSIS = {
  id: 'fake analysis',
  status: 'completed',
  labware: [],
} as any
const PROTOCOL_RESPONSE = {
  data: {
    protocolType: 'json',
    createdAt: 'now',
    id: PROTOCOL_ID,
    metadata: { protocolName: 'fake protocol' },
    analysisSummaries: [{ id: PROTOCOL_ANALYSIS.id, status: 'completed' }],
    key: 'fakeProtocolKey',
    robotType: OT2_ROBOT_TYPE,
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
    when(mockUseProtocolAnalysisAsDocumentQuery)
      .calledWith(null, null, { enabled: false, refetchInterval: 5000 })
      .mockReturnValue({
        data: null,
      } as UseQueryResult<CompletedProtocolAnalysis | null>)
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
      robotType: 'OT-3 Standard',
    })
  })

  it('returns the protocol file when given a run id', async () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: { protocolId: PROTOCOL_ID } } as any,
      } as UseQueryResult<Run>)
    when(mockUseProtocolQuery)
      .calledWith(PROTOCOL_ID, { staleTime: Infinity })
      .mockReturnValue({ data: PROTOCOL_RESPONSE } as UseQueryResult<Protocol>)
    when(mockUseProtocolAnalysisAsDocumentQuery)
      .calledWith(PROTOCOL_ID, 'fake analysis', {
        enabled: true,
        refetchInterval: 5000,
      })
      .mockReturnValue({
        data: PROTOCOL_ANALYSIS,
      } as UseQueryResult<CompletedProtocolAnalysis | null>)
    when(mockUseProtocolAnalysisAsDocumentQuery)
      .calledWith(PROTOCOL_ID, 'fake analysis', {
        enabled: false,
        refetchInterval: 5000,
      })
      .mockReturnValue({
        data: PROTOCOL_ANALYSIS,
      } as UseQueryResult<CompletedProtocolAnalysis | null>)

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
