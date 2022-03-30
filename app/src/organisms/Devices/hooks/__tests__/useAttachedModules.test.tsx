import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from 'react-query'

import { fetchModules, getAttachedModules } from '../../../../redux/modules'
import { mockFetchModulesSuccessActionPayloadModules } from '../../../../redux/modules/__fixtures__'
import { useDispatchApiRequest } from '../../../../redux/robot-api'

import type { DispatchApiRequestType } from '../../../../redux/robot-api'

import { useAttachedModules } from '..'

jest.mock('../../../../redux/modules')
jest.mock('../../../../redux/robot-api')

const mockFetchModules = fetchModules as jest.MockedFunction<
  typeof fetchModules
>
const mockGetAttachedModules = getAttachedModules as jest.MockedFunction<
  typeof getAttachedModules
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>

const store: Store<any> = createStore(jest.fn(), {})

describe('useAttachedModules hook', () => {
  let dispatchApiRequest: DispatchApiRequestType
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
    dispatchApiRequest = jest.fn()
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, []])
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns no modules when given a null robot name', () => {
    when(mockGetAttachedModules)
      .calledWith(undefined as any, null)
      .mockReturnValue([])

    const { result } = renderHook(() => useAttachedModules(null), { wrapper })

    expect(result.current).toEqual([])
    expect(dispatchApiRequest).not.toBeCalled()
  })

  it('returns attached modules when given a robot name', () => {
    when(mockGetAttachedModules)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(mockFetchModulesSuccessActionPayloadModules)

    const { result } = renderHook(() => useAttachedModules('otie'), { wrapper })

    expect(result.current).toEqual(mockFetchModulesSuccessActionPayloadModules)
    expect(dispatchApiRequest).toBeCalledWith(mockFetchModules('otie'))
  })
})
