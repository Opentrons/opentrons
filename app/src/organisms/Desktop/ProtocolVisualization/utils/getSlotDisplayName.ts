import {
  FIXED_TRASH_ID,
  WASTE_CHUTE_ADDRESSABLE_AREAS,
} from '@opentrons/shared-data'

import type { TFunction } from 'i18next'

export function getSlotDisplayName(
  slot: string,
  t: TFunction
): string {
  if (
    (WASTE_CHUTE_ADDRESSABLE_AREAS as readonly string[]).includes(slot)
  ) {
    return t('waste_chute')
  }
  if (slot === FIXED_TRASH_ID) {
    return t('trash')
  }
  return slot
}
