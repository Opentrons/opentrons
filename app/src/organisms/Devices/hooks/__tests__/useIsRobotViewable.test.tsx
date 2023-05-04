import { useIsRobotViewable } from '..'
import { getDiscoverableRobotByName } from '../../../../redux/discovery'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../../redux/discovery/__fixtures__'
import { renderHook } from '@testing-library/react-hooks'
import { when, resetAllWhenMocks } from 'jest-when'
import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'

jest.mock('../../../../redux/discovery')

const mockGetDiscoverableRobotByName = getDiscoverableRobotByName as jest.MockedFunction<
  typeof getDiscoverableRobotByName
>

const store: Store<any> = createStore(jest.fn(), {})

describe('useIsRobotViewable hook', () => {
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
