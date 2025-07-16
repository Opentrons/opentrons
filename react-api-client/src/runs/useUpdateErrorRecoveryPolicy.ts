import { useMutation } from 'react-query'

import { updateErrorRecoveryPolicy } from '@opentrons/api-client'

import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  HostConfig,
  RecoveryPolicyRulesParams,
  UpdateErrorRecoveryPolicyResponse,
} from '@opentrons/api-client'

export type UseErrorRecoveryPolicyResponse = UseMutationResult<
  UpdateErrorRecoveryPolicyResponse,
  AxiosError,
  RecoveryPolicyRulesParams
> & {
  updateErrorRecoveryPolicy: UseMutateFunction<
    UpdateErrorRecoveryPolicyResponse,
    AxiosError,
    RecoveryPolicyRulesParams
  >
}

export type UseUpdateErrorRecoveryPolicyOptions = UseMutationOptions<
  UpdateErrorRecoveryPolicyResponse,
  AxiosError,
  RecoveryPolicyRulesParams
>

export function useUpdateErrorRecoveryPolicy(
  runId: string,
  options: UseUpdateErrorRecoveryPolicyOptions = {}
): UseErrorRecoveryPolicyResponse {
  const host = useHost()

  const mutation = useMutation<
    UpdateErrorRecoveryPolicyResponse,
    AxiosError,
    RecoveryPolicyRulesParams
  >(
    [host, 'runs', runId, 'errorRecoveryPolicy'],
    (policyRules: RecoveryPolicyRulesParams) =>
      updateErrorRecoveryPolicy(host as HostConfig, runId, policyRules)
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
