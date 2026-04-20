import { useQuery } from 'react-query'

import { getClientData } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  AxiosError,
  ClientDataResponse,
  DefaultClientData,
} from '@opentrons/api-client'

export function useClientData<T = DefaultClientData>(
  key: string,
  options: UseQueryOptions<ClientDataResponse<T>, AxiosError> = {}
): UseQueryResult<ClientDataResponse<T>, AxiosError> {
  const host = useHost()
  const query = useQuery<ClientDataResponse<T>, AxiosError>(
    [host, 'client_data', key],
    async () => {
      if (host == null) {
        throw new Error('Host config is required')
      }
      return await getClientData<T>(host, key).then(response => response.data)
    },
    { enabled: host !== null, ...options }
  )

  return query
}
