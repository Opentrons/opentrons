import type { HandlesCommands } from '../types'
import type { MoveToCoordinatesRunTimeCommand } from '@opentrons/shared-data/command'

export function getMoveToCoordinatesCommandText({
  command,
  t,
}: HandlesCommands<MoveToCoordinatesRunTimeCommand>): string {
  const { coordinates } = command.params

  return t('move_to_coordinates', coordinates)
}
