import { vi, it, expect, describe, beforeEach } from 'vitest'
import { when } from 'vitest-when'
import { renderHook } from '@testing-library/react'
import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'
import { useProtocolDetailsForRun } from '..'
import { useNotifyRunQuery } from '../useNotifyRunQuery'
import { RUN_ID_2 } from '../__fixtures__'

import type { Protocol, Run } from '@opentrons/api-client'
import type { UseQueryResult } from 'react-query'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

vi.mock('@opentrons/react-api-client')
vi.mock('../useNotifyRunQuery')

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
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(null, { staleTime: Infinity })
      .thenReturn({} as UseQueryResult<Run>)
    when(vi.mocked(useProtocolQuery))
      .calledWith(null, { staleTime: Infinity })
      .thenReturn({} as UseQueryResult<Protocol>)
    when(vi.mocked(useProtocolAnalysisAsDocumentQuery))
      .calledWith(null, null, { enabled: false, refetchInterval: 5000 })
      .thenReturn({
        data: null,
      } as UseQueryResult<CompletedProtocolAnalysis | null>)
  })

  it('returns null when given a null run id', async () => {
    const { result } = renderHook(() => useProtocolDetailsForRun(null))
    expect(result.current).toStrictEqual({
      displayName: null,
      protocolData: null,
      protocolKey: null,
      isProtocolAnalyzing: false,
      robotType: 'OT-3 Standard',
      isQuickTransfer: false,
    })
  })

  it('returns the protocol file when given a run id', async () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID_2, { staleTime: Infinity })
      .thenReturn({
        data: { data: { protocolId: PROTOCOL_ID } } as any,
      } as UseQueryResult<Run>)
    when(vi.mocked(useProtocolQuery))
      .calledWith(PROTOCOL_ID, { staleTime: Infinity })
      .thenReturn({ data: PROTOCOL_RESPONSE } as UseQueryResult<Protocol>)
    when(vi.mocked(useProtocolAnalysisAsDocumentQuery))
      .calledWith(PROTOCOL_ID, 'fake analysis', {
        enabled: true,
        refetchInterval: 5000,
      })
      .thenReturn({
        data: PROTOCOL_ANALYSIS,
      } as UseQueryResult<CompletedProtocolAnalysis | null>)
    when(vi.mocked(useProtocolAnalysisAsDocumentQuery))
      .calledWith(PROTOCOL_ID, 'fake analysis', {
        enabled: false,
        refetchInterval: 5000,
      })
      .thenReturn({
        data: PROTOCOL_ANALYSIS,
      } as UseQueryResult<CompletedProtocolAnalysis | null>)

    const { result } = renderHook(() => useProtocolDetailsForRun(RUN_ID_2))

    expect(result.current).toStrictEqual({
      displayName: 'fake protocol',
      protocolData: { id: 'fake analysis', status: 'completed', labware: [] },
      protocolKey: 'fakeProtocolKey',
      isProtocolAnalyzing: false,
      robotType: 'OT-2 Standard',
      isQuickTransfer: false,
    })
  })
})
