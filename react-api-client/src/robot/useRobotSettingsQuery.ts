import { useQuery } from 'react-query'
import { getRobotSettings } from '@opentrons/api-client'
import { useHost } from '../api'

import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig, RobotSettingsResponse } from '@opentrons/api-client'

export type UseRobotSettingsQueryOptions = UseQueryOptions<RobotSettingsResponse>

export function useRobotSettingsQuery(
  options: UseRobotSettingsQueryOptions = {}
): UseQueryResult<RobotSettingsResponse> {
  const host = useHost()
  const query = useQuery<RobotSettingsResponse>(
    [host as HostConfig, 'robot_settings'],
    () => getRobotSettings(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
