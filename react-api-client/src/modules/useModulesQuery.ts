import { useQuery } from 'react-query'
import { getModules } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig, Modules } from '@opentrons/api-client'
import { MODULE_MODELS } from '@opentrons/shared-data'

export type UseModulesQueryOptions = UseQueryOptions<Modules>

export function useModulesQuery(
  options: UseModulesQueryOptions = {}
): UseQueryResult<Modules> {
  const host = useHost()
  const query = useQuery<Modules>(
    [host, 'modules'],
    () =>
      getModules(host as HostConfig).then(response => {
        const modules = response.data?.data ?? []
        // this check will determine if the module response is v3 or v2
        // if v2, we will return an empty array
        if (modules.length > 0 && 'id' in modules[0]) {
          return response.data
        } else {
          return {
            data: [],
            meta: { totalLength: 0, cursor: 0 },
          }
        }
      }),
    {
      enabled: host !== null,
      // Filter unknown modules so we don't block the app, which
      // can happen when developing new devices not yet known to the client.
      select: resp => {
        return {
          ...resp,
          data: resp.data.filter(module =>
            MODULE_MODELS.includes(module.moduleModel)
          ),
        }
      },
      ...options,
    }
  )

  return query
}
