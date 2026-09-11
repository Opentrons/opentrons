import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { restart } from '@opentrons/api-client'

import { useRestartMutation } from '..'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '../../accessControl/__fixtures__/documentationState'
import { useHost } from '../../api'

import type * as React from 'react'
import type {
  HostConfig,
  Response,
  RestartResponse,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const RESTART_RESPONSE: RestartResponse = {
  message: 'restarting in 1 second',
}

describe('useRestartMutation hook', () => {
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

  it('should return no data if the restart request fails', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(restart).mockRejectedValue('oh no')

    const { result } = renderHook(
      () => useRestartMutation(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE),
      { wrapper }
    )

    expect(result.current.data).toBeUndefined()
    act(() => {
      result.current.restart()
    })
    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should restart the robot when calling restart', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(restart).mockResolvedValue({
      data: RESTART_RESPONSE,
    } as Response<RestartResponse>)

    const { result } = renderHook(
      () => useRestartMutation(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE),
      { wrapper }
    )
    act(() => {
      result.current.restart()
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(RESTART_RESPONSE)
    })
    expect(restart).toHaveBeenCalledWith(HOST_CONFIG, expect.any(String))
  })
})
