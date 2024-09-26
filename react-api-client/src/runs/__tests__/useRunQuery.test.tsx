import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getRun } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useRunQuery } from '..'

import type { HostConfig, Response, Run } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const RUN_ID = '1'
const RUN_RESPONSE = { data: { id: RUN_ID } } as Run

describe('useRunQuery hook', () => {
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

    const { result } = renderHook(() => useRunQuery(RUN_ID), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get runs request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getRun).mockRejectedValue('oh no')

    const { result } = renderHook(() => useRunQuery(RUN_ID), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should return a run', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getRun).mockResolvedValue({ data: RUN_RESPONSE } as Response<Run>)

    const { result } = renderHook(() => useRunQuery(RUN_ID), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(RUN_RESPONSE)
    })
  })
})
