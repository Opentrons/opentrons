import * as errorCreators from '../../errorCreators'
import {
  PROTOCOL_CONTEXT_NAME,
  pythonRuntimeString,
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  WaitForDurationCreateCommand,
  WaitForResumeCreateCommand,
} from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError } from '../../types'

export const delay: CommandCreator<
  { message?: string } | { message?: string; seconds: number | string }
> = (args, invariantContext, prevRobotState) => {
  const { message } = args
  const runtimeParameters = invariantContext.runtimeParameters ?? {}
  const resolvedMessage =
    message == null
      ? undefined
      : resolveStringRuntimeValue(message, runtimeParameters)
  const errors: CommandCreatorError[] = []
  if (message != null && resolvedMessage == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: message })
    )
  }
  let command: WaitForResumeCreateCommand | WaitForDurationCreateCommand
  let python: string
  if ('seconds' in args) {
    const seconds = resolveNumericRuntimeValue(args.seconds, runtimeParameters)
    if (typeof args.seconds === 'string' && seconds == null) {
      errors.push(
        errorCreators.invalidRuntimeParameter({ parameterName: args.seconds })
      )
    }
    if (errors.length > 0 || seconds == null) {
      return { errors }
    }
    command = {
      commandType: 'waitForDuration',
      key: uuid(),
      params: { seconds, message: resolvedMessage },
    }
    const pythonArgs = [
      `seconds=${args.seconds}`,
      ...(message && resolvedMessage != null
        ? [
            `msg=${pythonRuntimeString(message, resolvedMessage, runtimeParameters)}`,
          ]
        : []),
    ]
    python = `${PROTOCOL_CONTEXT_NAME}.delay(${pythonArgs.join(', ')})`
  } else {
    if (errors.length > 0) {
      return { errors }
    }
    command = {
      commandType: 'waitForResume',
      key: uuid(),
      params: { message: resolvedMessage },
    }
    const pauseMessage =
      message && resolvedMessage != null
        ? pythonRuntimeString(message, resolvedMessage, runtimeParameters)
        : ''
    python = `${PROTOCOL_CONTEXT_NAME}.pause(${pauseMessage})`
  }
  return {
    commands: [command],
    python: python,
  }
}
