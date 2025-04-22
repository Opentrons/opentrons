import type { HandlesCommands } from '../types'
import type { CommentRunTimeCommand } from '@opentrons/shared-data/command'

export function getCommentCommandText({
  command,
}: HandlesCommands<CommentRunTimeCommand>): string {
  const { message } = command.params

  return message
}
