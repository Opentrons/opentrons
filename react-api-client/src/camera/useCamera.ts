import { useQuery } from 'react-query'

import { getCamera } from '@opentrons/api-client'

import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { CameraResponse, HostConfig } from '@opentrons/api-client'

export function useCamera(
  options: UseQueryOptions<CameraResponse> = {}
): UseQueryResult<CameraResponse> {
  const host = useHost()
  const query = useQuery<CameraResponse>(
    [host, 'camera'],
    () =>
      getCamera(host as HostConfig)
        .then(response => response.data)
        .catch((e: AxiosError) => {
          throw e
        }),
    { ...options, enabled: host !== null && options?.enabled }
  )
  return query
}
