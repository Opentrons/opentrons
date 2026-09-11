import { getErrorRecoveryPolicy } from '@opentrons/api-client'
import {
  useHost,
  useUpdateErrorRecoveryPolicy,
} from '@opentrons/react-api-client'

import type {
  RecoveryPolicyRulesParams,
  UpdateErrorRecoveryPolicyResponse,
} from '@opentrons/api-client'
import type { DocumentationState } from '@opentrons/react-api-client'

/**
 * append - Add a new policy rule to the end of the existing recovery policy.
 */
export type UpdatePolicyStrategy = 'append'

export interface UpdateErrorRecoveryPolicyWithStrategy {
  runId: string
  newPolicy: RecoveryPolicyRulesParams[number]
  strategy: UpdatePolicyStrategy
}

export function useUpdateRecoveryPolicyWithStrategy(
  runId: string,
  documentationState: DocumentationState
): (
  newPolicy: UpdateErrorRecoveryPolicyWithStrategy['newPolicy'],
  strategy: UpdateErrorRecoveryPolicyWithStrategy['strategy']
) => Promise<UpdateErrorRecoveryPolicyResponse> {
  const host = useHost()

  const { mutateAsync: updateErrorRecoveryPolicy } =
    useUpdateErrorRecoveryPolicy(runId, documentationState)

  return (
    newPolicy: UpdateErrorRecoveryPolicyWithStrategy['newPolicy'],
    strategy: UpdateErrorRecoveryPolicyWithStrategy['strategy']
  ) =>
    getErrorRecoveryPolicy(host!, runId).then(res => {
      const existingPolicyRules = res.data.data.policyRules.map(rule => ({
        commandType: rule.matchCriteria.command.commandType,
        errorType: rule.matchCriteria.command.error.errorType,
        ifMatch: rule.ifMatch,
      }))

      const buildUpdatedPolicy = (): RecoveryPolicyRulesParams => {
        switch (strategy) {
          case 'append':
            return [...existingPolicyRules, newPolicy]
          default: {
            console.error('Unhandled policy strategy, defaulting to append.')
            return [...existingPolicyRules, newPolicy]
          }
        }
      }

      return updateErrorRecoveryPolicy(buildUpdatedPolicy())
    })
}
