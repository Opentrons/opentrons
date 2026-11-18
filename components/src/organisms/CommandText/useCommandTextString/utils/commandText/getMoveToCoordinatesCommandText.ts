import type { MoveToCoordinatesRunTimeCommand } from '@opentrons/shared-data'
import type { HandlesCommands } from '../types'

export function getMoveToCoordinatesCommandText({
  command,
  t,
}: HandlesCommands<MoveToCoordinatesRunTimeCommand>): string {
  const { coordinates } = command.params

  return t('move_to_coordinates', coordinates)
}
