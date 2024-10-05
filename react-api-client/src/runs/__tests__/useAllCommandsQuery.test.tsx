import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getCommands } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useAllCommandsQuery } from '../useAllCommandsQuery'
import { mockCommandsResponse } from '../__fixtures__'

import type { HostConfig, Response, CommandsData } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const RUN_ID = 'run_id'

describe('useAllCommandsQuery hook', () => {
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

    const { result } = renderHook(() => useAllCommandsQuery(RUN_ID), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get commands request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getCommands).mockRejectedValue('oh no')

    const { result } = renderHook(() => useAllCommandsQuery(RUN_ID), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should return all commands for a given run', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getCommands).mockResolvedValue({
      data: mockCommandsResponse,
    } as Response<CommandsData>)

    const { result } = renderHook(() => useAllCommandsQuery(RUN_ID), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockCommandsResponse)
    })
  })
})
