import { PUT, request } from '../request'

import type { RunCommandError, RunTimeCommand } from '@opentrons/shared-data'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type {
  ErrorRecoveryPolicy,
  IfMatchType,
  UpdateErrorRecoveryPolicyRequest,
  UpdateErrorRecoveryPolicyResponse,
} from './types'

export type RecoveryPolicyRulesParams = Array<{
  commandType: RunTimeCommand['commandType']
  errorType: RunCommandError['errorType']
  ifMatch: IfMatchType
}>

export function updateErrorRecoveryPolicy(
  config: HostConfig,
  runId: string,
  policyRules: RecoveryPolicyRulesParams,
  userNotes: string
): ResponsePromise<UpdateErrorRecoveryPolicyResponse> {
  const policy = buildErrorRecoveryPolicyBody(policyRules)

  return request<
    UpdateErrorRecoveryPolicyResponse,
    UpdateErrorRecoveryPolicyRequest
  >(PUT, `/runs/${runId}/errorRecoveryPolicy`, config, {
    body: { data: policy },
    userNotes,
  })
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
