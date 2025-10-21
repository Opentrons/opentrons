import { describe, expect, it } from 'vitest'

import { shouldCommandSucceedGivenRecoveryPolicy } from '..'

import type { ErrorRecoveryPolicy } from '@opentrons/api-client'

describe('shouldCommandSucceedGivenRecoveryPolicy', () => {
  const COMMAND_TYPE = 'pickUpTip'
  const ERROR_TYPE = 'assumeFalsePositiveAndContinue'
  const DIFFERENT_COMMAND_TYPE = 'dropTip'
  const DIFFERENT_ERROR_TYPE = 'ignoreAndContinue'

  const createCommand = (commandType: any, errorType: string | null): any => ({
    commandType,
    params: {},
    ...(errorType
      ? { error: { errorType, detail: {}, message: 'Test error' } }
      : {}),
  })

  const createPolicy = (
    commandType: any,
    errorType: string,
    ifMatch: string
  ): ErrorRecoveryPolicy => ({
    policyRules: [
      {
        matchCriteria: {
          command: {
            commandType,
            error: {
              errorType,
            },
          },
        },
        ifMatch: ifMatch as any,
      },
    ],
  })

  it('should return true for commands without errors, regardless of policy', () => {
    const cmd = createCommand(COMMAND_TYPE, null)
    const policy = createPolicy(COMMAND_TYPE, ERROR_TYPE, 'waitForRecovery')

    const result = shouldCommandSucceedGivenRecoveryPolicy(cmd, policy)

    expect(result).toBe(true)
  })

  it('should return true for commands with errors but no policy', () => {
    const cmd = createCommand(COMMAND_TYPE, ERROR_TYPE)

    const result = shouldCommandSucceedGivenRecoveryPolicy(cmd, undefined)

    expect(result).toBe(true)
  })

  it('should return true for commands with errors and matching policy with ifMatch = "ignoreAndContinue"', () => {
    const cmd = createCommand(COMMAND_TYPE, ERROR_TYPE)
    const policy = createPolicy(COMMAND_TYPE, ERROR_TYPE, 'ignoreAndContinue')

    const result = shouldCommandSucceedGivenRecoveryPolicy(cmd, policy)

    expect(result).toBe(true)
  })

  it('should return true for commands with errors and matching policy with ifMatch = "assumeFalsePositiveAndContinue"', () => {
    const cmd = createCommand(COMMAND_TYPE, ERROR_TYPE)
    const policy = createPolicy(
      COMMAND_TYPE,
      ERROR_TYPE,
      'assumeFalsePositiveAndContinue'
    )

    const result = shouldCommandSucceedGivenRecoveryPolicy(cmd, policy)

    expect(result).toBe(true)
  })

  it('should return false for commands with errors and matching policy with ifMatch = "failRun"', () => {
    const cmd = createCommand(COMMAND_TYPE, ERROR_TYPE)
    const policy = createPolicy(COMMAND_TYPE, ERROR_TYPE, 'failRun')

    const result = shouldCommandSucceedGivenRecoveryPolicy(cmd, policy)

    expect(result).toBe(false)
  })

  it('should return false for commands with errors and matching policy with ifMatch = "waitForRecovery"', () => {
    const cmd = createCommand(COMMAND_TYPE, ERROR_TYPE)
    const policy = createPolicy(COMMAND_TYPE, ERROR_TYPE, 'waitForRecovery')

    const result = shouldCommandSucceedGivenRecoveryPolicy(cmd, policy)

    expect(result).toBe(false)
  })

  it('should return false for commands with errors and policy with non-matching commandType', () => {
    const cmd = createCommand(COMMAND_TYPE, ERROR_TYPE)
    const policy = createPolicy(
      DIFFERENT_COMMAND_TYPE,
      ERROR_TYPE,
      'ignoreAndContinue'
    )

    const result = shouldCommandSucceedGivenRecoveryPolicy(cmd, policy)

    expect(result).toBe(false)
  })

  it('should return false for commands with errors and policy with non-matching errorType', () => {
    const cmd = createCommand(COMMAND_TYPE, ERROR_TYPE)
    const policy = createPolicy(
      COMMAND_TYPE,
      DIFFERENT_ERROR_TYPE,
      'ignoreAndContinue'
    )

    const result = shouldCommandSucceedGivenRecoveryPolicy(cmd, policy)

    expect(result).toBe(false)
  })

  it('should return true if at least one policy rule matches and allows continuation', () => {
    const cmd = createCommand(COMMAND_TYPE, ERROR_TYPE)
    const policy: ErrorRecoveryPolicy = {
      policyRules: [
        {
          matchCriteria: {
            command: {
              commandType: DIFFERENT_COMMAND_TYPE,
              error: {
                errorType: ERROR_TYPE,
              },
            },
          },
          ifMatch: 'ignoreAndContinue',
        },
        {
          matchCriteria: {
            command: {
              commandType: COMMAND_TYPE,
              error: {
                errorType: ERROR_TYPE,
              },
            },
          },
          ifMatch: 'ignoreAndContinue',
        },
      ],
    }

    const result = shouldCommandSucceedGivenRecoveryPolicy(cmd, policy)

    expect(result).toBe(true)
  })

  it('should return false if no policy rule matches', () => {
    const cmd = createCommand(COMMAND_TYPE, ERROR_TYPE)
    const policy: ErrorRecoveryPolicy = {
      policyRules: [
        {
          matchCriteria: {
            command: {
              commandType: DIFFERENT_COMMAND_TYPE,
              error: {
                errorType: ERROR_TYPE,
              },
            },
          },
          ifMatch: 'ignoreAndContinue',
        },
        {
          matchCriteria: {
            command: {
              commandType: COMMAND_TYPE,
              error: {
                errorType: DIFFERENT_ERROR_TYPE,
              },
            },
          },
          ifMatch: 'ignoreAndContinue',
        },
      ],
    }

    const result = shouldCommandSucceedGivenRecoveryPolicy(cmd, policy)

    expect(result).toBe(false)
  })

  it('should work with an empty policy rules array', () => {
    const cmd = createCommand(COMMAND_TYPE, ERROR_TYPE)
    const policy: ErrorRecoveryPolicy = {
      policyRules: [],
    }

    const result = shouldCommandSucceedGivenRecoveryPolicy(cmd, policy)

    expect(result).toBe(false)
  })
})
