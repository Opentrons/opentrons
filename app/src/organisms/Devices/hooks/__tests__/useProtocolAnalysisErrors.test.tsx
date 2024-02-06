import { when, resetAllWhenMocks } from 'jest-when'
import { UseQueryResult } from 'react-query'
import { renderHook } from '@testing-library/react'

import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'

import { useProtocolAnalysisErrors } from '..'
import { useNotifyRunQuery } from '../../../../resources/runs/useNotifyRunQuery'

import { RUN_ID_2 } from '../../../../organisms/RunTimeControl/__fixtures__'

import type { Run, Protocol } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  PendingProtocolAnalysis,
} from '@opentrons/shared-data'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../resources/runs/useNotifyRunQuery')

const mockUseNotifyRunQuery = useNotifyRunQuery as jest.MockedFunction<
  typeof useNotifyRunQuery
>

const mockUseProtocolQuery = useProtocolQuery as jest.MockedFunction<
  typeof useProtocolQuery
>
const mockUseProtocolAnalysisAsDocumentQuery = useProtocolAnalysisAsDocumentQuery as jest.MockedFunction<
  typeof useProtocolAnalysisAsDocumentQuery
>

describe('useProtocolAnalysisErrors hook', () => {
  beforeEach(() => {
    when(mockUseNotifyRunQuery)
      .calledWith(null, { staleTime: Infinity })
      .mockReturnValue({} as UseQueryResult<Run>)
    when(mockUseProtocolQuery)
      .calledWith(null)
      .mockReturnValue({} as UseQueryResult<Protocol>)
    when(mockUseProtocolAnalysisAsDocumentQuery)
      .calledWith(null, null, { enabled: false })
      .mockReturnValue({
        data: null,
      } as UseQueryResult<CompletedProtocolAnalysis | null>)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns null when protocol id is null', () => {
    when(mockUseNotifyRunQuery)
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
    when(mockUseNotifyRunQuery)
      .calledWith(RUN_ID_2, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: { protocolId: PROTOCOL_ID } } as any,
      } as UseQueryResult<Run>)
    when(mockUseProtocolQuery)
      .calledWith(PROTOCOL_ID)
      .mockReturnValue({
        data: {
          data: { analysisSummaries: [{ id: PROTOCOL_ANALYSIS.id }] },
        } as any,
      } as UseQueryResult<Protocol>)
    when(mockUseProtocolAnalysisAsDocumentQuery)
      .calledWith(PROTOCOL_ID, PROTOCOL_ANALYSIS.id, { enabled: true })
      .mockReturnValue({
        data: PROTOCOL_ANALYSIS,
      } as UseQueryResult<CompletedProtocolAnalysis>)
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
    when(mockUseNotifyRunQuery)
      .calledWith(RUN_ID_2, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: { protocolId: PROTOCOL_ID } } as any,
      } as UseQueryResult<Run>)
    when(mockUseProtocolQuery)
      .calledWith(PROTOCOL_ID)
      .mockReturnValue({
        data: {
          data: { analysisSummaries: [{ id: PROTOCOL_ANALYSIS.id }] },
        } as any,
      } as UseQueryResult<Protocol>)
    when(mockUseProtocolAnalysisAsDocumentQuery)
      .calledWith(PROTOCOL_ID, PROTOCOL_ANALYSIS.id, { enabled: true })
      .mockReturnValue({
        data: PROTOCOL_ANALYSIS,
      } as UseQueryResult<CompletedProtocolAnalysis>)
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
    when(mockUseNotifyRunQuery)
      .calledWith(RUN_ID_2, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: { protocolId: PROTOCOL_ID } } as any,
      } as UseQueryResult<Run>)
    when(mockUseProtocolQuery)
      .calledWith(PROTOCOL_ID)
      .mockReturnValue({
        data: {
          data: {
            analysisSummaries: [{ id: PROTOCOL_ANALYSIS_WITH_ERRORS.id }],
          },
        } as any,
      } as UseQueryResult<Protocol>)
    when(mockUseProtocolAnalysisAsDocumentQuery)
      .calledWith(PROTOCOL_ID, PROTOCOL_ANALYSIS_WITH_ERRORS.id, {
        enabled: true,
      })
      .mockReturnValue({
        data: PROTOCOL_ANALYSIS_WITH_ERRORS,
      } as UseQueryResult<CompletedProtocolAnalysis>)
    const { result } = renderHook(() => useProtocolAnalysisErrors(RUN_ID_2))
    expect(result.current).toStrictEqual({
      analysisErrors: [{ detail: 'fake error' }],
    })
  })
})
