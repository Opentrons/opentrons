import type { MoveToSlotRunTimeCommand } from '@opentrons/shared-data/command'
import type { GetCommandText } from '..'

type GetMoveToSlotCommandText = Omit<GetCommandText, 'command'> & {
  command: MoveToSlotRunTimeCommand
}

export function getMoveToSlotCommandText({
  command,
  t,
}: GetMoveToSlotCommandText): string {
  const { slotName } = command.params

  return t('move_to_slot', { slot_name: slotName })
}
