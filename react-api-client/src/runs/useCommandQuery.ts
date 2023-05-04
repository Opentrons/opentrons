import { useHost } from '../api'
import { CommandDetail, HostConfig, getCommand } from '@opentrons/api-client'
import { UseQueryResult, useQuery } from 'react-query'
import type { UseQueryOptions } from 'react-query'

export function useCommandQuery(
  runId: string | null,
  commandId: string | null,
  options?: UseQueryOptions<CommandDetail, Error>
): UseQueryResult<CommandDetail, Error> {
  const host = useHost()
  const defaultEnabled = host !== null && runId != null && commandId != null
  const query = useQuery<CommandDetail, Error>(
    [host, 'runs', runId, 'commands', commandId],
    () =>
      getCommand(host as HostConfig, runId as string, commandId as string)
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
