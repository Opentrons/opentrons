import { useQuery } from 'react-query'

import { getCommand } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { CommandDetail } from '@opentrons/api-client'

export function useCommandQuery(
  runId: string | null,
  commandId: string | null,
  options?: UseQueryOptions<CommandDetail, Error>
): UseQueryResult<CommandDetail, Error> {
  const host = useHost()
  const defaultEnabled = host !== null && runId != null && commandId != null
  const query = useQuery<CommandDetail, Error>(
    getQueryKey(host, 'runs', runId, 'commands', commandId),
    () =>
      getCommand(host!, runId!, commandId!)
        .then(response => response.data)
        .catch((e: Error) => {
          throw e
        }),
    {
      ...options,
      enabled:
        options != null && 'enabled' in options
          ? options.enabled && defaultEnabled
          : defaultEnabled,
    }
  )

  return query
}
