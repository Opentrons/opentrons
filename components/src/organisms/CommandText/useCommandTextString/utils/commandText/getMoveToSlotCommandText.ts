import type { HandlesCommands } from '../types'
import type { MoveToSlotRunTimeCommand } from '@opentrons/shared-data/command'

export function getMoveToSlotCommandText({
  command,
  t,
}: HandlesCommands<MoveToSlotRunTimeCommand>): string {
  const { slotName } = command.params

  return t('move_to_slot', { slot_name: slotName })
}
