import { useQuery } from 'react-query'

import { getRobotSettings } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { QueryKey, UseQueryOptions, UseQueryResult } from 'react-query'
import type { HostConfig, RobotSettingsResponse } from '@opentrons/api-client'

export type UseRobotSettingsQueryOptions =
  UseQueryOptions<RobotSettingsResponse>

export function robotSettingsQueryKey(host: HostConfig | null): QueryKey {
  return getQueryKey(host, 'robot_settings')
}

export function useRobotSettingsQuery(
  options: UseRobotSettingsQueryOptions = {},
  hostOverride?: HostConfig | null
): UseQueryResult<RobotSettingsResponse> {
  const hostFromProvider = useHost()
  const host = hostOverride ?? hostFromProvider
  const query = useQuery<RobotSettingsResponse>(
    robotSettingsQueryKey(host),
    () => getRobotSettings(host!).then(response => response.data),
    { enabled: host != null, ...options }
  )

  return query
}
