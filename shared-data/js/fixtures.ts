import {
  EXTENSION_SLOT_LOAD_NAME,
  FixtureLoadName,
  WASTE_CHUTE_LOAD_NAME,
} from './types'

export function getFixtureDisplayName(loadName: FixtureLoadName): string {
  if (loadName === EXTENSION_SLOT_LOAD_NAME) {
    return 'Staging Area Slot'
  } else if (loadName === WASTE_CHUTE_LOAD_NAME) {
    return 'Waste Chute'
  } else {
    return 'Slot'
  }
}
