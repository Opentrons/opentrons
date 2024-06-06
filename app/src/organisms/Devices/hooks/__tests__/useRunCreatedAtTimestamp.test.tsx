import { renderHook } from '@testing-library/react'
import { vi, it, expect, describe, beforeEach } from 'vitest'
import { when } from 'vitest-when'

import { mockIdleUnstartedRun } from '../../../RunTimeControl/__fixtures__'
import { formatTimestamp } from '../../utils'
import { useRunCreatedAtTimestamp } from '../useRunCreatedAtTimestamp'
import { useNotifyRunQuery } from '../../../../resources/runs'

import type { UseQueryResult } from 'react-query'
import type { Run } from '@opentrons/api-client'

vi.mock('../../../../resources/runs')
vi.mock('../../utils')

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
