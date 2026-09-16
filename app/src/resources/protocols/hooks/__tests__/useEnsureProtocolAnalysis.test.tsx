import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import {
  useCreateProtocolAnalysisMutation,
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'

import { PROTOCOL_ANALYSIS, PROTOCOL_ID } from '../__fixtures__'
import { useEnsureProtocolAnalysis } from '../useEnsureProtocolAnalysis'

import type { UseQueryResult } from 'react-query'
import type { Protocol } from '@opentrons/api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

vi.mock('@opentrons/react-api-client')

const ANALYSIS_POLL_MS = 5000
const PENDING_ANALYSIS_ID = 'pending-analysis-id'

const EMPTY_SUMMARIES_PROTOCOL = {
  data: { analysisSummaries: [] },
} as Protocol

const PENDING_SUMMARIES_PROTOCOL = {
  data: {
    analysisSummaries: [{ id: PENDING_ANALYSIS_ID, status: 'pending' }],
  },
} as Protocol

const COMPLETED_SUMMARIES_PROTOCOL = {
  data: {
    analysisSummaries: [{ id: PROTOCOL_ANALYSIS.id, status: 'completed' }],
  },
} as Protocol

describe('useEnsureProtocolAnalysis', () => {
  let createProtocolAnalysis: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createProtocolAnalysis = vi.fn()
    vi.mocked(useCreateProtocolAnalysisMutation).mockReturnValue({
      createProtocolAnalysis,
    } as any)
    when(vi.mocked(useProtocolQuery))
      .calledWith(null, { staleTime: Infinity }, undefined)
      .thenReturn({ data: undefined } as UseQueryResult<Protocol>)
    when(vi.mocked(useProtocolAnalysisAsDocumentQuery))
      .calledWith(null, null, {
        enabled: false,
        refetchInterval: ANALYSIS_POLL_MS,
      })
      .thenReturn({
        data: null,
      } as UseQueryResult<CompletedProtocolAnalysis | null>)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('POSTs a new analysis once when analysis summaries are empty', () => {
    stubProtocolQuery(EMPTY_SUMMARIES_PROTOCOL, true)
    when(vi.mocked(useProtocolAnalysisAsDocumentQuery))
      .calledWith(PROTOCOL_ID, null, {
        enabled: false,
        refetchInterval: ANALYSIS_POLL_MS,
      })
      .thenReturn({
        data: null,
      } as UseQueryResult<CompletedProtocolAnalysis | null>)

    const { result, rerender } = renderHook(() =>
      useEnsureProtocolAnalysis(PROTOCOL_ID)
    )

    expect(createProtocolAnalysis).toHaveBeenCalledTimes(1)
    expect(createProtocolAnalysis).toHaveBeenCalledWith(
      { protocolKey: PROTOCOL_ID, forceReAnalyze: false },
      expect.objectContaining({ onError: expect.any(Function) })
    )
    expect(result.current.analysisId).toBeNull()
    expect(result.current.isAnalyzing).toBe(true)

    rerender()
    expect(createProtocolAnalysis).toHaveBeenCalledTimes(1)
  })

  it('does not POST when a pending analysis id already exists', () => {
    stubProtocolQuery(PENDING_SUMMARIES_PROTOCOL, true)
    when(vi.mocked(useProtocolAnalysisAsDocumentQuery))
      .calledWith(PROTOCOL_ID, PENDING_ANALYSIS_ID, {
        enabled: true,
        refetchInterval: ANALYSIS_POLL_MS,
      })
      .thenReturn({
        data: null,
      } as UseQueryResult<CompletedProtocolAnalysis | null>)

    const { result } = renderHook(() => useEnsureProtocolAnalysis(PROTOCOL_ID))

    expect(createProtocolAnalysis).not.toHaveBeenCalled()
    expect(result.current.analysisId).toBe(PENDING_ANALYSIS_ID)
    expect(result.current.isAnalyzing).toBe(true)
  })

  it('does not enable asDocument without an analysis id', () => {
    stubProtocolQuery(EMPTY_SUMMARIES_PROTOCOL, true)
    when(vi.mocked(useProtocolAnalysisAsDocumentQuery))
      .calledWith(PROTOCOL_ID, null, {
        enabled: false,
        refetchInterval: ANALYSIS_POLL_MS,
      })
      .thenReturn({
        data: null,
      } as UseQueryResult<CompletedProtocolAnalysis | null>)

    renderHook(() => useEnsureProtocolAnalysis(PROTOCOL_ID))

    expect(useProtocolAnalysisAsDocumentQuery).toHaveBeenCalledWith(
      PROTOCOL_ID,
      null,
      { enabled: false, refetchInterval: ANALYSIS_POLL_MS }
    )
  })

  it('returns the completed analysis document without starting a new analysis', () => {
    stubProtocolQuery(COMPLETED_SUMMARIES_PROTOCOL, true)
    stubProtocolQuery(COMPLETED_SUMMARIES_PROTOCOL, undefined)
    when(vi.mocked(useProtocolAnalysisAsDocumentQuery))
      .calledWith(PROTOCOL_ID, PROTOCOL_ANALYSIS.id, {
        enabled: true,
        refetchInterval: false,
      })
      .thenReturn({
        data: PROTOCOL_ANALYSIS,
      } as UseQueryResult<CompletedProtocolAnalysis>)

    const { result } = renderHook(() => useEnsureProtocolAnalysis(PROTOCOL_ID))

    expect(createProtocolAnalysis).not.toHaveBeenCalled()
    expect(result.current.analysis).toEqual(PROTOCOL_ANALYSIS)
    expect(result.current.analysisId).toBe(PROTOCOL_ANALYSIS.id)
    expect(result.current.isAnalyzing).toBe(false)
  })

  it('treats LastAnalysisPending 503 as in-progress and does not retry', () => {
    stubProtocolQuery(EMPTY_SUMMARIES_PROTOCOL, true)
    when(vi.mocked(useProtocolAnalysisAsDocumentQuery))
      .calledWith(PROTOCOL_ID, null, {
        enabled: false,
        refetchInterval: ANALYSIS_POLL_MS,
      })
      .thenReturn({
        data: null,
      } as UseQueryResult<CompletedProtocolAnalysis | null>)
    createProtocolAnalysis.mockImplementation(
      (_vars: unknown, options: { onError?: (error: unknown) => void }) => {
        options.onError?.({
          isAxiosError: true,
          response: {
            status: 503,
            data: { errors: [{ id: 'LastAnalysisPending' }] },
          },
        })
      }
    )

    const { result, rerender } = renderHook(() =>
      useEnsureProtocolAnalysis(PROTOCOL_ID)
    )

    expect(createProtocolAnalysis).toHaveBeenCalledTimes(1)
    expect(result.current.isAnalyzing).toBe(true)
    rerender()
    expect(createProtocolAnalysis).toHaveBeenCalledTimes(1)
  })
})

function stubProtocolQuery(
  protocol: Protocol,
  enablePolling: boolean | undefined
): void {
  when(vi.mocked(useProtocolQuery))
    .calledWith(PROTOCOL_ID, { staleTime: Infinity }, enablePolling)
    .thenReturn({ data: protocol } as UseQueryResult<Protocol>)
}
