import { VACUUM_DOCK_DISPLAY_LOCATION } from '/protocol-designer/constants'

import type { TFunction } from 'i18next'

const getRowFromSlotName = (slotName: string): string => slotName.slice(0, 1)

export function getDeckLabel(
  slotName: string,
  isHopper: boolean,
  isVacuumDock: boolean,
  t: TFunction
): string {
  if (slotName === 'offDeck') {
    return t('off_deck')
  }

  if (isHopper) {
    return t('shared:stacker', {
      slot: getRowFromSlotName(slotName),
    })
  }

  if (isVacuumDock) {
    return VACUUM_DOCK_DISPLAY_LOCATION
  }

  return slotName
}
