import type {
  CompletedProtocolAnalysis,
  MoveToAddressableAreaParams,
} from '@opentrons/shared-data'
import type { TFunction } from 'react-i18next'

export function getAddressableAreaDisplayName(
  analysis: CompletedProtocolAnalysis,
  commandId: string,
  t: TFunction<'protocol_command_text'>
): string {
  const addressableAreaCommand = (analysis?.commands ?? []).find(
    command => command.id === commandId
  )

  if (
    addressableAreaCommand == null ||
    !('addressableAreaName' in addressableAreaCommand.params)
  ) {
    return ''
  }

  const addressableAreaName: MoveToAddressableAreaParams['addressableAreaName'] =
    addressableAreaCommand.params.addressableAreaName
  const movableTrashSubstr = 'movableTrash'

  if (addressableAreaName.includes(movableTrashSubstr)) {
    const slotName = addressableAreaName.split(movableTrashSubstr)[1]
    return t('trash_bin_in_slot', { slot_name: slotName })
  } else if (addressableAreaName.includes('WasteChute')) {
    return t('waste_chute')
  } else if (addressableAreaName === 'fixedTrash') return t('fixed_trash')
  else return addressableAreaName
}
