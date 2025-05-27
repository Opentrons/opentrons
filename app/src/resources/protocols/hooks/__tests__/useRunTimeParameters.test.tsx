import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'

import { MOCK_RTP_DATA, PROTOCOL_ANALYSIS, PROTOCOL_ID } from '../__fixtures__'
import { useRunTimeParameters } from '../useRunTimeParameters'

import type { UseQueryResult } from 'react-query'
import type { Protocol } from '@opentrons/api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

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
