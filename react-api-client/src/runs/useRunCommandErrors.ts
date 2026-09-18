import { useQuery } from 'react-query'

import { getRunCommandErrors } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { GetCommandsParams, RunCommandErrors } from '@opentrons/api-client'

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
    getQueryKey(host, 'runs', runId, 'commandErrors', cursor, pageLength),
    () => {
      return getRunCommandErrors(host!, runId!, finalizedParams).then(
        response => response.data
      )
    },
    allOptions
  )

  return query
}
