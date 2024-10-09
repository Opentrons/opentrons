import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createRunAction } from '@opentrons/api-client'
import { useHost } from '../../api'
import { usePlayRunMutation } from '..'

import { RUN_ID_1, mockPlayRunAction } from '../__fixtures__'

import type { HostConfig, Response, RunAction } from '@opentrons/api-client'
import type { UsePlayRunMutationOptions } from '../usePlayRunMutation'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('usePlayRunMutation hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & UsePlayRunMutationOptions
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & UsePlayRunMutationOptions
    > = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })

  it('should return no data when calling playRun if the request fails', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createRunAction).mockRejectedValue('oh no')

    const { result } = renderHook(usePlayRunMutation, {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    act(() => result.current.playRun(RUN_ID_1))
    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should create a play run action when calling the playRun callback', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createRunAction).mockResolvedValue({
      data: mockPlayRunAction,
    } as Response<RunAction>)

    const { result } = renderHook(usePlayRunMutation, {
      wrapper,
    })
    act(() => result.current.playRun(RUN_ID_1))

    await waitFor(() => {
      expect(result.current.data).toEqual(mockPlayRunAction)
    })
  })
})
