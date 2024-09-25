import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'

import { getDoorStatus } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useDoorQuery } from '..'

import type { HostConfig, Response, DoorStatus } from '@opentrons/api-client'
import type { UseDoorQueryOptions } from '../useDoorQuery'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const DOOR_RESPONSE: DoorStatus = {
  data: { status: 'open', doorRequiredClosedForProtocol: true },
} as DoorStatus

describe('useDoorQuery hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & UseDoorQueryOptions
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & UseDoorQueryOptions
    > = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  it('should return no data if no host', () => {
    vi.mocked(useHost).mockReturnValue(null)

    const { result } = renderHook(() => useDoorQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return no data if lights request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getDoorStatus).mockRejectedValue('oh no')

    const { result } = renderHook(() => useDoorQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return lights response data', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getDoorStatus).mockResolvedValue({
      data: DOOR_RESPONSE,
    } as Response<DoorStatus>)

    const { result } = renderHook(() => useDoorQuery(), { wrapper })

    await waitFor(() => {
      expect(result.current?.data).toEqual(DOOR_RESPONSE)
    })
  })
})
