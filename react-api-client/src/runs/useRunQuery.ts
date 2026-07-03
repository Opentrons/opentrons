import { useEffect } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import some from 'lodash/some'

import { getRun } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { HostConfig, Run, RunError } from '@opentrons/api-client'

export function useRunQuery<TError = Error>(
  runId: string | null,
  options: UseQueryOptions<Run, TError> = {},
  hostOverride?: HostConfig | null
): UseQueryResult<Run, TError> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()
  const query = useQuery<Run, TError>(
    getQueryKey(host, 'runs', runId, 'details'),
    () => getRun(host!, runId!).then(response => response.data),
    {
      enabled: host !== null && runId != null && options.enabled !== false,
      ...options,
    }
  )

  const estopInErrorTree = (error: RunError): boolean =>
    error?.errorCode === '3008' ||
    some(
      (error?.wrappedErrors ?? []).map((wrapped: RunError) =>
        estopInErrorTree(wrapped)
      )
    )

  // If the run contains an estop error, invalidate the estop query so we get the
  // estop modal as fast as we can
  useEffect(
    () => {
      if (
        query.data?.data?.current &&
        some(
          ((query.data?.data?.errors ?? []) as RunError[]).map(estopInErrorTree)
        )
      ) {
        queryClient.invalidateQueries(getQueryKey(host, '/robot/control'))
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      runId,
      query.isSuccess,
      query.data?.data?.current,
      query.data?.data?.errors,
    ]
  )

  return query
}
