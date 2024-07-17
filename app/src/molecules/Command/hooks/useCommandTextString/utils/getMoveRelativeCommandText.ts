import type { MoveRelativeRunTimeCommand } from '@opentrons/shared-data/command'
import type { GetCommandText } from '..'

type GetMoveRelativeRunTimeCommand = Omit<GetCommandText, 'command'> & {
  command: MoveRelativeRunTimeCommand
}

export function getMoveRelativeCommandText({
  command,
  t,
}: GetMoveRelativeRunTimeCommand): string {
  const { axis, distance } = command.params

  return t('move_relative', { axis, distance })
}
