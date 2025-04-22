import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'
import { renderHook } from '@testing-library/react'

import { mockIdleUnstartedRun } from '/app/resources/runs/__fixtures__'
import { formatTimestamp } from '/app/transformations/runs'

import { useNotifyRunQuery } from '../useNotifyRunQuery'
import { useRunCreatedAtTimestamp } from '../useRunCreatedAtTimestamp'

import type { Run } from '@opentrons/api-client'
import type { UseQueryResult } from 'react-query'

vi.mock('../useNotifyRunQuery')
vi.mock('/app/transformations/runs')

const MOCK_RUN_ID = '1'

describe('useRunCreatedAtTimestamp', () => {
  beforeEach(() => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(MOCK_RUN_ID)
      .thenReturn({
        data: { data: mockIdleUnstartedRun },
      } as UseQueryResult<Run>)
    when(vi.mocked(formatTimestamp))
      .calledWith(mockIdleUnstartedRun.createdAt)
      .thenReturn('this is formatted')
  })

  it('should return a created at timestamp for a run', () => {
    const { result } = renderHook(() => useRunCreatedAtTimestamp(MOCK_RUN_ID))
    expect(result.current).toEqual('this is formatted')
  })
})
