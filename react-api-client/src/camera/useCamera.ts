import { useQuery } from 'react-query'

import { getCamera } from '@opentrons/api-client'

import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseQueryResult } from 'react-query'
import type { CameraResponse, HostConfig } from '@opentrons/api-client'

export function useCamera(): UseQueryResult<CameraResponse, AxiosError> {
  const host = useHost()
  const query = useQuery<CameraResponse, AxiosError>(
    [useHost, 'camera'],
    () =>
      getCamera(host as HostConfig)
        .then(response => response.data)
        .catch((e: AxiosError) => {
          throw e
        }),
    { enabled: host !== null }
  )
  return query
}
