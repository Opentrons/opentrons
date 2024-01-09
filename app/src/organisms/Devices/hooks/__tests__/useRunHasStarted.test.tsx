import { renderHook } from '@testing-library/react'
import { when, resetAllWhenMocks } from 'jest-when'

import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'

import { useRunStatus } from '../../../../organisms/RunTimeControl/hooks'
import { useRunHasStarted } from '../useRunHasStarted'

jest.mock('../../../../organisms/RunTimeControl/hooks')

const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>

const MOCK_RUN_ID = '1'

describe('useRunHasStarted', () => {
  beforeEach(() => {
    when(mockUseRunStatus).calledWith(null).mockReturnValue(null)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return false when no run id is provided', () => {
    const { result } = renderHook(() => useRunHasStarted(null))
    expect(result.current).toEqual(false)
  })

  it('should return false when run has not started', () => {
    when(mockUseRunStatus)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue(RUN_STATUS_IDLE)
    const { result } = renderHook(() => useRunHasStarted(MOCK_RUN_ID))
    expect(result.current).toEqual(false)
  })

  it('should return true when run has started', () => {
    when(mockUseRunStatus)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue(RUN_STATUS_RUNNING)
    const { result } = renderHook(() => useRunHasStarted(MOCK_RUN_ID))
    expect(result.current).toEqual(true)
  })
})
