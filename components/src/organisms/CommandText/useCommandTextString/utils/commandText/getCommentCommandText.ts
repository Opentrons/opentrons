import type { CommentRunTimeCommand } from '@opentrons/shared-data'
import type { HandlesCommands } from '../types'

export function getCommentCommandText({
  command,
}: HandlesCommands<CommentRunTimeCommand>): string {
  const { message } = command.params

  return message
}
