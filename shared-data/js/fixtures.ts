import {
  STAGING_AREA_LOAD_NAME,
  TRASH_BIN_LOAD_NAME,
  WASTE_CHUTE_LOAD_NAME,
} from './constants'
import type { FixtureLoadName } from './types'

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
