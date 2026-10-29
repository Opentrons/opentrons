import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'

import {
  NULL_PROTOCOL_ANALYSIS,
  PROTOCOL_ANALYSIS,
  PROTOCOL_ID,
} from '../__fixtures__'
import { useRequiredProtocolLabware } from '../useRequiredProtocolLabware'

import type { UseQueryResult } from 'react-query'
import type { Protocol } from '@opentrons/api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

vi.mock('@opentrons/react-api-client')

describe('useRequiredProtocolLabware', () => {
  beforeEach(() => {
    when(vi.mocked(useProtocolQuery))
      .calledWith(PROTOCOL_ID)
      .thenReturn({
        data: {
          data: {
            analysisSummaries: [{ id: PROTOCOL_ANALYSIS.id } as any],
          },
        },
      } as UseQueryResult<Protocol>)
    when(vi.mocked(useProtocolAnalysisAsDocumentQuery))
      .calledWith(PROTOCOL_ID, PROTOCOL_ANALYSIS.id, { enabled: true })
      .thenReturn({
        data: PROTOCOL_ANALYSIS,
      } as UseQueryResult<CompletedProtocolAnalysis>)
    when(vi.mocked(useProtocolAnalysisAsDocumentQuery))
      .calledWith(PROTOCOL_ID, NULL_PROTOCOL_ANALYSIS.id, {
        enabled: true,
      })
      .thenReturn({
        data: NULL_PROTOCOL_ANALYSIS,
      } as UseQueryResult<CompletedProtocolAnalysis>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return LabwareSetupItem array', () => {
    const { result } = renderHook(() => useRequiredProtocolLabware(PROTOCOL_ID))
    expect(result.current.length).toBe(1)
    expect(result.current[0].labwareDef.metadata.displayName).toEqual(
      '300ul Tiprack FIXTURE'
    )
  })

  it('should return empty array when there is no match with protocol id', () => {
    when(vi.mocked(useProtocolQuery))
      .calledWith(PROTOCOL_ID)
      .thenReturn({
        data: {
          data: {
            analysisSummaries: [{ id: NULL_PROTOCOL_ANALYSIS.id } as any],
          },
        },
      } as UseQueryResult<Protocol>)
    const { result } = renderHook(() => useRequiredProtocolLabware(PROTOCOL_ID))
    expect(result.current.length).toBe(0)
  })
})
