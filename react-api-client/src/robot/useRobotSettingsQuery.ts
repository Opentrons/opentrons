import { getRobotSettings } from '@opentrons/api-client'
import type { HostConfig, RobotSettingsResponse } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import { useHost } from '../api'

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
