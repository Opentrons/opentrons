import { useMutation } from 'react-query'

import { updateErrorRecoveryPolicy } from '@opentrons/api-client'

import { useHost } from '../api'

import type {
  UseMutationOptions,
  UseMutationResult,
  UseMutateFunction,
} from 'react-query'
import type { AxiosError } from 'axios'
import type {
  RecoveryPolicyRulesParams,
  UpdateErrorRecoveryPolicyResponse,
  HostConfig,
} from '@opentrons/api-client'

export type UseUpdateErrorRecoveryPolicyResponse = UseMutationResult<
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
): UseUpdateErrorRecoveryPolicyResponse {
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
