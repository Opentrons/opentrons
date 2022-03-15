import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from 'react-query'

import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'

import { useCurrentRunStatus } from '../../../RunTimeControl/hooks'

import { useIsProtocolRunning } from '..'

jest.mock('../../../../organisms/RunTimeControl/hooks')
jest.mock('../../../../redux/robot-controls')

const mockUseCurrentRunStatus = useCurrentRunStatus as jest.MockedFunction<
  typeof useCurrentRunStatus
>

const store: Store<any> = createStore(jest.fn(), {})

describe('useIsProtocolRunning hook', () => {
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns false when current run record does not exist', () => {
    when(mockUseCurrentRunStatus).calledWith().mockReturnValue(null)

    const { result } = renderHook(() => useIsProtocolRunning(), { wrapper })

    expect(result.current).toEqual(false)
  })

  it('returns false when current run record is idle', () => {
    when(mockUseCurrentRunStatus).calledWith().mockReturnValue(RUN_STATUS_IDLE)

    const { result } = renderHook(() => useIsProtocolRunning(), { wrapper })

    expect(result.current).toEqual(false)
  })

  it('returns true when current run record is not idle', () => {
    when(mockUseCurrentRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_RUNNING)

    const { result } = renderHook(() => useIsProtocolRunning(), {
      wrapper,
    })

    expect(result.current).toEqual(true)
  })
})
