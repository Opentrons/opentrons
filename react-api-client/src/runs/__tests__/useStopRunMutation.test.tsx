import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createRunAction } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useStopRunMutation } from '..'

import { RUN_ID_1, mockStopRunAction } from '../__fixtures__'

import type { HostConfig, Response, RunAction } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useStopRunMutation hook', () => {
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

  it('should return no data when calling stopRun if the request fails', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createRunAction).mockRejectedValue('oops')

    const { result } = renderHook(() => useStopRunMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    result.current.stopRun(RUN_ID_1)
    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should create a stop run action when calling the stopRun callback', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createRunAction).mockResolvedValue({
      data: mockStopRunAction,
    } as Response<RunAction>)

    const { result } = renderHook(() => useStopRunMutation(), {
      wrapper,
    })
    act(() => result.current.stopRun(RUN_ID_1))

    await waitFor(() => {
      expect(result.current.data).toEqual(mockStopRunAction)
    })
  })
})
