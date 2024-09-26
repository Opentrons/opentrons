// tests for the useHealth hooks
import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'

import { getHealth } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useHealth } from '..'

import type { HostConfig, Response, Health } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const HEALTH_RESPONSE: Health = { name: 'robot-name' } as Health

describe('useHealth hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{
      children: React.ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  it('should return no data if no host', () => {
    vi.mocked(useHost).mockReturnValue(null)

    const { result } = renderHook(useHealth, { wrapper })

    expect(result.current).toBeUndefined()
  })

  it('should return no data if health request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getHealth).mockRejectedValue('oh no')

    const { result } = renderHook(useHealth, { wrapper })

    expect(result.current).toBeUndefined()
  })

  it('should return health response data', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getHealth).mockResolvedValue({
      data: HEALTH_RESPONSE,
    } as Response<Health>)

    const { result } = renderHook(() => useHealth(), { wrapper })

    await waitFor(() => expect(result.current).toEqual(HEALTH_RESPONSE))
  })
})
