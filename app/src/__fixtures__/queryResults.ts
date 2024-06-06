import { vi } from 'vitest'
import type { UseQueryResult } from 'react-query'

export function mockSuccessQueryResults<Result>(
  data: Result
): UseQueryResult<Result, any> {
  return {
    data,
    error: null,
    isError: false,
    isLoadingError: false,
    isIdle: false,
    isLoading: false,
    isRefetchError: false,
    isRefetching: false,
    isSuccess: true,
    status: 'success',
    isFetched: true,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    isFetching: false,
    isFetchedAfterMount: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isStale: false,
    refetch: vi.fn(),
    remove: vi.fn(),
  }
}
