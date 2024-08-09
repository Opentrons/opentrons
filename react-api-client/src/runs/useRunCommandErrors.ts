import { useQuery } from 'react-query'
import { getRunCommandErrors } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  GetCommandsParams,
  HostConfig,
  RunCommandErrors,
} from '@opentrons/api-client'

const DEFAULT_PAGE_LENGTH = 30
export const DEFAULT_PARAMS: GetCommandsParams = {
  cursor: null,
  pageLength: DEFAULT_PAGE_LENGTH,
}

export function useRunCommandErrors<TError = Error>(
  runId: string | null,
  params?: GetCommandsParams | null,
  options: UseQueryOptions<RunCommandErrors, TError> = {}
): UseQueryResult<RunCommandErrors, TError> {
  const host = useHost()
  const nullCheckedParams = params ?? DEFAULT_PARAMS

  const allOptions: UseQueryOptions<RunCommandErrors, TError> = {
    ...options,
    enabled: host !== null && runId != null && options.enabled !== false,
  }
  const { cursor, pageLength } = nullCheckedParams
  const query = useQuery<RunCommandErrors, TError>(
    [host, 'runs', runId, 'commandErrors', cursor, pageLength],
    () => {
      return getRunCommandErrors(
        host as HostConfig,
        runId as string,
        nullCheckedParams
      ).then(response => response.data)
    },
    allOptions
  )

  return query
}
