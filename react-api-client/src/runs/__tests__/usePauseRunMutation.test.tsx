import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createRunAction } from '@opentrons/api-client'

import { usePauseRunMutation } from '..'
import { mockPauseRunAction, RUN_ID_1 } from '../__fixtures__'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '../../accessControl/__fixtures__/documentationState'
import { useHost } from '../../api'

import type * as React from 'react'
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

    const { result } = renderHook(
      () => usePauseRunMutation(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE),
      {
        wrapper,
      }
    )

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

    const { result } = renderHook(
      () => usePauseRunMutation(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE),
      {
        wrapper,
      }
    )
    act(() => result.current.pauseRun(RUN_ID_1))

    await waitFor(() => {
      expect(result.current.data).toEqual(mockPauseRunAction)
    })
  })
})
