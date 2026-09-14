import { updateErrorRecoveryPolicy } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  RecoveryPolicyRulesParams,
  UpdateErrorRecoveryPolicyResponse,
} from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'

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
  documentationState: DocumentationState,
  options: UseUpdateErrorRecoveryPolicyOptions = {}
): UseErrorRecoveryPolicyResponse {
  const host = useHost()

  const mutation = useDocumentedMutation<
    UpdateErrorRecoveryPolicyResponse,
    AxiosError,
    RecoveryPolicyRulesParams
  >(
    documentationState,
    ['update_error_recovery_policy'],
    getQueryKey(host, 'runs', runId, 'errorRecoveryPolicy'),
    ({ variables: policyRules, userNotes }) =>
      updateErrorRecoveryPolicy(host!, runId, policyRules, userNotes)
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
