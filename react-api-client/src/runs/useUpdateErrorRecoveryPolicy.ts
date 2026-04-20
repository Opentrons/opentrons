import { useMutation } from 'react-query'

import { updateErrorRecoveryPolicy } from '@opentrons/api-client'

import { useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  HttpClientError,
  RecoveryPolicyRulesParams,
  UpdateErrorRecoveryPolicyResponse,
} from '@opentrons/api-client'

export type UseErrorRecoveryPolicyResponse = UseMutationResult<
  UpdateErrorRecoveryPolicyResponse,
  HttpClientError,
  RecoveryPolicyRulesParams
> & {
  updateErrorRecoveryPolicy: UseMutateFunction<
    UpdateErrorRecoveryPolicyResponse,
    HttpClientError,
    RecoveryPolicyRulesParams
  >
}

export type UseUpdateErrorRecoveryPolicyOptions = UseMutationOptions<
  UpdateErrorRecoveryPolicyResponse,
  HttpClientError,
  RecoveryPolicyRulesParams
>

export function useUpdateErrorRecoveryPolicy(
  runId: string,
  options: UseUpdateErrorRecoveryPolicyOptions = {}
): UseErrorRecoveryPolicyResponse {
  const host = useHost()

  const mutation = useMutation<
    UpdateErrorRecoveryPolicyResponse,
    HttpClientError,
    RecoveryPolicyRulesParams
  >(
    [host, 'runs', runId, 'errorRecoveryPolicy'],
    (policyRules: RecoveryPolicyRulesParams) =>
      updateErrorRecoveryPolicy(host!, runId, policyRules)
        .then(response => response.data)
        .catch(e => {
          throw e
        }),
    options
  )

  return {
    ...mutation,
    updateErrorRecoveryPolicy: mutation.mutate,
  }
}
