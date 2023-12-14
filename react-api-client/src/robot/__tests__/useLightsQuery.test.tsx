// tests for the useLights hooks
import * as React from 'react'
import { when } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'

import { getLights as mockGetLights } from '@opentrons/api-client'
import { useHost as mockUseHost } from '../../api'
import { useLightsQuery } from '..'

import type { HostConfig, Response, Lights } from '@opentrons/api-client'
import type { UseLightsQueryOptions } from '../useLightsQuery'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const getLights = mockGetLights as jest.MockedFunction<typeof mockGetLights>
const useHost = mockUseHost as jest.MockedFunction<typeof mockUseHost>

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
    jest.resetAllMocks()
  })

  it('should return no data if no host', () => {
    when(useHost).calledWith().mockReturnValue(null)

    const { result } = renderHook(() => useLightsQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return no data if lights request fails', () => {
    when(useHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(getLights).calledWith(HOST_CONFIG).mockRejectedValue('oh no')

    const { result } = renderHook(() => useLightsQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return lights response data', async () => {
    when(useHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(getLights)
      .calledWith(HOST_CONFIG)
      .mockResolvedValue({ data: LIGHTS_RESPONSE } as Response<Lights>)

    const { result } = renderHook(() => useLightsQuery(), { wrapper })

    await waitFor(() => {
      expect(result.current?.data).toEqual(LIGHTS_RESPONSE)
    })
  })
})
