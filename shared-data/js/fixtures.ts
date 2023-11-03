import {
  STAGING_AREA_LOAD_NAME,
  TRASH_BIN_LOAD_NAME,
  WASTE_CHUTE_LOAD_NAME,
} from './constants'
import type { Cutout, FixtureLoadName, FlexSlot } from './types'

export function getCutoutDisplayName(cutout: Cutout): string {
  return cutout.replace('cutout', '')
}

// returns the flex cutout associated with a flex slot id
export function getCutoutFromSlotId(slotId: FlexSlot): Cutout {
  // prepend 'cutout' then replace 4 with 3 e.g. B4 -> B3
  const cutout = 'cutout'.concat(slotId).replace('4', '3') as Cutout

  return cutout
}

export function getFixtureDisplayName(loadName: FixtureLoadName): string {
  if (loadName === STAGING_AREA_LOAD_NAME) {
    return 'Staging Area Slot'
  } else if (loadName === TRASH_BIN_LOAD_NAME) {
    return 'Trash Bin'
  } else if (loadName === WASTE_CHUTE_LOAD_NAME) {
    return 'Waste Chute'
  } else {
    return 'Slot'
  }
}
