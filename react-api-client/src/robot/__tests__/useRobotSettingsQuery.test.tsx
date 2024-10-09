import type * as React from 'react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'

import { getRobotSettings } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useRobotSettingsQuery } from '..'

import type {
  HostConfig,
  Response,
  RobotSettingsResponse,
} from '@opentrons/api-client'
import type { UseRobotSettingsQueryOptions } from '../useRobotSettingsQuery'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const ROBOT_SETTINGS_RESPONSE: RobotSettingsResponse = {
  settings: [
    {
      id: 'enableOEMMode',
      title: 'Enable OEM Mode',
      description: 'a mode for an OEM',
      value: false,
    },
  ],
}

describe('useRobotSettingsQuery hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & UseRobotSettingsQueryOptions
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & UseRobotSettingsQueryOptions
    > = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return no data if no host', () => {
    vi.mocked(useHost).mockReturnValue(null)

    const { result } = renderHook(() => useRobotSettingsQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return no data if robot settings request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getRobotSettings).mockRejectedValue('oh no')

    const { result } = renderHook(() => useRobotSettingsQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return robot settings response data', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getRobotSettings).mockResolvedValue({
      data: ROBOT_SETTINGS_RESPONSE,
    } as Response<RobotSettingsResponse>)

    const { result } = renderHook(() => useRobotSettingsQuery(), { wrapper })

    await waitFor(() => {
      expect(result.current?.data).toEqual(ROBOT_SETTINGS_RESPONSE)
    })
  })
})
