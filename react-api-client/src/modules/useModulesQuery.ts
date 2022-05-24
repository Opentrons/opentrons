import { useQuery } from 'react-query'
import { getModules } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig, AttachedModules } from '@opentrons/api-client'

export function useModulesQuery(
  options: UseQueryOptions<AttachedModules> = {}
): UseQueryResult<AttachedModules> {
  const host = useHost()
  const query = useQuery<AttachedModules>(
    [host, 'modules'],
    () => getModules(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
