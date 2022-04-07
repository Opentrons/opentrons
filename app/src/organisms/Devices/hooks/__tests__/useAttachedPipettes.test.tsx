import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from 'react-query'

import { fetchPipettes, getAttachedPipettes } from '../../../../redux/pipettes'
import {
  mockLeftProtoPipette,
  mockRightProtoPipette,
} from '../../../../redux/pipettes/__fixtures__'
import { useDispatchApiRequest } from '../../../../redux/robot-api'
import { useRobot } from '../useRobot'
import { useAttachedPipettes } from '..'

import type { DiscoveredRobot } from '../../../../redux/discovery/types'
import type { DispatchApiRequestType } from '../../../../redux/robot-api'

jest.mock('../../../../redux/pipettes')
jest.mock('../../../../redux/robot-api')
jest.mock('../useRobot')

const mockFetchPipettes = fetchPipettes as jest.MockedFunction<
  typeof fetchPipettes
>
const mockGetAttachedPipettes = getAttachedPipettes as jest.MockedFunction<
  typeof getAttachedPipettes
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>

const store: Store<any> = createStore(jest.fn(), {})

const ROBOT_NAME = 'otie'

describe('useAttachedPipettes hook', () => {
  let dispatchApiRequest: DispatchApiRequestType
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    dispatchApiRequest = jest.fn()
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, []])
    when(mockUseRobot)
      .calledWith(ROBOT_NAME)
      .mockReturnValue(({ status: 'chill' } as unknown) as DiscoveredRobot)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns no pipettes when given a null robot name', () => {
    when(mockGetAttachedPipettes)
      .calledWith(undefined as any, null)
      .mockReturnValue({ left: null, right: null })

    const { result } = renderHook(() => useAttachedPipettes(null), { wrapper })

    expect(result.current).toEqual({ left: null, right: null })
    expect(dispatchApiRequest).not.toBeCalled()
  })

  it('returns attached pipettes when given a robot name', () => {
    when(mockGetAttachedPipettes)
      .calledWith(undefined as any, ROBOT_NAME)
      .mockReturnValue({
        left: mockLeftProtoPipette,
        right: mockRightProtoPipette,
      })

    const { result } = renderHook(() => useAttachedPipettes(ROBOT_NAME), {
      wrapper,
    })

    expect(result.current).toEqual({
      left: mockLeftProtoPipette,
      right: mockRightProtoPipette,
    })
    expect(dispatchApiRequest).toBeCalledWith(mockFetchPipettes(ROBOT_NAME))
  })
})
