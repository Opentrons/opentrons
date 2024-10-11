import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getCommand } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useCommandQuery } from '..'

import type { CommandDetail, HostConfig, Response } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const RUN_ID = '1'
const COMMAND_ID = '2'
const COMMAND_RESPONSE = {
  data: { id: COMMAND_ID } as any,
  links: null,
} as CommandDetail

describe('useCommandQuery hook', () => {
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

    const { result } = renderHook(() => useCommandQuery(RUN_ID, COMMAND_ID), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get runs request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getCommand).mockRejectedValue('oh no')

    const { result } = renderHook(() => useCommandQuery(RUN_ID, COMMAND_ID), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should return a command', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getCommand).mockResolvedValue({
      data: COMMAND_RESPONSE,
    } as Response<CommandDetail>)

    const { result } = renderHook(() => useCommandQuery(RUN_ID, COMMAND_ID), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(COMMAND_RESPONSE)
    })
  })
})
