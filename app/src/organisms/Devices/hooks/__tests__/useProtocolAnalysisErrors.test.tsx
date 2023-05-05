import type { Run, ProtocolAnalyses } from '@opentrons/api-client'
import {
  useProtocolAnalysesQuery,
  useRunQuery,
} from '@opentrons/react-api-client'
import type {
  CompletedProtocolAnalysis,
  PendingProtocolAnalysis,
} from '@opentrons/shared-data'
import { renderHook } from '@testing-library/react-hooks'
import { when, resetAllWhenMocks } from 'jest-when'
import { UseQueryResult } from 'react-query'

import { useProtocolAnalysisErrors } from '..'
import { RUN_ID_2 } from '../../../../organisms/RunTimeControl/__fixtures__'

jest.mock('@opentrons/react-api-client')

const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockUseProtocolAnalysesQuery = useProtocolAnalysesQuery as jest.MockedFunction<
  typeof useProtocolAnalysesQuery
>

describe('useProtocolAnalysisErrors hook', () => {
  beforeEach(() => {
    when(mockUseRunQuery)
      .calledWith(null, { staleTime: Infinity })
      .mockReturnValue({} as UseQueryResult<Run>)
    when(mockUseProtocolAnalysesQuery)
      .calledWith(null, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: [] } as any,
      } as UseQueryResult<ProtocolAnalyses>)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns null when protocol id is null', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: { protocolId: null } } as any,
      } as UseQueryResult<Run>)
    const { result } = renderHook(() => useProtocolAnalysisErrors(RUN_ID_2))
    expect(result.current).toStrictEqual({
      analysisErrors: null,
    })
  })

  it('returns null when there are no errors', async () => {
    const PROTOCOL_ID = 'fake_protocol_id'
    const PROTOCOL_ANALYSIS = {
      id: 'fake analysis',
      status: 'completed',
    } as CompletedProtocolAnalysis
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: { protocolId: PROTOCOL_ID } } as any,
      } as UseQueryResult<Run>)
    when(mockUseProtocolAnalysesQuery)
      .calledWith(PROTOCOL_ID, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: [PROTOCOL_ANALYSIS as any] },
      } as UseQueryResult<ProtocolAnalyses>)

    const { result } = renderHook(() => useProtocolAnalysisErrors(RUN_ID_2))
    expect(result.current).toStrictEqual({
      analysisErrors: null,
    })
  })

  it('returns null when analysis status is not complete', async () => {
    const PROTOCOL_ID = 'fake_protocol_id'
    const PROTOCOL_ANALYSIS = {
      id: 'fake analysis',
      status: 'pending',
    } as PendingProtocolAnalysis
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: { protocolId: PROTOCOL_ID } } as any,
      } as UseQueryResult<Run>)
    when(mockUseProtocolAnalysesQuery)
      .calledWith(PROTOCOL_ID, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: [PROTOCOL_ANALYSIS as any] },
      } as UseQueryResult<ProtocolAnalyses>)

    const { result } = renderHook(() => useProtocolAnalysisErrors(RUN_ID_2))
    expect(result.current).toStrictEqual({
      analysisErrors: null,
    })
  })

  it('returns an array of AnalysisErrors when there are errors in the analysis', async () => {
    const PROTOCOL_ID = 'fake_protocol_id'
    const PROTOCOL_ANALYSIS_WITH_ERRORS = {
      id: 'fake analysis',
      status: 'completed',
      errors: [{ detail: 'fake error' }],
    } as CompletedProtocolAnalysis
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: { protocolId: PROTOCOL_ID } } as any,
      } as UseQueryResult<Run>)
    when(mockUseProtocolAnalysesQuery)
      .calledWith(PROTOCOL_ID, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: [PROTOCOL_ANALYSIS_WITH_ERRORS as any] },
      } as UseQueryResult<ProtocolAnalyses>)

    const { result } = renderHook(() => useProtocolAnalysisErrors(RUN_ID_2))
    expect(result.current).toStrictEqual({
      analysisErrors: [{ detail: 'fake error' }],
    })
  })
})
