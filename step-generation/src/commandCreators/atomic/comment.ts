import * as errorCreators from '../../errorCreators'
import {
  PROTOCOL_CONTEXT_NAME,
  pythonRuntimeString,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type { CommandCreator } from '../../types'

export const comment: CommandCreator<{ message: string }> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { message } = args
  const runtimeParameters = invariantContext.runtimeParameters ?? {}
  const resolvedMessage = resolveStringRuntimeValue(message, runtimeParameters)
  if (resolvedMessage == null) {
    return {
      errors: [
        errorCreators.invalidRuntimeParameter({ parameterName: message }),
      ],
    }
  }

  const commands = [
    {
      commandType: 'comment' as const,
      key: uuid(),
      params: {
        message: resolvedMessage,
      },
    },
  ]
  const python = `${PROTOCOL_CONTEXT_NAME}.comment(${pythonRuntimeString(message, resolvedMessage, runtimeParameters)})`
  return {
    commands,
    python,
  }
}
