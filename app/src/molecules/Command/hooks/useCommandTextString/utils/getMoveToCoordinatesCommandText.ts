import type { MoveToCoordinatesRunTimeCommand } from '@opentrons/shared-data/command'
import type { GetCommandText } from '..'

type GetMoveToCoordinatesCommandText = Omit<GetCommandText, 'command'> & {
  command: MoveToCoordinatesRunTimeCommand
}

export function getMoveToCoordinatesCommandText({
  command,
  t,
}: GetMoveToCoordinatesCommandText): string {
  const { coordinates } = command.params

  return t('move_to_coordinates', coordinates)
}
