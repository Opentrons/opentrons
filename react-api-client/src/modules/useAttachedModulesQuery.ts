import { UseQueryResult, useQuery } from 'react-query'
import { getModules } from '@opentrons/api-client'
import { useHost } from '../api'
import type { HostConfig, AttachedModules } from '@opentrons/api-client'

export function useAttachedModulesQuery(): UseQueryResult<AttachedModules> {
  const host = useHost()
  const query = useQuery(
    [host, 'modules'],
    () => getModules(host as HostConfig).then(response => response.data),
    { enabled: host !== null }
  )

  return query
}
