import { useQuery } from 'react-query'

import { getRobotSettings } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { RobotSettingsResponse } from '@opentrons/api-client'

export type UseRobotSettingsQueryOptions =
  UseQueryOptions<RobotSettingsResponse>

export function useRobotSettingsQuery(
  options: UseRobotSettingsQueryOptions = {}
): UseQueryResult<RobotSettingsResponse> {
  const host = useHost()
  const query = useQuery<RobotSettingsResponse>(
    [host!, 'robot_settings'],
    () => getRobotSettings(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
