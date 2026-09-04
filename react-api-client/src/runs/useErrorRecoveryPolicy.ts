import { useQuery } from 'react-query'

import { getErrorRecoveryPolicy } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { ErrorRecoveryPolicyResponse } from '@opentrons/api-client'

export function useErrorRecoveryPolicy(
  runId: string,
  options: UseQueryOptions<ErrorRecoveryPolicyResponse, Error> = {}
): UseQueryResult<ErrorRecoveryPolicyResponse, Error> {
  const host = useHost()

  const query = useQuery<ErrorRecoveryPolicyResponse, Error>(
    getQueryKey(host, 'runs', runId, 'errorRecoveryPolicy'),
    () =>
      getErrorRecoveryPolicy(host!, runId)
        .then(response => response.data)
        .catch(e => {
          throw e
        }),
    options
  )

  return query
}
