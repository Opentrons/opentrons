import { PUT, request } from '../request'

import type { HostConfig } from '../types'
import type { ResponsePromise } from '../request'
import type {
  ErrorRecoveryPolicy,
  IfMatchType,
  UpdateErrorRecoveryPolicyRequest,
  UpdateErrorRecoveryPolicyResponse,
} from './types'
import type { RunCommandError, RunTimeCommand } from '@opentrons/shared-data'

export type RecoveryPolicyRulesParams = Array<{
  commandType: RunTimeCommand['commandType']
  errorType: RunCommandError['errorType']
  ifMatch: IfMatchType
}>

export function updateErrorRecoveryPolicy(
  config: HostConfig,
  runId: string,
  policyRules: RecoveryPolicyRulesParams
): ResponsePromise<UpdateErrorRecoveryPolicyResponse> {
  const policy = buildErrorRecoveryPolicyBody(policyRules)

  return request<
    UpdateErrorRecoveryPolicyResponse,
    UpdateErrorRecoveryPolicyRequest
  >(PUT, `/runs/${runId}/errorRecoveryPolicy`, { data: policy }, config)
}

function buildErrorRecoveryPolicyBody(
  policyRules: RecoveryPolicyRulesParams
): ErrorRecoveryPolicy {
  return {
    policyRules: policyRules.map(rule => ({
      matchCriteria: {
        command: {
          commandType: rule.commandType,
          error: {
            errorType: rule.errorType,
          },
        },
      },
      ifMatch: rule.ifMatch,
    })),
  }
}
