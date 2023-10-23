import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from 'react-query'

import { getRobotModelByName } from '../../../../redux/discovery'

import { useIsFlex } from '..'

jest.mock('../../../../redux/discovery/selectors')

const mockGetRobotModelByName = getRobotModelByName as jest.MockedFunction<
  typeof getRobotModelByName
>

const store: Store<any> = createStore(jest.fn(), {})

describe('useIsFlex hook', () => {
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

  it('returns false when given a robot name that does not have a discoverable model', () => {
    when(mockGetRobotModelByName)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(null)

    const { result } = renderHook(() => useIsFlex('otie'), { wrapper })

    expect(result.current).toEqual(false)
  })

  it('returns true when given a discoverable OT-3 robot name with a model', () => {
    when(mockGetRobotModelByName)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue('OT-3 Classic')

    const { result } = renderHook(() => useIsFlex('otie'), {
      wrapper,
    })

    expect(result.current).toEqual(true)
  })
  it('returns true when given a discoverable OT-3 robot name with an Opentrons Flex model', () => {
    when(mockGetRobotModelByName)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue('Opentrons Flex')

    const { result } = renderHook(() => useIsFlex('otie'), {
      wrapper,
    })

    expect(result.current).toEqual(true)
  })
})
