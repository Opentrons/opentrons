import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { putSystemTime } from '@opentrons/api-client'

import { usePutSystemTimeMutation } from '..'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '../../accessControl/__fixtures__/documentationState'
import { useHost } from '../../api'

import type * as React from 'react'
import type {
  HostConfig,
  Response,
  SystemTimeResponse,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const SYSTEM_TIME = '2020-09-08T18:02:01.318292+00:00'
const SYSTEM_TIME_RESPONSE: SystemTimeResponse = {
  data: {
    id: 'time',
    systemTime: SYSTEM_TIME,
  },
}

describe('usePutSystemTimeMutation hook', () => {
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

  it('should put system time when calling putSystemTime', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(putSystemTime).mockResolvedValue({
      data: SYSTEM_TIME_RESPONSE,
    } as Response<SystemTimeResponse>)

    const { result } = renderHook(
      () =>
        usePutSystemTimeMutation(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE),
      { wrapper }
    )
    act(() => {
      result.current.putSystemTime(SYSTEM_TIME)
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(SYSTEM_TIME_RESPONSE)
    })
    expect(putSystemTime).toHaveBeenCalledWith(
      HOST_CONFIG,
      SYSTEM_TIME,
      expect.any(String)
    )
  })
})
