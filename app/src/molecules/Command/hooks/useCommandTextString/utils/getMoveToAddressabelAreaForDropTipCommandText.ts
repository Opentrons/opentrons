import { getAddressableAreaDisplayName } from '../../../utils'

import type { MoveToAddressableAreaForDropTipRunTimeCommand } from '@opentrons/shared-data/command'
import type { GetCommandText } from '..'

type GetMoveToAddressableAreaForDropTipCommandText = Omit<
  GetCommandText,
  'command'
> & {
  command: MoveToAddressableAreaForDropTipRunTimeCommand
}

export function getMoveToAddressableAreaForDropTipCommandText({
  command,
  commandTextData,
  t,
}: GetMoveToAddressableAreaForDropTipCommandText): string {
  const addressableAreaDisplayName =
    commandTextData != null
      ? getAddressableAreaDisplayName(commandTextData, command.id, t)
      : null

  return t('move_to_addressable_area_drop_tip', {
    addressable_area: addressableAreaDisplayName,
  })
}
