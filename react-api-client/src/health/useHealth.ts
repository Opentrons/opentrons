import { HostConfig, getHealth } from '@opentrons/api-client'
import { UseQueryResult, useQuery } from 'react-query'
import { useHost } from '../api'

import type { UseQueryOptions } from 'react-query'
import type { AxiosResponse, AxiosError } from 'axios'
import type { Health } from '@opentrons/api-client'

export function useHealthQuery(
  options: UseQueryOptions<AxiosResponse<Health>, AxiosError> = {}
): UseQueryResult<AxiosResponse<Health>, AxiosError> {
  const host = useHost()
  const queryKey = ['health', host]
  const query = useQuery<AxiosResponse<Health>, AxiosError>(
    queryKey,
    () => getHealth(host as HostConfig),
    {
      ...options,
      enabled: host !== null && options.enabled !== false,
    }
  )

  return query
}

export function useHealth(): Health | undefined {
  return useHealthQuery().data?.data
}
