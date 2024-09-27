import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createRun } from '@opentrons/api-client'
import { useHost } from '../../api'
import { PROTOCOL_ID, mockRunResponse } from '../__fixtures__'
import { useCreateRunMutation } from '..'

import type {
  HostConfig,
  Response,
  Run,
  CreateRunData,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useCreateRunMutation hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  let createRunData = {} as CreateRunData

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{
      children: React.ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    createRunData = {}

    wrapper = clientProvider
  })

  it('should return no data when calling createRun if the request fails', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createRun).mockRejectedValue('oh no')

    const { result } = renderHook(() => useCreateRunMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    result.current.createRun({})
    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should create a run when calling the createRun callback with basic run args', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createRun).mockResolvedValue({
      data: mockRunResponse,
    } as Response<Run>)

    const { result } = renderHook(() => useCreateRunMutation(), {
      wrapper,
    })
    act(() => result.current.createRun(createRunData))

    await waitFor(() => {
      expect(result.current.data).toEqual(mockRunResponse)
    })
  })

  it('should create a protocol run when calling the createRun callback with protocol run args', async () => {
    createRunData = { protocolId: PROTOCOL_ID }
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createRun).mockResolvedValue({
      data: mockRunResponse,
    } as Response<Run>)

    const { result } = renderHook(() => useCreateRunMutation(), {
      wrapper,
    })
    act(() => result.current.createRun(createRunData))

    await waitFor(() => {
      expect(result.current.data).toEqual(mockRunResponse)
    })
  })
})
