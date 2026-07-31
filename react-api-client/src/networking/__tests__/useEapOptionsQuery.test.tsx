import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getEapOptions } from '@opentrons/api-client'

import { useEapOptionsQuery } from '..'
import { useHost } from '../../api'

import type * as React from 'react'
import type {
  EapOptionsResponse,
  HostConfig,
  Response,
} from '@opentrons/api-client'
import type { UseEapOptionsQueryOptions } from '../useEapOptionsQuery'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const EAP_OPTIONS_RESPONSE: EapOptionsResponse = {
  options: [
    {
      name: 'peap/mschapv2',
      displayName: 'PEAP/MSCHAPv2',
      options: [
        {
          name: 'identity',
          displayName: 'Username',
          required: true,
          type: 'string',
        },
      ],
    },
  ],
}

describe('useEapOptionsQuery hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & UseEapOptionsQueryOptions
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & UseEapOptionsQueryOptions
    > = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return no data if no host', () => {
    vi.mocked(useHost).mockReturnValue(null)

    const { result } = renderHook(() => useEapOptionsQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return no data if eap options request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getEapOptions).mockRejectedValue('oh no')

    const { result } = renderHook(() => useEapOptionsQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return eap options response data', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getEapOptions).mockResolvedValue({
      data: EAP_OPTIONS_RESPONSE,
    } as Response<EapOptionsResponse>)

    const { result } = renderHook(() => useEapOptionsQuery(), { wrapper })

    await waitFor(() => {
      expect(result.current?.data).toEqual(EAP_OPTIONS_RESPONSE)
    })
  })
})
