import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'

import { getDiscoverableRobotByName } from '../../../../redux/discovery'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../../redux/discovery/__fixtures__'

import { useIsRobotViewable } from '..'

jest.mock('../../../../redux/discovery')

const mockGetDiscoverableRobotByName = getDiscoverableRobotByName as jest.MockedFunction<
  typeof getDiscoverableRobotByName
>

const store: Store<any> = createStore(jest.fn(), {})

describe('useIsRobotViewable hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
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

  it('returns false when given an unreachable robot name', () => {
    when(mockGetDiscoverableRobotByName)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(mockUnreachableRobot)

    const { result } = renderHook(() => useIsRobotViewable('otie'), { wrapper })

    expect(result.current).toEqual(false)
  })

  it('returns false when given a reachable robot name', () => {
    when(mockGetDiscoverableRobotByName)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(mockReachableRobot)

    const { result } = renderHook(() => useIsRobotViewable('otie'), {
      wrapper,
    })

    expect(result.current).toEqual(false)
  })

  it('returns true when given a connectable robot name', () => {
    when(mockGetDiscoverableRobotByName)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(mockConnectableRobot)

    const { result } = renderHook(() => useIsRobotViewable('otie'), {
      wrapper,
    })

    expect(result.current).toEqual(true)
  })
})
