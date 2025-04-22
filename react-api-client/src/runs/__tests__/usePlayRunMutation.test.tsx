import { QueryClient, QueryClientProvider } from 'react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRunAction } from '@opentrons/api-client'
import { act, renderHook, waitFor } from '@testing-library/react'

import { usePlayRunMutation } from '..'
import { mockPlayRunAction, RUN_ID_1 } from '../__fixtures__'
import { useHost } from '../../api'

import type { UsePlayRunMutationOptions } from '../usePlayRunMutation'
import type { HostConfig, Response, RunAction } from '@opentrons/api-client'
import type * as React from 'react'

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
