import { getErrorRecoveryPolicy } from '@opentrons/api-client'
import type {
  ErrorRecoveryPolicyResponse,
  HostConfig,
} from '@opentrons/api-client'
import { useQuery } from 'react-query'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import { useHost } from '../api'

export function useErrorRecoveryPolicy(
  runId: string,
  options: UseQueryOptions<ErrorRecoveryPolicyResponse, Error> = {}
): UseQueryResult<ErrorRecoveryPolicyResponse, Error> {
  const host = useHost()

  const query = useQuery<ErrorRecoveryPolicyResponse, Error>(
    [host, 'runs', runId, 'errorRecoveryPolicy'],
    () =>
      getErrorRecoveryPolicy(host as HostConfig, runId)
        .then(response => response.data)
        .catch(e => {
          throw e
        }),
    options
  )

  return query
}
