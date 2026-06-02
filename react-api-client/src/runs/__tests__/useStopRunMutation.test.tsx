import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createRunAction } from '@opentrons/api-client'

import { useStopRunMutation } from '..'
import { mockStopRunAction, RUN_ID_1 } from '../__fixtures__'
import { useHost } from '../../api'

import type * as React from 'react'
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

    const { result } = renderHook(
      () => useStopRunMutation({ reasonForInteractionRequired: false }),
      {
        wrapper,
      }
    )

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

    const { result } = renderHook(
      () => useStopRunMutation({ reasonForInteractionRequired: false }),
      {
        wrapper,
      }
    )
    act(() => result.current.stopRun(RUN_ID_1))

    await waitFor(() => {
      expect(result.current.data).toEqual(mockStopRunAction)
    })
  })
})
