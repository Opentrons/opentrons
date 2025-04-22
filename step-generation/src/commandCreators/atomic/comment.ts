import { formatPyStr, PROTOCOL_CONTEXT_NAME, uuid } from '../../utils'

import type { CommandCreator } from '../../types'
import type { CommentParams } from '@opentrons/shared-data'

export const comment: CommandCreator<CommentParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { message } = args

  const commands = [
    {
      commandType: 'comment' as const,
      key: uuid(),
      params: {
        message,
      },
    },
  ]
  const python = `${PROTOCOL_CONTEXT_NAME}.comment(${formatPyStr(message)})`
  return {
    commands,
    python,
  }
}
