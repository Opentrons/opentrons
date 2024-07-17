import type { CommentRunTimeCommand } from '@opentrons/shared-data/command'
import type { GetCommandText } from '..'

type GetCommentCommandText = Omit<GetCommandText, 'command'> & {
  command: CommentRunTimeCommand
}

export function getCommentCommandText({
  command,
}: GetCommentCommandText): string {
  const { message } = command.params

  return message
}
