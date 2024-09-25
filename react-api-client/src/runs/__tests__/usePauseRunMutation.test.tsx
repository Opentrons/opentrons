import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createRunAction } from '@opentrons/api-client'
import { useHost } from '../../api'
import { usePauseRunMutation } from '..'

import { RUN_ID_1, mockPauseRunAction } from '../__fixtures__'

import type { HostConfig, Response, RunAction } from '@opentrons/api-client'
import type { UsePauseRunMutationOptions } from '../usePauseRunMutation'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('usePauseRunMutation hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & UsePauseRunMutationOptions
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & UsePauseRunMutationOptions
    > = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })

  it('should return no data when calling pauseRun if the request fails', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createRunAction).mockRejectedValue('uh oh')

    const { result } = renderHook(usePauseRunMutation, {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    act(() => result.current.pauseRun(RUN_ID_1))
    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should create a pause run action when calling the pauseRun callback', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createRunAction).mockResolvedValue({
      data: mockPauseRunAction,
    } as Response<RunAction>)

    const { result } = renderHook(usePauseRunMutation, {
      wrapper,
    })
    act(() => result.current.pauseRun(RUN_ID_1))

    await waitFor(() => {
      expect(result.current.data).toEqual(mockPauseRunAction)
    })
  })
})
