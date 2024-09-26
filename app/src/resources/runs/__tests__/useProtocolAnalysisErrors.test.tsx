import { vi, it, expect, describe, beforeEach } from 'vitest'
import { when } from 'vitest-when'
import { renderHook } from '@testing-library/react'

import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'

import { useProtocolAnalysisErrors } from '../useProtocolAnalysisErrors'
import { useNotifyRunQuery } from '../useNotifyRunQuery'

import { RUN_ID_2 } from '../__fixtures__'

import type { UseQueryResult } from 'react-query'
import type { Run, Protocol } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  PendingProtocolAnalysis,
} from '@opentrons/shared-data'

vi.mock('@opentrons/react-api-client')
vi.mock('../useNotifyRunQuery')

describe('useProtocolAnalysisErrors hook', () => {
  beforeEach(() => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(null, { staleTime: Infinity })
      .thenReturn({} as UseQueryResult<Run>)
    when(vi.mocked(useProtocolQuery))
      .calledWith(null)
      .thenReturn({} as UseQueryResult<Protocol>)
    when(vi.mocked(useProtocolAnalysisAsDocumentQuery))
      .calledWith(null, null, { enabled: false })
      .thenReturn({
        data: null,
      } as UseQueryResult<CompletedProtocolAnalysis | null>)
  })

  it('returns null when protocol id is null', () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID_2, { staleTime: Infinity })
      .thenReturn({
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
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID_2, { staleTime: Infinity })
      .thenReturn({
        data: { data: { protocolId: PROTOCOL_ID } } as any,
      } as UseQueryResult<Run>)
    when(vi.mocked(useProtocolQuery))
      .calledWith(PROTOCOL_ID)
      .thenReturn({
        data: {
          data: { analysisSummaries: [{ id: PROTOCOL_ANALYSIS.id }] },
        } as any,
      } as UseQueryResult<Protocol>)
    when(vi.mocked(useProtocolAnalysisAsDocumentQuery))
      .calledWith(PROTOCOL_ID, PROTOCOL_ANALYSIS.id, { enabled: true })
      .thenReturn({
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
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID_2, { staleTime: Infinity })
      .thenReturn({
        data: { data: { protocolId: PROTOCOL_ID } } as any,
      } as UseQueryResult<Run>)
    when(vi.mocked(useProtocolQuery))
      .calledWith(PROTOCOL_ID)
      .thenReturn({
        data: {
          data: { analysisSummaries: [{ id: PROTOCOL_ANALYSIS.id }] },
        } as any,
      } as UseQueryResult<Protocol>)
    when(vi.mocked(useProtocolAnalysisAsDocumentQuery))
      .calledWith(PROTOCOL_ID, PROTOCOL_ANALYSIS.id, { enabled: true })
      .thenReturn({
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
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID_2, { staleTime: Infinity })
      .thenReturn({
        data: { data: { protocolId: PROTOCOL_ID } } as any,
      } as UseQueryResult<Run>)
    when(vi.mocked(useProtocolQuery))
      .calledWith(PROTOCOL_ID)
      .thenReturn({
        data: {
          data: {
            analysisSummaries: [{ id: PROTOCOL_ANALYSIS_WITH_ERRORS.id }],
          },
        } as any,
      } as UseQueryResult<Protocol>)
    when(vi.mocked(useProtocolAnalysisAsDocumentQuery))
      .calledWith(PROTOCOL_ID, PROTOCOL_ANALYSIS_WITH_ERRORS.id, {
        enabled: true,
      })
      .thenReturn({
        data: PROTOCOL_ANALYSIS_WITH_ERRORS,
      } as UseQueryResult<CompletedProtocolAnalysis>)
    const { result } = renderHook(() => useProtocolAnalysisErrors(RUN_ID_2))
    expect(result.current).toStrictEqual({
      analysisErrors: [{ detail: 'fake error' }],
    })
  })
})
