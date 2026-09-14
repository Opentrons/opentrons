import { useQuery } from 'react-query'

import { getRobotUpdateSessionStatus } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { QueryKey, UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  HostConfig,
  RobotUpdateSessionStatus,
} from '@opentrons/api-client'

export const ROBOT_UPDATE_STATUS_POLL_MS = 2000

export type UseRobotUpdateStatusQueryOptions =
  UseQueryOptions<RobotUpdateSessionStatus>

export function robotUpdateStatusQueryKey(
  host: HostConfig | null,
  pathPrefix: string | null,
  token: string | null
): QueryKey {
  return getQueryKey(host, 'server', 'update', pathPrefix, token, 'status')
}

export function useRobotUpdateStatusQuery(
  pathPrefix: string | null,
  token: string | null,
  options: UseRobotUpdateStatusQueryOptions = {},
  hostOverride?: HostConfig | null
): UseQueryResult<RobotUpdateSessionStatus> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  return useQuery(
    robotUpdateStatusQueryKey(host, pathPrefix, token),
    () =>
      getRobotUpdateSessionStatus(host!, pathPrefix!, token!).then(
        response => response.data
      ),
    {
      enabled: host != null && pathPrefix != null && token != null,
      refetchInterval: ROBOT_UPDATE_STATUS_POLL_MS,
      ...options,
    }
  )
}
