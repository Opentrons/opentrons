import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { postWifiConfigure } from '@opentrons/api-client'

import { usePostWifiConfigureMutation } from '..'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '../../accessControl/__fixtures__/documentationState'
import { useHost } from '../../api'
import { networkingStatusQueryKey } from '../useNetworkingStatusQuery'
import { wifiQueryKey } from '../useWifiQuery'

import type * as React from 'react'
import type {
  HostConfig,
  Response,
  WifiConfigureRequest,
  WifiConfigureResponse,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const WIFI_CONFIGURE_REQUEST: WifiConfigureRequest = {
  ssid: 'network-name',
  psk: 'password',
  securityType: 'wpa-psk',
  hidden: false,
}
const WIFI_CONFIGURE_RESPONSE: WifiConfigureResponse = {
  ssid: 'network-name',
  message: 'connected',
}

describe('usePostWifiConfigureMutation hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{
      children: React.ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })

  it('should return no data if no host', () => {
    vi.mocked(useHost).mockReturnValue(null)

    const { result } = renderHook(
      () =>
        usePostWifiConfigureMutation(
          ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
        ),
      {
        wrapper,
      }
    )

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the wifi configure request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(postWifiConfigure).mockRejectedValue('oh no')

    const { result } = renderHook(
      () =>
        usePostWifiConfigureMutation(
          ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
        ),
      {
        wrapper,
      }
    )
    expect(result.current.data).toBeUndefined()
  })

  it('should configure wifi and invalidate networking queries when calling postWifiConfigure', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(postWifiConfigure).mockResolvedValue({
      data: WIFI_CONFIGURE_RESPONSE,
    } as Response<WifiConfigureResponse>)
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(
      () =>
        usePostWifiConfigureMutation(
          ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
        ),
      {
        wrapper,
      }
    )
    act(() => {
      result.current.postWifiConfigure(WIFI_CONFIGURE_REQUEST)
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(WIFI_CONFIGURE_RESPONSE)
    })
    expect(postWifiConfigure).toHaveBeenCalledWith(
      HOST_CONFIG,
      WIFI_CONFIGURE_REQUEST,
      expect.any(String)
    )
    expect(invalidateQueries).toHaveBeenCalledWith(
      networkingStatusQueryKey(HOST_CONFIG)
    )
    expect(invalidateQueries).toHaveBeenCalledWith(wifiQueryKey(HOST_CONFIG))
  })
})
