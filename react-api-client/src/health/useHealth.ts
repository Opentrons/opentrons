import { HostConfig, Health, getHealth } from '@opentrons/js-api-client'
import { UseQueryResult, useQuery } from 'react-query'
import { useHost } from '../api'

export function useHealthQuery(): UseQueryResult<Health> {
  const host = useHost()
  const query = useQuery(
    ['health', host],
    () => getHealth(host as HostConfig).then(response => response.data),
    { enabled: host !== null }
  )

  return query
}

export function useHealth(): Health | undefined {
  return useHealthQuery().data
}
