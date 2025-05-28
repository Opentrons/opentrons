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

export function useRunCommandErrors<TError = Error>(
  runId: string | null,
  params?: GetCommandsParams | null,
  options: UseQueryOptions<RunCommandErrors, TError> = {}
): UseQueryResult<RunCommandErrors, TError> {
  const host = useHost()
  const allOptions: UseQueryOptions<RunCommandErrors, TError> = {
    ...options,
    enabled: host !== null && runId != null && options.enabled !== false,
  }

  const { cursor, pageLength } = params ?? {}
  const finalizedParams = {
    ...params,
    pageLength: params?.pageLength ?? DEFAULT_PAGE_LENGTH,
  }
  const query = useQuery<RunCommandErrors, TError>(
    [host, 'runs', runId, 'commandErrors', cursor, pageLength],
    () => {
      return getRunCommandErrors(
        host as HostConfig,
        runId as string,
        finalizedParams
      ).then(response => response.data)
    },
    allOptions
  )

  return query
}
