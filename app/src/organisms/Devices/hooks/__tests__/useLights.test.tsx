import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import {
  useLightsQuery,
  useSetLightsMutation,
} from '@opentrons/react-api-client'

import { useLights } from '..'

jest.mock('@opentrons/react-api-client')

const mockUseLightsQuery = useLightsQuery as jest.MockedFunction<
  typeof useLightsQuery
>
const mockUseSetLightsMutation = useSetLightsMutation as jest.MockedFunction<
  typeof useSetLightsMutation
>

const store: Store<any> = createStore(jest.fn(), {})

describe('useLights hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  let setLights: jest.Mock

  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    mockUseLightsQuery.mockReturnValue({ data: { on: false } } as any)
    setLights = jest.fn()
    mockUseSetLightsMutation.mockReturnValue({ setLights } as any)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('toggles lights off when on', () => {
    mockUseLightsQuery.mockReturnValue({ data: { on: true } } as any)

    const { result } = renderHook(() => useLights(), { wrapper })

    expect(result.current.lightsOn).toEqual(true)
    result.current.toggleLights()
    expect(setLights).toBeCalledWith({ on: false })
  })

  it('toggles lights on when off', () => {
    mockUseLightsQuery.mockReturnValue({ data: { on: false } } as any)

    const { result } = renderHook(() => useLights(), {
      wrapper,
    })

    expect(result.current.lightsOn).toEqual(false)
    result.current.toggleLights()
    expect(setLights).toBeCalledWith({ on: true })
  })
})
