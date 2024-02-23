import { renderHook } from '@testing-library/react'
import { when, resetAllWhenMocks } from 'jest-when'

import { mockIdleUnstartedRun } from '../../../../organisms/RunTimeControl/__fixtures__'
import { formatTimestamp } from '../../utils'
import { useRunCreatedAtTimestamp } from '../useRunCreatedAtTimestamp'
import { useNotifyRunQuery } from '../../../../resources/runs/useNotifyRunQuery'

import type { UseQueryResult } from 'react-query'
import type { Run } from '@opentrons/api-client'

jest.mock('../../../../resources/runs/useNotifyRunQuery')
jest.mock('../../utils')

const mockUseNotifyRunQuery = useNotifyRunQuery as jest.MockedFunction<
  typeof useNotifyRunQuery
>
const mockFormatTimestamp = formatTimestamp as jest.MockedFunction<
  typeof formatTimestamp
>

const MOCK_RUN_ID = '1'

describe('useRunCreatedAtTimestamp', () => {
  beforeEach(() => {
    when(mockUseNotifyRunQuery)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue({
        data: { data: mockIdleUnstartedRun },
      } as UseQueryResult<Run>)
    when(mockFormatTimestamp)
      .calledWith(mockIdleUnstartedRun.createdAt)
      .mockReturnValue('this is formatted')
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return a created at timestamp for a run', () => {
    const { result } = renderHook(() => useRunCreatedAtTimestamp(MOCK_RUN_ID))
    expect(result.current).toEqual('this is formatted')
  })
})
