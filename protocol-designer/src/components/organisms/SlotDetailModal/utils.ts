import type { TFunction } from 'i18next'

const getRowFromSlotName = (slotName: string): string => slotName.slice(0, 1)

export function getDeckLabel(
  slotName: string,
  isHopper: boolean,
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

  return slotName
}
