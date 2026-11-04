import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { updateRobotSetting } from '@opentrons/api-client'

import { useUpdateRobotSettingMutation } from '..'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '../../accessControl/__fixtures__/documentationState'
import { useHost } from '../../api'
import { robotSettingsQueryKey } from '../useRobotSettingsQuery'

import type * as React from 'react'
import type {
  HostConfig,
  Response,
  RobotSettingsResponse,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const ROBOT_SETTINGS_RESPONSE: RobotSettingsResponse = {
  settings: [
    {
      id: 'disableHomeOnBoot',
      title: 'Disable home on boot',
      description: 'a setting',
      value: true,
    },
  ],
}

describe('useUpdateRobotSettingMutation hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{
      children: React.ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should update robot settings query cache on success', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(updateRobotSetting).mockResolvedValue({
      data: ROBOT_SETTINGS_RESPONSE,
    } as Response<RobotSettingsResponse>)

    const { result } = renderHook(
      () =>
        useUpdateRobotSettingMutation(
          ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
        ),
      {
        wrapper,
      }
    )

    result.current.updateRobotSetting({
      id: 'disableHomeOnBoot',
      value: true,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(updateRobotSetting).toHaveBeenCalledWith(
      HOST_CONFIG,
      'disableHomeOnBoot',
      true,
      ''
    )
    expect(
      queryClient.getQueryData(robotSettingsQueryKey(HOST_CONFIG))
    ).toEqual(ROBOT_SETTINGS_RESPONSE)
  })
})
