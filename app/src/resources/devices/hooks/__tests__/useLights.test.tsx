import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useLightsQuery,
  useSetLightsMutation,
} from '@opentrons/react-api-client'

import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'

import { useLights } from '../useLights'

import type { Store } from 'redux'
import type { Mock } from 'vitest'
import type { FunctionComponent, ReactNode } from 'react'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const store: Store<any> = legacy_createStore(vi.fn(), {})

describe('useLights hook', () => {
  let wrapper: FunctionComponent<{ children: ReactNode }>
  let setLights: Mock

  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    vi.mocked(useLightsQuery).mockReturnValue({ data: { on: false } } as any)
    setLights = vi.fn()
    vi.mocked(useSetLightsMutation).mockReturnValue({ setLights } as any)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('toggles lights off when on', () => {
    vi.mocked(useLightsQuery).mockReturnValue({ data: { on: true } } as any)

    const { result } = renderHook(() => useLights(), { wrapper })

    expect(result.current.lightsOn).toEqual(true)
    expect(useSetLightsMutation).toHaveBeenCalledWith(
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
    )
    result.current.toggleLights()
    expect(setLights).toBeCalledWith({ on: false })
  })

  it('toggles lights on when off', () => {
    vi.mocked(useLightsQuery).mockReturnValue({ data: { on: false } } as any)

    const { result } = renderHook(() => useLights(), {
      wrapper,
    })

    expect(result.current.lightsOn).toEqual(false)
    expect(useSetLightsMutation).toHaveBeenCalledWith(
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
    )
    result.current.toggleLights()
    expect(setLights).toBeCalledWith({ on: true })
  })
})
