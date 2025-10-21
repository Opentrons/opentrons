import some from 'lodash/some'

import type { ErrorRecoveryPolicy } from '@opentrons/api-client'
import type { RunTimeCommand } from '@opentrons/shared-data'

// Whether the command should succeed given the error recovery policy.
export function shouldCommandSucceedGivenRecoveryPolicy(
  cmd: RunTimeCommand,
  policy: ErrorRecoveryPolicy | undefined
): boolean {
  if (!policy || !cmd.error) {
    if (cmd.error) {
      console.warn(
        'Check for command errors before passing invoking isCommandErrorRecoveryPolicyException.'
      )
    }
    return true
  }

  return some(
    policy.policyRules,
    rule =>
      rule.matchCriteria.command.commandType === cmd.commandType &&
      rule.matchCriteria.command.error.errorType === cmd.error?.errorType &&
      (rule.ifMatch === 'assumeFalsePositiveAndContinue' ||
        rule.ifMatch === 'ignoreAndContinue')
  )
}
