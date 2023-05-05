import type { Run } from '@opentrons/api-client'
import { useRunQuery } from '@opentrons/react-api-client'
import { renderHook } from '@testing-library/react-hooks'
import { when, resetAllWhenMocks } from 'jest-when'
import type { UseQueryResult } from 'react-query'

import { mockIdleUnstartedRun } from '../../../../organisms/RunTimeControl/__fixtures__'
import { formatTimestamp } from '../../utils'
import { useRunCreatedAtTimestamp } from '../useRunCreatedAtTimestamp'

jest.mock('@opentrons/react-api-client')
jest.mock('../../utils')

const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockFormatTimestamp = formatTimestamp as jest.MockedFunction<
  typeof formatTimestamp
>

const MOCK_RUN_ID = '1'

describe('useRunCreatedAtTimestamp', () => {
  beforeEach(() => {
    when(mockUseRunQuery)
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
