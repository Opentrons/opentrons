// tests for the useLights hooks
import type * as React from 'react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'

import { getLights } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useLightsQuery } from '..'

import type { HostConfig, Response, Lights } from '@opentrons/api-client'
import type { UseLightsQueryOptions } from '../useLightsQuery'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const LIGHTS_RESPONSE: Lights = { on: true } as Lights

describe('useLights hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & UseLightsQueryOptions
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & UseLightsQueryOptions
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

    const { result } = renderHook(() => useLightsQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return no data if lights request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getLights).mockRejectedValue('oh no')

    const { result } = renderHook(() => useLightsQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return lights response data', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getLights).mockResolvedValue({
      data: LIGHTS_RESPONSE,
    } as Response<Lights>)

    const { result } = renderHook(() => useLightsQuery(), { wrapper })

    await waitFor(() => {
      expect(result.current?.data).toEqual(LIGHTS_RESPONSE)
    })
  })
})
