import { useQuery } from 'react-query'

import { getRobotServerAccessControlSettings } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { RobotServerAccessControlSettingsResponse } from '@opentrons/api-client'

export function useGetRobotServerAccessControlSettingsQuery(
  options: UseQueryOptions<
    RobotServerAccessControlSettingsResponse,
    AxiosError
  > = {}
): UseQueryResult<RobotServerAccessControlSettingsResponse, AxiosError> {
  const host = useHost()
  const query = useQuery<RobotServerAccessControlSettingsResponse, AxiosError>(
    getQueryKey(host, 'accessControl', 'settings'),
    () =>
      getRobotServerAccessControlSettings(host!)
        .then(response => response.data)
        .catch((e: AxiosError) => {
          throw e
        }),
    { enabled: host !== null, ...options }
  )

  return query
}
