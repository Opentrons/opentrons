import { vi, it, describe, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { when } from 'vitest-when'

import {
  useProtocolQuery,
  useProtocolAnalysisAsDocumentQuery,
} from '@opentrons/react-api-client'

import { useRunTimeParameters } from '../useRunTimeParameters'
import { PROTOCOL_ID, PROTOCOL_ANALYSIS, MOCK_RTP_DATA } from '../__fixtures__'

import type { UseQueryResult } from 'react-query'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { Protocol } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client')

describe('useRunTimeParameters', () => {
  beforeEach(() => {
    when(vi.mocked(useProtocolQuery))
      .calledWith(PROTOCOL_ID)
      .thenReturn({
        data: {
          data: { analysisSummaries: [{ id: PROTOCOL_ANALYSIS.id } as any] },
        },
      } as UseQueryResult<Protocol>)
    when(vi.mocked(useProtocolAnalysisAsDocumentQuery))
      .calledWith(PROTOCOL_ID, PROTOCOL_ANALYSIS.id, { enabled: true })
      .thenReturn({
        data: PROTOCOL_ANALYSIS,
      } as UseQueryResult<CompletedProtocolAnalysis>)
  })
  it('return RTP', () => {
    const { result } = renderHook(() => useRunTimeParameters(PROTOCOL_ID))
    expect(result.current).toBe(MOCK_RTP_DATA)
  })
})
