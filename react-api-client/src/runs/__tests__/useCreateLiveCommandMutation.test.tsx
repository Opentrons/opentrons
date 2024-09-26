import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createLiveCommand } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useCreateLiveCommandMutation } from '../useCreateLiveCommandMutation'

import { mockAnonLoadCommand } from '../__fixtures__'

import type { HostConfig } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useCreateLiveCommandMutation hook', () => {
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

  it('should issue the given live command when callback is called', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createLiveCommand).mockResolvedValue({ data: 'something' } as any)

    const { result } = renderHook(() => useCreateLiveCommandMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    act(() => {
      result.current.createLiveCommand({
        command: mockAnonLoadCommand,
      })
    })
    await waitFor(() => {
      expect(result.current.data).toBe('something')
    })
  })
  it('should pass waitUntilComplete and timeout through if given command', async () => {
    const waitUntilComplete = true
    const timeout = 2000
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createLiveCommand).mockResolvedValue({ data: 'something' } as any)

    const { result } = renderHook(() => useCreateLiveCommandMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    act(() => {
      result.current.createLiveCommand({
        command: mockAnonLoadCommand,
        waitUntilComplete,
        timeout,
      })
    })
    await waitFor(() => {
      expect(result.current.data).toBe('something')
    })
  })
})
